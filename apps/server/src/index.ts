import http from 'node:http';
import { config } from './config.js';
import { app } from './app.js';
import { attachWebSocketServer } from './wsServer.js';
import { SessionRepository } from './repositories/sessionRepository.js';

const server = http.createServer(app);
attachWebSocketServer(server, new SessionRepository());

server.listen(config.port, () => {
  console.log(`JaldiDo server listening on http://localhost:${config.port}`);
});
