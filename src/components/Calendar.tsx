import { useMemo, useState } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { useCardioStore } from '../stores/cardioStore';
import { getDateString } from '../utils/export';
import { Icons } from './Icons';
import { setPendingAI } from '../utils/aiContext';
import type { Session } from '../types';

interface CalendarProps {
  onStartSession?: () => void;
  onAskCoach?: () => void;
}

const SESSION_CFG: Record<string, { color: string; dim: string }> = {
  push:  { color: 'var(--primary)',   dim: 'rgba(255,107,53,0.18)' },
  pull:  { color: 'var(--secondary)', dim: 'rgba(196,30,58,0.18)' },
  legs:  { color: '#A78BFA',          dim: 'rgba(167,139,250,0.18)' },
  upper: { color: '#FB923C',          dim: 'rgba(251,146,60,0.18)' },
  lower: { color: '#F87171',          dim: 'rgba(248,113,113,0.18)' },
};

const DAY_NAMES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function fmtDateLong(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}


export default function Calendar({ onStartSession, onAskCoach }: CalendarProps) {
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState<string | null>(getDateString());
  const { sessions, deleteSession, startPlannedSession, createSession, loadFromTemplate } = useSessionStore();
  const { courses, natations } = useCardioStore();

  const handleRedoSession = (sess: Session) => {
    createSession(sess.type);
    loadFromTemplate(sess.exercises.map((e) => ({ name: e.exerciseName, muscleGroup: e.muscleGroup })));
    onStartSession?.();
  };

  const handleAnalyzeSession = (sess: Session) => {
    const lines = sess.exercises.map((ex) => {
      const sets = ex.sets.length
        ? ex.sets.map((s) => `${s.weight}kg×${s.reps}`).join(', ')
        : '—';
      return `  • ${ex.exerciseName} : ${sets}`;
    }).join('\n');
    setPendingAI({
      kind: 'session-analysis',
      initialMessage: `Analyse cette séance ${sess.type} du ${sess.date} :\n${lines}\n\nDonne-moi ton analyse : intensité, équilibre musculaire, et 2-3 conseils concrets pour la prochaine fois.`,
      payload: { sessionId: sess.id, type: sess.type, date: sess.date, exercises: sess.exercises },
    });
    onAskCoach?.();
  };

  const year = month.getFullYear();
  const mo = month.getMonth();
  const daysInMonth = new Date(year, mo + 1, 0).getDate();
  const firstDay = new Date(year, mo, 1).getDay();
  const firstDayOffset = (firstDay + 6) % 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getDateStr = (d: number) =>
    `${year}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const actMap = useMemo(() => {
    const map: Record<string, { sessions: Session[]; hasCourse: boolean; hasNat: boolean }> = {};
    sessions.forEach((s) => {
      if (!map[s.date]) map[s.date] = { sessions: [], hasCourse: false, hasNat: false };
      map[s.date].sessions.push(s);
    });
    courses.forEach((c) => {
      if (!map[c.date]) map[c.date] = { sessions: [], hasCourse: false, hasNat: false };
      map[c.date].hasCourse = true;
    });
    natations.forEach((n) => {
      if (!map[n.date]) map[n.date] = { sessions: [], hasCourse: false, hasNat: false };
      map[n.date].hasNat = true;
    });
    return map;
  }, [sessions, courses, natations]);

  const today = getDateString();
  const monthLabel = month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const monthSessionCount = sessions.filter((s) =>
    s.date.startsWith(`${year}-${String(mo + 1).padStart(2, '0')}`)
  ).length;

  const monthKm = courses
    .filter((c) => c.date.startsWith(`${year}-${String(mo + 1).padStart(2, '0')}`))
    .reduce((s, c) => s + c.distance, 0);

  const selInfo = selected ? actMap[selected] : null;
  const selCourses = selected ? courses.filter((c) => c.date === selected) : [];
  const selNatations = selected ? natations.filter((n) => n.date === selected) : [];

  return (
    <div className="page-enter" style={{ paddingBottom: 20 }}>
      {/* Header */}
      <div style={{ padding: '14px 22px 14px' }}>
        <div style={{ fontSize: 11, color: 'var(--text-mute)', letterSpacing: 0.16, fontWeight: 700, textTransform: 'uppercase' }}>Historique</div>
        <h1 className="t-display" style={{ margin: '4px 0 0', fontSize: 52, lineHeight: 0.88 }}>Calendrier</h1>
        <div style={{ display: 'flex', gap: 18, marginTop: 12 }}>
          <div>
            <span className="t-num" style={{ fontSize: 22, color: 'var(--primary)' }}>{monthSessionCount}</span>
            <span style={{ fontSize: 12, color: 'var(--text-mute)', marginLeft: 4, fontWeight: 600 }}>séances</span>
          </div>
          <div style={{ width: 1, background: 'var(--line)' }} />
          <div>
            <span className="t-num" style={{ fontSize: 22 }}>{monthKm.toFixed(1)}</span>
            <span style={{ fontSize: 12, color: 'var(--text-mute)', marginLeft: 4, fontWeight: 600 }}>km</span>
          </div>
        </div>
      </div>

      {/* Month nav */}
      <div style={{ padding: '6px 16px 14px' }}>
        <div className="glass" style={{ borderRadius: 18, padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setMonth(new Date(year, mo - 1))} className="tap" style={{
            background: 'transparent', border: 'none', width: 36, height: 36, borderRadius: 12,
            color: 'var(--text-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Icons.ChevronLeft size={18} /></button>
          <span style={{ fontSize: 14, fontWeight: 700, textTransform: 'capitalize', letterSpacing: 0.1 }}>{monthLabel}</span>
          <button onClick={() => setMonth(new Date(year, mo + 1))} className="tap" style={{
            background: 'transparent', border: 'none', width: 36, height: 36, borderRadius: 12,
            color: 'var(--text-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Icons.ChevronRight size={18} /></button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: '0 16px 14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
          {DAY_NAMES.map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-mute)', letterSpacing: 0.12 }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={i} style={{ aspectRatio: '1' }} />;
            const iso = getDateStr(d);
            const info = actMap[iso];
            const sess = info?.sessions[0];
            const cfg = sess ? SESSION_CFG[sess.type] : null;
            const isToday = iso === today;
            const isSel = iso === selected;

            return (
              <button key={i} onClick={() => setSelected(iso === selected ? null : iso)} className="tap" style={{
                aspectRatio: '1', padding: 0, borderRadius: 12,
                background: cfg ? cfg.dim : 'rgba(255,255,255,0.03)',
                border: isSel ? '2px solid #fff' : isToday ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                position: 'relative', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                color: 'var(--text)',
              }}>
                {cfg && (
                  <div style={{
                    position: 'absolute', top: 4, right: 4,
                    width: 5, height: 5, borderRadius: '50%',
                    background: cfg.color, boxShadow: `0 0 6px ${cfg.color}`,
                  }} />
                )}
                <span className="t-num" style={{ fontSize: 16, color: cfg ? '#fff' : 'var(--text-soft)' }}>{d}</span>
                {(info?.hasCourse || info?.hasNat) && (
                  <div style={{ position: 'absolute', bottom: 3, display: 'flex', gap: 2 }}>
                    {info.hasCourse && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--info)' }} />}
                    {info.hasNat && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--cyan)' }} />}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ padding: '6px 22px 16px', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {Object.entries(SESSION_CFG).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: v.color }} />
            <span style={{ fontSize: 10, color: 'var(--text-mute)', fontWeight: 600, letterSpacing: 0.06, textTransform: 'uppercase' }}>{k}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--info)' }} />
          <span style={{ fontSize: 10, color: 'var(--text-mute)', fontWeight: 600, letterSpacing: 0.06, textTransform: 'uppercase' }}>Course</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)' }} />
          <span style={{ fontSize: 10, color: 'var(--text-mute)', fontWeight: 600, letterSpacing: 0.06, textTransform: 'uppercase' }}>Natation</span>
        </div>
      </div>

      {/* Day detail */}
      {selected && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 22px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-mute)', letterSpacing: 0.12 }}>{fmtDateLong(selected)}</div>
          </div>
          <div style={{ padding: '6px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {selInfo?.sessions.map((sess) => {
              const cfg = SESSION_CFG[sess.type];
              const isPlanned = !sess.completed;
              return (
                <div key={sess.id} className="glass" style={{
                  borderRadius: 22, padding: '14px 16px',
                  borderLeft: `3px solid ${cfg?.color || 'var(--primary)'}`,
                  ...(isPlanned ? { borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.15)', borderLeftStyle: 'solid' } : {}),
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{
                        fontSize: 10.5, fontWeight: 700, letterSpacing: 0.16, padding: '4px 10px', borderRadius: 999,
                        background: cfg?.dim || 'rgba(255,107,53,0.12)', color: cfg?.color || 'var(--primary)',
                        textTransform: 'uppercase',
                      }}>{sess.type}</span>
                      {isPlanned && (
                        <span style={{
                          fontSize: 9.5, fontWeight: 800, letterSpacing: 0.5, padding: '3px 8px', borderRadius: 999,
                          background: 'rgba(255,255,255,0.06)', color: 'var(--text-mute)',
                          border: '1px dashed rgba(255,255,255,0.2)',
                          textTransform: 'uppercase',
                        }}>À faire</span>
                      )}
                    </div>
                    <button className="tap" onClick={() => {
                      if (confirm('Supprimer cette séance ?')) deleteSession(sess.id);
                    }} style={{ background: 'transparent', border: 'none', color: 'var(--text-mute)' }}>
                      <Icons.Trash size={14} />
                    </button>
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {sess.exercises.map((e) => (
                      <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                        <span style={{ fontWeight: 600 }}>{e.exerciseName}</span>
                        <span className="t-mono" style={{ color: 'var(--text-mute)' }}>
                          {e.sets.map((s) => `${s.weight}×${s.reps}`).join(', ') || '—'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {isPlanned && (
                    <button
                      onClick={async () => {
                        const live = await startPlannedSession(sess.id);
                        if (live) onStartSession?.();
                      }}
                      className="tap"
                      style={{
                        marginTop: 12, width: '100%',
                        background: `linear-gradient(135deg, ${cfg?.color || 'var(--primary)'}, var(--secondary))`,
                        border: 'none', borderRadius: 14, padding: '11px',
                        color: '#fff', fontWeight: 800, fontSize: 13,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                      <Icons.Play size={14} /> Lancer cette séance
                    </button>
                  )}

                  {!isPlanned && sess.exercises.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button
                        onClick={() => handleRedoSession(sess)}
                        className="tap"
                        style={{
                          flex: 1,
                          background: 'rgba(255,107,53,0.12)',
                          border: '1px solid rgba(255,107,53,0.25)',
                          borderRadius: 12, padding: '10px',
                          color: 'var(--primary)', fontWeight: 700, fontSize: 12,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}>
                        <Icons.Play size={12} /> Refaire
                      </button>
                      <button
                        onClick={() => handleAnalyzeSession(sess)}
                        className="tap"
                        style={{
                          flex: 1,
                          background: 'rgba(96,165,250,0.10)',
                          border: '1px solid rgba(96,165,250,0.22)',
                          borderRadius: 12, padding: '10px',
                          color: 'var(--info)', fontWeight: 700, fontSize: 12,
                        }}>
                        🤖 Analyser IA
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {selCourses.map((c) => (
              <div key={c.id} className="glass" style={{ borderRadius: 22, padding: '14px 16px', borderLeft: '3px solid var(--info)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icons.Run size={18} color="var(--info)" />
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.16, color: 'var(--info)', textTransform: 'uppercase' }}>Course</span>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                  <div><div className="t-num" style={{ fontSize: 26 }}>{c.distance}</div><div style={{ fontSize: 10, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase' }}>km</div></div>
                  <div><div className="t-num" style={{ fontSize: 26 }}>{c.time}</div><div style={{ fontSize: 10, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase' }}>min</div></div>
                  <div>
                    <div className="t-num" style={{ fontSize: 26 }}>{c.distance > 0 ? (c.time / c.distance).toFixed(2) : '--'}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase' }}>min/km</div>
                  </div>
                </div>
                {typeof c.notes === 'string' && c.notes && (
                  <div style={{ fontSize: 11, color: 'var(--text-soft)', marginTop: 8, fontStyle: 'italic' }}>{c.notes}</div>
                )}
              </div>
            ))}

            {selNatations.map((n) => (
              <div key={n.id} className="glass" style={{ borderRadius: 22, padding: '14px 16px', borderLeft: '3px solid var(--cyan)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icons.Swim size={18} color="var(--cyan)" />
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.16, color: 'var(--cyan)', textTransform: 'uppercase' }}>
                    Natation{(n as any).style ? ` · ${(n as any).style}` : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                  <div><div className="t-num" style={{ fontSize: 26 }}>{n.distance}</div><div style={{ fontSize: 10, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase' }}>m</div></div>
                  <div><div className="t-num" style={{ fontSize: 26 }}>{n.time}</div><div style={{ fontSize: 10, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase' }}>min</div></div>
                </div>
                {typeof (n as any).notes === 'string' && (n as any).notes && (
                  <div style={{ fontSize: 11, color: 'var(--text-soft)', marginTop: 8, fontStyle: 'italic' }}>{(n as any).notes}</div>
                )}
              </div>
            ))}

            {!selInfo?.sessions.length && !selCourses.length && !selNatations.length && (
              <div style={{ textAlign: 'center', color: 'var(--text-mute)', fontSize: 13, padding: '20px 0' }}>
                Aucune activité ce jour.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
