import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

export class StorageService {
  private readonly rootDir: string;

  constructor(rootDir = config.storagePath) {
    this.rootDir = path.resolve(rootDir);
    fs.mkdirSync(this.rootDir, { recursive: true });
  }

  ensureSessionFolder(sessionId: string): string {
    const sessionDir = path.join(this.rootDir, sessionId);
    fs.mkdirSync(sessionDir, { recursive: true });
    return sessionDir;
  }

  saveFile(sessionId: string, originalName: string, buffer: Buffer, mimeType: string): { filePath: string; safeName: string } {
    const dir = this.ensureSessionFolder(sessionId);
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${Date.now()}-${safeName}`;
    const filePath = path.join(dir, fileName);
    fs.writeFileSync(filePath, buffer);
    return { filePath, safeName: fileName };
  }

  getFilePath(sessionId: string, fileName: string): string {
    return path.join(this.rootDir, sessionId, fileName);
  }

  removeFile(sessionId: string, fileName: string): void {
    const filePath = this.getFilePath(sessionId, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
