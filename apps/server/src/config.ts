import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 3000),
  webUrl: process.env.WEB_URL ?? 'http://localhost:5173',
  sessionTtl: Number(process.env.SESSION_TTL ?? 900),
  maxFileSize: Number(process.env.MAX_FILE_SIZE ?? 104857600),
  storagePath: process.env.STORAGE_PATH ?? './tmp/uploads',
  corsOrigins: ['http://localhost:5173', 'http://127.0.0.1:5173']
};
