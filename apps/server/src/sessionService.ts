import { randomUUID, randomBytes } from 'node:crypto';
import { SessionRepository } from './repositories/sessionRepository.js';
import { Session, SessionFile, SessionTextMessage } from './types.js';

export const sessionRepository = new SessionRepository();

export function createAccessCode(): string {
  const bytes = randomBytes(3);
  const code = bytes.toString('hex').slice(0, 6).toUpperCase();
  return code;
}

export function isValidAccessCode(accessCode: string): boolean {
  return /^[0-9A-F]{6}$/.test(accessCode.trim().toUpperCase());
}

export function createSession(creator = 'Device 1', ttlSeconds = 900): Session {
  let accessCode = createAccessCode();
  while (sessionRepository.getSessionByAccessCode(accessCode)) {
    accessCode = createAccessCode();
  }

  const session = sessionRepository.createSession(accessCode, creator);
  session.expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  return session;
}

export function joinSession(accessCode: string, deviceName = 'Device 2'): Session | undefined {
  const code = accessCode.trim().toUpperCase();
  if (!isValidAccessCode(code)) return undefined;

  const session = sessionRepository.getSessionByAccessCode(code);
  if (!session) return undefined;

  return sessionRepository.addConnectedDevice(session.sessionId, deviceName);
}

export function getSessionById(sessionId: string): Session | undefined {
  return sessionRepository.getSessionById(sessionId);
}

export function getSessionByCode(accessCode: string): Session | undefined {
  return sessionRepository.getSessionByAccessCode(accessCode.trim().toUpperCase());
}

export function addFileToSession(sessionId: string, file: Omit<SessionFile, 'status' | 'createdAt'> & { status?: 'uploaded' | 'completed'; createdAt?: string }): Session | undefined {
  return sessionRepository.addFile(sessionId, {
    ...file,
    id: file.id ?? randomUUID(),
    status: file.status ?? 'completed',
    createdAt: file.createdAt ?? new Date().toISOString()
  });
}

export function addMessageToSession(sessionId: string, sender: string, text: string): Session | undefined {
  return sessionRepository.addMessage(sessionId, sender, text);
}

export function expireSession(sessionId: string): Session | undefined {
  return sessionRepository.expireSession(sessionId);
}

export function hisSessionExpired(sessionId: string): boolean {
  const session = getSessionById(sessionId);
  return !session;
}

export function sanitizeFileName(filename: string): string {
  return filename
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 120);
}

export function getPublicSession(session: Session) {
  return {
    sessionId: session.sessionId,
    accessCode: session.accessCode,
    creator: session.creator,
    connectedDevices: session.connectedDevices,
    files: session.files.map((file) => ({
      id: file.id,
      name: file.name,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      status: file.status,
      createdAt: file.createdAt,
      generatedBy: file.generatedBy
    })),
    messages: session.messages,
    status: session.status,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt
  };
}

export function toSessionSnapshot(session: Session) {
  return { ...getPublicSession(session) };
}

export function getSessionAndFile(sessionId: string, fileId: string): { session?: Session; file?: SessionFile } {
  const session = getSessionById(sessionId);
  if (!session) return {};

  const file = session.files.find((item) => item.id === fileId);
  return { session, file };
}

export function resolveSessionStatus(session: Session | undefined): 'active' | 'expired' {
  if (!session) return 'expired';
  return new Date(session.expiresAt).getTime() <= Date.now() ? 'expired' : session.status;
}
