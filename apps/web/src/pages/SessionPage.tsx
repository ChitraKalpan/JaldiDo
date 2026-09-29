import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteFile, getQrCode, getSession, sendTextMessage } from '../services/api';
import { connectSessionSocket, SocketEvent } from '../services/socket';
import type { Session, SessionFile, SessionMessage } from '../types';

interface SessionPageProps {
  onCreateSession: () => Promise<void> | void;
}

export default function SessionPage({ onCreateSession }: SessionPageProps) {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const sessionRef = useRef<Session | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ name: string; percent: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const loadSession = async () => {
    if (!sessionId) return;
    try {
      const response = await getSession(sessionId);
      sessionRef.current = response;
      setSession(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load session.');
    }
  };

  useEffect(() => {
    if (!sessionId) return;
    void loadSession();
    void getQrCode(sessionId).then((response) => setQrDataUrl(response.dataUrl)).catch(() => undefined);

    const socket = connectSessionSocket(sessionId, (event: SocketEvent) => {
      if (event.type === 'SESSION_EXPIRED') {
        setError('Session expired.');
        return;
      }
      void loadSession();
    }, 'Browser Device');

    return () => {
      socket.close();
    };
  }, [sessionId]);

  const timeLeft = useMemo(() => {
    if (!session?.expiresAt) return '00:00';
    const ms = new Date(session.expiresAt).getTime() - Date.now();
    if (ms <= 0) return '00:00';
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [session]);

  const copyCode = async () => {
    if (!session?.accessCode) return;
    await navigator.clipboard.writeText(session.accessCode);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const files = Array.from(event.dataTransfer.files);
    if (files.length) {
      await uploadFiles(files);
    }
  };

  const uploadFiles = async (files: File[]) => {
    if (!sessionId || !files.length) return;
    setUploading(true);
    setUploadProgress({ name: files[0].name, percent: 0 });

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('deviceName', 'Browser Device');

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', `/api/sessions/${sessionId}/files`);
          xhr.upload.onprogress = (progressEvent) => {
            if (progressEvent.lengthComputable) {
              const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
              setUploadProgress({ name: file.name, percent });
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
              return;
            }
            reject(new Error('File upload failed.'));
          };
          xhr.onerror = () => reject(new Error('File upload failed.'));
          xhr.send(formData);
        });
      }
      await loadSession();
      setUploadProgress(null);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'File upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async () => {
    if (!sessionId || !text.trim()) return;
    try {
      await sendTextMessage(sessionId, text, 'Browser Device');
      setText('');
      await loadSession();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to send text.');
    }
  };

  const removeFile = async (fileId: string) => {
    if (!sessionId) return;
    try {
      await deleteFile(sessionId, fileId);
      await loadSession();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Unable to remove file.');
    }
  };

  if (!session) {
    return <main className="page-shell"><section className="panel"><h2>Loading session...</h2></section></main>;
  }

  return (
    <main className="page-shell session-page">
      <section className="panel session-panel">
        <div className="session-header">
          <div>
            <p className="eyebrow">JaldiDo</p>
            <h2>Your Share Code</h2>
          </div>
          <div className="header-actions">
            <button className="secondary-button" onClick={() => void onCreateSession()}>Create New Session</button>
            <button className="ghost-button" onClick={() => navigate('/')}>Home</button>
          </div>
        </div>

        <div className="share-code-box">
          <div className="code-badge">{session.accessCode}</div>
          <button className="secondary-button" onClick={copyCode}>Copy Code</button>
        </div>

        <div className="qr-panel">
          {qrDataUrl ? <img src={qrDataUrl} alt="Session QR code" className="qr-code" /> : null}
          <p>Session expires in {timeLeft}</p>
        </div>

        <div className="status-row">
          <span className="status-chip">{session.connectedDevices.length > 1 ? 'Connected' : 'Waiting for another device...'}</span>
        </div>

        {error ? <p className="error-text">{error}</p> : null}

        <div className="devices-panel">
          <h3>Connected Devices</h3>
          {session.connectedDevices.map((device) => (
            <div key={device} className="device-pill">● {device}</div>
          ))}
        </div>

        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <p>Drag files here</p>
          <span>or</span>
          <label className="secondary-button file-button">
            <input
              type="file"
              multiple
              onChange={(event) => {
                if (event.target.files) {
                  void uploadFiles(Array.from(event.target.files));
                }
              }}
            />
            Add Files
          </label>
        </div>

        {uploading && uploadProgress ? (
          <div className="progress-box">
            <p>{uploadProgress.name}</p>
            <div className="progress-bar">
              <span style={{ width: `${uploadProgress.percent}%` }} />
            </div>
            <small>{uploadProgress.percent}%</small>
          </div>
        ) : null}

        <div className="text-panel">
          <h3>Send Text</h3>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Write or paste something..."
          />
          <button className="primary-button full-width" onClick={() => void sendMessage()}>
            Send
          </button>
        </div>

        <div className="files-panel">
          <h3>Shared Files</h3>
          {session.files.length === 0 ? <p className="muted-copy">No files yet.</p> : null}
          {session.files.map((file: SessionFile) => (
            <div key={file.id} className="file-card">
              <div className="file-meta">
                <span className="file-icon">📄</span>
                <div>
                  <strong>{file.originalName}</strong>
                  <small>{(file.size / 1024 / 1024).toFixed(2)} MB</small>
                </div>
              </div>
              <div className="file-actions">
                <button className="secondary-button" onClick={() => window.open(file.downloadUrl, '_blank')}>
                  Download
                </button>
                <button className="ghost-button danger" onClick={() => void removeFile(file.id)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="messages-panel">
          <h3>Shared Messages</h3>
          {session.messages.length === 0 ? <p className="muted-copy">No messages yet.</p> : null}
          {session.messages.map((message: SessionMessage) => (
            <div key={message.id} className="message-item">
              <strong>{message.sender}</strong>
              <p>{message.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
