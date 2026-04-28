import { useState } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { useTemplateStore } from '../stores/templateStore';
import { useExerciseStore } from '../stores/exerciseStore';
import { useAuthStore } from '../stores/authStore';
import { PRESET_EXERCISES } from '../db/seedExercises';
import ExerciseTracker from './ExerciseTracker';
import TemplateModal from './TemplateModal';
import RestTimer from './RestTimer';
import PostSessionPhoto from './PostSessionPhoto';
import { Icons } from './Icons';
import type { SessionType } from '../types';

interface SessionFormProps {
  onSessionEnd: () => void;
  onCancel: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'record') => void;
}

const SESSION_TYPES: { id: SessionType; label: string; color: string; dim: string; gradient: string }[] = [
  { id: 'push',  label: 'Push',  color: '#FF6B35', dim: 'rgba(255,107,53,0.15)',  gradient: 'linear-gradient(135deg, #FF6B35, #E14A0F)' },
  { id: 'pull',  label: 'Pull',  color: '#C41E3A', dim: 'rgba(196,30,58,0.15)',   gradient: 'linear-gradient(135deg, #C41E3A, #8B0E22)' },
  { id: 'legs',  label: 'Legs',  color: '#A78BFA', dim: 'rgba(167,139,250,0.15)', gradient: 'linear-gradient(135deg, #A78BFA, #7C3AED)' },
  { id: 'upper', label: 'Upper', color: '#FB923C', dim: 'rgba(251,146,60,0.15)',  gradient: 'linear-gradient(135deg, #FB923C, #EA580C)' },
  { id: 'lower', label: 'Lower', color: '#F87171', dim: 'rgba(248,113,113,0.15)', gradient: 'linear-gradient(135deg, #F87171, #DC2626)' },
];

const MUSCLE_GROUPS = Object.keys(PRESET_EXERCISES);

export default function SessionForm({ onSessionEnd, onCancel, showToast }: SessionFormProps) {
  const { currentSession, createSession, addExercise, endSession, loadFromTemplate } = useSessionStore();
  const { templates, createTemplate } = useTemplateStore();
  const { getAllExercises, createExercise } = useExerciseStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [timerTrigger, setTimerTrigger] = useState(0);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customMuscle, setCustomMuscle] = useState('chest');
  const [saveTemplateName, setSaveTemplateName] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [photoSession, setPhotoSession] = useState<{ type: SessionType; date: string } | null>(null);

  const { user } = useAuthStore();
  const allExercises = getAllExercises();

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
    showToast('Exercice ajouté', 'success');
  };

  const handleEndSession = async () => {
    if (!currentSession) return;
    const savedType = currentSession.type;
    const savedDate = currentSession.date;
    const completed = await endSession();
    if (completed) {
      if (user) {
        setPhotoSession({ type: savedType, date: savedDate });
      } else {
        onSessionEnd();
      }
    }
  };

  const handleSaveTemplate = async () => {
    if (!currentSession || !saveTemplateName.trim()) return;
    const exerciseList = currentSession.exercises.map((e) => ({ name: e.exerciseName, muscleGroup: e.muscleGroup }));
    await createTemplate(saveTemplateName.trim(), currentSession.type, exerciseList);
    setSaveTemplateName('');
    setShowSaveTemplate(false);
    showToast('Template sauvegardé', 'success');
  };

  const handleLoadTemplate = (exerciseNames: Array<{ name: string; muscleGroup: string }>) => {
    loadFromTemplate(exerciseNames);
    setShowTemplateModal(false);
    showToast('Template chargé', 'info');
  };

  // ── Post-session photo modal ───────────────────────────────
  if (photoSession) {
    return (
      <PostSessionPhoto
        sessionType={photoSession.type}
        date={photoSession.date}
        onDone={() => { setPhotoSession(null); onSessionEnd(); }}
      />
    );
  }

  // ── Type picker ────────────────────────────────────────────
  if (!currentSession) {
    return (
      <div className="page-enter" style={{ padding: '14px 16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '0 6px' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.16 }}>Commencer</div>
            <h2 className="t-display" style={{ fontSize: 40, lineHeight: 0.9, marginTop: 4 }}>Nouvelle séance</h2>
          </div>
          <button onClick={onCancel} className="tap glass" style={{
            width: 36, height: 36, borderRadius: 12, border: '1px solid var(--glass-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mute)',
          }}>
            <Icons.X size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {SESSION_TYPES.map((t) => (
            <button key={t.id} onClick={() => createSession(t.id)} className="tap" style={{
              background: t.gradient, border: 'none', borderRadius: 24,
              padding: '28px 22px', textAlign: 'left',
              position: 'relative', overflow: 'hidden',
              boxShadow: `0 8px 28px ${t.color}40`,
              minHeight: 110,
            }}>
              <div style={{
                position: 'absolute', inset: 0, opacity: 0.35,
                background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.25), transparent 60%)',
              }} />
              <div style={{ position: 'absolute', top: 14, right: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', boxShadow: '0 0 10px rgba(255,255,255,0.8)' }} />
              </div>
              <div className="t-display" style={{ fontSize: 36, color: '#fff', position: 'relative' }}>{t.label}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: 0.1, textTransform: 'uppercase', position: 'relative', marginTop: 6 }}>
                {t.id === 'push' ? 'Pecs · Épaules · Triceps' :
                 t.id === 'pull' ? 'Dos · Biceps' :
                 t.id === 'legs' ? 'Jambes · Glutes' :
                 t.id === 'upper' ? 'Haut du corps' : 'Bas du corps'}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const typeCfg = SESSION_TYPES.find((t) => t.id === currentSession.type)!;
  const filteredExercises = searchQuery
    ? allExercises.filter((e) =>
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
    <div className="page-enter" style={{ paddingBottom: 120 }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        padding: '16px 16px 12px',
        background: 'rgba(5,5,5,0.85)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 10.5, fontWeight: 700, letterSpacing: 0.16, padding: '4px 12px', borderRadius: 999,
              background: typeCfg.dim, color: typeCfg.color, textTransform: 'uppercase',
            }}>{typeCfg.label}</span>
            <span style={{ fontSize: 12, color: 'var(--text-mute)' }}>
              {currentSession.exercises.length} exos · {currentSession.exercises.reduce((t, e) => t + e.sets.length, 0)} sets
            </span>
          </div>
          <button onClick={onCancel} className="tap" style={{ background: 'none', border: 'none', color: 'var(--secondary)', fontSize: 12, fontWeight: 700 }}>
            Annuler
          </button>
        </div>
      </div>

      {/* Exercises */}
      <div style={{ padding: '8px 16px' }}>
        {currentSession.exercises.length === 0 ? (
          <div className="glass" style={{ borderRadius: 22, padding: '32px', textAlign: 'center', marginBottom: 12 }}>
            <Icons.Dumbbell size={32} color="var(--text-faint)" />
            <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-mute)' }}>Aucun exercice</div>
            <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-faint)' }}>Ajoute des exercices ci-dessous</div>
          </div>
        ) : (
          <ExerciseTracker
            exercises={currentSession.exercises}
            showToast={showToast}
            onSetAdded={() => setTimerTrigger((t) => t + 1)}
          />
        )}
      </div>

      {/* Add exercise section */}
      <div style={{ padding: '8px 16px 0' }}>
        <div className="glass" style={{ borderRadius: 22, padding: '16px 16px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: showAddMenu ? 12 : 0 }}>
            {templates.filter((t) => t.type === currentSession.type).length > 0 && (
              <button onClick={() => setShowTemplateModal(true)} className="tap" style={{
                flex: 1, border: 'none', borderRadius: 14, padding: '11px',
                background: 'rgba(196,30,58,0.12)', color: 'var(--secondary)',
                fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <Icons.Save size={14} /> Template
              </button>
            )}
            <button onClick={() => setShowAddMenu(!showAddMenu)} className="tap" style={{
              flex: 1, border: 'none', borderRadius: 14, padding: '11px',
              background: showAddMenu ? 'rgba(255,107,53,0.2)' : 'rgba(255,107,53,0.12)',
              color: 'var(--primary)',
              fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <Icons.Plus size={14} stroke={2.4} /> {showAddMenu ? 'Fermer' : 'Exercice'}
            </button>
          </div>

          {showAddMenu && (
            <div>
              <input
                type="text" placeholder="Rechercher un exercice..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="input-glass" style={{ marginBottom: 10 }}
                autoFocus
              />

              {filteredExercises.length > 0 && (
                <div className="glass" style={{ borderRadius: 14, maxHeight: 200, overflowY: 'auto', marginBottom: 10 }}>
                  {filteredExercises.slice(0, 20).map((ex) => (
                    <button key={ex.id || ex.name} onClick={() => handleAddExercise(ex.name, ex.muscleGroup)}
                      className="tap" style={{
                        width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none',
                        borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        color: 'var(--text)',
                      }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{ex.name}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-mute)', textTransform: 'capitalize' }}>{ex.muscleGroup}</span>
                    </button>
                  ))}
                </div>
              )}

              {!searchQuery && (
                <>
                  <div style={{ fontSize: 10.5, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.12, marginBottom: 8 }}>
                    Favoris
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
                    {quickFavorites.map((ex) => {
                      const disabled = currentSession.exercises.some((e) => e.exerciseName === ex.name);
                      return (
                        <button key={ex.name} onClick={() => !disabled && handleAddExercise(ex.name, ex.muscle)}
                          className="tap" style={{
                            border: 'none', borderRadius: 12, padding: '8px 12px',
                            background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)',
                            color: disabled ? 'var(--text-faint)' : 'var(--primary)',
                            fontSize: 12, fontWeight: 600, textAlign: 'left',
                          }}>
                          {ex.name}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              <button onClick={() => setShowCustomForm(!showCustomForm)} className="tap" style={{
                width: '100%', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12,
                padding: '8px', background: 'transparent',
                color: 'var(--text-mute)', fontSize: 12, fontWeight: 600,
              }}>
                {showCustomForm ? '✕ Fermer' : '+ Créer exercice custom'}
              </button>

              {showCustomForm && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    type="text" placeholder="Nom de l'exercice" value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="input-glass" style={{ padding: '10px 14px' }}
                  />
                  <select value={customMuscle} onChange={(e) => setCustomMuscle(e.target.value)}
                    className="input-glass" style={{ padding: '10px 14px', appearance: 'none' }}>
                    {MUSCLE_GROUPS.map((m) => <option key={m} value={m} style={{ background: '#1a1a1f' }}>{m}</option>)}
                  </select>
                  <button onClick={handleCreateCustom} disabled={!customName.trim()} className="tap" style={{
                    border: 'none', borderRadius: 12, padding: '10px',
                    background: customName.trim() ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                    color: '#fff', fontWeight: 700, fontSize: 13, opacity: customName.trim() ? 1 : 0.5,
                  }}>Ajouter</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Template save + End session */}
      {currentSession.exercises.length > 0 && (
        <div style={{ padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!showSaveTemplate ? (
            <button onClick={() => setShowSaveTemplate(true)} className="tap glass" style={{
              borderRadius: 16, padding: '12px', border: '1px solid var(--glass-border)',
              color: 'var(--text-mute)', fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Icons.Save size={14} /> Sauvegarder comme template
            </button>
          ) : (
            <div className="glass" style={{ borderRadius: 16, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type="text" placeholder="Nom du template (ex: Push Heavy)"
                value={saveTemplateName} onChange={(e) => setSaveTemplateName(e.target.value)}
                className="input-glass" style={{ padding: '10px 14px' }} autoFocus
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setShowSaveTemplate(false); setSaveTemplateName(''); }}
                  className="tap" style={{ flex: 1, border: 'none', borderRadius: 10, padding: '8px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-mute)', fontWeight: 600, fontSize: 12 }}>
                  Annuler
                </button>
                <button onClick={handleSaveTemplate} disabled={!saveTemplateName.trim()}
                  className="tap" style={{
                    flex: 1, border: 'none', borderRadius: 10, padding: '8px',
                    background: saveTemplateName.trim() ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.04)',
                    color: 'var(--primary)', fontWeight: 700, fontSize: 12, opacity: saveTemplateName.trim() ? 1 : 0.4,
                  }}>Sauvegarder</button>
              </div>
            </div>
          )}

          <button onClick={handleEndSession} className="tap" style={{
            border: 'none', borderRadius: 22, padding: '20px',
            background: 'linear-gradient(135deg, #16A34A, #15803D)',
            color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: 0.1,
            boxShadow: '0 8px 28px rgba(22,163,74,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <Icons.Check size={20} stroke={2.4} /> TERMINER LA SÉANCE
          </button>
        </div>
      )}

      {/* Rest timer — floating pill, auto-starts after each set */}
      <RestTimer trigger={timerTrigger} />

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
