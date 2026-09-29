import { useNavigate } from 'react-router-dom';

interface LandingPageProps {
  onCreate: () => Promise<void> | void;
}

export default function LandingPage({ onCreate }: LandingPageProps) {
  const navigate = useNavigate();

  return (
    <main className="page-shell landing-page">
      <div className="brand-wrap">
        <div className="brand-row">
          <span className="brand-mark">J</span>
          <span className="brand-name">JaldiDo</span>
        </div>
      </div>

      <section className="hero-panel">
        <p className="eyebrow">Share Without The Friction.</p>
        <h1>JaldiDo</h1>
        <p className="hero-copy">
          Send files, text, links, and media between your devices using one simple code.
        </p>

        <div className="cta-row">
          <button className="primary-button" onClick={onCreate}>
            Create Share
          </button>
          <button className="secondary-button" onClick={() => navigate('/join')}>
            Join With Code
          </button>
        </div>

        <p className="muted-copy">No complicated setup. No account required. Just create, scan, and share.</p>
      </section>
    </main>
  );
}
