export interface SessionFile {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: 'uploaded' | 'completed';
  createdAt: string;
  generatedBy: string;
  downloadUrl: string;
}

export interface SessionMessage {
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
  status: 'active' | 'expired';
  createdAt: string;
  expiresAt: string;
}

export interface SessionTextMessage extends SessionMessage {}
