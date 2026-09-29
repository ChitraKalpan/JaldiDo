import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import QRCode from 'qrcode';
import { config } from './config.js';
import { addFileToSession, addMessageToSession, createSession, getPublicSession, getSessionByCode, getSessionById, isValidAccessCode, joinSession, sanitizeFileName, sessionRepository } from './sessionService.js';
import { RateLimiter } from './utils/rateLimiter.js';
import { StorageService } from './services/storageService.js';
import { TransferService } from './services/transferService.js';
import { broadcastSessionEvent } from './wsServer.js';

const app = express();
const storage = new StorageService(config.storagePath);
const transferService = new TransferService();
const createLimiter = new RateLimiter(10, 60_000);
const joinLimiter = new RateLimiter(20, 60_000);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
      if (!sessionId) {
        cb(new Error('Missing session id'), '');
        return;
      }
      const target = storage.ensureSessionFolder(sessionId);
      cb(null, target);
    },
    filename: (req, file, cb) => {
      const safe = sanitizeFileName(file.originalname || 'upload');
      cb(null, `${Date.now()}-${safe}`);
    }
  }),
  limits: {
    fileSize: Number(config.maxFileSize ?? 104857600)
  }
});

app.use((req, _res, next) => {
  if (req.path.startsWith('/api')) {
    const ip = req.ip ?? 'unknown';
    const pathKey = `${req.path}:${ip}`;
    if (req.method === 'POST' && req.path === '/api/sessions') {
      if (!createLimiter.isAllowed(pathKey)) {
        const error = new Error('Too many create session requests. Please wait a moment.');
        (error as Error & { statusCode?: number }).statusCode = 429;
        throw error;
      }
    }
    if (req.method === 'POST' && req.path === '/api/sessions/join') {
      if (!joinLimiter.isAllowed(pathKey)) {
        const error = new Error('Too many join requests. Please wait a moment.');
        (error as Error & { statusCode?: number }).statusCode = 429;
        throw error;
      }
    }
  }
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, status: 'healthy' });
});

app.post('/api/sessions', (req, res) => {
  const deviceName = req.body?.deviceName || 'My Device';
  const session = createSession(deviceName, Number(config.sessionTtl));
  broadcastSessionEvent(session.sessionId, 'SESSION_CREATED', { sessionId: session.sessionId, accessCode: session.accessCode });

  res.status(201).json({
    sessionId: session.sessionId,
    accessCode: session.accessCode,
    expiresAt: session.expiresAt,
    status: session.status,
    qrCodeUrl: `/api/sessions/${session.sessionId}/qr`
  });
});

app.post('/api/sessions/join', (req, res) => {
  const accessCode = String(req.body?.accessCode ?? '').trim();
  const deviceName = String(req.body?.deviceName ?? 'Guest Device');

  if (!isValidAccessCode(accessCode)) {
    return res.status(400).json({ error: 'Invalid share code.' });
  }

  const session = getSessionByCode(accessCode);
  if (!session) {
    return res.status(404).json({ error: 'Session not found or expired.' });
  }

  const joined = joinSession(accessCode, deviceName);
  if (!joined) {
    return res.status(400).json({ error: 'Unable to join this session.' });
  }

  broadcastSessionEvent(session.sessionId, 'DEVICE_JOINED', { deviceName, sessionId: session.sessionId });

  return res.json({
    sessionId: joined.sessionId,
    expiresAt: joined.expiresAt,
    status: joined.status,
    connectedDevices: joined.connectedDevices
  });
});

app.get('/api/sessions/:sessionId', (req, res) => {
  const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  const session = getSessionById(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session expired or not found.' });
  }

  return res.json(getPublicSession(session));
});

app.get('/api/sessions/:sessionId/qr', async (req, res) => {
  const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  const session = getSessionById(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session expired or not found.' });
  }

  const joinUrl = `${config.webUrl}/join/${session.accessCode}`;
  const dataUrl = await QRCode.toDataURL(joinUrl);
  return res.json({ url: joinUrl, dataUrl, accessCode: session.accessCode });
});

app.post('/api/sessions/:sessionId/files', upload.single('file'), (req, res) => {
  const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  const session = getSessionById(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session expired or not found.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const generatedBy = String(req.body?.deviceName ?? 'Device');
  const fileId = `file-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const saved = addFileToSession(session.sessionId, {
    id: fileId,
    name: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype || 'application/octet-stream',
    size: req.file.size,
    path: req.file.path,
    status: 'completed',
    generatedBy
  });

  if (!saved) {
    return res.status(400).json({ error: 'Unable to attach file to session.' });
  }

  const fileRecord = saved.files[saved.files.length - 1];
  broadcastSessionEvent(session.sessionId, 'FILE_COMPLETED', {
    file: {
      id: fileRecord.id,
      name: fileRecord.originalName,
      size: fileRecord.size,
      mimeType: fileRecord.mimeType,
      downloadUrl: transferService.getDownloadUrl(session.sessionId, fileRecord.id)
    }
  });

  return res.status(201).json({
    message: 'File uploaded successfully.',
    file: {
      id: fileRecord.id,
      name: fileRecord.originalName,
      size: fileRecord.size,
      mimeType: fileRecord.mimeType,
      status: fileRecord.status,
      downloadUrl: transferService.getDownloadUrl(session.sessionId, fileRecord.id)
    }
  });
});

app.get('/api/sessions/:sessionId/files', (req, res) => {
  const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  const session = getSessionById(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session expired or not found.' });
  }

  return res.json({
    files: session.files.map((file) => ({
      id: file.id,
      name: file.name,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      status: file.status,
      createdAt: file.createdAt,
      generatedBy: file.generatedBy,
      downloadUrl: transferService.getDownloadUrl(session.sessionId, file.id)
    }))
  });
});

app.get('/api/sessions/:sessionId/files/:fileId', (req, res) => {
  const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  const session = getSessionById(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session expired or not found.' });
  }

  const file = session.files.find((item) => item.id === req.params.fileId);
  if (!file) {
    return res.status(404).json({ error: 'File not found.' });
  }

  const safePath = path.resolve(file.path);
  if (!safePath.startsWith(path.resolve(config.storagePath))) {
    return res.status(400).json({ error: 'Invalid file path.' });
  }

  return res.download(safePath, file.originalName);
});

app.delete('/api/sessions/:sessionId/files/:fileId', (req, res) => {
  const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  const session = getSessionById(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session expired or not found.' });
  }

  const target = session.files.find((file) => file.id === req.params.fileId);
  if (!target) {
    return res.status(404).json({ error: 'File not found.' });
  }

  if (fs.existsSync(target.path)) {
    fs.unlinkSync(target.path);
  }

  const updated = sessionRepository.removeFile(session.sessionId, req.params.fileId);
  broadcastSessionEvent(session.sessionId, 'FILE_REMOVED', { fileId: req.params.fileId });
  return res.json({ message: 'File removed.', session: updated ? getPublicSession(updated) : null });
});

app.post('/api/sessions/:sessionId/messages', (req, res) => {
  const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  const session = getSessionById(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session expired or not found.' });
  }

  const text = String(req.body?.text ?? '').trim();
  const sender = String(req.body?.deviceName ?? 'Device');

  if (!text) {
    return res.status(400).json({ error: 'Text message is required.' });
  }

  const updated = addMessageToSession(session.sessionId, sender, text);
  if (!updated) {
    return res.status(400).json({ error: 'Unable to send text.' });
  }

  const message = updated.messages[updated.messages.length - 1];
  broadcastSessionEvent(session.sessionId, 'TEXT_SHARED', { message });

  return res.status(201).json({ message, session: getPublicSession(updated) });
});

app.use((error: Error & { statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = error.statusCode ?? 500;
  const message = statusCode === 500 ? 'Something went wrong. Please try again.' : error.message;
  return res.status(statusCode).json({ error: message });
});

export { app };
