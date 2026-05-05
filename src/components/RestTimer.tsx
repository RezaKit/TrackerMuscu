import { useEffect, useRef, useState } from 'react';
import { tr, useLang } from '../utils/i18n';

const PRESETS = [
  { label: '30s', s: 30 },
  { label: '1min', s: 60 },
  { label: '1m30', s: 90 },
  { label: '2min', s: 120 },
  { label: '3min', s: 180 },
];

interface RestTimerProps {
  trigger: number; // increment this to auto-start after a set
}

export default function RestTimer({ trigger }: RestTimerProps) {
  useLang();
  const [target, setTarget] = useState(90);
  const [seconds, setSeconds] = useState(90);
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetRef = useRef(90);

  const doStart = (t: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    targetRef.current = t;
    setTarget(t);
    setSeconds(t);
    setRunning(true);
    setDone(false);
    setExpanded(false);
  };

  // Auto-start when a set is added
  useEffect(() => {
    if (trigger > 0) doStart(targetRef.current);
  }, [trigger]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          setDone(true);
          setExpanded(true);
          if ('vibrate' in navigator) navigator.vibrate([80, 50, 80, 50, 200]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const progress = target > 0 ? seconds / target : 0;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeStr = mins > 0
    ? `${mins}:${String(secs).padStart(2, '0')}`
    : `${secs}s`;

  const timerColor = done ? 'var(--ok)'
    : seconds > target * 0.5 ? 'var(--ok)'
    : seconds > target * 0.25 ? '#FB923C'
    : 'var(--secondary)';

  const SIZE = 34;
  const R = 13;
  const CIRC = 2 * Math.PI * R;

  return (
    <div style={{
      position: 'fixed',
      bottom: `calc(env(safe-area-inset-bottom, 0px) + 20px)`,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 40,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
    }}>
      {/* Expanded panel — presets + controls */}
      {expanded && (
        <div className="glass-strong" style={{
          borderRadius: 20,
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          animation: 'fadeIn 0.15s ease',
          minWidth: 240,
        }}>
          <div style={{
            fontSize: 10, color: done ? 'var(--ok)' : 'var(--text-mute)',
            fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', letterSpacing: 0.12,
          }}>
            {done ? tr({fr:'✓ Repos terminé — relance ?',en:'✓ Rest done — restart?',es:'✓ Descanso listo — reiniciar?'}) : tr({fr:'Durée de repos',en:'Rest duration',es:'Duración del descanso'})}
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {PRESETS.map((p) => (
              <button key={p.s} onClick={() => doStart(p.s)} style={{
                border: 'none', borderRadius: 10, padding: '7px 9px',
                background: target === p.s && !done ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                color: target === p.s && !done ? '#fff' : 'var(--text-soft)',
                fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--mono)',
              }}>
                {p.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setRunning((r) => !r)} style={{
              flex: 1, border: 'none', borderRadius: 12, padding: '9px',
              background: running ? 'rgba(196,30,58,0.2)' : 'rgba(74,222,128,0.15)',
              color: running ? 'var(--secondary)' : 'var(--ok)',
              fontWeight: 700, fontSize: 12, cursor: 'pointer',
            }}>
              {running ? tr({fr:'Pause',en:'Pause',es:'Pausa'}) : tr({fr:'Reprendre',en:'Resume',es:'Reanudar'})}
            </button>
            <button onClick={() => setExpanded(false)} style={{
              flex: 1, border: 'none', borderRadius: 12, padding: '9px',
              background: 'rgba(255,255,255,0.06)', color: 'var(--text-mute)',
              fontWeight: 700, fontSize: 12, cursor: 'pointer',
            }}>
              {tr({fr:'Fermer',en:'Close',es:'Cerrar'})}
            </button>
          </div>
        </div>
      )}

      {/* Main floating pill */}
      <button onClick={() => setExpanded((e) => !e)} className="tap" style={{
        borderRadius: 999,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 16px 8px 8px',
        background: 'rgba(10,10,14,0.96)',
        border: done ? '1px solid var(--ok)' : '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        boxShadow: done
          ? '0 0 24px rgba(74,222,128,0.3), 0 8px 32px rgba(0,0,0,0.6)'
          : '0 8px 32px rgba(0,0,0,0.6)',
        cursor: 'pointer', transition: 'border-color 0.3s, box-shadow 0.3s',
      }}>
        {/* Circular progress ring */}
        <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={2.5} />
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none" stroke={timerColor} strokeWidth={2.5}
            strokeDasharray={`${CIRC * progress} ${CIRC}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.9s linear, stroke 0.5s ease' }} />
        </svg>

        {/* Time or done checkmark */}
        <span className="t-mono" style={{
          fontSize: 18, fontWeight: 700,
          color: done ? 'var(--ok)' : 'var(--text)',
          minWidth: 40, textAlign: 'center', letterSpacing: -0.5,
        }}>
          {done ? '✓' : timeStr}
        </span>

        {/* Status label */}
        <span style={{
          fontSize: 11, color: done ? 'var(--ok)' : running ? 'var(--text-mute)' : '#FB923C',
          fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.1,
        }}>
          {done ? tr({fr:"C'est bon !",en:'Good to go!',es:'¡Listo!'}) : running ? tr({fr:'Repos',en:'Rest',es:'Descanso'}) : tr({fr:'Pausa',en:'Paused',es:'En pausa'})}
        </span>
      </button>
    </div>
  );
}
