import { lazy, Suspense, useMemo, useState } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { useCardioStore } from '../stores/cardioStore';
import { useBodyWeightStore } from '../stores/bodyweightStore';
import { Icons } from './Icons';
import ProgressGallery from './ProgressGallery';
import { tr, getLang, useLang } from '../utils/i18n';

const Leaderboard = lazy(() => import('./Leaderboard'));

interface AnalyticsProps {
  showToast: (msg: string, type?: 'success' | 'info' | 'record') => void;
}

type Tab = 'muscu' | 'cardio' | 'poids' | 'photos';

function fmtDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  const locale = getLang() === 'fr' ? 'fr-FR' : getLang() === 'es' ? 'es-ES' : 'en-GB';
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

// ── Custom SVG area chart ─────────────────────────────────
function Chart({ data, accessor, unit, color, label }: {
  data: any[]; accessor: (d: any) => number; unit: string; color: string; label: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="glass" style={{ borderRadius: 22, padding: 30, textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>
        {tr({ fr: 'Aucune donnée', en: 'No data', es: 'Sin datos' })}
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
  useLang();
  const { sessions } = useSessionStore();
  const { courses, natations } = useCardioStore();
  const { weights, addWeight } = useBodyWeightStore();

  const [tab, setTab] = useState<Tab>('muscu');
  const [selectedExo, setSelectedExo] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [showFriends, setShowFriends] = useState(false);

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

    // Linear regression to predict next PR
    let prediction: { kgPerWeek: number; nextPrKg: number; weeksOut: number } | null = null;
    if (vals.length >= 3) {
      const n = vals.length;
      const xMean = (n - 1) / 2;
      const yMean = vals.reduce((s, v) => s + v, 0) / n;
      let num = 0, den = 0;
      vals.forEach((v, i) => { num += (i - xMean) * (v - yMean); den += (i - xMean) ** 2; });
      if (den > 0) {
        const slope = num / den; // kg per session
        // Compute average days between sessions for this exercise
        const dates = exoData.map((p) => new Date(p.date).getTime());
        const avgDaysBetween = exoData.length > 1
          ? (dates[dates.length - 1] - dates[0]) / (1000 * 86400 * (exoData.length - 1))
          : 7;
        const kgPerWeek = slope * (7 / Math.max(avgDaysBetween, 1));
        const current = vals[vals.length - 1];
        if (kgPerWeek > 0.1) {
          const nextPrKg = Math.ceil(current / 2.5) * 2.5; // next standard increment
          const sessionsNeeded = (nextPrKg - current) / slope;
          const weeksOut = Math.max(1, Math.round(sessionsNeeded * avgDaysBetween / 7));
          prediction = { kgPerWeek: Math.round(kgPerWeek * 10) / 10, nextPrKg, weeksOut };
        }
      }
    }

    return { max: exoMax, progress, oneRM, count: exoData.length, prediction };
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
      showToast(tr({ fr: `Poids enregistré: ${v} kg`, en: `Weight saved: ${v} kg`, es: `Peso guardado: ${v} kg` }), 'success');
    }
  };

  const TABS: { id: Tab; label: string; Icon: (p: any) => JSX.Element }[] = [
    { id: 'muscu',  label: tr({ fr: 'Muscu',  en: 'Gym',    es: 'Muscu'  }), Icon: Icons.Dumbbell },
    { id: 'cardio', label: tr({ fr: 'Cardio', en: 'Cardio', es: 'Cardio' }), Icon: Icons.Run },
    { id: 'poids',  label: tr({ fr: 'Poids',  en: 'Weight', es: 'Peso'   }), Icon: Icons.Scale },
    { id: 'photos', label: tr({ fr: 'Photos', en: 'Photos', es: 'Fotos'  }), Icon: Icons.Camera },
  ];

  if (showFriends) {
    return (
      <div className="page-enter" style={{ paddingBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px 6px' }}>
          <button onClick={() => setShowFriends(false)} className="tap glass" style={{
            width: 36, height: 36, borderRadius: 12, border: '1px solid var(--glass-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mute)',
          }}>
            <Icons.ChevronLeft size={16} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-mute)', letterSpacing: 0.16, fontWeight: 700, textTransform: 'uppercase' }}>
              {tr({ fr: 'Communauté', en: 'Community', es: 'Comunidad' })}
            </div>
            <h1 className="t-display" style={{ margin: '2px 0 0', fontSize: 36, lineHeight: 0.9 }}>
              {tr({ fr: 'Amis', en: 'Friends', es: 'Amigos' })}
            </h1>
          </div>
        </div>
        <Suspense fallback={<div className="skeleton" style={{ height: 200, margin: '12px 16px', borderRadius: 18 }} />}>
          <Leaderboard />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ padding: '14px 22px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--text-mute)', letterSpacing: 0.16, fontWeight: 700, textTransform: 'uppercase' }}>{tr({ fr: 'Progression', en: 'Progress', es: 'Progreso' })}</div>
          <h1 className="t-display" style={{ margin: '4px 0 0', fontSize: 52, lineHeight: 0.88 }}>Stats</h1>
        </div>
        <button
          onClick={() => setShowFriends(true)}
          className="tap glass"
          aria-label={tr({ fr: 'Amis', en: 'Friends', es: 'Amigos' })}
          style={{
            marginTop: 4,
            border: '1px solid var(--glass-border)',
            borderRadius: 14,
            padding: '8px 12px',
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'linear-gradient(135deg, rgba(96,165,250,0.10), rgba(255,107,53,0.06))',
            color: 'var(--text-soft)',
            fontWeight: 700, fontSize: 12,
          }}
        >
          <Icons.Users size={14} />
          <span>{tr({ fr: 'Amis', en: 'Friends', es: 'Amigos' })}</span>
        </button>
      </div>

      {/* Global stats */}
      <div style={{ padding: '6px 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <StatCard label={tr({ fr: 'Séances', en: 'Workouts', es: 'Sesiones' })} value={globalStats.sessions} icon={<Icons.Dumbbell size={14} />} />
        <StatCard label={tr({ fr: 'Volume', en: 'Volume', es: 'Volumen' })} value={(globalStats.volume / 1000).toFixed(1)} unit="t" accent="var(--primary)" icon={<Icons.Trophy size={14} />} />
        <StatCard label={tr({ fr: 'Course', en: 'Running', es: 'Carrera' })} value={globalStats.courseKm.toFixed(1)} unit="km" icon={<Icons.Run size={14} />} />
        <StatCard label={tr({ fr: 'Natation', en: 'Swim', es: 'Natación' })} value={(globalStats.swimM / 1000).toFixed(1)} unit="km" icon={<Icons.Swim size={14} />} />
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
              <option value="">{tr({ fr: '-- Choisir un exercice --', en: '-- Pick an exercise --', es: '-- Elegir ejercicio --' })}</option>
              {allExos.map((n) => <option key={n} value={n} style={{ background: '#1a1a1f' }}>{n}</option>)}
            </select>
          </div>

          {selectedExo && exoData && exoStats && (
            <>
              <div style={{ padding: '0 16px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <StatCard label="Max" value={exoStats.max} unit="kg" accent="var(--primary)" />
                <StatCard label={tr({ fr: '1RM est.', en: '1RM est.', es: '1RM est.' })} value={exoStats.oneRM} unit="kg" />
                <StatCard label={tr({ fr: 'Progression', en: 'Progress', es: 'Progreso' })} value={(exoStats.progress >= 0 ? '+' : '') + exoStats.progress} unit="kg" accent={exoStats.progress >= 0 ? 'var(--ok)' : 'var(--secondary)'} />
                <StatCard label={tr({ fr: 'Séances', en: 'Sessions', es: 'Sesiones' })} value={exoStats.count} />
              </div>
              <div style={{ padding: '0 16px 14px' }}>
                <Chart data={exoData} accessor={(p) => p.max} unit="kg" color="var(--primary)" label={tr({ fr: 'Poids max', en: 'Max weight', es: 'Peso máx.' })} />
              </div>
              {exoStats.progress > 0 && (
                <div style={{ padding: '0 16px 14px' }}>
                  <div className="glass" style={{ borderRadius: 18, padding: '14px 16px', background: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.2)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Icons.TrendUp size={22} color="var(--ok)" />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>+{exoStats.progress}kg {tr({ fr: `sur ${exoStats.count} séances`, en: `over ${exoStats.count} sessions`, es: `en ${exoStats.count} sesiones` })}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-soft)' }}>{tr({ fr: 'Belle progression — continue.', en: 'Great progress — keep going.', es: 'Gran progreso — ¡sigue así!' })}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* PR Prediction card */}
              {exoStats.prediction && (
                <div style={{ padding: '0 16px 14px' }}>
                  <div className="glass" style={{
                    borderRadius: 18, padding: '16px',
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(99,102,241,0.08))',
                    border: '1px solid rgba(139,92,246,0.25)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icons.Trophy size={17} color="#fff" />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#c4b5fd' }}>{tr({ fr: 'Prédiction de PR', en: 'PR Prediction', es: 'Predicción de PR' })}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>{tr({ fr: `basée sur ta progression (${exoStats.count} séances)`, en: `based on your progress (${exoStats.count} sessions)`, es: `basada en tu progreso (${exoStats.count} sesiones)` })}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1, background: 'rgba(139,92,246,0.1)', borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.1, marginBottom: 3 }}>{tr({ fr: 'Prochain PR', en: 'Next PR', es: 'Próximo PR' })}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#c4b5fd' }}>{exoStats.prediction.nextPrKg} kg</div>
                      </div>
                      <div style={{ flex: 1, background: 'rgba(99,102,241,0.1)', borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.1, marginBottom: 3 }}>{tr({ fr: 'Dans environ', en: 'In about', es: 'En aprox.' })}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#818cf8' }}>{exoStats.prediction.weeksOut} {tr({ fr: 'sem.', en: 'wks', es: 'sem.' })}</div>
                      </div>
                      <div style={{ flex: 1, background: 'rgba(99,102,241,0.08)', borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.1, marginBottom: 3 }}>{tr({ fr: 'Progression', en: 'Progress', es: 'Progreso' })}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#a5b4fc' }}>+{exoStats.prediction.kgPerWeek}kg/{tr({ fr: 'sem', en: 'wk', es: 'sem' })}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {allExos.length === 0 && (
            <div style={{ padding: '40px 22px', textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>
              {tr({ fr: 'Lance des séances pour voir tes stats !', en: 'Start workouts to see your stats!', es: '¡Haz sesiones para ver tus estadísticas!' })}
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
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-mute)', letterSpacing: 0.12 }}>{tr({ fr: 'Historique course', en: 'Run history', es: 'Historial carrera' })}</div>
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
            <div style={{ padding: '20px 22px', textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>{tr({ fr: 'Aucune course enregistrée.', en: 'No runs recorded.', es: 'Sin carreras registradas.' })}</div>
          )}
          {swimData.length > 0 && (
            <div style={{ padding: '0 16px 14px' }}>
              <Chart data={swimData} accessor={(r) => r.distance} unit="m" color="var(--cyan)" label="Natation · Distance" />
            </div>
          )}
        </div>
      )}

      {/* PHOTOS TAB */}
      {tab === 'photos' && (
        <div style={{ padding: '0 16px 20px' }}>
          <ProgressGallery showToast={showToast} />
        </div>
      )}


      {/* POIDS TAB */}
      {tab === 'poids' && (
        <div style={{ paddingBottom: 20 }}>
          {weightData.length >= 1 && (
            <div style={{ padding: '0 16px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <StatCard label={tr({ fr: 'Actuel', en: 'Current', es: 'Actual' })} value={weightData[weightData.length - 1].weight.toFixed(1)} unit="kg" accent="var(--primary)" />
              <StatCard label="Min" value={Math.min(...weightData.map((w) => w.weight)).toFixed(1)} unit="kg" />
              <StatCard
                label={tr({ fr: 'Évol.', en: 'Change', es: 'Cambio' })}
                value={(weightData[weightData.length - 1].weight - weightData[0].weight).toFixed(1)}
                unit="kg"
                accent={weightData[weightData.length - 1].weight <= weightData[0].weight ? 'var(--ok)' : 'var(--secondary)'}
              />
            </div>
          )}
          {weightData.length >= 2 && (
            <div style={{ padding: '0 16px 14px' }}>
              <Chart data={weightData} accessor={(w) => w.weight} unit="kg" color="var(--secondary)" label={tr({ fr: 'Poids corporel', en: 'Body weight', es: 'Peso corporal' })} />
            </div>
          )}
          <div style={{ padding: '0 16px 14px' }}>
            <div className="glass" style={{ borderRadius: 18, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: 10, letterSpacing: 0.12 }}>{tr({ fr: 'Ajouter mesure', en: 'Add measurement', es: 'Añadir medida' })}</div>
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
