import { useState } from 'react';
import { useExerciseStore } from '../stores/exerciseStore';
import { useTemplateStore } from '../stores/templateStore';
import { PRESET_EXERCISES } from '../db/seedExercises';
import { Icons } from './Icons';

const MUSCLE_GROUPS = Object.keys(PRESET_EXERCISES);

interface SettingsProps {
  showToast: (msg: string, type?: 'success' | 'info' | 'record') => void;
}

type Tab = 'exercises' | 'templates';

const TYPE_LABELS: Record<string, string> = {
  push: 'Push', pull: 'Pull', legs: 'Legs', upper: 'Upper', lower: 'Lower',
};

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
    showToast(`"${newName.trim()}" ajouté`, 'success');
  };

  const handleDeleteExercise = async (id: string, name: string) => {
    if (!confirm(`Supprimer "${name}" ?`)) return;
    await deleteExercise(id);
    showToast('Exercice supprimé', 'info');
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!confirm(`Supprimer le template "${name}" ?`)) return;
    await deleteTemplate(id);
    showToast('Template supprimé', 'info');
  };

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ padding: '52px 22px 14px' }}>
        <div style={{ fontSize: 11, color: 'var(--text-mute)', letterSpacing: 0.16, fontWeight: 700, textTransform: 'uppercase' }}>Configuration</div>
        <h1 className="t-display" style={{ margin: '4px 0 0', fontSize: 52, lineHeight: 0.88 }}>Paramètres</h1>
      </div>

      {/* Tabs */}
      <div style={{ padding: '6px 16px 14px' }}>
        <div className="glass" style={{ borderRadius: 16, padding: 4, display: 'flex' }}>
          {([
            { id: 'exercises' as const, label: 'Exercices', Icon: Icons.Dumbbell },
            { id: 'templates' as const, label: 'Templates', Icon: Icons.Save },
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
                <div style={{ fontWeight: 700, fontSize: 14 }}>Mes exercices custom</div>
                <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>
                  {customExercises.length} exercice{customExercises.length !== 1 ? 's' : ''} personnel{customExercises.length !== 1 ? 's' : ''}
                </div>
              </div>
              <button onClick={() => setShowAddForm(!showAddForm)} className="tap" style={{
                border: 'none', borderRadius: 12, padding: '8px 14px',
                background: showAddForm ? 'rgba(255,255,255,0.06)' : 'var(--primary)',
                color: '#fff', fontWeight: 700, fontSize: 12,
              }}>
                {showAddForm ? 'Fermer' : '+ Ajouter'}
              </button>
            </div>

            {showAddForm && (
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '12px', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input type="text" placeholder="Nom de l'exercice" value={newName}
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
                }}>Créer l'exercice</button>
              </div>
            )}

            {customExercises.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-mute)', fontSize: 13 }}>
                Aucun exercice custom. Crée les tiens !
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
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Exercices preset</div>
            <div style={{ fontSize: 11, color: 'var(--text-mute)', marginBottom: 12 }}>
              {Object.values(PRESET_EXERCISES).flat().length} exercices disponibles par défaut
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

      {/* TEMPLATES TAB */}
      {tab === 'templates' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {templates.length === 0 ? (
            <div className="glass" style={{ borderRadius: 22, padding: '32px 22px', textAlign: 'center' }}>
              <Icons.Save size={32} color="var(--text-faint)" />
              <div style={{ marginTop: 12, color: 'var(--text-mute)', fontSize: 13 }}>Aucun template sauvegardé.</div>
              <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-faint)' }}>Sauvegarde-en depuis une séance active.</div>
            </div>
          ) : (
            templates.map((t) => (
              <div key={t.id} className="glass" style={{ borderRadius: 18, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</span>
                      <span style={{ fontSize: 10, background: 'rgba(255,107,53,0.12)', color: 'var(--primary)', padding: '3px 8px', borderRadius: 999, fontWeight: 700, textTransform: 'uppercase' }}>
                        {TYPE_LABELS[t.type] || t.type}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>{t.exerciseNames.length} exercice{t.exerciseNames.length !== 1 ? 's' : ''}</div>
                  </div>
                  <button onClick={() => handleDeleteTemplate(t.id, t.name)} className="tap" style={{ background: 'none', border: 'none', color: 'var(--text-mute)', marginLeft: 8 }}>
                    <Icons.Trash size={14} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {t.exerciseNames.map((e, i) => (
                    <span key={i} style={{ fontSize: 10, background: 'rgba(255,255,255,0.05)', color: 'var(--text-soft)', padding: '3px 8px', borderRadius: 8 }}>
                      {e.name}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
