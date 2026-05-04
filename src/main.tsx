import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker } from './utils/swUpdate'

// Hide the HTML splash screen as soon as React takes over
function hideSplash() {
  // Cancel the boot watchdog: React mounted, no recovery UI needed
  const w = (window as any).__bootWatchdog;
  if (w) { clearTimeout(w); (window as any).__bootWatchdog = null; }

  const el = document.getElementById('splash');
  if (!el) return;
  el.style.opacity = '0';
  setTimeout(() => el.remove(), 400);
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: string | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(err: Error) {
    return { error: err?.message ?? 'Unknown error' };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          position: 'fixed', inset: 0,
          background: '#050505',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 32, gap: 16, fontFamily: 'sans-serif',
        }}>
          <div style={{ fontSize: 42, letterSpacing: 3, color: '#FF6B35', fontWeight: 900 }}>RezaKit</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', maxWidth: 320, textAlign: 'center', lineHeight: 1.5 }}>
            Erreur au démarrage — vide ton cache Safari/Chrome et réessaie.
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', maxWidth: 320, wordBreak: 'break-all' }}>
            {this.state.error}
          </div>
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ marginTop: 8, background: '#FF6B35', border: 'none', borderRadius: 14, padding: '12px 28px', color: '#fff', fontWeight: 700, fontSize: 14 }}
          >
            Réinitialiser l'app
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

// Hide the inline HTML splash once React has rendered
hideSplash();

registerServiceWorker();
