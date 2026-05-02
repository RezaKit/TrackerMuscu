import { useEffect, useState } from 'react';
import { useMeasurementStore, MEASUREMENT_LABELS } from '../stores/measurementStore';
import type { MeasurementKey } from '../types';
import { Icons } from './Icons';

interface MeasurementsProps {
  onClose: () => void;
}

const MEASUREMENT_ORDER: MeasurementKey[] = [
  'chest', 'shoulders', 'waist', 'hips',
  'biceps_left', 'biceps_right',
  'thigh_left', 'thigh_right',
  'calf_left', 'calf_right',
  'neck', 'body_fat',
];

export default function Measurements({ onClose }: MeasurementsProps) {
  const { measurements, loadMeasurements, addMeasurement, deleteMeasurement } = useMeasurementStore();
  const [showAdd, setShowAdd] = useState(false);
  const [values, setValues] = useState<Partial<Record<MeasurementKey, string>>>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { loadMeasurements(); }, []);

  const latest = measurements[0];
  const previous = measurements[1];

  const handleSave = async () => {
    const parsed: Partial<Record<MeasurementKey, number>> = {};
    Object.entries(values).forEach(([k, v]) => {
      const n = parseFloat(v as string);
      if (!isNaN(n) && n > 0) parsed[k as MeasurementKey] = n;
    });
    if (Object.keys(parsed).length === 0) return;
    await addMeasurement(parsed, date);
    setValues({});
    setShowAdd(false);
  };

  const getDelta = (key: MeasurementKey): number | null => {
    if (!latest || !previous) return null;
    const a = latest.values[key];
    const b = previous.values[key];
    if (a === undefined || b === undefined) return null;
    return a - b;
  };

  return (
    <div className="page-enter" style={{ padding: '14px 16px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <button onClick={onClose} className="tap glass" style={{
          width: 36, height: 36, borderRadius: 12, border: '1px solid var(--glass-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mute)',
        }}>
          <Icons.ChevronLeft size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.16 }}>Body</div>
          <h2 className="t-display" style={{ fontSize: 32, lineHeight: 0.9, marginTop: 2 }}>Mesures</h2>
        </div>
        {!showAdd && (
          <button onClick={() => setShowAdd(true)} className="tap" style={{
            border: 'none', borderRadius: 14, padding: '8px 14px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: '#fff', fontWeight: 700, fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Icons.Plus size={14} /> Ajouter
          </button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="glass" style={{ borderRadius: 22, padding: 16, marginBottom: 18 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.12 }}>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-glass" style={{ marginTop: 4 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {MEASUREMENT_ORDER.map((key) => {
              const cfg = MEASUREMENT_LABELS[key];
              return (
                <div key={key}>
                  <label style={{ fontSize: 10, color: 'var(--text-mute)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <span>{cfg.emoji}</span>
                    <span>{cfg.label}</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number" step="0.1" inputMode="decimal"
                      placeholder="—"
                      value={values[key] || ''}
                      onChange={(e) => setValues({ ...values, [key]: e.target.value })}
                      className="input-glass"
                      style={{ paddingRight: 32, fontFamily: 'var(--mono)' }}
                    />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-mute)' }}>
                      {cfg.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setShowAdd(false); setValues({}); }} className="tap" style={{
              flex: 1, border: 'none', borderRadius: 12, padding: '10px',
              background: 'rgba(255,255,255,0.04)', color: 'var(--text-mute)', fontWeight: 700, fontSize: 13,
            }}>Annuler</button>
            <button onClick={handleSave} className="tap" style={{
              flex: 2, border: 'none', borderRadius: 12, padding: '10px',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: '#fff', fontWeight: 700, fontSize: 13,
            }}>Enregistrer</button>
          </div>
        </div>
      )}

      {/* Latest measurements */}
      {latest ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 10, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.14 }}>
              Dernière mesure
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700,
              padding: '2px 8px', borderRadius: 999,
              background: 'rgba(255,107,53,0.12)', color: 'var(--primary)',
              border: '1px solid rgba(255,107,53,0.2)',
              whiteSpace: 'nowrap',
            }}>
              {new Date(latest.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 22 }}>
            {MEASUREMENT_ORDER.filter(k => latest.values[k] !== undefined).map((key) => {
              const cfg = MEASUREMENT_LABELS[key];
              const value = latest.values[key]!;
              const delta = getDelta(key);
              return (
                <div key={key} className="glass" style={{ borderRadius: 16, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-mute)', fontWeight: 600, marginBottom: 4 }}>
                    {cfg.emoji} {cfg.label}
                  </div>
                  <div className="t-display" style={{ fontSize: 22, color: 'var(--primary)', lineHeight: 1 }}>
                    {value}<span style={{ fontSize: 12, color: 'var(--text-mute)', marginLeft: 3 }}>{cfg.unit}</span>
                  </div>
                  {delta !== null && delta !== 0 && (
                    <div style={{
                      fontSize: 10, fontWeight: 700, marginTop: 4,
                      color: delta > 0 ? 'var(--ok)' : 'rgba(248,113,113,0.9)',
                    }}>
                      {delta > 0 ? '+' : ''}{delta.toFixed(1)} {cfg.unit}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : !showAdd && (
        <div className="glass" style={{ borderRadius: 22, padding: '32px 20px', textAlign: 'center' }}>
          <Icons.Scale size={32} color="var(--text-faint)" />
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 12 }}>Aucune mesure</div>
          <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 4 }}>
            Commence à tracker tes mesures pour suivre ton évolution.
          </div>
        </div>
      )}

      {/* History */}
      {measurements.length > 1 && (
        <>
          <div style={{ fontSize: 11, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.14, marginBottom: 8 }}>
            Historique
          </div>
          <div className="glass" style={{ borderRadius: 18, overflow: 'hidden' }}>
            {measurements.slice(1, 10).map((m) => {
              const keys = Object.keys(m.values) as MeasurementKey[];
              return (
                <div key={m.id} style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 999,
                      background: 'rgba(255,255,255,0.06)', color: 'var(--text-soft)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                      {new Date(m.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </span>
                    <button onClick={() => { if (confirm('Supprimer cette mesure ?')) deleteMeasurement(m.id); }}
                      className="tap" style={{ background: 'none', border: 'none', color: 'rgba(196,30,58,0.6)', padding: 4 }}>
                      <Icons.Trash size={14} />
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-mute)', display: 'flex', flexWrap: 'wrap', gap: '6px 12px' }}>
                    {keys.map((k) => (
                      <span key={k}>
                        {MEASUREMENT_LABELS[k].label}: <span style={{ color: 'var(--text-soft)', fontFamily: 'var(--mono)' }}>{m.values[k]}{MEASUREMENT_LABELS[k].unit}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
