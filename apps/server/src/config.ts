import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config();

const configuredStoragePath = process.env.STORAGE_PATH;
const storagePath = process.env.VERCEL && configuredStoragePath && !path.isAbsolute(configuredStoragePath)
  ? '/tmp/jaldido/uploads'
  : configuredStoragePath ?? (process.env.VERCEL ? '/tmp/jaldido/uploads' : './tmp/uploads');

export const config = {
  port: Number(process.env.PORT ?? 3000),
  webUrl: process.env.WEB_URL ?? 'http://localhost:5173',
  sessionTtl: Number(process.env.SESSION_TTL ?? 900),
  maxFileSize: Number(process.env.MAX_FILE_SIZE ?? 104857600),
  storagePath,
  corsOrigins: ['http://localhost:5173', 'http://127.0.0.1:5173']
};
