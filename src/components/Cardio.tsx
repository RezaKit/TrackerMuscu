import { useState } from 'react';
import { useCardioStore } from '../stores/cardioStore';
import { getDateString } from '../utils/export';
import { Icons } from './Icons';

interface CardioProps {
  showToast: (msg: string, type?: 'success' | 'info' | 'record') => void;
}

type Tab = 'course' | 'natation';

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function Cardio({ showToast }: CardioProps) {
  const [tab, setTab] = useState<Tab>('course');
  const [showForm, setShowForm] = useState(false);
  const [distance, setDistance] = useState('');
  const [time, setTime] = useState('');
  const [date, setDate] = useState(getDateString());
  const [notes, setNotes] = useState('');
  const [style, setStyle] = useState('Crawl');

  const { courses, natations, addCourse, addNatation, deleteCourse, deleteNatation } = useCardioStore();

  const handleAdd = async () => {
    const d = parseFloat(distance);
    const t = parseFloat(time);
    if (!d || !t) return;
    if (tab === 'course') {
      await addCourse(d, t, date, notes || undefined);
      showToast(`Course: ${d}km`, 'success');
    } else {
      await addNatation(d, t, date, style, notes || undefined);
      showToast(`Natation: ${d}m`, 'success');
    }
    setDistance(''); setTime(''); setNotes(''); setDate(getDateString());
    setShowForm(false);
  };

  const entries = tab === 'course' ? courses : natations;
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const totalDist = sorted.reduce((s, e) => s + e.distance, 0);

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ padding: '52px 22px 14px' }}>
        <div style={{ fontSize: 11, color: 'var(--text-mute)', letterSpacing: 0.16, fontWeight: 700, textTransform: 'uppercase' }}>Cardio</div>
        <h1 className="t-display" style={{ margin: '4px 0 0', fontSize: 52, lineHeight: 0.88 }}>Entraînement</h1>
      </div>

      {/* Tabs */}
      <div style={{ padding: '6px 16px 14px' }}>
        <div className="glass" style={{ borderRadius: 16, padding: 4, display: 'flex' }}>
          {([
            { id: 'course' as const, label: 'Course', Icon: Icons.Run },
            { id: 'natation' as const, label: 'Natation', Icon: Icons.Swim },
          ]).map(({ id, label, Icon }) => {
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

      {/* Stats */}
      {sorted.length > 0 && (
        <div style={{ padding: '0 16px 14px', display: 'flex', gap: 10 }}>
          {[
            { label: 'Distance', value: tab === 'course' ? `${totalDist.toFixed(1)} km` : `${totalDist} m` },
            { label: 'Séances', value: sorted.length },
          ].map((s) => (
            <div key={s.label} className="glass" style={{ flex: 1, borderRadius: 18, padding: '14px 14px' }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.12, marginBottom: 4 }}>{s.label}</div>
              <span className="t-num" style={{ fontSize: 28, color: 'var(--primary)' }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Add button / Form */}
      <div style={{ padding: '0 16px 14px' }}>
        {!showForm ? (
          <button onClick={() => setShowForm(true)} className="tap" style={{
            width: '100%', border: 'none', borderRadius: 22, padding: '18px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: '#fff', fontWeight: 700, fontSize: 15,
            boxShadow: '0 8px 28px rgba(255,107,53,0.35)',
          }}>+ Nouvelle {tab === 'course' ? 'course' : 'natation'}</button>
        ) : (
          <div className="glass" style={{ borderRadius: 22, padding: '16px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Nouvelle {tab === 'course' ? 'course' : 'natation'}</span>
              <button onClick={() => setShowForm(false)} className="tap" style={{ background: 'none', border: 'none', color: 'var(--text-mute)' }}>
                <Icons.X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.12, marginBottom: 6 }}>Date</div>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-glass" />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.12, marginBottom: 6 }}>
                    Distance ({tab === 'course' ? 'km' : 'm'})
                  </div>
                  <input type="number" inputMode="decimal" placeholder={tab === 'course' ? '5.2' : '1000'} value={distance}
                    onChange={(e) => setDistance(e.target.value)} className="input-glass" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.12, marginBottom: 6 }}>Temps (min)</div>
                  <input type="number" inputMode="decimal" placeholder="28" value={time}
                    onChange={(e) => setTime(e.target.value)} className="input-glass" />
                </div>
              </div>

              {tab === 'course' && distance && time && (
                <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,107,53,0.08)', borderRadius: 12, padding: '10px 14px', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase' }}>Allure</span>
                  <span className="t-mono" style={{ fontSize: 16, color: 'var(--primary)', fontWeight: 600 }}>
                    {(parseFloat(time) / parseFloat(distance)).toFixed(2)} /km
                  </span>
                </div>
              )}

              {tab === 'natation' && (
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.12, marginBottom: 8 }}>Style</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['Crawl', 'Brasse', 'Dos', 'Papillon', 'Mixte'].map((s) => (
                      <button key={s} onClick={() => setStyle(s)} className="tap" style={{
                        border: 'none', borderRadius: 10, padding: '7px 12px',
                        background: style === s ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                        color: style === s ? '#fff' : 'var(--text-soft)',
                        fontSize: 12, fontWeight: 600,
                      }}>{s}</button>
                    ))}
                  </div>
                </div>
              )}

              <input type="text" placeholder="Notes (optionnel)" value={notes}
                onChange={(e) => setNotes(e.target.value)} className="input-glass" />

              <button onClick={handleAdd} disabled={!distance || !time} className="tap" style={{
                border: 'none', borderRadius: 14, padding: '14px',
                background: distance && time ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                color: '#fff', fontWeight: 700, fontSize: 14, opacity: distance && time ? 1 : 0.4,
              }}>Enregistrer</button>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      {sorted.length > 0 && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-mute)', letterSpacing: 0.12, marginBottom: 4 }}>Historique</div>
          {sorted.map((entry) => (
            <div key={entry.id} className="glass" style={{
              borderRadius: 16, padding: '12px 14px',
              borderLeft: `3px solid ${tab === 'course' ? 'var(--info)' : 'var(--cyan)'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: tab === 'course' ? 'rgba(96,165,250,0.12)' : 'rgba(34,211,238,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: tab === 'course' ? 'var(--info)' : 'var(--cyan)',
                  }}>
                    {tab === 'course' ? <Icons.Run size={16} /> : <Icons.Swim size={16} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>
                      {tab === 'course' ? `${entry.distance} km` : `${entry.distance} m`}
                      <span style={{ fontSize: 12, color: 'var(--text-mute)', fontWeight: 400, marginLeft: 6 }}>· {entry.time} min</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>
                      {fmtDate(entry.date)}
                      {tab === 'course' && entry.distance > 0 && <> · {(entry.time / entry.distance).toFixed(2)} min/km</>}
                      {tab === 'natation' && 'style' in entry && typeof (entry as any).style === 'string' && (entry as any).style && <> · {(entry as any).style}</>}
                    </div>
                  </div>
                </div>
                <button onClick={() => {
                  if (!confirm('Supprimer ?')) return;
                  tab === 'course' ? deleteCourse(entry.id) : deleteNatation(entry.id);
                }} className="tap" style={{ background: 'none', border: 'none', color: 'var(--text-mute)', marginLeft: 8 }}>
                  <Icons.Trash size={14} />
                </button>
              </div>
              {typeof entry.notes === 'string' && entry.notes && (
                <div style={{ fontSize: 11, color: 'var(--text-soft)', marginTop: 8, fontStyle: 'italic' }}>{entry.notes}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {sorted.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 22px', color: 'var(--text-mute)', fontSize: 13 }}>
          Aucune {tab === 'course' ? 'course' : 'natation'} enregistrée
        </div>
      )}
    </div>
  );
}
