import { useState } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { useTemplateStore } from '../stores/templateStore';
import { useExerciseStore } from '../stores/exerciseStore';
import { PRESET_EXERCISES } from '../db/seedExercises';
import ExerciseTracker from './ExerciseTracker';
import TemplateModal from './TemplateModal';
import type { SessionType } from '../types';

interface SessionFormProps {
  onSessionEnd: () => void;
  onCancel: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'record') => void;
}

const SESSION_TYPES: { id: SessionType; label: string; color: string; emoji: string }[] = [
  { id: 'push', label: 'Push', color: 'bg-orange-500', emoji: '💪' },
  { id: 'pull', label: 'Pull', color: 'bg-red-600', emoji: '🏋️' },
  { id: 'legs', label: 'Legs', color: 'bg-gray-800', emoji: '🦵' },
  { id: 'upper', label: 'Upper', color: 'bg-orange-600', emoji: '⬆️' },
  { id: 'lower', label: 'Lower', color: 'bg-red-700', emoji: '⬇️' },
];

const MUSCLE_GROUPS = Object.keys(PRESET_EXERCISES);

export default function SessionForm({ onSessionEnd, onCancel, showToast }: SessionFormProps) {
  const { currentSession, createSession, addExercise, endSession, loadFromTemplate } =
    useSessionStore();
  const { templates, createTemplate } = useTemplateStore();
  const { getAllExercises, createExercise } = useExerciseStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customMuscle, setCustomMuscle] = useState('chest');
  const [saveTemplateName, setSaveTemplateName] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  const allExercises = getAllExercises();

  const handleSessionTypeSelect = (type: SessionType) => {
    createSession(type);
  };

  const handleAddExercise = (name: string, muscleGroup: string) => {
    addExercise(name, muscleGroup);
    setSearchQuery('');
    setShowAddMenu(false);
    setShowCustomForm(false);
  };

  const handleCreateCustom = async () => {
    if (!customName.trim()) return;
    await createExercise(customName.trim(), customMuscle);
    handleAddExercise(customName.trim(), customMuscle);
    setCustomName('');
    setCustomMuscle('chest');
    showToast('Exercice ajouté à ta liste 📌', 'success');
  };

  const handleEndSession = async () => {
    const completed = await endSession();
    if (completed) {
      onSessionEnd();
    }
  };

  const handleSaveTemplate = async () => {
    if (!currentSession || !saveTemplateName.trim()) return;
    const exerciseList = currentSession.exercises.map((e) => ({
      name: e.exerciseName,
      muscleGroup: e.muscleGroup,
    }));
    await createTemplate(saveTemplateName.trim(), currentSession.type, exerciseList);
    setSaveTemplateName('');
    setShowSaveTemplate(false);
    showToast('Template sauvegardé 💾', 'success');
  };

  const handleLoadTemplate = (exerciseNames: Array<{ name: string; muscleGroup: string }>) => {
    loadFromTemplate(exerciseNames);
    setShowTemplateModal(false);
    showToast('Template chargé ✅', 'info');
  };

  // Step 1: Choose session type
  if (!currentSession) {
    return (
      <div className="p-4 pb-24 space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-black text-primary">Nouvelle séance</h2>
          <button onClick={onCancel} className="text-gray-500 text-sm">
            Annuler
          </button>
        </div>

        <p className="text-sm text-gray-400">Choisir le type de séance</p>

        <div className="grid grid-cols-2 gap-3">
          {SESSION_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => handleSessionTypeSelect(type.id)}
              className={`${type.color} text-white py-6 rounded-xl font-bold flex flex-col gap-1 items-center active:scale-95 transition`}
            >
              <span className="text-3xl">{type.emoji}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const filteredExercises = searchQuery
    ? allExercises.filter(
        (e) =>
          e.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !currentSession.exercises.some((ce) => ce.exerciseName === e.name)
      )
    : [];

  const quickFavorites = [
    { name: 'Barbell Bench Press', muscle: 'chest' },
    { name: 'Deadlift', muscle: 'back' },
    { name: 'Barbell Squats', muscle: 'legs' },
    { name: 'Pull-ups', muscle: 'back' },
    { name: 'Barbell Rows', muscle: 'back' },
    { name: 'Dumbbell Shoulder Press', muscle: 'shoulders' },
  ];

  return (
    <div className="p-4 pb-32 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-black text-primary">
            {SESSION_TYPES.find((t) => t.id === currentSession.type)?.emoji}{' '}
            {currentSession.type.toUpperCase()}
          </h2>
          <p className="text-xs text-gray-500">
            {currentSession.exercises.length} exercices ·{' '}
            {currentSession.exercises.reduce((t, e) => t + e.sets.length, 0)} sets
          </p>
        </div>
        <button onClick={onCancel} className="text-xs text-secondary">
          ✕ Annuler
        </button>
      </div>

      {currentSession.exercises.length > 0 ? (
        <ExerciseTracker exercises={currentSession.exercises} showToast={showToast} />
      ) : (
        <div className="bg-dark border border-primary/20 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-400 mb-3">Aucun exercice pour cette séance</p>
          <p className="text-xs text-gray-500">Ajoute des exercices pour commencer 👇</p>
        </div>
      )}

      <div className="bg-dark border border-primary/20 rounded-xl p-4 space-y-3">
        <div className="flex gap-2">
          {templates.filter((t) => t.type === currentSession.type).length > 0 && (
            <button
              onClick={() => setShowTemplateModal(true)}
              className="flex-1 bg-secondary/20 text-secondary py-2 rounded-lg text-sm font-bold"
            >
              📋 Charger template
            </button>
          )}
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex-1 bg-primary/20 text-primary py-2 rounded-lg text-sm font-bold"
          >
            {showAddMenu ? 'Fermer' : '+ Ajouter exercice'}
          </button>
        </div>

        {showAddMenu && (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="🔍 Rechercher un exercice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-dark border border-primary/40 rounded-lg px-3 py-2 text-sm text-text-light focus:outline-none focus:border-primary"
              autoFocus
            />

            {filteredExercises.length > 0 && (
              <div className="bg-bg-dark border border-primary/20 rounded-lg max-h-48 overflow-y-auto">
                {filteredExercises.slice(0, 20).map((ex) => (
                  <button
                    key={ex.id || ex.name}
                    onClick={() => handleAddExercise(ex.name, ex.muscleGroup)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-primary/20 transition border-b border-primary/10 last:border-0"
                  >
                    <span className="font-semibold">{ex.name}</span>
                    <span className="text-xs text-gray-500 ml-2">({ex.muscleGroup})</span>
                  </button>
                ))}
              </div>
            )}

            {!searchQuery && (
              <>
                <p className="text-xs text-gray-500 uppercase font-bold">⚡ Favoris</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickFavorites.map((ex) => (
                    <button
                      key={ex.name}
                      onClick={() => handleAddExercise(ex.name, ex.muscle)}
                      disabled={currentSession.exercises.some(
                        (e) => e.exerciseName === ex.name
                      )}
                      className="text-xs bg-bg-dark text-primary px-3 py-2 rounded-lg border border-primary/20 hover:border-primary/60 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {ex.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            <button
              onClick={() => setShowCustomForm(!showCustomForm)}
              className="w-full text-xs text-gray-400 py-2 border border-dashed border-gray-600 rounded-lg hover:border-primary hover:text-primary transition"
            >
              {showCustomForm ? '✕ Fermer' : '+ Créer exercice custom'}
            </button>

            {showCustomForm && (
              <div className="bg-bg-dark rounded-lg p-3 space-y-2 border border-primary/20">
                <input
                  type="text"
                  placeholder="Nom de l'exercice"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-dark border border-primary/40 rounded px-2 py-1.5 text-sm text-text-light focus:outline-none focus:border-primary"
                />
                <select
                  value={customMuscle}
                  onChange={(e) => setCustomMuscle(e.target.value)}
                  className="w-full bg-dark border border-primary/40 rounded px-2 py-1.5 text-sm text-text-light"
                >
                  {MUSCLE_GROUPS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleCreateCustom}
                  className="w-full bg-primary text-dark py-1.5 rounded font-bold text-sm"
                >
                  Ajouter
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {currentSession.exercises.length > 0 && (
        <div className="space-y-2">
          {!showSaveTemplate ? (
            <button
              onClick={() => setShowSaveTemplate(true)}
              className="w-full bg-dark border border-primary/20 text-gray-400 py-2 rounded-lg text-sm hover:border-primary transition"
            >
              💾 Sauvegarder comme template
            </button>
          ) : (
            <div className="bg-dark border border-primary/20 rounded-lg p-3 space-y-2">
              <input
                type="text"
                placeholder="Nom du template (ex: Push Heavy)"
                value={saveTemplateName}
                onChange={(e) => setSaveTemplateName(e.target.value)}
                className="w-full bg-bg-dark border border-primary/40 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowSaveTemplate(false);
                    setSaveTemplateName('');
                  }}
                  className="flex-1 text-xs text-gray-400 py-1.5 rounded"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={!saveTemplateName.trim()}
                  className="flex-1 bg-primary/20 text-primary py-1.5 rounded text-sm font-bold disabled:opacity-30"
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleEndSession}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl font-black text-lg active:scale-95 transition"
          >
            ✓ TERMINER LA SÉANCE
          </button>
        </div>
      )}

      {showTemplateModal && (
        <TemplateModal
          sessionType={currentSession.type}
          onSelect={handleLoadTemplate}
          onClose={() => setShowTemplateModal(false)}
        />
      )}
    </div>
  );
}
