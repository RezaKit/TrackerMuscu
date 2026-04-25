import { useState } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { getExerciseHistory, isNewRecord } from '../utils/records';
import type { ExerciseLog } from '../types';

interface ExerciseTrackerProps {
  exercises: ExerciseLog[];
  showToast: (msg: string, type?: 'success' | 'info' | 'record') => void;
}

export default function ExerciseTracker({ exercises, showToast }: ExerciseTrackerProps) {
  const { addSet, editSet, deleteSet, deleteExercise, sessions } = useSessionStore();
  const [expandedId, setExpandedId] = useState<string | null>(
    exercises[exercises.length - 1]?.id || null
  );
  const [editingSet, setEditingSet] = useState<{ exId: string; idx: number } | null>(null);
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

    if (wasRecord && w > 0) {
      showToast(`🔥 Nouveau PR ${exerciseName}: ${w}kg!`, 'record');
    }
  };

  const handleStartEdit = (exId: string, idx: number, weight: number, reps: number) => {
    setEditingSet({ exId, idx });
    setEditWeight(String(weight));
    setEditReps(String(reps));
  };

  const handleSaveEdit = () => {
    if (!editingSet) return;
    const w = parseFloat(editWeight);
    const r = parseInt(editReps);
    if (isNaN(w) || isNaN(r)) return;
    editSet(editingSet.exId, editingSet.idx, w, r);
    setEditingSet(null);
  };

  const handleDeleteExercise = (id: string, name: string) => {
    if (confirm(`Supprimer ${name} de cette séance ?`)) {
      deleteExercise(id);
    }
  };

  const getLastSessionHistory = (exerciseName: string) => {
    const history = getExerciseHistory(sessions, exerciseName);
    const lastDates = Array.from(new Set(history.map((h) => h.date))).slice(-3).reverse();
    return lastDates.map((date) => ({
      date,
      sets: history.filter((h) => h.date === date),
    }));
  };

  return (
    <div className="space-y-3">
      {exercises.map((exercise, exIdx) => {
        const isExpanded = expandedId === exercise.id;
        const lastHistory = getLastSessionHistory(exercise.exerciseName);
        const currentMax = Math.max(0, ...exercise.sets.map((s) => s.weight));

        return (
          <div
            key={exercise.id}
            className="bg-dark border border-primary/30 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : exercise.id)}
              className="w-full flex justify-between items-center p-4 text-left"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-mono">{exIdx + 1}</span>
                  <h3 className="font-bold text-primary">{exercise.exerciseName}</h3>
                </div>
                <p className="text-xs text-gray-500">
                  {exercise.sets.length} sets
                  {currentMax > 0 && <> · max {currentMax}kg</>}
                  <> · {exercise.muscleGroup}</>
                </p>
              </div>
              <span className="text-primary">{isExpanded ? '▼' : '▶'}</span>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 space-y-3 border-t border-primary/10">
                {exercise.sets.length > 0 && (
                  <div className="space-y-1 pt-3">
                    {exercise.sets.map((set, idx) => {
                      const isEditing = editingSet?.exId === exercise.id && editingSet.idx === idx;
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-2 bg-bg-dark rounded-lg p-2"
                        >
                          <span className="text-xs font-bold text-primary w-8">
                            S{set.setNumber}
                          </span>
                          {isEditing ? (
                            <>
                              <input
                                type="number"
                                inputMode="decimal"
                                value={editWeight}
                                onChange={(e) => setEditWeight(e.target.value)}
                                className="w-16 bg-dark border border-primary rounded px-2 py-1 text-sm text-center"
                              />
                              <span className="text-xs text-gray-500">kg ×</span>
                              <input
                                type="number"
                                inputMode="numeric"
                                value={editReps}
                                onChange={(e) => setEditReps(e.target.value)}
                                className="w-14 bg-dark border border-primary rounded px-2 py-1 text-sm text-center"
                              />
                              <button
                                onClick={handleSaveEdit}
                                className="text-green-400 text-sm ml-auto"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setEditingSet(null)}
                                className="text-gray-500 text-sm"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="text-sm flex-1">
                                <span className="font-bold text-text-light">{set.weight}kg</span>
                                <span className="text-gray-500"> × {set.reps}</span>
                              </span>
                              <button
                                onClick={() =>
                                  handleStartEdit(exercise.id, idx, set.weight, set.reps)
                                }
                                className="text-gray-500 text-xs px-1"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => deleteSet(exercise.id, idx)}
                                className="text-secondary text-xs px-1"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="Poids"
                    value={expandedId === exercise.id ? weight : ''}
                    onChange={(e) => setWeight(e.target.value)}
                    className="flex-1 bg-bg-dark border border-primary/40 rounded-lg px-3 py-2 text-primary font-bold text-center focus:outline-none focus:border-primary"
                  />
                  <span className="self-center text-gray-500">×</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Reps"
                    value={expandedId === exercise.id ? reps : ''}
                    onChange={(e) => setReps(e.target.value)}
                    className="w-20 bg-bg-dark border border-primary/40 rounded-lg px-3 py-2 text-primary font-bold text-center focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => handleAddSet(exercise.id, exercise.exerciseName)}
                    disabled={!weight || !reps}
                    className="bg-primary text-dark px-4 rounded-lg font-black disabled:opacity-30"
                  >
                    +
                  </button>
                </div>

                {lastHistory.length > 0 && (
                  <div className="bg-bg-dark rounded-lg p-3 border border-primary/10">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">
                      📊 Historique
                    </h4>
                    <div className="space-y-1.5">
                      {lastHistory.map((h) => (
                        <div key={h.date} className="text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-mono">
                              {new Date(h.date + 'T00:00:00').toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                              })}
                            </span>
                            <div className="flex gap-1.5 flex-wrap justify-end">
                              {h.sets.map((s, i) => (
                                <span
                                  key={i}
                                  className="text-gray-400 bg-dark px-1.5 py-0.5 rounded text-[10px]"
                                >
                                  {s.weight}×{s.reps}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleDeleteExercise(exercise.id, exercise.exerciseName)}
                  className="w-full text-secondary/60 text-xs py-1 hover:text-secondary transition"
                >
                  🗑️ Retirer de la séance
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
