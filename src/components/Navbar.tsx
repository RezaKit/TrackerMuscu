import type { Page } from '../App';
import { Icons } from './Icons';
import { t, useLang } from '../utils/i18n';

interface NavbarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

const TABS: { id: Page; key: string; Icon: (props: any) => JSX.Element }[] = [
  { id: 'dashboard', key: 'nav.home',     Icon: Icons.Home },
  { id: 'calendar',  key: 'nav.calendar', Icon: Icons.Calendar },
  { id: 'analytics', key: 'nav.stats',    Icon: Icons.Stats },
  { id: 'params',    key: 'nav.params',   Icon: Icons.Settings },
];

export default function Navbar({ currentPage, onPageChange }: NavbarProps) {
  useLang(); // re-render on language change
  return (
    <div style={{
      position: 'fixed', left: 0, right: 0, bottom: 0,
      paddingBottom: 'env(safe-area-inset-bottom, 8px)',
      paddingTop: 4, zIndex: 30,
      pointerEvents: 'none',
    }}>
      <div style={{
        margin: '0 14px', height: 60, position: 'relative',
        pointerEvents: 'auto',
      }}>
        {/* Glass pill */}
        <div className="glass-strong" style={{
          position: 'absolute', inset: 0,
          borderRadius: 28,
          display: 'flex', alignItems: 'center',
          padding: '0 6px',
        }}>
          {/* Left two tabs */}
          {TABS.slice(0, 2).map(({ id, key, Icon }) => {
            const on = currentPage === id;
            return (
              <button key={id} onClick={() => onPageChange(id)} className="tap" style={{
                background: 'none', border: 'none',
                padding: '8px 10px', flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                color: on ? 'var(--primary)' : 'var(--text-mute)',
              }}>
                <Icon size={22} stroke={on ? 2.2 : 1.8} />
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>{t(key)}</span>
              </button>
            );
          })}

          {/* FAB spacer */}
          <div style={{ width: 64 }} />

          {/* Right two tabs */}
          {TABS.slice(2).map(({ id, key, Icon }) => {
            const on = currentPage === id;
            return (
              <button key={id} onClick={() => onPageChange(id)} className="tap" style={{
                background: 'none', border: 'none',
                padding: '8px 10px', flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                color: on ? 'var(--primary)' : 'var(--text-mute)',
              }}>
                <Icon size={22} stroke={on ? 2.2 : 1.8} />
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>{t(key)}</span>
              </button>
            );
          })}
        </div>

        {/* Center FAB */}
        <button
          onClick={() => onPageChange('session')}
          className="tap pulse-glow"
          style={{
            position: 'absolute', left: '50%', top: -16,
            transform: 'translateX(-50%)',
            width: 58, height: 58, borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.15)',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
          }}
        >
          <Icons.Plus size={28} stroke={2.6} />
        </button>
      </div>
    </div>
  );
}
