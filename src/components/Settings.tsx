import { useState } from 'react';
import { useExerciseStore } from '../stores/exerciseStore';
import { useTemplateStore } from '../stores/templateStore';
import { PRESET_EXERCISES } from '../db/seedExercises';

const MUSCLE_GROUPS = Object.keys(PRESET_EXERCISES);

interface SettingsProps {
  showToast: (msg: string, type?: 'success' | 'info' | 'record') => void;
}

type Tab = 'exercises' | 'templates';

export default function Settings({ showToast }: SettingsProps) {
  const [tab, setTab] = useState<Tab>('exercises');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMuscle, setNewMuscle] = useState('chest');

  const { customExercises, createExercise, deleteExercise } = useExerciseStore();
  const { templates, deleteTemplate } = useTemplateStore();

  const handleAddExercise = async () => {
    if (!newName.trim()) return;
    await createExercise(newName.trim(), newMuscle);
    setNewName('');
    setNewMuscle('chest');
    setShowAddForm(false);
    showToast(`"${newName.trim()}" ajouté ✅`, 'success');
  };

  const handleDeleteExercise = async (id: string, name: string) => {
    if (!confirm(`Supprimer "${name}" de tes exercices custom ?`)) return;
    await deleteExercise(id);
    showToast('Exercice supprimé', 'info');
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!confirm(`Supprimer le template "${name}" ?`)) return;
    await deleteTemplate(id);
    showToast('Template supprimé', 'info');
  };

  const TYPE_LABELS: Record<string, string> = {
    push: 'Push', pull: 'Pull', legs: 'Legs', upper: 'Upper', lower: 'Lower',
  };

  return (
    <div className="p-4 pb-28 space-y-4">
      <h2 className="text-xl font-black text-primary">⚙️ PARAMÈTRES</h2>

      <div className="flex gap-2 bg-dark rounded-xl p-1">
        <button
          onClick={() => setTab('exercises')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
            tab === 'exercises' ? 'bg-primary text-dark' : 'text-gray-400'
          }`}
        >
          💪 Exercices
        </button>
        <button
          onClick={() => setTab('templates')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
            tab === 'templates' ? 'bg-primary text-dark' : 'text-gray-400'
          }`}
        >
          📋 Templates
        </button>
      </div>

      {tab === 'exercises' && (
        <div className="space-y-3">
          <div className="bg-dark border border-primary/20 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="font-bold text-text-light">Mes exercices custom</h3>
                <p className="text-xs text-gray-500">
                  {customExercises.length} exercice{customExercises.length !== 1 ? 's' : ''} personnel{customExercises.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-primary text-dark px-3 py-1.5 rounded-lg text-sm font-bold"
              >
                {showAddForm ? '✕' : '+ Ajouter'}
              </button>
            </div>

            {showAddForm && (
              <div className="bg-bg-dark rounded-xl p-3 space-y-2 mb-3 border border-primary/20">
                <input
                  type="text"
                  placeholder="Nom de l'exercice"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddExercise()}
                  autoFocus
                  className="w-full bg-dark border border-primary/40 rounded-lg px-3 py-2 text-text-light text-sm focus:outline-none focus:border-primary"
                />
                <select
                  value={newMuscle}
                  onChange={(e) => setNewMuscle(e.target.value)}
                  className="w-full bg-dark border border-primary/40 rounded-lg px-3 py-2 text-text-light text-sm"
                >
                  {MUSCLE_GROUPS.map((m) => (
                    <option key={m} value={m}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddExercise}
                  disabled={!newName.trim()}
                  className="w-full bg-primary text-dark py-2 rounded-lg font-bold text-sm disabled:opacity-30"
                >
                  ✓ Créer l'exercice
                </button>
              </div>
            )}

            {customExercises.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                <p>Aucun exercice custom pour l'instant.</p>
                <p className="text-xs mt-1">Crée les tiens pour les retrouver dans quick-add.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {customExercises.map((ex) => (
                  <div
                    key={ex.id}
                    className="flex justify-between items-center bg-bg-dark rounded-lg px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-text-light">{ex.name}</p>
                      <p className="text-[10px] text-gray-500">{ex.muscleGroup}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteExercise(ex.id, ex.name)}
                      className="text-secondary text-sm px-2 py-1"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-dark border border-primary/10 rounded-xl p-4">
            <h3 className="font-bold text-text-light mb-1">Exercices preset</h3>
            <p className="text-xs text-gray-500 mb-3">
              {Object.values(PRESET_EXERCISES).flat().length} exercices disponibles par défaut
            </p>
            <div className="space-y-1">
              {Object.entries(PRESET_EXERCISES).map(([group, exos]) => (
                <div key={group} className="flex justify-between text-xs">
                  <span className="text-gray-400 capitalize">{group}</span>
                  <span className="text-primary font-bold">{exos.length} exos</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'templates' && (
        <div className="space-y-3">
          {templates.length === 0 ? (
            <div className="bg-dark border border-primary/20 rounded-xl p-6 text-center">
              <p className="text-gray-500 text-sm">Aucun template sauvegardé.</p>
              <p className="text-xs text-gray-600 mt-1">
                Pendant une séance, tape "Sauvegarder comme template".
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="bg-dark border border-primary/20 rounded-xl p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-text-light">{t.name}</span>
                        <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                          {TYPE_LABELS[t.type] || t.type}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {t.exerciseNames.map((e, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-bg-dark text-gray-400 px-2 py-0.5 rounded"
                          >
                            {e.name}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-600 mt-1">
                        {t.exerciseNames.length} exercice{t.exerciseNames.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteTemplate(t.id, t.name)}
                      className="text-secondary text-sm ml-2 mt-0.5"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
