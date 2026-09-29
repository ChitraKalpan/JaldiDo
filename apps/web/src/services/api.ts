const PATH = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${PATH}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error ?? 'Something went wrong. Please try again.');
  }

  return data as T;
}

export async function createSession(deviceName = 'My Device') {
  return request<{ sessionId: string; accessCode: string; expiresAt: string; status: string; qrCodeUrl: string }>(
    '/sessions',
    {
      method: 'POST',
      body: JSON.stringify({ deviceName })
    }
  );
}

export async function joinSession(accessCode: string, deviceName = 'Guest Device') {
  return request<{ sessionId: string; expiresAt: string; status: string; connectedDevices: string[] }>(
    '/sessions/join',
    {
      method: 'POST',
      body: JSON.stringify({ accessCode, deviceName })
    }
  );
}

export async function getSession(sessionId: string) {
  return request<any>(`/sessions/${sessionId}`);
}

export async function getQrCode(sessionId: string) {
  return request<{ dataUrl: string; url: string; accessCode: string }>(`/sessions/${sessionId}/qr`);
}

export async function sendTextMessage(sessionId: string, text: string, deviceName = 'Device') {
  return request<any>(`/sessions/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text, deviceName })
  });
}

export async function uploadFile(sessionId: string, file: File, deviceName = 'Device') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('deviceName', deviceName);

  const response = await fetch(`${PATH}/sessions/${sessionId}/files`, {
    method: 'POST',
    body: formData
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error ?? 'File upload failed.');
  }

  return data;
}

export async function deleteFile(sessionId: string, fileId: string) {
  return request<any>(`/sessions/${sessionId}/files/${fileId}`, {
    method: 'DELETE'
  });
}
