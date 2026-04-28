import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSessionStore } from '../stores/sessionStore';
import { getExerciseHistory, isNewRecord } from '../utils/records';
import { Icons } from './Icons';
import { EXERCISE_INFO } from '../db/exerciseInfo';
import type { ExerciseLog } from '../types';

interface ExerciseTrackerProps {
  exercises: ExerciseLog[];
  showToast: (msg: string, type?: 'success' | 'info' | 'record') => void;
  onSetAdded?: () => void;
}

export default function ExerciseTracker({ exercises, showToast, onSetAdded }: ExerciseTrackerProps) {
  const { addSet, editSet, deleteSet, deleteExercise, sessions } = useSessionStore();
  const [expandedId, setExpandedId] = useState<string | null>(exercises[exercises.length - 1]?.id || null);
  const [editingSet, setEditingSet] = useState<{ exId: string; idx: number } | null>(null);
  const [infoName, setInfoName] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editReps, setEditReps] = useState('');

  const handleAddSet = (exerciseId: string, exerciseName: string) => {
    const w = parseFloat(weight);
    const r = parseInt(reps);
    if (isNaN(w) || isNaN(r) || w < 0 || r <= 0) return;
    const wasRecord = isNewRecord(sessions, exerciseName, w);
    addSet(exerciseId, w, r);
    setWeight('');
    setReps('');
    onSetAdded?.();
    if (wasRecord && w > 0) showToast(`Nouveau PR — ${exerciseName}: ${w}kg`, 'record');
  };

  const handleSaveEdit = () => {
    if (!editingSet) return;
    const w = parseFloat(editWeight);
    const r = parseInt(editReps);
    if (isNaN(w) || isNaN(r)) return;
    editSet(editingSet.exId, editingSet.idx, w, r);
    setEditingSet(null);
  };

  const getHistory = (name: string) => {
    const history = getExerciseHistory(sessions, name);
    const dates = Array.from(new Set(history.map((h) => h.date))).slice(-3).reverse();
    return dates.map((date) => ({ date, sets: history.filter((h) => h.date === date) }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Modal info exercice */}
      {infoName && createPortal(
        <div onClick={() => setInfoName(null)} style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'flex-end', padding: '0',
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            width: '100%', background: 'rgba(18,18,22,0.98)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px 24px 0 0',
            padding: '24px 22px calc(40px + env(safe-area-inset-bottom, 0px))',
            maxHeight: '80vh', overflowY: 'auto',
            WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
          }}>
            <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 999, margin: '0 auto 20px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,107,53,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <Icons.Info size={16} />
              </div>
              <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>{infoName}</span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.6 }}>
              {EXERCISE_INFO[infoName]}
            </p>
            <button onClick={() => setInfoName(null)} style={{
              marginTop: 20, width: '100%', background: 'rgba(255,255,255,0.06)',
              border: 'none', borderRadius: 14, padding: '14px', color: 'var(--text-mute)',
              fontWeight: 700, fontSize: 14,
            }}>Fermer</button>
          </div>
        </div>,
        document.body
      )}

      {exercises.map((exercise, exIdx) => {
        const isExpanded = expandedId === exercise.id;
        const history = getHistory(exercise.exerciseName);
        const maxWeight = Math.max(0, ...exercise.sets.map((s) => s.weight));

        return (
          <div key={exercise.id} className="glass" style={{ borderRadius: 22, overflow: 'hidden' }}>
            {/* Header */}
            <button onClick={() => setExpandedId(isExpanded ? null : exercise.id)}
              className="tap" style={{
                width: '100%', background: 'none', border: 'none', padding: '14px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left',
              }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="t-mono" style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 700 }}>{String(exIdx + 1).padStart(2, '0')}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>{exercise.exerciseName}</span>
                  {EXERCISE_INFO[exercise.exerciseName] && (
                    <button onClick={(e) => { e.stopPropagation(); setInfoName(exercise.exerciseName); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-faint)', padding: '2px', lineHeight: 0 }}>
                      <Icons.Info size={14} />
                    </button>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>
                  {exercise.sets.length} sets{maxWeight > 0 && ` · max ${maxWeight}kg`} · {exercise.muscleGroup}
                </div>
              </div>
              <div style={{ color: 'var(--text-mute)', marginLeft: 8 }}>
                {isExpanded ? <Icons.ChevronUp size={16} /> : <Icons.ChevronDown size={16} />}
              </div>
            </button>

            {isExpanded && (
              <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--line)' }}>
                {/* Sets */}
                {exercise.sets.length > 0 && (
                  <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {exercise.sets.map((set, idx) => {
                      const isEditing = editingSet?.exId === exercise.id && editingSet.idx === idx;
                      return (
                        <div key={idx} style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '8px 12px',
                        }}>
                          <span className="t-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', width: 24 }}>
                            S{set.setNumber}
                          </span>
                          {isEditing ? (
                            <>
                              <input type="number" inputMode="decimal" value={editWeight}
                                onChange={(e) => setEditWeight(e.target.value)}
                                style={{ width: 60, background: 'rgba(255,107,53,0.1)', border: '1px solid var(--primary)', borderRadius: 8, color: 'var(--text)', padding: '4px 8px', textAlign: 'center', fontSize: 14, fontFamily: 'var(--mono)', outline: 'none' }} />
                              <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>kg ×</span>
                              <input type="number" inputMode="numeric" value={editReps}
                                onChange={(e) => setEditReps(e.target.value)}
                                style={{ width: 50, background: 'rgba(255,107,53,0.1)', border: '1px solid var(--primary)', borderRadius: 8, color: 'var(--text)', padding: '4px 8px', textAlign: 'center', fontSize: 14, fontFamily: 'var(--mono)', outline: 'none' }} />
                              <button onClick={handleSaveEdit} className="tap" style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--ok)' }}>
                                <Icons.Check size={16} />
                              </button>
                              <button onClick={() => setEditingSet(null)} className="tap" style={{ background: 'none', border: 'none', color: 'var(--text-mute)' }}>
                                <Icons.X size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="t-mono" style={{ flex: 1, fontSize: 14 }}>
                                <span style={{ fontWeight: 700, color: 'var(--text)' }}>{set.weight}</span>
                                <span style={{ color: 'var(--text-mute)' }}>kg × {set.reps}</span>
                              </span>
                              <button onClick={() => { setEditingSet({ exId: exercise.id, idx }); setEditWeight(String(set.weight)); setEditReps(String(set.reps)); }}
                                className="tap" style={{ background: 'none', border: 'none', color: 'var(--text-mute)', padding: '2px 4px' }}>
                                <Icons.Edit size={13} />
                              </button>
                              <button onClick={() => deleteSet(exercise.id, idx)}
                                className="tap" style={{ background: 'none', border: 'none', color: 'var(--secondary)', padding: '2px 4px' }}>
                                <Icons.Trash size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add set */}
                <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
                  <input type="number" inputMode="decimal" placeholder="Poids" value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: 'var(--primary)', padding: '10px', textAlign: 'center', fontSize: 16, fontFamily: 'var(--display)', outline: 'none' }} />
                  <span style={{ color: 'var(--text-mute)', fontSize: 12 }}>×</span>
                  <input type="number" inputMode="numeric" placeholder="Reps" value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    style={{ width: 72, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: 'var(--primary)', padding: '10px', textAlign: 'center', fontSize: 16, fontFamily: 'var(--display)', outline: 'none' }} />
                  <button onClick={() => handleAddSet(exercise.id, exercise.exerciseName)}
                    disabled={!weight || !reps} className="tap" style={{
                      border: 'none', borderRadius: 12, width: 44, height: 44, flexShrink: 0,
                      background: weight && reps ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                      color: '#fff', fontWeight: 900, fontSize: 20,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: weight && reps ? 1 : 0.4,
                    }}>+</button>
                </div>

                {/* History */}
                {history.length > 0 && (
                  <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.12, marginBottom: 8 }}>
                      Historique
                    </div>
                    {history.map((h) => (
                      <div key={h.date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span className="t-mono" style={{ fontSize: 10, color: 'var(--text-mute)' }}>
                          {new Date(h.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                        </span>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {h.sets.map((s, i) => (
                            <span key={i} className="t-mono" style={{ fontSize: 10, color: 'var(--text-soft)', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 6 }}>
                              {s.weight}×{s.reps}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={() => { if (confirm(`Supprimer ${exercise.exerciseName} ?`)) deleteExercise(exercise.id); }}
                  className="tap" style={{
                    width: '100%', background: 'none', border: 'none', marginTop: 10,
                    color: 'rgba(196,30,58,0.5)', fontSize: 12, fontWeight: 600, padding: '6px 0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                  <Icons.Trash size={12} /> Retirer de la séance
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
