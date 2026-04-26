import { useMemo, useState } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { useCardioStore } from '../stores/cardioStore';
import { useBodyWeightStore } from '../stores/bodyweightStore';
import { Icons } from './Icons';

interface AnalyticsProps {
  showToast: (msg: string, type?: 'success' | 'info' | 'record') => void;
}

type Tab = 'muscu' | 'cardio' | 'poids';

function fmtDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// ── Custom SVG area chart ─────────────────────────────────
function Chart({ data, accessor, unit, color, label }: {
  data: any[]; accessor: (d: any) => number; unit: string; color: string; label: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="glass" style={{ borderRadius: 22, padding: 30, textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>
        Aucune donnée
      </div>
    );
  }
  const W = 340, H = 130, pad = { l: 6, r: 6, t: 12, b: 16 };
  const values = data.map(accessor);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const xi = (i: number) => pad.l + (i / Math.max(1, data.length - 1)) * (W - pad.l - pad.r);
  const yi = (v: number) => pad.t + (1 - (v - min) / range) * (H - pad.t - pad.b);
  const path = values.map((v, i) => `${i ? 'L' : 'M'}${xi(i).toFixed(1)} ${yi(v).toFixed(1)}`).join(' ');
  const area = path + ` L${xi(values.length - 1)} ${H - pad.b} L${xi(0)} ${H - pad.b} Z`;
  const gradId = `grad-${color.replace(/[^a-z0-9]/gi, '')}`;

  return (
    <div className="glass" style={{ borderRadius: 22, padding: '14px 14px 8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 10.5, color: 'var(--text-mute)', fontWeight: 700, letterSpacing: 0.12, textTransform: 'uppercase' }}>{label}</span>
        <span className="t-mono" style={{ fontSize: 11, color }}>{values[values.length - 1]} {unit}</span>
      </div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={pad.l} x2={W - pad.r}
            y1={pad.t + g * (H - pad.t - pad.b)} y2={pad.t + g * (H - pad.t - pad.b)}
            stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        ))}
        <path d={area} fill={`url(#${gradId})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {values.map((v, i) => (
          <circle key={i} cx={xi(i)} cy={yi(v)} r={2.5} fill="#0E0E10" stroke={color} strokeWidth="1.5" />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-mute)', marginTop: -4 }}>
        <span>{data[0]?.date ? fmtDate(data[0].date) : ''}</span>
        <span>{data[data.length - 1]?.date ? fmtDate(data[data.length - 1].date) : ''}</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, accent, icon }: {
  label: string; value: string | number; unit?: string; accent?: string; icon?: React.ReactNode;
}) {
  return (
    <div className="glass" style={{ padding: '14px 14px 16px', borderRadius: 22, flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden' }}>
      {icon && (
        <div style={{ position: 'absolute', top: 12, right: 12, color: accent || 'var(--text-mute)', opacity: 0.7 }}>{icon}</div>
      )}
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.12, textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span className="t-num" style={{ fontSize: 34, color: accent || 'var(--text)' }}>{value}</span>
        {unit && <span style={{ fontSize: 12, color: 'var(--text-mute)', fontWeight: 600 }}>{unit}</span>}
      </div>
    </div>
  );
}

export default function Analytics({ showToast }: AnalyticsProps) {
  const { sessions } = useSessionStore();
  const { courses, natations } = useCardioStore();
  const { weights, addWeight } = useBodyWeightStore();

  const [tab, setTab] = useState<Tab>('muscu');
  const [selectedExo, setSelectedExo] = useState('');
  const [weightInput, setWeightInput] = useState('');

  const allExos = useMemo(() => {
    const s = new Set<string>();
    sessions.forEach((sess) => sess.exercises.forEach((ex) => s.add(ex.exerciseName)));
    return Array.from(s).sort();
  }, [sessions]);

  const globalStats = useMemo(() => {
    const totalVolume = sessions.reduce((sum, sess) =>
      sum + sess.exercises.reduce((es, ex) =>
        es + ex.sets.reduce((ss, s) => ss + s.weight * s.reps, 0), 0), 0);
    return {
      sessions: sessions.length,
      volume: totalVolume,
      courseKm: courses.reduce((s, c) => s + c.distance, 0),
      swimM: natations.reduce((s, n) => s + n.distance, 0),
    };
  }, [sessions, courses, natations]);

  const exoData = useMemo(() => {
    if (!selectedExo) return null;
    const points: { date: string; max: number }[] = [];
    [...sessions].sort((a, b) => a.date.localeCompare(b.date)).forEach((s) => {
      const ex = s.exercises.find((e) => e.exerciseName === selectedExo);
      if (ex && ex.sets.length) {
        const max = Math.max(...ex.sets.map((st) => st.weight));
        points.push({ date: s.date, max });
      }
    });
    return points;
  }, [selectedExo, sessions]);

  const exoStats = useMemo(() => {
    if (!exoData || !exoData.length) return null;
    const vals = exoData.map((p) => p.max);
    const exoMax = Math.max(...vals);
    const progress = vals[vals.length - 1] - vals[0];
    const oneRM = Math.round(exoMax * 1.0333);
    return { max: exoMax, progress, oneRM, count: exoData.length };
  }, [exoData]);

  const courseData = useMemo(() =>
    [...courses].sort((a, b) => a.date.localeCompare(b.date)), [courses]);
  const swimData = useMemo(() =>
    [...natations].sort((a, b) => a.date.localeCompare(b.date)), [natations]);
  const weightData = useMemo(() =>
    [...weights].sort((a, b) => a.date.localeCompare(b.date)), [weights]);

  const handleAddWeight = async () => {
    const v = parseFloat(weightInput);
    if (!isNaN(v) && v > 0) {
      await addWeight(v);
      setWeightInput('');
      showToast(`Poids enregistré: ${v} kg`, 'success');
    }
  };

  const TABS: { id: Tab; label: string; Icon: (p: any) => JSX.Element }[] = [
    { id: 'muscu',  label: 'Muscu',  Icon: Icons.Dumbbell },
    { id: 'cardio', label: 'Cardio', Icon: Icons.Run },
    { id: 'poids',  label: 'Poids',  Icon: Icons.Scale },
  ];

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ padding: '52px 22px 14px' }}>
        <div style={{ fontSize: 11, color: 'var(--text-mute)', letterSpacing: 0.16, fontWeight: 700, textTransform: 'uppercase' }}>Progression</div>
        <h1 className="t-display" style={{ margin: '4px 0 0', fontSize: 52, lineHeight: 0.88 }}>Stats</h1>
      </div>

      {/* Global stats */}
      <div style={{ padding: '6px 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <StatCard label="Séances" value={globalStats.sessions} icon={<Icons.Dumbbell size={14} />} />
        <StatCard label="Volume" value={(globalStats.volume / 1000).toFixed(1)} unit="t" accent="var(--primary)" icon={<Icons.Trophy size={14} />} />
        <StatCard label="Course" value={globalStats.courseKm.toFixed(1)} unit="km" icon={<Icons.Run size={14} />} />
        <StatCard label="Natation" value={(globalStats.swimM / 1000).toFixed(1)} unit="km" icon={<Icons.Swim size={14} />} />
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 16px 14px' }}>
        <div className="glass" style={{ borderRadius: 16, padding: 4, display: 'flex' }}>
          {TABS.map(({ id, label, Icon }) => {
            const on = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)} className="tap" style={{
                flex: 1, border: 'none', borderRadius: 12, padding: '10px',
                background: on ? 'var(--primary)' : 'transparent',
                color: on ? '#fff' : 'var(--text-mute)',
                fontSize: 12, fontWeight: 700, letterSpacing: 0.08, textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <Icon size={13} /> {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* MUSCU TAB */}
      {tab === 'muscu' && (
        <div style={{ paddingBottom: 20 }}>
          <div style={{ padding: '0 16px 12px' }}>
            <select value={selectedExo} onChange={(e) => setSelectedExo(e.target.value)} className="input-glass" style={{ appearance: 'none' }}>
              <option value="">-- Choisir un exercice --</option>
              {allExos.map((n) => <option key={n} value={n} style={{ background: '#1a1a1f' }}>{n}</option>)}
            </select>
          </div>

          {selectedExo && exoData && exoStats && (
            <>
              <div style={{ padding: '0 16px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <StatCard label="Max" value={exoStats.max} unit="kg" accent="var(--primary)" />
                <StatCard label="1RM est." value={exoStats.oneRM} unit="kg" />
                <StatCard label="Progression" value={(exoStats.progress >= 0 ? '+' : '') + exoStats.progress} unit="kg" accent={exoStats.progress >= 0 ? 'var(--ok)' : 'var(--secondary)'} />
                <StatCard label="Sessions" value={exoStats.count} />
              </div>
              <div style={{ padding: '0 16px 14px' }}>
                <Chart data={exoData} accessor={(p) => p.max} unit="kg" color="var(--primary)" label="Poids max" />
              </div>
              {exoStats.progress > 0 && (
                <div style={{ padding: '0 16px 14px' }}>
                  <div className="glass" style={{ borderRadius: 18, padding: '14px 16px', background: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.2)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Icons.TrendUp size={22} color="var(--ok)" />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>+{exoStats.progress}kg sur {exoStats.count} séances</div>
                      <div style={{ fontSize: 11, color: 'var(--text-soft)' }}>Belle progression — continue.</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {allExos.length === 0 && (
            <div style={{ padding: '40px 22px', textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>
              Lance des séances pour voir tes stats !
            </div>
          )}
        </div>
      )}

      {/* CARDIO TAB */}
      {tab === 'cardio' && (
        <div style={{ paddingBottom: 20 }}>
          {courseData.length > 0 ? (
            <>
              <div style={{ padding: '0 16px 12px' }}>
                <Chart data={courseData} accessor={(r) => r.distance} unit="km" color="var(--info)" label="Course · Distance" />
              </div>
              <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-mute)', letterSpacing: 0.12 }}>Historique course</div>
                {[...courseData].reverse().map((r) => (
                  <div key={r.id} className="glass" style={{ borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(96,165,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--info)' }}>
                      <Icons.Run size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{r.distance} km · {r.time} min</div>
                      <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>{fmtDate(r.date)} · {r.distance > 0 ? (r.time / r.distance).toFixed(2) : '--'} min/km</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ padding: '20px 22px', textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>Aucune course enregistrée.</div>
          )}
          {swimData.length > 0 && (
            <div style={{ padding: '0 16px 14px' }}>
              <Chart data={swimData} accessor={(r) => r.distance} unit="m" color="var(--cyan)" label="Natation · Distance" />
            </div>
          )}
        </div>
      )}

      {/* POIDS TAB */}
      {tab === 'poids' && (
        <div style={{ paddingBottom: 20 }}>
          {weightData.length >= 1 && (
            <div style={{ padding: '0 16px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <StatCard label="Actuel" value={weightData[weightData.length - 1].weight.toFixed(1)} unit="kg" accent="var(--primary)" />
              <StatCard label="Min" value={Math.min(...weightData.map((w) => w.weight)).toFixed(1)} unit="kg" />
              <StatCard
                label="Évol."
                value={(weightData[weightData.length - 1].weight - weightData[0].weight).toFixed(1)}
                unit="kg"
                accent={weightData[weightData.length - 1].weight <= weightData[0].weight ? 'var(--ok)' : 'var(--secondary)'}
              />
            </div>
          )}
          {weightData.length >= 2 && (
            <div style={{ padding: '0 16px 14px' }}>
              <Chart data={weightData} accessor={(w) => w.weight} unit="kg" color="var(--secondary)" label="Poids corporel" />
            </div>
          )}
          <div style={{ padding: '0 16px 14px' }}>
            <div className="glass" style={{ borderRadius: 18, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: 10, letterSpacing: 0.12 }}>Ajouter mesure</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="number" inputMode="decimal" placeholder="kg"
                  value={weightInput} onChange={(e) => setWeightInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddWeight()}
                  className="input-glass" style={{ flex: 1, padding: '10px 14px', fontSize: 18, fontFamily: 'var(--display)' }}
                />
                <button onClick={handleAddWeight} disabled={!weightInput} className="tap" style={{
                  border: 'none', borderRadius: 14, padding: '0 20px',
                  background: weightInput ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                  color: '#fff', fontWeight: 700, opacity: weightInput ? 1 : 0.4,
                }}>✓</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
