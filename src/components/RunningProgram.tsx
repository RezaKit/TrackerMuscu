import { getDaysUntilRace, getCurrentWeek, PLAN } from '../utils/runningPlan';
import { Icons } from './Icons';

const PHASE_COLORS: Record<string, string> = {
  'Découverte':    '#60A5FA',
  'Fondation':     '#22D3EE',
  'Construction':  '#4ADE80',
  'Endurance':     '#FACC15',
  'Spécifique':    '#FB923C',
  'Simulation':    '#F87171',
  'Affûtage':      '#C084FC',
};

const PHASES_META = [
  { name: 'Découverte', weeks: [1, 4] },
  { name: 'Fondation', weeks: [5, 8] },
  { name: 'Construction', weeks: [9, 12] },
  { name: 'Endurance', weeks: [13, 16] },
  { name: 'Spécifique', weeks: [17, 20] },
  { name: 'Simulation', weeks: [21, 23] },
  { name: 'Affûtage', weeks: [24, 27] },
];

export default function RunningProgram() {
  const days = getDaysUntilRace();
  const currentWeek = getCurrentWeek();

  const startDate = new Date(2026, 3, 26);
  const raceDate = new Date(2026, 10, 1);
  const totalDays = Math.round((raceDate.getTime() - startDate.getTime()) / 86400000);
  const elapsed = Math.max(0, totalDays - days);
  const pct = Math.max(0, Math.min(100, (elapsed / totalDays) * 100));

  const curPlan = currentWeek >= 1 && currentWeek <= PLAN.length
    ? PLAN[currentWeek - 1]
    : PLAN[0];

  const phaseColor = PHASE_COLORS[curPlan.phase] || 'var(--primary)';

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ padding: '14px 22px 14px' }}>
        <div style={{ fontSize: 11, color: 'var(--text-mute)', letterSpacing: 0.16, fontWeight: 700, textTransform: 'uppercase' }}>1er Novembre 2026</div>
        <h1 className="t-display" style={{ margin: '4px 0 0', fontSize: 52, lineHeight: 0.88 }}>Semi.</h1>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span className="t-num" style={{ fontSize: 60, color: 'var(--primary)' }}>{days}</span>
          <span style={{ fontSize: 13, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.1 }}>jours restants</span>
        </div>
      </div>

      {/* Progress */}
      <div style={{ padding: '6px 16px 14px' }}>
        <div className="glass" style={{ borderRadius: 18, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, letterSpacing: 0.1, color: 'var(--text-mute)', textTransform: 'uppercase', marginBottom: 8 }}>
            <span>Semaine {Math.max(1, currentWeek)} / {PLAN.length}</span>
            <span>{Math.round(pct)}%</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: pct + '%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', borderRadius: 999 }} />
          </div>
          <div style={{ display: 'flex', gap: 3, marginTop: 10 }}>
            {PHASES_META.map((p) => (
              <div key={p.name} style={{
                flex: p.weeks[1] - p.weeks[0] + 1, height: 4, borderRadius: 2,
                background: PHASE_COLORS[p.name], opacity: 0.7,
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Current week card */}
      <div style={{ padding: '6px 22px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-mute)', letterSpacing: 0.12 }}>Cette semaine</div>
      <div style={{ padding: '6px 16px 16px' }}>
        <div className="glass-strong" style={{
          borderRadius: 24, padding: '18px 20px',
          background: `linear-gradient(135deg, ${phaseColor}20 0%, rgba(0,0,0,0.4) 100%)`,
          border: `1px solid ${phaseColor}33`,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: -20, bottom: -20, color: phaseColor, opacity: 0.15 }}>
            <Icons.Run size={140} stroke={1.4} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: phaseColor, boxShadow: `0 0 12px ${phaseColor}` }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: phaseColor, letterSpacing: 0.18, textTransform: 'uppercase' }}>
              S{curPlan.week} · {curPlan.phase}
            </span>
          </div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span className="t-num" style={{ fontSize: 76, color: '#fff', lineHeight: 0.85 }}>{curPlan.longRunKm}</span>
            <span style={{ fontSize: 14, color: 'var(--text-soft)', fontWeight: 600 }}>km dimanche</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-soft)', marginTop: 8, fontStyle: 'italic' }}>
            "{curPlan.description}"
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, padding: '5px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: 'var(--text-soft)', letterSpacing: 0.1, textTransform: 'uppercase' }}>
              {new Date(curPlan.sundayDate + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </div>
            {curPlan.optionalKm && (
              <div style={{ fontSize: 10.5, fontWeight: 700, padding: '5px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: 'var(--text-soft)', letterSpacing: 0.1, textTransform: 'uppercase' }}>
                + {curPlan.optionalKm}km en semaine
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All weeks */}
      <div style={{ padding: '6px 22px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-mute)', letterSpacing: 0.12 }}>{PLAN.length} semaines</div>
      <div style={{ padding: '6px 16px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {PLAN.map((w) => {
          const isCur = w.week === currentWeek;
          const isPast = w.week < currentWeek;
          const wColor = PHASE_COLORS[w.phase] || 'var(--primary)';
          return (
            <div key={w.week} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 12,
              background: isCur ? `${wColor}14` : 'transparent',
              border: isCur ? `1px solid ${wColor}40` : '1px solid transparent',
              opacity: isPast ? 0.45 : 1,
            }}>
              <div style={{ width: 30, fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: isCur ? wColor : 'var(--text-mute)' }}>
                S{String(w.week).padStart(2, '0')}
              </div>
              <div style={{ width: 4, alignSelf: 'stretch', background: wColor, borderRadius: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{w.phase}{w.isPeak ? ' · Peak' : ''}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-mute)', fontWeight: 600 }}>
                  {new Date(w.sundayDate + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <div className="t-num" style={{ fontSize: 22, color: isCur ? wColor : 'var(--text-soft)' }}>{w.longRunKm}</div>
              <span style={{ fontSize: 10, color: 'var(--text-mute)', fontWeight: 700 }}>km</span>
              {w.isPeak && <Icons.Flame size={14} color="var(--secondary)" />}
              {w.isTaper && <Icons.Moon size={14} color="var(--info)" />}
            </div>
          );
        })}

        {/* Race Day */}
        <div className="glass-strong" style={{
          marginTop: 12, borderRadius: 22, padding: '18px 20px',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.2)',
        }}>
          <Icons.Flag size={36} color="#fff" />
          <div className="t-display" style={{ fontSize: 36, color: '#fff', marginTop: 4, lineHeight: 1 }}>Race Day</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginTop: 4 }}>
            1 NOVEMBRE 2026 · 21.1 KM
          </div>
        </div>
      </div>
    </div>
  );
}
