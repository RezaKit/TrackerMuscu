import { Icons } from './Icons';

interface ToastProps {
  message: string;
  type: 'success' | 'info' | 'record';
}

const COLORS = {
  success: { bg: 'rgba(74,222,128,0.15)',  border: 'rgba(74,222,128,0.4)',  icon: 'var(--ok)' },
  info:    { bg: 'rgba(255,107,53,0.15)',  border: 'rgba(255,107,53,0.4)',  icon: 'var(--primary)' },
  record:  { bg: 'rgba(255,107,53,0.2)',   border: 'rgba(255,107,53,0.6)',  icon: 'var(--primary)' },
};

export default function Toast({ message, type }: ToastProps) {
  const c = COLORS[type];
  return (
    <div style={{
      position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 12px)', left: 16, right: 16, zIndex: 300,
      animation: 'toastIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <div className="glass-strong" style={{
        background: c.bg, borderColor: c.border,
        padding: '14px 16px', borderRadius: 18,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: c.icon, flexShrink: 0,
        }}>
          {type === 'record' ? <Icons.Flame size={20} /> : <Icons.Check size={20} />}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-soft)', fontWeight: 600 }}>{message}</div>
      </div>
    </div>
  );
}
