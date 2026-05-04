import { useEffect, useState } from 'react';
import { applyUpdate, onUpdateAvailable } from '../utils/swUpdate';
import { t, useLang } from '../utils/i18n';

export default function UpdateBanner() {
  useLang();
  const [visible, setVisible] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const off = onUpdateAvailable(() => setVisible(true));
    return () => { off(); };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 10px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9500,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 999,
        background: 'linear-gradient(135deg, rgba(255,107,53,0.95), rgba(196,30,58,0.95))',
        color: '#fff',
        fontWeight: 700,
        fontSize: 12.5,
        letterSpacing: 0.2,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.12)',
        backdropFilter: 'blur(12px)',
        animation: 'modalSheetIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        maxWidth: 'calc(100vw - 24px)',
      }}
    >
      <span style={{ fontSize: 16, lineHeight: 1 }}>✨</span>
      <span>{t('update.available')}</span>
      <button
        onClick={async () => {
          setApplying(true);
          await applyUpdate();
          // Fallback: if SW doesn't reload us within 1.5s, force it
          setTimeout(() => window.location.reload(), 1500);
        }}
        disabled={applying}
        className="tap"
        style={{
          border: 'none',
          padding: '6px 14px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.95)',
          color: 'var(--secondary-deep)',
          fontWeight: 800,
          fontSize: 12,
          cursor: 'pointer',
          opacity: applying ? 0.6 : 1,
        }}
      >
        {applying ? '⟳' : t('update.reload')}
      </button>
      <button
        onClick={() => setVisible(false)}
        aria-label="Fermer"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.75)',
          cursor: 'pointer',
          fontSize: 14,
          padding: '0 2px',
        }}
      >
        ✕
      </button>
    </div>
  );
}
