import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { joinSession } from '../services/api';

export default function JoinPage() {
  const navigate = useNavigate();
  const { code } = useParams();
  const [accessCode, setAccessCode] = useState(code ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (code) {
      void handleConnect(code);
    }
  }, [code]);

  const handleConnect = async (nextCode = accessCode) => {
    const trimmed = nextCode.trim().toUpperCase();
    if (!/^[0-9A-F]{6}$/.test(trimmed)) {
      setError('Invalid or expired share code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await joinSession(trimmed, 'Laptop Device');
      navigate(`/session/${result.sessionId}`);
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : 'Invalid or expired share code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell join-page">
      <section className="panel join-panel">
        <p className="eyebrow">Join JaldiDo Session</p>
        <h2>Enter your 6-character code</h2>
        <input
          className="code-input"
          maxLength={6}
          value={accessCode}
          onChange={(event) => setAccessCode(event.target.value.toUpperCase())}
          placeholder="A91F03"
          aria-label="Share code"
        />
        {error ? <p className="error-text">{error}</p> : null}
        <button className="primary-button full-width" onClick={() => void handleConnect()} disabled={loading}>
          {loading ? 'Connecting...' : 'Connect'}
        </button>
      </section>
    </main>
  );
}
