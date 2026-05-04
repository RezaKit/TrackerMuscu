import { useState } from 'react';
import { useExerciseStore } from '../stores/exerciseStore';
import { useTemplateStore } from '../stores/templateStore';
import { useRoutineStore } from '../stores/routineStore';
import { useSessionStore } from '../stores/sessionStore';
import { PRESET_EXERCISES } from '../db/seedExercises';
import { Icons } from './Icons';
import { setPendingAI } from '../utils/aiContext';
import { tr } from '../utils/i18n';

const MUSCLE_GROUPS = Object.keys(PRESET_EXERCISES);

const EMOJI_LIST = ['💪','🏃','🏊','🧘','📵','🍵','🛌','📚','💤','🚿','💧','🥗','☕','🎯','⭐','🔥','🎧','🧴','💊','🌙','☀️','🍎','🥦','🏋️','🧹','🪥'];

interface SettingsProps {
  showToast: (msg: string, type?: 'success' | 'info' | 'record') => void;
  onStartSession?: () => void;
  onAskCoach?: () => void;
}

type Tab = 'exercises' | 'templates' | 'routine';

const TYPE_LABELS: Record<string, string> = {
  push: 'Push', pull: 'Pull', legs: 'Legs', upper: 'Upper', lower: 'Lower',
};

export default function Settings({ showToast, onStartSession, onAskCoach }: SettingsProps) {
  const [tab, setTab] = useState<Tab>('exercises');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMuscle, setNewMuscle] = useState('chest');
  const [routineName, setRoutineName] = useState('');
  const [routineEmoji, setRoutineEmoji] = useState('⭐');
  const [expandedTplId, setExpandedTplId] = useState<string | null>(null);

  const { customExercises, createExercise, deleteExercise } = useExerciseStore();
  const { templates, deleteTemplate } = useTemplateStore();
  const { items: routineItems, addItem: addRoutineItem, deleteItem: deleteRoutineItem } = useRoutineStore();
  const { createSession, loadFromTemplate } = useSessionStore();

  const handleStartTemplate = (tpl: typeof templates[number]) => {
    createSession(tpl.type);
    loadFromTemplate(tpl.exerciseNames);
    onStartSession?.();
    showToast(tr({ fr: `▶ ${tpl.name} démarrée`, en: `▶ ${tpl.name} started`, es: `▶ ${tpl.name} iniciada` }), 'success');
  };

  const handleAskAITemplate = (tpl: typeof templates[number]) => {
    const exoLines = tpl.exerciseNames.map((e, i) => `  ${i + 1}. ${e.name} (${e.muscleGroup})`).join('\n');
    setPendingAI({
      kind: 'template',
      initialMessage: `Voici mon template "${tpl.name}" (${tpl.type}) :\n${exoLines}\n\nComment puis-je le modifier / l'optimiser pour mes objectifs ?`,
      payload: { templateId: tpl.id, name: tpl.name, type: tpl.type, exercises: tpl.exerciseNames },
    });
    onAskCoach?.();
  };

  const handleAddExercise = async () => {
    if (!newName.trim()) return;
    await createExercise(newName.trim(), newMuscle);
    setNewName('');
    setNewMuscle('chest');
    setShowAddForm(false);
    showToast(tr({ fr: `"${newName.trim()}" ajouté`, en: `"${newName.trim()}" added`, es: `"${newName.trim()}" añadido` }), 'success');
  };

  const handleDeleteExercise = async (id: string, name: string) => {
    if (!confirm(`Supprimer "${name}" ?`)) return;
    await deleteExercise(id);
    showToast(tr({ fr: 'Exercice supprimé', en: 'Exercise deleted', es: 'Ejercicio eliminado' }), 'info');
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!confirm(`Supprimer le template "${name}" ?`)) return;
    await deleteTemplate(id);
    showToast(tr({ fr: 'Template supprimé', en: 'Template deleted', es: 'Plantilla eliminada' }), 'info');
  };

  return (
    <div className="page-enter">
      <div style={{ padding: '14px 22px 14px' }}>
        <div style={{ fontSize: 11, color: 'var(--text-mute)', letterSpacing: 0.16, fontWeight: 700, textTransform: 'uppercase' }}>{tr({ fr: 'Configuration', en: 'Configuration', es: 'Configuración' })}</div>
        <h1 className="t-display" style={{ margin: '4px 0 0', fontSize: 52, lineHeight: 0.88 }}>{tr({ fr: 'Config', en: 'Config', es: 'Config' })}</h1>
      </div>

      {/* Tabs */}
      <div style={{ padding: '6px 16px 14px' }}>
        <div className="glass" style={{ borderRadius: 16, padding: 4, display: 'flex' }}>
          {([
            { id: 'exercises' as const, label: tr({ fr: 'Exercices', en: 'Exercises', es: 'Ejercicios' }), Icon: Icons.Dumbbell },
            { id: 'templates' as const, label: tr({ fr: 'Templates', en: 'Templates', es: 'Plantillas' }), Icon: Icons.Save },
            { id: 'routine' as const, label: tr({ fr: 'Routine', en: 'Routine', es: 'Rutina' }), Icon: Icons.Moon },
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

      {/* EXERCISES TAB */}
      {tab === 'exercises' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="glass" style={{ borderRadius: 22, padding: '16px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{tr({ fr: 'Mes exercices custom', en: 'My custom exercises', es: 'Mis ejercicios personalizados' })}</div>
                <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>
                  {customExercises.length} {tr({ fr: `exercice${customExercises.length !== 1 ? 's' : ''} personnel${customExercises.length !== 1 ? 's' : ''}`, en: `custom exercise${customExercises.length !== 1 ? 's' : ''}`, es: `ejercicio${customExercises.length !== 1 ? 's' : ''} personalizado${customExercises.length !== 1 ? 's' : ''}` })}
                </div>
              </div>
              <button onClick={() => setShowAddForm(!showAddForm)} className="tap" style={{
                border: 'none', borderRadius: 12, padding: '8px 14px',
                background: showAddForm ? 'rgba(255,255,255,0.06)' : 'var(--primary)',
                color: '#fff', fontWeight: 700, fontSize: 12,
              }}>
                {showAddForm ? tr({ fr: 'Fermer', en: 'Close', es: 'Cerrar' }) : tr({ fr: '+ Ajouter', en: '+ Add', es: '+ Añadir' })}
              </button>
            </div>

            {showAddForm && (
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '12px', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input type="text" placeholder={tr({ fr: "Nom de l'exercice", en: 'Exercise name', es: 'Nombre del ejercicio' })} value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddExercise()}
                  className="input-glass" autoFocus />
                <select value={newMuscle} onChange={(e) => setNewMuscle(e.target.value)}
                  className="input-glass" style={{ appearance: 'none' }}>
                  {MUSCLE_GROUPS.map((m) => (
                    <option key={m} value={m} style={{ background: '#1a1a1f' }}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                  ))}
                </select>
                <button onClick={handleAddExercise} disabled={!newName.trim()} className="tap" style={{
                  border: 'none', borderRadius: 12, padding: '11px',
                  background: newName.trim() ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                  color: '#fff', fontWeight: 700, fontSize: 13, opacity: newName.trim() ? 1 : 0.4,
                }}>{tr({ fr: "Créer l'exercice", en: 'Create exercise', es: 'Crear ejercicio' })}</button>
              </div>
            )}

            {customExercises.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-mute)', fontSize: 13 }}>
                {tr({ fr: 'Aucun exercice custom. Crée les tiens !', en: 'No custom exercises yet. Create your own!', es: 'Sin ejercicios personalizados. ¡Crea los tuyos!' })}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {customExercises.map((ex) => (
                  <div key={ex.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '10px 12px',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{ex.name}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-mute)', marginTop: 1 }}>{ex.muscleGroup}</div>
                    </div>
                    <button onClick={() => handleDeleteExercise(ex.id, ex.name)} className="tap" style={{ background: 'none', border: 'none', color: 'var(--text-mute)', padding: '4px 8px' }}>
                      <Icons.Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass" style={{ borderRadius: 22, padding: '16px 16px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{tr({ fr: 'Exercices preset', en: 'Preset exercises', es: 'Ejercicios predefinidos' })}</div>
            <div style={{ fontSize: 11, color: 'var(--text-mute)', marginBottom: 12 }}>
              {Object.values(PRESET_EXERCISES).flat().length} {tr({ fr: 'exercices disponibles par défaut', en: 'exercises available by default', es: 'ejercicios disponibles por defecto' })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(PRESET_EXERCISES).map(([group, exos]) => (
                <div key={group} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-soft)', textTransform: 'capitalize' }}>{group}</span>
                  <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, fontFamily: 'var(--mono)' }}>{exos.length}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ROUTINE TAB */}
      {tab === 'routine' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Current items */}
          <div className="glass" style={{ borderRadius: 22, padding: '16px 16px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
              {tr({ fr: 'Items de ta routine soir', en: 'Evening routine items', es: 'Elementos de tu rutina nocturna' })}
            </div>
            {routineItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-mute)', fontSize: 13 }}>
                {tr({ fr: 'Aucun item. Ajoute-en ci-dessous.', en: 'No items yet. Add some below.', es: 'Sin elementos. Añade algunos abajo.' })}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {routineItems.map((item) => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '12px 14px',
                  }}>
                    <span style={{ fontSize: 22 }}>{item.emoji}</span>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{item.name}</span>
                    <button onClick={async () => { await deleteRoutineItem(item.id); showToast(tr({ fr: 'Item supprimé', en: 'Item deleted', es: 'Elemento eliminado' }), 'info'); }}
                      className="tap" style={{ background: 'none', border: 'none', color: 'var(--text-mute)', padding: '4px' }}>
                      <Icons.Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add new item */}
          <div className="glass" style={{ borderRadius: 22, padding: '16px 16px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>{tr({ fr: 'Ajouter un item', en: 'Add an item', es: 'Añadir un elemento' })}</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
              }}>{routineEmoji}</div>
              <input
                type="text"
                placeholder={tr({ fr: "Nom de l'habitude", en: 'Habit name', es: 'Nombre del hábito' })}
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && routineName.trim()) {
                    await addRoutineItem(routineName.trim(), routineEmoji);
                    setRoutineName('');
                    showToast(tr({ fr: `"${routineName.trim()}" ajouté`, en: `"${routineName.trim()}" added`, es: `"${routineName.trim()}" añadido` }), 'success');
                  }
                }}
                className="input-glass"
                style={{ flex: 1 }}
              />
            </div>
            {/* Emoji picker */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {EMOJI_LIST.map((e) => (
                <button key={e} onClick={() => setRoutineEmoji(e)} className="tap" style={{
                  width: 38, height: 38, borderRadius: 10, border: 'none', fontSize: 20,
                  background: routineEmoji === e ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.04)',
                  outline: routineEmoji === e ? '2px solid var(--primary)' : 'none',
                }}>
                  {e}
                </button>
              ))}
            </div>
            <button
              onClick={async () => {
                if (!routineName.trim()) return;
                await addRoutineItem(routineName.trim(), routineEmoji);
                setRoutineName('');
                showToast(tr({ fr: `"${routineName.trim()}" ajouté`, en: `"${routineName.trim()}" added`, es: `"${routineName.trim()}" añadido` }), 'success');
              }}
              disabled={!routineName.trim()}
              className="tap"
              style={{
                width: '100%', border: 'none', borderRadius: 12, padding: '11px',
                background: routineName.trim() ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                color: '#fff', fontWeight: 700, fontSize: 13,
                opacity: routineName.trim() ? 1 : 0.4,
              }}
            >
              {tr({ fr: 'Ajouter à la routine', en: 'Add to routine', es: 'Añadir a la rutina' })}
            </button>
          </div>
        </div>
      )}

      {/* TEMPLATES TAB */}
      {tab === 'templates' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {templates.length === 0 ? (
            <div className="glass" style={{ borderRadius: 22, padding: '32px 22px', textAlign: 'center' }}>
              <Icons.Save size={32} color="var(--text-faint)" />
              <div style={{ marginTop: 12, color: 'var(--text-mute)', fontSize: 13 }}>{tr({ fr: 'Aucun template sauvegardé.', en: 'No template saved yet.', es: 'Ningún template guardado.' })}</div>
              <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-faint)' }}>{tr({ fr: 'Sauvegarde-en depuis une séance active.', en: 'Save one from an active workout.', es: 'Guarda uno desde una sesión activa.' })}</div>
            </div>
          ) : (
            templates.map((t) => {
              const expanded = expandedTplId === t.id;
              return (
                <div key={t.id} className="glass" style={{ borderRadius: 18, overflow: 'hidden' }}>
                  {/* Header (clickable) */}
                  <button
                    onClick={() => setExpandedTplId(expanded ? null : t.id)}
                    className="tap"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      width: '100%', padding: '14px 16px',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      textAlign: 'left', color: 'inherit',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</span>
                        <span style={{ fontSize: 10, background: 'rgba(255,107,53,0.12)', color: 'var(--primary)', padding: '3px 8px', borderRadius: 999, fontWeight: 700, textTransform: 'uppercase' }}>
                          {TYPE_LABELS[t.type] || t.type}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>
                        {t.exerciseNames.length} {tr({ fr: `exercice${t.exerciseNames.length !== 1 ? 's' : ''}`, en: `exercise${t.exerciseNames.length !== 1 ? 's' : ''}`, es: `ejercicio${t.exerciseNames.length !== 1 ? 's' : ''}` })}
                        {' · '}
                        <span style={{ color: 'var(--text-faint)' }}>{expanded ? tr({ fr: 'Toucher pour réduire', en: 'Tap to collapse', es: 'Tocar para cerrar' }) : tr({ fr: 'Toucher pour voir', en: 'Tap to view', es: 'Tocar para ver' })}</span>
                      </div>
                    </div>
                    <span style={{
                      color: 'var(--text-mute)', fontSize: 18,
                      transform: expanded ? 'rotate(90deg)' : 'rotate(0)',
                      transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                      flexShrink: 0,
                    }}>›</span>
                  </button>

                  {/* Expanded content */}
                  {expanded && (
                    <div style={{
                      padding: '0 16px 14px', borderTop: '1px solid rgba(255,255,255,0.06)',
                      animation: 'fadeIn 0.22s ease-out',
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '12px 0' }}>
                        {t.exerciseNames.map((e, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 10px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: 10,
                          }}>
                            <span style={{
                              flexShrink: 0, width: 22, height: 22, borderRadius: 6,
                              background: 'rgba(255,107,53,0.15)', color: 'var(--primary)',
                              fontSize: 10.5, fontWeight: 800,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontFamily: 'var(--mono)',
                            }}>{i + 1}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{e.name}</div>
                              <div style={{ fontSize: 10.5, color: 'var(--text-mute)', textTransform: 'capitalize', marginTop: 1 }}>{e.muscleGroup}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        <button
                          onClick={() => handleStartTemplate(t)}
                          className="tap"
                          style={{
                            flex: 1.4, border: 'none', borderRadius: 12, padding: '11px',
                            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                            color: '#fff', fontWeight: 800, fontSize: 12.5,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          }}
                        >
                          <Icons.Play size={13} /> {tr({ fr: 'Lancer', en: 'Start', es: 'Iniciar' })}
                        </button>
                        <button
                          onClick={() => handleAskAITemplate(t)}
                          className="tap"
                          style={{
                            flex: 1.4, borderRadius: 12, padding: '11px',
                            background: 'rgba(96,165,250,0.12)',
                            color: 'var(--info)', fontWeight: 700, fontSize: 12.5,
                            border: '1px solid rgba(96,165,250,0.25)',
                          }}
                        >
                          🤖 {tr({ fr: 'Modifier IA', en: 'Edit AI', es: 'Editar IA' })}
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(t.id, t.name)}
                          className="tap"
                          style={{
                            flexShrink: 0, border: 'none', borderRadius: 12, padding: '11px 14px',
                            background: 'rgba(196,30,58,0.12)', color: 'var(--secondary)',
                            fontWeight: 700, fontSize: 12.5,
                          }}
                        >
                          <Icons.Trash size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
