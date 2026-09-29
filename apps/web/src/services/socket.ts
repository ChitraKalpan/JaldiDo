export type SocketEvent = {
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
};

export function connectSessionSocket(sessionId: string, onMessage: (event: SocketEvent) => void, deviceName = 'This Device') {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const socket = new WebSocket(`${protocol}://${window.location.host}/ws`);

  socket.addEventListener('open', () => {
    socket.send(JSON.stringify({ type: 'JOIN', sessionId, deviceName }));
  });

  socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data) as SocketEvent;
    onMessage(data);
  });

  socket.addEventListener('close', () => {
    console.info('WebSocket disconnected');
  });

  return socket;
}
