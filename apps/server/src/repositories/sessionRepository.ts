import { randomUUID } from 'node:crypto';
import { Session, SessionFile, SessionTextMessage } from '../types.js';

export class SessionRepository {
  private sessions = new Map<string, Session>();
  private accessCodeIndex = new Map<string, string>();

  createSession(accessCode: string, creator: string): Session {
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const session: Session = {
      sessionId: randomUUID(),
      accessCode,
      creator,
      connectedDevices: [creator],
      files: [],
      messages: [],
      status: 'active',
      createdAt: now,
      expiresAt
    };
    this.sessions.set(session.sessionId, session);
    this.accessCodeIndex.set(accessCode.toUpperCase(), session.sessionId);
    return session;
  }

  getSessionById(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      this.expireSession(sessionId);
      return undefined;
    }

    return session;
  }

  getSessionByAccessCode(accessCode: string): Session | undefined {
    const normalized = accessCode.toUpperCase();
    const sessionId = this.accessCodeIndex.get(normalized);
    if (!sessionId) return undefined;
    return this.getSessionById(sessionId);
  }

  getAllSessions(): Session[] {
    return Array.from(this.sessions.values()).filter((session) => {
      const expired = new Date(session.expiresAt).getTime() <= Date.now();
      if (expired) {
        this.expireSession(session.sessionId);
      }
      return !expired;
    });
  }

  addConnectedDevice(sessionId: string, deviceName: string): Session | undefined {
    const session = this.getSessionById(sessionId);
    if (!session) return undefined;

    session.connectedDevices = Array.from(new Set([...session.connectedDevices, deviceName]));
    return session;
  }

  addFile(sessionId: string, file: Omit<SessionFile, 'status' | 'createdAt'> & { status?: 'uploaded' | 'completed'; createdAt?: string }): Session | undefined {
    const session = this.getSessionById(sessionId);
    if (!session) return undefined;

    const record: SessionFile = {
      id: file.id,
      name: file.name,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      path: file.path,
      status: file.status ?? 'uploaded',
      createdAt: file.createdAt ?? new Date().toISOString(),
      generatedBy: file.generatedBy
    };

    session.files = [...session.files, record];
    return session;
  }

  removeFile(sessionId: string, fileId: string): Session | undefined {
    const session = this.getSessionById(sessionId);
    if (!session) return undefined;
    session.files = session.files.filter((file) => file.id !== fileId);
    return session;
  }

  addMessage(sessionId: string, sender: string, text: string): Session | undefined {
    const session = this.getSessionById(sessionId);
    if (!session) return undefined;

    const message: SessionTextMessage = {
      id: randomUUID(),
      sender,
      text,
      createdAt: new Date().toISOString()
    };

    session.messages = [...session.messages, message];
    return session;
  }

  expireSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    session.status = 'expired';
    this.sessions.delete(sessionId);
    this.accessCodeIndex.delete(session.accessCode.toUpperCase());
    return session;
  }

  getFileById(sessionId: string, fileId: string): SessionFile | undefined {
    const session = this.getSessionById(sessionId);
    if (!session) return undefined;
    return session.files.find((file) => file.id === fileId);
  }

  updateSessionExpiry(sessionId: string, expiresAt: string): Session | undefined {
    const session = this.getSessionById(sessionId);
    if (!session) return undefined;
    session.expiresAt = expiresAt;
    return session;
  }
}
