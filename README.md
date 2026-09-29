# JaldiDo

JaldiDo is a lightweight cross-device sharing app that lets people create a temporary session, generate a 6-character access code and QR code, join from another device, and exchange files, text, and links without creating accounts.

## Overview

The MVP focuses on the core flow:

1. Open the app
2. Create a session
3. Share a 6-character access code or QR code
4. Join from another device
5. Upload files or send text
6. Transfer data and let the session expire automatically

## Architecture

The project is structured as a small monorepo with:

- Web app: React + TypeScript + Vite
- Server: Express + TypeScript + WebSocket layer
- In-memory session repository for MVP sessions
- Local temporary storage for uploaded files
- QR generation for join URLs

The design keeps sessions, file storage, and transfer logic separate so future upgrades like WebRTC, object storage, and encryption can be added without rewriting the whole product.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind-inspired plain CSS design
- Express
- Node.js
- WebSocket (`ws`)
- Multer
- QRCode
- Vitest

## Folder Structure

```text
jaldido/
├── apps/
│   ├── web/
│   │   ├── index.html
│   │   ├── src/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── vitest.config.ts
│   └── server/
│       ├── src/
│       ├── package.json
│       ├── tsconfig.json
│       └── vitest.config.ts
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── ...
```

## Local Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Then open the app in the browser at:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Environment Variables

The app reads the following values from `.env` when present:

```env
PORT=3000
WEB_URL=http://localhost:5173
SESSION_TTL=900
MAX_FILE_SIZE=104857600
STORAGE_PATH=./tmp/uploads
```

## Development Commands

```bash
npm install
npm run dev
npm test
npm run build
```

## Production Build

```bash
npm run build
```

This compiles both the server and the frontend. The frontend output is under `apps/web/dist`, and the server transpiles to `apps/server/dist`.

## API Endpoints

### Session creation

```http
POST /api/sessions
```

Returns a session ID, a 6-character share code, and an expiry timestamp.

### Session join

```http
POST /api/sessions/join
```

Body:

```json
{
  "accessCode": "7F3A9C",
  "deviceName": "Laptop Device"
}
```

### Session details

```http
GET /api/sessions/:sessionId
```

### File upload

```http
POST /api/sessions/:sessionId/files
```

### File listing

```http
GET /api/sessions/:sessionId/files
```

### File download

```http
GET /api/sessions/:sessionId/files/:fileId
```

### Text messages

```http
POST /api/sessions/:sessionId/messages
```

## WebSocket Events

The server emits events for session lifecycle and transfers.

- `SESSION_CREATED`
- `DEVICE_JOINED`
- `DEVICE_LEFT`
- `FILE_STARTED`
- `FILE_PROGRESS`
- `FILE_COMPLETED`
- `TEXT_SHARED`
- `FILE_REMOVED`
- `SESSION_EXPIRED`

## Security Considerations

This MVP includes basic protections that are appropriate for a temporary-session sharing app:

- 6-character hexadecimal validation
- temporary session expiry enforcement
- rate limiting on session creation and join attempts
- file type and size validation via server-side checks
- local file storage using sanitized names
- session cleanup when expired
- no permanent user accounts or passwords

## Future Improvements

- WebRTC peer-to-peer transfers
- end-to-end encryption
- S3-compatible object storage
- resumable uploads
- stronger abuse protection
- password-protected session sharing
- multi-device rooms and history views
- mobile app and desktop app variants

## Notes

The current MVP uses a server-mediated transfer model and an in-memory session repository, which keeps the implementation reliable and easy to run locally while leaving the architecture ready for more advanced transfer and storage backends later.
