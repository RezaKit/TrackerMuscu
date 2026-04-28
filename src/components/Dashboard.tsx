import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSessionStore } from '../stores/sessionStore';
import { useCardioStore } from '../stores/cardioStore';
import { useBodyWeightStore } from '../stores/bodyweightStore';
import { getPersonalRecords } from '../utils/records';
import { exportWeekAsText, downloadText } from '../utils/weekExport';
import { scheduleSync } from '../utils/cloudSync';
import { useCalorieStore } from '../stores/calorieStore';
import { useRoutineStore } from '../stores/routineStore';
import { getDateString } from '../utils/export';
import { Icons } from './Icons';

interface DashboardProps {
  onNewSession: () => void;
  onGoToSettings: () => void;
  onGoToStats: () => void;
  onGoToCoach: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'record') => void;
  user?: { email?: string } | null;
  onShowAuth?: () => void;
  onSignOut?: () => void;
}

const SESSION_CFG: Record<string, { color: string; dim: string }> = {
  push:  { color: 'var(--primary)',   dim: 'rgba(255,107,53,0.12)' },
  pull:  { color: 'var(--secondary)', dim: 'rgba(196,30,58,0.12)' },
  legs:  { color: '#A78BFA',          dim: 'rgba(167,139,250,0.12)' },
  upper: { color: '#FB923C',          dim: 'rgba(251,146,60,0.12)' },
  lower: { color: '#F87171',          dim: 'rgba(248,113,113,0.12)' },
};

type SheetType = 'calories' | 'routine' | 'weight' | 'run' | 'swim' | null;

function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 22px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.12, textTransform: 'uppercase', color: 'var(--text-mute)' }}>
        {children}
      </div>
      {action}
    </div>
  );
}

function Sheet({ open, onClose, title, height = '80%', children }: {
  open: boolean; onClose: () => void; title?: string; height?: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.25s ease',
      }} />
      <div className="glass-strong" style={{
        position: 'relative', height,
        background: 'rgba(20,20,24,0.95)',
        borderTopLeftRadius: 32, borderTopRightRadius: 32,
        display: 'flex', flexDirection: 'column',
        animation: 'slideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <div style={{ width: 40, height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.2)', margin: '10px auto 4px' }} />
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 22px 10px' }}>
            <h2 className="t-display" style={{ margin: 0, fontSize: 28, color: 'var(--text)' }}>{title}</h2>
            <button onClick={onClose} className="tap" style={{
              background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 999,
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text)',
            }}><Icons.X size={18} /></button>
          </div>
        )}
        <div style={{
          flex: 1, overflowY: 'auto',
          WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}>{children}</div>
      </div>
    </div>,
    document.body
  );
}

// ── Calories Sheet ─────────────────────────────────────────
function CaloriesSheet({ open, onClose, showToast }: { open: boolean; onClose: () => void; showToast: DashboardProps['showToast'] }) {
  const { getDayStats, addEntry } = useCalorieStore();
  const today = getDateString();
  const stats = getDayStats(today);
  const [calIn, setCalIn] = useState(stats.in || 0);
  const [calOut, setCalOut] = useState(stats.out || 0);
  const net = calIn - calOut;

  const handleSave = async () => {
    if (calIn > 0) await addEntry(calIn, 'Total mangé', 'in', today, 'dejeuner');
    if (calOut > 0) await addEntry(calOut, 'Total dépensé', 'out', today);
    scheduleSync();
    showToast('Calories enregistrées', 'success');
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Calories" height="64%">
      <div style={{ padding: '8px 18px 24px' }}>
        <div style={{ fontSize: 12, color: 'var(--text-soft)', marginBottom: 16 }}>Total quotidien</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {([
            { label: 'Calories mangées', sub: 'Tout repas confondu', icon: <Icons.Apple size={20} />, color: 'var(--ok)', value: calIn, onChange: setCalIn, max: 4000 },
            { label: 'Calories dépensées', sub: 'Activité + métabolisme', icon: <Icons.Flame size={20} />, color: 'var(--primary)', value: calOut, onChange: setCalOut, max: 5000 },
          ] as const).map((row) => (
            <div key={row.label} className="glass" style={{ borderRadius: 18, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: row.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: row.color }}>
                  {row.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{row.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>{row.sub}</div>
                </div>
                <span className="t-num" style={{ fontSize: 26, color: row.color }}>{row.value}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => row.onChange(Math.max(0, row.value - 100))} className="tap" style={{ background: 'rgba(255,255,255,0.06)', border: 'none', width: 48, height: 36, borderRadius: 10, color: 'var(--text)', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>−100</button>
                <input type="range" min={0} max={row.max} step={50} value={row.value} onChange={(e) => row.onChange(+e.target.value)} style={{ flex: 1, accentColor: row.color }} />
                <button onClick={() => row.onChange(row.value + 100)} className="tap" style={{ background: 'rgba(255,255,255,0.06)', border: 'none', width: 48, height: 36, borderRadius: 10, color: 'var(--text)', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>+100</button>
              </div>
            </div>
          ))}
        </div>
        <div className="glass" style={{ marginTop: 14, borderRadius: 16, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.12 }}>Net</span>
          <span className="t-num" style={{ fontSize: 32, color: net <= 0 ? 'var(--ok)' : 'var(--primary)' }}>
            {net > 0 ? '+' : ''}{net} <span style={{ fontSize: 12, color: 'var(--text-mute)' }}>kcal</span>
          </span>
        </div>
        <button onClick={handleSave} className="tap" style={{
          marginTop: 18, width: '100%', border: 'none', borderRadius: 16,
          padding: 16, background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: 0.1, textTransform: 'uppercase',
        }}>Enregistrer</button>
      </div>
    </Sheet>
  );
}

// ── Weight Sheet ───────────────────────────────────────────
function WeightSheet({ open, onClose, showToast }: { open: boolean; onClose: () => void; showToast: DashboardProps['showToast'] }) {
  const { weights, addWeight } = useBodyWeightStore();
  const last = weights.length > 0 ? weights[weights.length - 1].weight : 75;
  const [val, setVal] = useState(last);

  const handleSave = async () => {
    await addWeight(val);
    scheduleSync();
    showToast(`Poids enregistré: ${val.toFixed(1)} kg`, 'success');
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Poids corporel" height="52%">
      <div style={{ padding: '8px 18px 24px' }}>
        <div style={{ fontSize: 12, color: 'var(--text-soft)', marginBottom: 14 }}>Pèse-toi à jeun, le matin.</div>
        <div className="glass" style={{ borderRadius: 22, padding: '24px 16px', textAlign: 'center' }}>
          <div className="t-num" style={{ fontSize: 64, color: 'var(--primary)' }}>
            {val.toFixed(1)}<span style={{ fontSize: 18, color: 'var(--text-mute)', marginLeft: 6 }}>kg</span>
          </div>
          <input type="range" min={40} max={120} step={0.1} value={val} onChange={(e) => setVal(+e.target.value)}
            style={{ width: '100%', marginTop: 16, accentColor: 'var(--primary)' }} />
        </div>
        <button onClick={handleSave} className="tap" style={{
          marginTop: 18, width: '100%', border: 'none', borderRadius: 16,
          padding: 16, background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: 0.1, textTransform: 'uppercase',
        }}>Enregistrer</button>
      </div>
    </Sheet>
  );
}

// ── Cardio Sheet ───────────────────────────────────────────
function CardioSheet({ kind, open, onClose, showToast }: { kind: 'run' | 'swim'; open: boolean; onClose: () => void; showToast: DashboardProps['showToast'] }) {
  const { addCourse, addNatation } = useCardioStore();
  const isRun = kind === 'run';
  const [dist, setDist] = useState('');
  const [mins, setMins] = useState('');
  const [style, setStyle] = useState('Crawl');
  const today = getDateString();

  const pace = () => {
    const d = parseFloat(dist), m = parseFloat(mins);
    if (!d || !m) return '--';
    return (m / d).toFixed(2);
  };

  const handleSave = async () => {
    const d = parseFloat(dist), m = parseFloat(mins);
    if (!d || d <= 0 || !m || m <= 0) return;
    if (isRun) {
      await addCourse(d, m, today);
      showToast(`Course: ${d} km · ${m} min`, 'success');
    } else {
      await addNatation(d, m, today, style);
      showToast(`Natation: ${d} m · ${m} min`, 'success');
    }
    scheduleSync();
    setDist(''); setMins('');
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title={isRun ? 'Course' : 'Natation'} height="68%">
      <div style={{ padding: '8px 18px 24px' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: isRun ? 'Distance' : 'Distance', sub: isRun ? 'km' : 'mètres', val: dist, set: setDist },
            { label: 'Temps', sub: 'minutes', val: mins, set: setMins },
          ].map((f) => (
            <div key={f.label} className="glass" style={{ flex: 1, borderRadius: 18, padding: '14px 14px 16px' }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-mute)', fontWeight: 700, letterSpacing: 0.12, textTransform: 'uppercase' }}>{f.label}</div>
              <input type="number" inputMode="decimal" value={f.val} onChange={(e) => f.set(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 36, width: '100%', outline: 'none', padding: 0, fontFamily: 'var(--display)' }} />
              <div style={{ fontSize: 11, color: 'var(--text-mute)', fontWeight: 600 }}>{f.sub}</div>
            </div>
          ))}
        </div>
        {isRun && dist && mins && (
          <div className="glass" style={{ marginTop: 12, borderRadius: 16, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.12 }}>Allure</span>
            <span className="t-mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--primary)' }}>{pace()} /km</span>
          </div>
        )}
        {!isRun && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.12, marginBottom: 8 }}>Style</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['Crawl', 'Brasse', 'Dos', 'Papillon', 'Mixte'].map((s) => (
                <button key={s} onClick={() => setStyle(s)} className="tap" style={{
                  border: 'none', borderRadius: 12, padding: '8px 14px',
                  background: style === s ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                  color: style === s ? '#fff' : 'var(--text-soft)',
                  fontSize: 12, fontWeight: 600,
                }}>{s}</button>
              ))}
            </div>
          </div>
        )}
        <button onClick={handleSave} disabled={!dist || !mins} className="tap" style={{
          marginTop: 22, width: '100%', border: 'none', borderRadius: 16,
          padding: 16, background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: 14,
          letterSpacing: 0.1, textTransform: 'uppercase', opacity: (!dist || !mins) ? 0.4 : 1,
        }}>Enregistrer</button>
      </div>
    </Sheet>
  );
}

// ── Main Dashboard ─────────────────────────────────────────
export default function Dashboard({ onNewSession, onGoToSettings, onGoToStats, onGoToCoach, showToast, user, onShowAuth, onSignOut }: DashboardProps) {
  const { sessions } = useSessionStore();
  const { courses, natations } = useCardioStore();
  const { weights } = useBodyWeightStore();
  const { getDayStats } = useCalorieStore();
  const { getCompletion, items: routineItems } = useRoutineStore();
  const [sheet, setSheet] = useState<SheetType>(null);

  const today = getDateString();
  const todaySession = sessions.find((s) => s.date === today);

  const weekStats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
    const from = getDateString(weekAgo);
    return {
      muscu: sessions.filter((s) => s.date >= from && s.date <= today).length,
      courseKm: courses.filter((c) => c.date >= from && c.date <= today).reduce((s, c) => s + c.distance, 0),
      swimM: natations.filter((n) => n.date >= from && n.date <= today).reduce((s, n) => s + n.distance, 0),
    };
  }, [sessions, courses, natations]);

  const currentStreak = useMemo(() => {
    const all = [
      ...sessions.map((s) => s.date),
      ...courses.map((c) => c.date),
      ...natations.map((n) => n.date),
    ];
    const sorted = Array.from(new Set(all)).sort((a, b) => b.localeCompare(a));
    if (!sorted.length) return 0;
    let streak = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      if (Math.round((prev.getTime() - curr.getTime()) / 86400000) <= 2) streak++;
      else break;
    }
    return streak;
  }, [sessions, courses, natations]);

  const latestWeight = weights.length > 0 ? weights[weights.length - 1] : null;
  const wDelta = weights.length >= 2 ? weights[weights.length - 1].weight - weights[weights.length - 2].weight : 0;

  const records = useMemo(() => getPersonalRecords(sessions).slice(0, 1), [sessions]);

  const calStats = getDayStats(today);
  const calNet = calStats.in - calStats.out;

  const routineToday = getCompletion(today);
  const routineChecked = routineToday?.completedItemIds.length || 0;

  const { entries: calorieEntries } = useCalorieStore();
  const { completions: routineCompletions, items: routineItemsFull } = useRoutineStore();

  const handleExportWeek = () => {
    try {
      const text = exportWeekAsText(sessions, courses, natations, weights, calorieEntries, routineCompletions, routineItemsFull);
      const filename = `semaine-${today}.txt`;
      downloadText(text, filename);
      showToast('Résumé semaine exporté', 'success');
    } catch {
      showToast('Erreur lors de l\'export', 'info');
    }
  };

  const todayLabel = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="page-enter" style={{ position: 'relative', minHeight: '100%' }}>

      {/* Header */}
      <div style={{ padding: '14px 22px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-mute)', letterSpacing: 0.16, fontWeight: 600, textTransform: 'capitalize' }}>
              {todayLabel}
            </div>
            <h1 className="t-display" style={{
              margin: '6px 0 0', fontSize: 56, lineHeight: 0.88,
              background: 'linear-gradient(180deg, #fff 30%, var(--primary) 130%)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            }}>TRACKER</h1>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
            {user ? (
              <button onClick={onSignOut} className="tap glass" style={{
                borderRadius: 12, border: '1px solid rgba(74,222,128,0.3)',
                padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(74,222,128,0.08)',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ok)', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--ok)', fontWeight: 700, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email?.split('@')[0]}
                </span>
              </button>
            ) : (
              <button onClick={onShowAuth} className="tap glass" style={{
                borderRadius: 12, border: '1px solid var(--glass-border)',
                padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-faint)', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--text-mute)', fontWeight: 700 }}>Se connecter</span>
              </button>
            )}
            <button onClick={onGoToSettings} className="tap glass" style={{
              width: 40, height: 40, borderRadius: 14, border: '1px solid var(--glass-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-soft)',
            }}>
              <Icons.Settings size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Hero CTA */}
      <div style={{ padding: '6px 16px 20px' }}>
        <button onClick={onNewSession} className="tap" style={{
          width: '100%', position: 'relative', overflow: 'hidden',
          border: 'none', borderRadius: 26, padding: 0, background: 'transparent',
        }}>
          <div style={{
            position: 'relative',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            borderRadius: 26, padding: '22px 22px 20px',
            display: 'flex', flexDirection: 'column', gap: 10,
            boxShadow: '0 10px 40px rgba(255,107,53,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)',
              backgroundSize: '200% 100%', animation: 'shimmer 3.5s linear infinite', pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.4,
              background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.18), transparent 50%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.25), transparent 50%)',
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.18, textTransform: 'uppercase' }}>
                  {todaySession ? 'Session done · push it' : 'Ready to lift'}
                </div>
                <div className="t-display" style={{ fontSize: 44, color: '#fff', marginTop: 4 }}>Nouvelle séance</div>
              </div>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.25)', flexShrink: 0,
              }}>
                <Icons.ArrowRight size={24} color="#fff" stroke={2.4} />
              </div>
            </div>
            <div style={{ position: 'relative', display: 'flex', gap: 6, marginTop: 4 }}>
              {['PUSH', 'PULL', 'LEGS', 'UPPER', 'LOWER'].map((t) => (
                <div key={t} style={{
                  fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5, color: 'rgba(255,255,255,0.85)',
                  background: 'rgba(0,0,0,0.22)', padding: '4px 8px', borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.12)',
                }}>{t}</div>
              ))}
            </div>
          </div>
        </button>
      </div>

      {/* 7-day stats */}
      <SectionLabel action={
        currentStreak > 1 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontSize: 11, fontWeight: 700 }}>
            <Icons.Flame size={12} /> {currentStreak}j streak
          </div>
        ) : undefined
      }>7 derniers jours</SectionLabel>
      <div style={{ padding: '6px 16px 16px', display: 'flex', gap: 10 }}>
        {[
          { label: 'Muscu', value: weekStats.muscu, unit: 'séances', Icon: Icons.Dumbbell },
          { label: 'Course', value: weekStats.courseKm.toFixed(1), unit: 'km', accent: 'var(--primary)', Icon: Icons.Run },
          { label: 'Natation', value: (weekStats.swimM / 1000).toFixed(1), unit: 'km', Icon: Icons.Swim },
        ].map((s) => (
          <div key={s.label} className="glass" style={{ flex: 1, padding: '14px 14px 16px', borderRadius: 22, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 12, right: 12, color: s.accent || 'var(--text-mute)', opacity: 0.7 }}>
              <s.Icon size={16} />
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.12, textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span className="t-num" style={{ fontSize: 32, color: s.accent || 'var(--text)' }}>{s.value}</span>
              <span style={{ fontSize: 11, color: 'var(--text-mute)', fontWeight: 600 }}>{s.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Calories */}
      <SectionLabel action={
        <button onClick={() => setSheet('calories')} className="tap" style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, fontWeight: 700, padding: 0 }}>
          + Logger
        </button>
      }>Calories · aujourd'hui</SectionLabel>
      <div style={{ padding: '6px 16px 16px' }}>
        <div className="glass" style={{ borderRadius: 22, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-mute)', fontWeight: 700, letterSpacing: 0.12, textTransform: 'uppercase' }}>Net</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                <span className="t-num" style={{ fontSize: 48, color: calNet <= 0 ? 'var(--ok)' : 'var(--primary)' }}>
                  {calNet > 0 ? '+' : ''}{calNet}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-mute)', fontWeight: 600 }}>kcal</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-soft)', marginTop: 2 }}>
                {calNet < 0 ? `Déficit · ${Math.abs(calNet)} kcal` : calNet === 0 ? 'Équilibre' : `Surplus · +${calNet} kcal`}
              </div>
            </div>
            <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
              <svg width="72" height="72" viewBox="0 0 76 76">
                <circle cx="38" cy="38" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                <circle cx="38" cy="38" r="32" fill="none" stroke="var(--primary)" strokeWidth="6"
                  strokeDasharray={`${Math.min(calStats.in / 2500, 1) * 201} 999`} strokeLinecap="round"
                  transform="rotate(-90 38 38)" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className="t-num" style={{ fontSize: 20, color: 'var(--text)' }}>{calStats.in}</div>
                <div style={{ fontSize: 8.5, color: 'var(--text-mute)', fontWeight: 700, letterSpacing: 0.1 }}>IN</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
            {[
              { label: 'Mangé', val: calStats.in, Icon: Icons.Apple, color: 'var(--ok)' },
              { label: 'Dépensé', val: calStats.out, Icon: Icons.Flame, color: 'var(--primary)' },
            ].map((row) => (
              <div key={row.label} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: row.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: row.color }}>
                  <row.Icon size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 9.5, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.1 }}>{row.label}</div>
                  <div className="t-mono" style={{ fontSize: 15, fontWeight: 600 }}>{row.val} <span style={{ fontSize: 10, color: 'var(--text-mute)' }}>kcal</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Routine */}
      <SectionLabel action={
        <button onClick={() => setSheet('routine')} className="tap" style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, fontWeight: 700, padding: 0 }}>
          Modifier
        </button>
      }>Routine du soir</SectionLabel>
      <RoutineSectionContent routineToday={routineToday} routineItems={routineItems} routineChecked={routineChecked} />

      {/* Weight + PR */}
      <div style={{ padding: '6px 16px 16px', display: 'flex', gap: 10 }}>
        <button onClick={() => setSheet('weight')} className="tap glass" style={{
          flex: 1, borderRadius: 22, padding: '14px 14px 16px', border: '1px solid var(--glass-border)',
          textAlign: 'left',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-mute)', fontWeight: 700, letterSpacing: 0.12, textTransform: 'uppercase' }}>Poids</div>
            <Icons.Scale size={14} color="var(--text-mute)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
            <span className="t-num" style={{ fontSize: 36 }}>{latestWeight ? latestWeight.weight.toFixed(1) : '--'}</span>
            <span style={{ fontSize: 12, color: 'var(--text-mute)', fontWeight: 600 }}>kg</span>
          </div>
          {latestWeight && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, color: wDelta < 0 ? 'var(--ok)' : 'var(--secondary)' }}>
              {wDelta < 0 ? <Icons.TrendDown size={12} /> : <Icons.TrendUp size={12} />}
              <span style={{ fontSize: 11, fontWeight: 600 }}>{wDelta > 0 ? '+' : ''}{wDelta.toFixed(1)} kg</span>
            </div>
          )}
        </button>
        <button onClick={onGoToStats} className="tap glass" style={{
          flex: 1, borderRadius: 22, padding: '14px 14px 16px', border: '1px solid var(--glass-border)',
          textAlign: 'left',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-mute)', fontWeight: 700, letterSpacing: 0.12, textTransform: 'uppercase' }}>Top PR</div>
            <Icons.Trophy size={14} color="var(--primary)" />
          </div>
          {records.length > 0 ? (
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{records[0].exerciseName}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                <span className="t-num" style={{ fontSize: 28, color: 'var(--primary)' }}>{records[0].weight}</span>
                <span style={{ fontSize: 11, color: 'var(--text-mute)', fontWeight: 600 }}>kg × {records[0].reps}</span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-mute)', marginTop: 10 }}>Lance une séance !</div>
          )}
        </button>
      </div>

      {/* Today session */}
      {todaySession && (
        <>
          <SectionLabel>Aujourd'hui</SectionLabel>
          <div style={{ padding: '6px 16px 16px' }}>
            <div className="glass" style={{ borderRadius: 22, padding: '16px 18px', borderLeft: `3px solid ${SESSION_CFG[todaySession.type]?.color || 'var(--primary)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontSize: 10.5, fontWeight: 700, letterSpacing: 0.16, padding: '4px 10px', borderRadius: 999,
                  background: SESSION_CFG[todaySession.type]?.dim || 'rgba(255,107,53,0.12)',
                  color: SESSION_CFG[todaySession.type]?.color || 'var(--primary)',
                  textTransform: 'uppercase',
                }}>{todaySession.type}</span>
                <div style={{ fontSize: 13, color: 'var(--text-soft)' }}>
                  {todaySession.exercises.length} exos · {todaySession.exercises.reduce((t, e) => t + e.sets.length, 0)} sets
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Quick log */}
      <SectionLabel>Quick log</SectionLabel>
      <div style={{ padding: '6px 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {([
          { label: 'Course', Icon: Icons.Run, kind: 'run' as const },
          { label: 'Natation', Icon: Icons.Swim, kind: 'swim' as const },
        ] as const).map((item) => (
          <button key={item.label} onClick={() => setSheet(item.kind)} className="tap glass" style={{
            borderRadius: 18, padding: '14px', border: '1px solid var(--glass-border)',
            display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)',
          }}>
            <div style={{ width: 34, height: 34, borderRadius: 11, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <item.Icon size={18} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600 }}>+ {item.label}</span>
          </button>
        ))}
      </div>

      {/* AI Coach banner */}
      <div style={{ padding: '0 16px 14px' }}>
        <button onClick={onGoToCoach} className="tap" style={{
          width: '100%', borderRadius: 20, padding: '14px 18px',
          background: 'linear-gradient(135deg, rgba(255,107,53,0.1) 0%, rgba(196,30,58,0.1) 100%)',
          border: '1px solid rgba(255,107,53,0.2)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 14, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icons.Bot size={22} color="#fff" />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Coach IA</div>
            <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 1 }}>
              Bilan semaine · Conseils · Nutrition · Technique
            </div>
          </div>
          <Icons.ChevronRight size={16} color="var(--primary)" />
        </button>
      </div>

      {/* Export */}
      <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8 }}>
        <button onClick={handleExportWeek} className="tap glass" style={{
          flex: 1, borderRadius: 14, padding: '12px', border: '1px solid var(--glass-border)',
          fontSize: 12, fontWeight: 600, color: 'var(--text-mute)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Icons.Download size={14} /> Résumé semaine
        </button>
      </div>

      {/* Sheets */}
      <CaloriesSheet open={sheet === 'calories'} onClose={() => setSheet(null)} showToast={showToast} />
      <RoutineSheet open={sheet === 'routine'} onClose={() => setSheet(null)} showToast={showToast} />
      <WeightSheet open={sheet === 'weight'} onClose={() => setSheet(null)} showToast={showToast} />
      <CardioSheet kind="run" open={sheet === 'run'} onClose={() => setSheet(null)} showToast={showToast} />
      <CardioSheet kind="swim" open={sheet === 'swim'} onClose={() => setSheet(null)} showToast={showToast} />
    </div>
  );
}

// ── Routine section content ────────────────────────────────
function RoutineSectionContent({ routineToday, routineItems, routineChecked }: {
  routineToday: any; routineItems: any[]; routineChecked: number;
}) {
  const ICONS: Record<string, (p: any) => JSX.Element> = {
    shower: Icons.Shower, reading: Icons.Book, stretch: Icons.Spark,
    sleep: Icons.Moon, meditation: Icons.Spark,
  };

  return (
    <div style={{ padding: '6px 16px 16px' }}>
      <div className="glass" style={{ borderRadius: 22, padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, rgba(96,165,250,0.18), rgba(34,211,238,0.10))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A5C8FF' }}>
              <Icons.Moon size={20} />
            </div>
            <div>
              <div style={{ fontSize: 10.5, color: 'var(--text-mute)', fontWeight: 700, letterSpacing: 0.12, textTransform: 'uppercase' }}>Routine soir</div>
              <span className="t-num" style={{ fontSize: 24 }}>{routineChecked}</span>
              <span style={{ fontSize: 11, color: 'var(--text-mute)', fontWeight: 600 }}>/{routineItems.length}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {routineItems.slice(0, 3).map((item) => {
            const on = routineToday?.completedItemIds.includes(item.id);
            const IcoKey = item.icon || item.name?.toLowerCase() || 'sleep';
            const Ico = ICONS[IcoKey] || Icons.Check;
            return (
              <div key={item.id} style={{
                flex: 1,
                background: on ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${on ? 'rgba(255,107,53,0.4)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 14, padding: '10px 6px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                color: on ? 'var(--primary)' : 'var(--text-mute)',
              }}>
                <Ico size={18} />
                <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.1, textTransform: 'uppercase' }}>{item.name}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Routine Sheet ──────────────────────────────────────────
function RoutineSheet({ open, onClose, showToast }: { open: boolean; onClose: () => void; showToast: DashboardProps['showToast'] }) {
  const { items, getCompletion, toggleItem } = useRoutineStore();
  const today = getDateString();
  const completion = getCompletion(today);
  const [bedtime, setBedtime] = useState('23:00');
  const [wake, setWake] = useState('07:00');

  const calcDuration = () => {
    const [bh, bm] = bedtime.split(':').map(Number);
    const [wh, wm] = wake.split(':').map(Number);
    let mins = (wh * 60 + wm) - (bh * 60 + bm);
    if (mins < 0) mins += 24 * 60;
    return (mins / 60).toFixed(1);
  };

  const handleSave = () => {
    showToast('Routine enregistrée', 'success');
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Routine du soir" height="78%">
      <div style={{ padding: '8px 18px 24px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-mute)', letterSpacing: 0.12, marginBottom: 8 }}>Sommeil</div>
        <div className="glass" style={{ borderRadius: 18, padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'Couché', val: bedtime, set: setBedtime },
              { label: 'Levé', val: wake, set: setWake },
            ].map((f) => (
              <div key={f.label} style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.1, marginBottom: 6 }}>{f.label}</div>
                <input type="time" value={f.val} onChange={(e) => f.set(e.target.value)} className="input-glass time-input"
                  style={{ padding: '10px 4px', textAlign: 'center', fontWeight: 700, fontSize: 15, fontFamily: 'var(--mono)', width: '100%', minWidth: 0, boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icons.Moon size={16} color="#A5C8FF" />
              <span style={{ fontSize: 12, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.12 }}>Durée</span>
            </div>
            <span className="t-num" style={{ fontSize: 26, color: '#A5C8FF' }}>{calcDuration()}<span style={{ fontSize: 12, color: 'var(--text-mute)', marginLeft: 4 }}>h</span></span>
          </div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-mute)', letterSpacing: 0.12, marginBottom: 8 }}>Rituel</div>
        <div style={{
          display: 'flex', gap: 8, marginBottom: 20,
          overflowX: 'auto', WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none', overscrollBehavior: 'contain',
        }}>
          {items.map((item) => {
            const on = completion?.completedItemIds.includes(item.id) ?? false;
            return (
              <button key={item.id} onClick={() => toggleItem(today, item.id)} className="tap glass" style={{
                flexShrink: 0, width: 80,
                border: `1px solid ${on ? 'rgba(255,107,53,0.5)' : 'var(--glass-border)'}`,
                background: on ? 'rgba(255,107,53,0.12)' : 'var(--glass-bg)',
                borderRadius: 16, padding: '10px 4px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                color: on ? 'var(--primary)' : 'var(--text-mute)',
              }}>
                <span style={{ fontSize: 18, opacity: on ? 1 : 0.5 }}>{item.emoji}</span>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: 0.1, textTransform: 'uppercase',
                  width: '100%', textAlign: 'center', padding: '0 4px',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{item.name}</span>
              </button>
            );
          })}
        </div>

        <button onClick={handleSave} className="tap" style={{
          width: '100%', border: 'none', borderRadius: 16, padding: 16,
          background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: 0.1, textTransform: 'uppercase',
        }}>Enregistrer</button>
      </div>
    </Sheet>
  );
}
