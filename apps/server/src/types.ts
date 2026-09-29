export type SessionStatus = 'active' | 'expired';

export interface SessionFile {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  status: 'uploaded' | 'completed';
  createdAt: string;
  generatedBy: string;
}

export interface SessionTextMessage {
  id: string;
  sender: string;
  text: string;
  createdAt: string;
}

export interface Session {
  sessionId: string;
  accessCode: string;
  creator: string;
  connectedDevices: string[];
  files: SessionFile[];
  messages: SessionTextMessage[];
  status: SessionStatus;
  createdAt: string;
  expiresAt: string;
}

export interface CreateSessionInput {
  deviceName?: string;
}

export interface JoinSessionInput {
  accessCode: string;
  deviceName?: string;
}

export interface RateLimitRecord {
  count: number;
  firstRequestAt: number;
}
