import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import LandingPage from './pages/LandingPage';
import JoinPage from './pages/JoinPage';
import SessionPage from './pages/SessionPage';
import { createSession } from './services/api';

function AppShell() {
  const navigate = useNavigate();

  const handleCreateSession = useCallback(async () => {
    try {
      const session = await createSession('My Device');
      navigate(`/session/${session.sessionId}`);
    } catch (error) {
      console.error(error);
    }
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage onCreate={handleCreateSession} />} />
      <Route path="/join/:code?" element={<JoinPage />} />
      <Route path="/session/:sessionId" element={<SessionPage onCreateSession={handleCreateSession} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
