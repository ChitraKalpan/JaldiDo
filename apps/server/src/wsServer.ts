import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { SessionRepository } from './repositories/sessionRepository.js';
import { getSessionById } from './sessionService.js';

const sessionSockets = new Map<string, Set<WebSocket>>();

export function broadcastSessionEvent(sessionId: string, type: string, payload: Record<string, unknown>) {
  const sockets = sessionSockets.get(sessionId);
  if (!sockets) return;

  const event = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
  for (const socket of sockets) {
    if (socket.readyState === socket.OPEN) {
      socket.send(event);
    }
  }
}

export function attachWebSocketServer(server: http.Server, repository: SessionRepository) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket) => {
    socket.on('message', (rawMessage) => {
      try {
        const message = JSON.parse(rawMessage.toString()) as { type?: string; sessionId?: string; deviceName?: string };

        if (!message.type || !message.sessionId) {
          socket.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Session info required.' } }));
          return;
        }

        const session = getSessionById(message.sessionId);
        if (!session) {
          socket.send(JSON.stringify({ type: 'SESSION_EXPIRED', payload: { sessionId: message.sessionId } }));
          return;
        }

        if (!sessionSockets.has(message.sessionId)) {
          sessionSockets.set(message.sessionId, new Set());
        }

        sessionSockets.get(message.sessionId)?.add(socket);

        if (message.type === 'JOIN') {
          const joinedName = message.deviceName ?? 'Guest Device';
          if (!session.connectedDevices.includes(joinedName)) {
            session.connectedDevices = [...new Set([...session.connectedDevices, joinedName])];
          }
          broadcastSessionEvent(message.sessionId, 'DEVICE_JOINED', { deviceName: joinedName });
        }
      } catch (error) {
        socket.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Invalid websocket message.' } }));
      }
    });

    socket.on('close', () => {
      for (const [sessionId, sockets] of sessionSockets.entries()) {
        if (sockets.has(socket)) {
          sockets.delete(socket);
          if (sockets.size === 0) {
            sessionSockets.delete(sessionId);
          }
          break;
        }
      }
    });
  });

  return { wss, repository };
}
