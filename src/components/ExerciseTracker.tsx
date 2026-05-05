import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSessionStore } from '../stores/sessionStore';
import { getExerciseHistory, isNewRecord } from '../utils/records';
import { Icons } from './Icons';
import { EXERCISE_INFO } from '../db/exerciseInfo';
import { getPref, togglePref, type ExercisePref } from '../utils/exercisePrefs';
import {
  findFxExercise, muscleLabel, equipLabel, levelLabel, mechanicLabel,
  localizeInstructions, type FxExercise,
} from '../utils/exerciseDB';
import { translateExerciseSteps } from '../utils/translateAI';
import MuscleMap from './MuscleMap';
import ExerciseMedia from './ExerciseMedia';
import { useLang, getLang, tr } from '../utils/i18n';
import type { ExerciseLog } from '../types';

interface ExerciseTrackerProps {
  exercises: ExerciseLog[];
  showToast: (msg: string, type?: 'success' | 'info' | 'record') => void;
  onSetAdded?: () => void;
}

export default function ExerciseTracker({ exercises, showToast, onSetAdded }: ExerciseTrackerProps) {
  useLang(); // re-render when language changes
  const { addSet, editSet, deleteSet, deleteExercise, toggleSuperset, sessions } = useSessionStore();
  const [expandedId, setExpandedId] = useState<string | null>(exercises[exercises.length - 1]?.id || null);
  const [editingSet, setEditingSet] = useState<{ exId: string; idx: number } | null>(null);
  const [infoName, setInfoName] = useState<string | null>(null);
  const [fxInfo, setFxInfo] = useState<FxExercise | null>(null);
  const [fxLoading, setFxLoading] = useState(false);
  const [aiSteps, setAiSteps] = useState<string[] | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editReps, setEditReps] = useState('');
  const [, forcePrefRender] = useState(0);

  useEffect(() => {
    if (!infoName) { setFxInfo(null); setAiSteps(null); return; }
    setFxInfo(null);
    setAiSteps(null);
    setFxLoading(true);
    findFxExercise(infoName)
      .then((info) => setFxInfo(info))
      .finally(() => setFxLoading(false));
  }, [infoName]);

  // Async high-quality translation via Gemini (cached forever per exo+lang).
  // Falls back to the local dictionary if the user has no API key.
  useEffect(() => {
    if (!fxInfo || getLang() === 'en') { setAiSteps(null); return; }
    let aborted = false;
    const apiKey = localStorage.getItem('gemini_api_key');
    translateExerciseSteps(fxInfo.id, fxInfo.instructions, apiKey).then((translated) => {
      if (!aborted && translated) setAiSteps(translated);
    });
    return () => { aborted = true; };
  }, [fxInfo?.id]);

  // Auto-fill weight & reps when an exercise is expanded — uses last set from current session
  // first, falling back to most recent historical set.
  useEffect(() => {
    if (!expandedId) return;
    const ex = exercises.find(e => e.id === expandedId);
    if (!ex) return;
    const lastInSession = ex.sets[ex.sets.length - 1];
    if (lastInSession) {
      setWeight(String(lastInSession.weight));
      setReps(String(lastInSession.reps));
      return;
    }
    const history = getExerciseHistory(sessions, ex.exerciseName);
    if (history.length > 0) {
      const last = history[history.length - 1];
      setWeight(String(last.weight));
      setReps(String(last.reps));
    } else {
      setWeight('');
      setReps('');
    }
  }, [expandedId]);

  // Returns the previous-session reference set to compare current sets against.
  const getPreviousSessionLastSet = (exerciseName: string): { weight: number; reps: number; date: string } | null => {
    const history = getExerciseHistory(sessions, exerciseName);
    if (history.length === 0) return null;
    // Group by date — return last set of the most recent date
    const lastDate = history[history.length - 1].date;
    const lastDateSets = history.filter(h => h.date === lastDate);
    const last = lastDateSets[lastDateSets.length - 1];
    return { weight: last.weight, reps: last.reps, date: last.date };
  };

  const handleTogglePref = (name: string, target: 'favorite' | 'avoid') => {
    const next = togglePref(name, target);
    forcePrefRender(n => n + 1);
    showToast(
      next === 'favorite' ? `⭐ ${name} ${tr({fr:'ajouté aux favoris',en:'added to favorites',es:'añadido a favoritos'})}`
      : next === 'avoid' ? `🚫 ${name} ${tr({fr:'sera évité',en:'will be avoided',es:'será evitado'})}`
      : `${name} ${tr({fr:': préférence retirée',en:': preference removed',es:': preferencia eliminada'})}`,
      'info'
    );
  };

  const handleToggleSuperset = (exId: string) => {
    toggleSuperset(exId);
    forcePrefRender(n => n + 1);
  };

  const handleAddSet = (exerciseId: string, exerciseName: string) => {
    const w = parseFloat(weight);
    const r = parseInt(reps);
    if (isNaN(w) || isNaN(r) || w < 0 || r <= 0) return;
    const wasRecord = isNewRecord(sessions, exerciseName, w);
    addSet(exerciseId, w, r);
    // Keep weight (often the same across sets), clear reps for the next entry
    setReps('');

    // Skip rest timer trigger if this exercise is mid-superset (not the last in the group)
    const idx = exercises.findIndex(e => e.id === exerciseId);
    const ex = exercises[idx];
    const next = exercises[idx + 1];
    const isMidSuperset = !!ex.supersetId && next?.supersetId === ex.supersetId;
    if (!isMidSuperset) onSetAdded?.();

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
        <div onClick={() => setInfoName(null)} className="modal-backdrop" style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'flex-end', padding: '0',
        }}>
          <div onClick={(e) => e.stopPropagation()} className="modal-sheet" style={{
            width: '100%', background: 'rgba(18,18,22,0.98)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px 24px 0 0',
            padding: '24px 22px calc(40px + env(safe-area-inset-bottom, 0px))',
            maxHeight: '80vh', overflowY: 'auto',
            WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
          }}>
            <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 999, margin: '0 auto 20px' }} />
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,107,53,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <Icons.Info size={16} />
              </div>
              <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>{infoName}</span>
            </div>

            {/* Vidéo (auto MP4 si CDN configuré) avec fallback flipbook 2 images */}
            {(() => {
              if (fxLoading) return <div className="skeleton" style={{ aspectRatio: '4/3', marginBottom: 14 }} />;
              if (fxInfo) {
                return (
                  <div style={{ marginBottom: 14 }}>
                    <ExerciseMedia
                      fxId={fxInfo.id}
                      name={fxInfo.name}
                      gifUrl={fxInfo.gifUrl}
                      fallbackImages={fxInfo.images ?? []}
                    />
                  </div>
                );
              }
              return null;
            })()}

            {/* Mini mannequin animé — muscles ciblés pulsent */}
            {(() => {
              const currentExo = exercises.find(e => e.exerciseName === infoName);
              if (!currentExo) return null;
              // Synthetic log: only this exercise's group, neutral volume → all related muscles glow at max
              const fakeLog: ExerciseLog = {
                ...currentExo,
                sets: [{ setNumber: 1, weight: 1, reps: 1 }],
              };
              return (
                <div style={{
                  marginBottom: 14, padding: '14px 12px 10px',
                  background: 'rgba(255,107,53,0.05)',
                  border: '1px solid rgba(255,107,53,0.18)',
                  borderRadius: 14,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                    {tr({fr:'Zones travaillées',en:'Target zones',es:'Zonas trabajadas'})}
                  </div>
                  <MuscleMap exercises={[fakeLog]} size={200} compact />
                </div>
              );
            })()}

            {/* Muscles */}
            {fxInfo && (fxInfo.primaryMuscles.length > 0 || fxInfo.secondaryMuscles.length > 0) && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  {tr({fr:'Muscles ciblés',en:'Target muscles',es:'Músculos objetivo'})}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {fxInfo.primaryMuscles.map((m) => (
                    <span key={m} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(255,107,53,0.15)', color: 'var(--primary)', border: '1px solid rgba(255,107,53,0.3)' }}>
                      ● {muscleLabel(m)}
                    </span>
                  ))}
                  {fxInfo.secondaryMuscles.map((m) => (
                    <span key={m} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.06)', color: 'var(--text-soft)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      ○ {muscleLabel(m)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Meta tags : équipement / niveau / mécanique */}
            {fxInfo && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {fxInfo.equipment && (
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.06)', color: 'var(--text-mute)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    🏋️ {equipLabel(fxInfo.equipment)}
                  </span>
                )}
                {fxInfo.level && (
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(96,165,250,0.10)', color: 'var(--info)', border: '1px solid rgba(96,165,250,0.22)' }}>
                    📊 {levelLabel(fxInfo.level)}
                  </span>
                )}
                {fxInfo.mechanic && (
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(74,222,128,0.10)', color: 'var(--ok)', border: '1px solid rgba(74,222,128,0.22)' }}>
                    {mechanicLabel(fxInfo.mechanic)}
                  </span>
                )}
              </div>
            )}

            {/* Instructions étape par étape (Gemini si dispo, sinon regex local) */}
            {fxInfo && fxInfo.instructions.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                  {tr({fr:"Comment l'exécuter",en:'How to perform',es:'Cómo ejecutarlo'})}
                </div>
                <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(aiSteps ?? localizeInstructions(fxInfo.instructions)).map((step, i) => (
                    <li key={i} style={{
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                      padding: '10px 12px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 12,
                    }}>
                      <span style={{
                        flexShrink: 0, width: 22, height: 22, borderRadius: 7,
                        background: 'var(--primary)', color: '#fff',
                        fontSize: 11, fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{i + 1}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.55 }}>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Description courte custom (en plus de fxInfo) — toujours visible si dispo */}
            {EXERCISE_INFO[infoName!] && (
              <div style={{
                marginBottom: 16, padding: '12px 14px',
                background: 'rgba(96,165,250,0.06)',
                border: '1px solid rgba(96,165,250,0.18)',
                borderRadius: 12,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--info)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                  💡 {tr({ fr: 'Note du coach', en: "Coach's note", es: 'Nota del coach' })}
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.55, margin: 0 }}>
                  {EXERCISE_INFO[infoName!]}
                </p>
              </div>
            )}

            {/* Si rien d'autre n'a matché, message explicite */}
            {!fxLoading && !fxInfo && !EXERCISE_INFO[infoName!] && (
              <p style={{ fontSize: 13, color: 'var(--text-mute)', lineHeight: 1.6, marginBottom: 16, textAlign: 'center', padding: '20px 0' }}>
                {tr({
                  fr: "Pas d'explication pour cet exercice. Demande au coach IA pour des conseils personnalisés !",
                  en: 'No explanation for this exercise. Ask the AI coach for personalised advice!',
                  es: 'Sin explicación para este ejercicio. ¡Pregunta al coach IA para consejos personalizados!',
                })}
              </p>
            )}

            <button onClick={() => setInfoName(null)} style={{
              width: '100%', background: 'rgba(255,255,255,0.06)',
              border: 'none', borderRadius: 14, padding: '14px', color: 'var(--text-mute)',
              fontWeight: 700, fontSize: 14,
            }}>{tr({fr:'Fermer',en:'Close',es:'Cerrar'})}</button>
          </div>
        </div>,
        document.body
      )}

      {exercises.map((exercise, exIdx) => {
        const isExpanded = expandedId === exercise.id;
        const history = getHistory(exercise.exerciseName);
        const maxWeight = Math.max(0, ...exercise.sets.map((s) => s.weight));
        const pref: ExercisePref = getPref(exercise.exerciseName);
        const inSuperset = !!exercise.supersetId;
        const prevExo = exercises[exIdx - 1];
        const nextExo = exercises[exIdx + 1];
        const isSupersetTop = inSuperset && (!prevExo || prevExo.supersetId !== exercise.supersetId);
        const isSupersetBottom = inSuperset && (!nextExo || nextExo.supersetId !== exercise.supersetId);

        return (
          <div key={exercise.id} className="glass" style={{
            borderRadius: 22,
            overflow: 'hidden',
            position: 'relative',
            border: inSuperset ? '1px solid rgba(255,107,53,0.4)' : undefined,
            borderTopLeftRadius: inSuperset && !isSupersetTop ? 0 : 22,
            borderTopRightRadius: inSuperset && !isSupersetTop ? 0 : 22,
            borderBottomLeftRadius: inSuperset && !isSupersetBottom ? 0 : 22,
            borderBottomRightRadius: inSuperset && !isSupersetBottom ? 0 : 22,
            marginTop: inSuperset && !isSupersetTop ? -10 : 0,
            background: inSuperset ? 'rgba(255,107,53,0.04)' : undefined,
          }}>
            {/* Superset badge */}
            {inSuperset && isSupersetTop && (
              <div style={{
                position: 'absolute', top: -8, left: 14,
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                color: '#fff', padding: '2px 10px', borderRadius: 999,
                fontSize: 9, fontWeight: 800, letterSpacing: 0.16,
                display: 'flex', alignItems: 'center', gap: 4,
                zIndex: 1,
              }}>
                <Icons.Link size={9} /> SUPERSET
              </div>
            )}

            {/* Header */}
            <button onClick={() => setExpandedId(isExpanded ? null : exercise.id)}
              className="tap" style={{
                width: '100%', background: 'none', border: 'none', padding: '14px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left',
              }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="t-mono" style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 700 }}>{String(exIdx + 1).padStart(2, '0')}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>{exercise.exerciseName}</span>
                  {pref === 'favorite' && (
                    <span style={{ color: '#FBBF24', fontSize: 11 }} title="Favori">★</span>
                  )}
                  <span
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); setInfoName(exercise.exerciseName); }}
                    style={{ color: 'var(--text-faint)', padding: '2px', lineHeight: 0, cursor: 'pointer', display: 'inline-flex' }}>
                    <Icons.Info size={14} />
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>
                  {exercise.sets.length} sets{maxWeight > 0 && ` · max ${maxWeight}kg`} · {exercise.muscleGroup}
                </div>
              </div>
              <div style={{ color: 'var(--text-mute)', marginLeft: 8 }}>
                {isExpanded ? <Icons.ChevronUp size={16} /> : <Icons.ChevronDown size={16} />}
              </div>
            </button>

            {isExpanded && (() => {
              const prevRef = getPreviousSessionLastSet(exercise.exerciseName);
              return (
              <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--line)' }}>
                {/* Sets */}
                {exercise.sets.length > 0 && (
                  <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {exercise.sets.map((set, idx) => {
                      const isEditing = editingSet?.exId === exercise.id && editingSet.idx === idx;
                      // Delta vs previous session's reference set
                      const wDelta = prevRef ? set.weight - prevRef.weight : 0;
                      const rDelta = prevRef ? set.reps - prevRef.reps : 0;
                      const arrow = wDelta > 0 ? '↑' : wDelta < 0 ? '↓' : (rDelta > 0 ? '↑' : rDelta < 0 ? '↓' : '=');
                      const arrowColor = wDelta > 0 || (wDelta === 0 && rDelta > 0)
                        ? 'var(--ok)'
                        : wDelta < 0 || (wDelta === 0 && rDelta < 0)
                          ? 'rgba(248,113,113,0.85)'
                          : 'var(--text-faint)';
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
                              {prevRef && (
                                <span style={{
                                  fontSize: 10, fontWeight: 800,
                                  color: arrowColor,
                                  minWidth: 14, textAlign: 'center',
                                }}>{arrow}</span>
                              )}
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

                {/* "Last time" hint with progression indicator */}
                {prevRef && (() => {
                  const w = parseFloat(weight);
                  const r = parseInt(reps);
                  const wDelta = !isNaN(w) ? w - prevRef.weight : 0;
                  const rDelta = !isNaN(r) ? r - prevRef.reps : 0;
                  const showDelta = !isNaN(w) && (wDelta !== 0 || rDelta !== 0);
                  const isUp = wDelta > 0 || (wDelta === 0 && rDelta > 0);
                  return (
                    <div style={{
                      marginTop: 12, display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: 10.5, color: 'var(--text-mute)', fontWeight: 600,
                    }}>
                      <span style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>{tr({fr:'Dernière fois',en:'Last time',es:'Última vez'})}</span>
                      <span className="t-mono" style={{ color: 'var(--text-soft)' }}>
                        {prevRef.weight}kg × {prevRef.reps}
                      </span>
                      {showDelta && (
                        <span style={{
                          marginLeft: 'auto', padding: '2px 8px', borderRadius: 999,
                          fontSize: 10, fontWeight: 800,
                          background: isUp ? 'rgba(34,197,94,0.12)' : 'rgba(248,113,113,0.12)',
                          color: isUp ? 'var(--ok)' : 'rgba(248,113,113,0.95)',
                          border: `1px solid ${isUp ? 'rgba(34,197,94,0.25)' : 'rgba(248,113,113,0.25)'}`,
                        }}>
                          {isUp ? '↑' : '↓'} {wDelta !== 0 ? `${wDelta > 0 ? '+' : ''}${wDelta.toFixed(wDelta % 1 === 0 ? 0 : 1)}kg` : `${rDelta > 0 ? '+' : ''}${rDelta} reps`}
                        </span>
                      )}
                    </div>
                  );
                })()}

                {/* Add set */}
                <div style={{ display: 'flex', gap: 8, marginTop: prevRef ? 8 : 12, alignItems: 'center' }}>
                  <input type="number" inputMode="decimal" placeholder={tr({fr:'Poids',en:'Weight',es:'Peso'})} value={weight}
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
                      {tr({fr:'Historique',en:'History',es:'Historial'})}
                    </div>
                    {history.map((h) => (
                      <div key={h.date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span className="t-mono" style={{ fontSize: 10, color: 'var(--text-mute)' }}>
                          {new Date(h.date + 'T00:00:00').toLocaleDateString(getLang()==='fr'?'fr-FR':getLang()==='es'?'es-ES':'en-GB', { day: '2-digit', month: '2-digit' })}
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

                {/* Quick actions */}
                <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                  <button onClick={() => handleTogglePref(exercise.exerciseName, 'favorite')}
                    className="tap" style={{
                      flex: 1, border: 'none', borderRadius: 10, padding: '8px',
                      background: pref === 'favorite' ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.04)',
                      color: pref === 'favorite' ? '#FBBF24' : 'var(--text-mute)',
                      fontSize: 11, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    }}>
                    <Icons.Star size={11} /> {pref === 'favorite' ? tr({fr:'Favori ★',en:'Favorite ★',es:'Favorito ★'}) : tr({fr:'Favoris',en:'Favorites',es:'Favoritos'})}
                  </button>
                  <button onClick={() => handleTogglePref(exercise.exerciseName, 'avoid')}
                    className="tap" style={{
                      flex: 1, border: 'none', borderRadius: 10, padding: '8px',
                      background: pref === 'avoid' ? 'rgba(248,113,113,0.18)' : 'rgba(255,255,255,0.04)',
                      color: pref === 'avoid' ? '#F87171' : 'var(--text-mute)',
                      fontSize: 11, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    }}>
                    <Icons.Ban size={11} /> {pref === 'avoid' ? tr({fr:'Évité 🚫',en:'Avoided 🚫',es:'Evitado 🚫'}) : tr({fr:'Éviter',en:'Avoid',es:'Evitar'})}
                  </button>
                  {exIdx < exercises.length - 1 && (
                    <button onClick={() => handleToggleSuperset(exercise.id)}
                      className="tap" style={{
                        flex: 1, border: 'none', borderRadius: 10, padding: '8px',
                        background: inSuperset ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.04)',
                        color: inSuperset ? 'var(--primary)' : 'var(--text-mute)',
                        fontSize: 11, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      }}>
                      <Icons.Link size={11} /> {inSuperset ? tr({fr:'Délier',en:'Unlink',es:'Desligar'}) : tr({fr:'Lier',en:'Link',es:'Ligar'})}
                    </button>
                  )}
                </div>

                <button onClick={() => { if (confirm(tr({fr:`Supprimer ${exercise.exerciseName} ?`,en:`Remove ${exercise.exerciseName}?`,es:`Eliminar ${exercise.exerciseName}?`}))) deleteExercise(exercise.id); }}
                  className="tap" style={{
                    width: '100%', background: 'none', border: 'none', marginTop: 10,
                    color: 'rgba(196,30,58,0.5)', fontSize: 12, fontWeight: 600, padding: '6px 0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                  <Icons.Trash size={12} /> {tr({fr:'Retirer de la séance',en:'Remove from workout',es:'Quitar del entreno'})}
                </button>
              </div>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
}
