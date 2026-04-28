import { useState, useMemo } from 'react';
import { useCalorieStore } from '../stores/calorieStore';
import { useRoutineStore } from '../stores/routineStore';
import { getDateString } from '../utils/export';
import { Icons } from './Icons';
import type { MealType } from '../types';

type Tab = 'calories' | 'routine';

const MEAL_LABELS: Record<MealType, string> = {
  'petit-dej': 'Petit-déj',
  dejeuner: 'Déjeuner',
  diner: 'Dîner',
  collation: 'Collation',
};

const MEAL_COLORS: Record<MealType, string> = {
  'petit-dej': '#FBBF24',
  dejeuner: 'var(--primary)',
  diner: 'var(--info)',
  collation: 'var(--ok)',
};

interface DailyProps {
  showToast: (msg: string, type?: 'success' | 'info' | 'record') => void;
  onBack?: () => void;
}

export default function Daily({ showToast, onBack }: DailyProps) {
  const [tab, setTab] = useState<Tab>('calories');
  const today = getDateString();

  return (
    <div className="page-enter">
      <div style={{ padding: '16px 22px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-mute)', letterSpacing: 0.16, fontWeight: 700, textTransform: 'uppercase' }}>Suivi quotidien</div>
          <h1 className="t-display" style={{ margin: '4px 0 0', fontSize: 52, lineHeight: 0.88 }}>Daily</h1>
        </div>
        {onBack && (
          <button onClick={onBack} className="tap" style={{
            background: 'rgba(255,255,255,0.06)', border: 'none',
            borderRadius: 14, padding: '10px 16px', marginTop: 4,
            color: 'var(--text-mute)', fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Icons.ChevronLeft size={16} /> Retour
          </button>
        )}
      </div>

      <div style={{ padding: '6px 16px 14px' }}>
        <div className="glass" style={{ borderRadius: 16, padding: 4, display: 'flex' }}>
          {([
            { id: 'calories' as const, label: 'Calories', Icon: Icons.Flame },
            { id: 'routine' as const, label: 'Routine', Icon: Icons.Moon },
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

      {tab === 'calories' && <CaloriesTab today={today} showToast={showToast} />}
      {tab === 'routine' && <RoutineTab today={today} showToast={showToast} />}
    </div>
  );
}

function CaloriesTab({ today, showToast }: { today: string; showToast: DailyProps['showToast'] }) {
  const { entries, calorieGoal, addEntry, deleteEntry, setGoal, getDayStats } = useCalorieStore();
  const [showForm, setShowForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [type, setType] = useState<'in' | 'out'>('in');
  const [calories, setCalories] = useState('');
  const [label, setLabel] = useState('');
  const [meal, setMeal] = useState<MealType>('dejeuner');
  const [date, setDate] = useState(today);
  const [goalInput, setGoalInput] = useState(String(calorieGoal));
  const [viewDate, setViewDate] = useState(today);

  const dayStats = getDayStats(viewDate);
  const remaining = calorieGoal - dayStats.in;
  const progressPct = Math.min(100, Math.round((dayStats.in / calorieGoal) * 100));

  const dayEntries = useMemo(
    () => entries.filter((e) => e.date === viewDate).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [entries, viewDate]
  );

  const weekStats = useMemo(() => {
    const d = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(d);
      day.setDate(d.getDate() - i);
      const dateStr = day.toISOString().split('T')[0];
      const s = getDayStats(dateStr);
      return {
        date: dateStr,
        label: day.toLocaleDateString('fr-FR', { weekday: 'short' }),
        in: s.in,
      };
    }).reverse();
  }, [entries]);

  const maxCal = Math.max(...weekStats.map((d) => d.in), calorieGoal, 1);

  const handleAdd = async () => {
    const cal = parseInt(calories);
    if (isNaN(cal) || cal <= 0 || !label.trim()) return;
    await addEntry(cal, label.trim(), type, date, type === 'in' ? meal : undefined);
    setCalories('');
    setLabel('');
    setShowForm(false);
    showToast(`${cal} kcal enregistré`, 'success');
  };

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Date selector */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="date" value={viewDate} onChange={(e) => setViewDate(e.target.value)} className="input-glass" style={{ flex: 1 }} />
        {viewDate !== today && (
          <button onClick={() => setViewDate(today)} className="tap" style={{
            background: 'rgba(255,107,53,0.12)', border: 'none', borderRadius: 10, padding: '10px 14px',
            color: 'var(--primary)', fontSize: 12, fontWeight: 700,
          }}>Aujourd'hui</button>
        )}
      </div>

      {/* Day summary */}
      <div className="glass" style={{ borderRadius: 22, padding: '16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.12, marginBottom: 2 }}>Ingérées</div>
            <div className="t-num" style={{ fontSize: 36, color: 'var(--primary)', lineHeight: 1 }}>
              {dayStats.in}<span style={{ fontSize: 13, color: 'var(--text-mute)', fontWeight: 400, marginLeft: 4 }}>kcal</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.12, marginBottom: 2 }}>Objectif</div>
            <button onClick={() => setShowGoalForm(!showGoalForm)} className="tap" style={{ background: 'none', border: 'none', padding: 0 }}>
              <div className="t-num" style={{ fontSize: 22, color: showGoalForm ? 'var(--primary)' : 'var(--text-soft)' }}>{calorieGoal} kcal</div>
            </button>
          </div>
        </div>

        {showGoalForm && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input type="number" inputMode="numeric" value={goalInput} onChange={(e) => setGoalInput(e.target.value)}
              className="input-glass" style={{ flex: 1 }} />
            <button onClick={() => { setGoal(parseInt(goalInput)); setShowGoalForm(false); showToast('Objectif mis à jour', 'success'); }}
              className="tap" style={{ background: 'var(--primary)', border: 'none', borderRadius: 12, padding: '0 16px', color: '#fff', fontWeight: 700, fontSize: 16 }}>
              <Icons.Check size={16} />
            </button>
          </div>
        )}

        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 999, height: 6, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{
            height: '100%', borderRadius: 999, transition: 'width 0.4s ease',
            width: `${Math.min(progressPct, 100)}%`,
            background: progressPct > 100 ? 'var(--secondary)' : 'linear-gradient(90deg, var(--primary), #FF9A6C)',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-mute)' }}>
          <span>{progressPct}%</span>
          <span style={{ color: remaining < 0 ? 'var(--secondary)' : 'var(--text-mute)' }}>
            {remaining >= 0 ? `${remaining} kcal restantes` : `${Math.abs(remaining)} kcal dépassées`}
          </span>
        </div>

        {dayStats.out > 0 && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--text-mute)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icons.Flame size={12} color="var(--primary)" /> Dépensées
              </span>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>−{dayStats.out} kcal</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--text-mute)' }}>Net</span>
              <span style={{ fontWeight: 700, color: dayStats.net > calorieGoal ? 'var(--secondary)' : 'var(--ok)' }}>
                {dayStats.net} kcal
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Weekly chart */}
      <div className="glass" style={{ borderRadius: 22, padding: '16px 16px' }}>
        <div style={{ fontSize: 10.5, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.12, marginBottom: 12 }}>7 derniers jours</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 60 }}>
          {weekStats.map((d) => {
            const h = d.in > 0 ? Math.max(6, Math.round((d.in / maxCal) * 52)) : 3;
            const isToday = d.date === today;
            const isView = d.date === viewDate;
            return (
              <button key={d.date} onClick={() => setViewDate(d.date)} className="tap" style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                background: 'none', border: 'none', padding: 0, height: '100%', justifyContent: 'flex-end',
              }}>
                <div style={{
                  width: '100%', borderRadius: '4px 4px 0 0',
                  height: `${h}px`,
                  background: isView ? 'var(--primary)' : isToday ? 'rgba(255,107,53,0.5)' : 'rgba(255,255,255,0.1)',
                  transition: 'height 0.3s ease',
                }} />
                <div style={{ fontSize: 9, color: isToday ? 'var(--primary)' : 'var(--text-faint)', fontWeight: isToday ? 700 : 400 }}>
                  {d.label}
                </div>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-faint)', textAlign: 'right' }}>
          Objectif: {calorieGoal} kcal
        </div>
      </div>

      {/* Add button / form */}
      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="tap" style={{
          width: '100%', border: 'none', borderRadius: 22, padding: '18px',
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          color: '#fff', fontWeight: 700, fontSize: 15,
          boxShadow: '0 8px 28px rgba(255,107,53,0.35)',
        }}>+ Enregistrer des calories</button>
      ) : (
        <div className="glass" style={{ borderRadius: 22, padding: '16px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Nouvelle entrée</span>
            <button onClick={() => setShowForm(false)} className="tap" style={{ background: 'none', border: 'none', color: 'var(--text-mute)' }}>
              <Icons.X size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['in', 'out'] as const).map((t) => (
                <button key={t} onClick={() => setType(t)} className="tap" style={{
                  flex: 1, border: 'none', borderRadius: 12, padding: '10px',
                  background: type === t ? (t === 'in' ? 'var(--primary)' : 'var(--secondary)') : 'rgba(255,255,255,0.06)',
                  color: '#fff', fontWeight: 700, fontSize: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                }}>
                  {t === 'in' ? <Icons.Apple size={13} /> : <Icons.Flame size={13} />}
                  {t === 'in' ? 'Mangées' : 'Dépensées'}
                </button>
              ))}
            </div>

            {type === 'in' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {(Object.entries(MEAL_LABELS) as [MealType, string][]).map(([key, lbl]) => (
                  <button key={key} onClick={() => setMeal(key)} className="tap" style={{
                    border: meal === key ? `1px solid ${MEAL_COLORS[key]}` : '1px solid transparent',
                    borderRadius: 10, padding: '8px 10px',
                    background: meal === key ? `${MEAL_COLORS[key]}18` : 'rgba(255,255,255,0.05)',
                    color: meal === key ? MEAL_COLORS[key] : 'var(--text-soft)',
                    fontSize: 12, fontWeight: 600,
                  }}>{lbl}</button>
                ))}
              </div>
            )}

            <input type="text" placeholder={type === 'in' ? 'Ex: Riz + poulet, Pizza...' : 'Ex: Séance muscu, Cardio...'}
              value={label} onChange={(e) => setLabel(e.target.value)} className="input-glass" />

            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" inputMode="numeric" placeholder="Calories (kcal)"
                value={calories} onChange={(e) => setCalories(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="input-glass" style={{ flex: 1 }} />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="input-glass" style={{ width: 130 }} />
            </div>

            <button onClick={handleAdd} disabled={!calories || !label.trim()} className="tap" style={{
              border: 'none', borderRadius: 14, padding: '14px',
              background: calories && label.trim() ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
              color: '#fff', fontWeight: 700, fontSize: 14,
              opacity: calories && label.trim() ? 1 : 0.4,
            }}>Enregistrer</button>
          </div>
        </div>
      )}

      {/* Entries */}
      {dayEntries.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 16 }}>
          <div style={{ fontSize: 10.5, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.12, marginBottom: 2 }}>Entrées du jour</div>
          {dayEntries.map((e) => {
            const mealColor = e.meal ? MEAL_COLORS[e.meal] : 'var(--primary)';
            return (
              <div key={e.id} className="glass" style={{
                borderRadius: 14, padding: '10px 14px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderLeft: `3px solid ${e.type === 'in' ? mealColor : 'var(--secondary)'}`,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{e.label}</div>
                  {e.meal && (
                    <div style={{ fontSize: 10.5, color: mealColor, marginTop: 1, fontWeight: 600 }}>{MEAL_LABELS[e.meal]}</div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="t-num" style={{ fontSize: 15, color: e.type === 'out' ? 'var(--secondary)' : 'var(--primary)', fontWeight: 700 }}>
                    {e.type === 'out' ? '−' : '+'}{e.calories}
                  </span>
                  <button onClick={() => deleteEntry(e.id)} className="tap" style={{ background: 'none', border: 'none', color: 'var(--text-mute)', padding: '2px 4px' }}>
                    <Icons.Trash size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RoutineTab({ today, showToast }: { today: string; showToast: DailyProps['showToast'] }) {
  const { items, completions, toggleItem, addItem, deleteItem, getCompletion, getStreak } = useRoutineStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('⭐');
  const [viewDate, setViewDate] = useState(today);

  const completion = getCompletion(viewDate);
  const checkedIds = completion?.completedItemIds || [];
  const streak = getStreak();
  const doneCount = checkedIds.length;
  const totalCount = items.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const isFullDone = doneCount === totalCount && totalCount > 0;

  const weekHistory = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const comp = completions.find((c) => c.date === dateStr);
      const done = comp?.completedItemIds.length || 0;
      return { date: dateStr, done, total: items.length, label: d.toLocaleDateString('fr-FR', { weekday: 'short' }) };
    }).reverse();
  }, [completions, items]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addItem(newName.trim(), newEmoji);
    setNewName('');
    setNewEmoji('⭐');
    setShowAddForm(false);
    showToast('Habitude ajoutée', 'success');
  };

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 24 }}>
      {/* Date selector */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="date" value={viewDate} onChange={(e) => setViewDate(e.target.value)} className="input-glass" style={{ flex: 1 }} />
        {viewDate !== today && (
          <button onClick={() => setViewDate(today)} className="tap" style={{
            background: 'rgba(255,107,53,0.12)', border: 'none', borderRadius: 10, padding: '10px 14px',
            color: 'var(--primary)', fontSize: 12, fontWeight: 700,
          }}>Aujourd'hui</button>
        )}
      </div>

      {/* Progress card */}
      <div className="glass" style={{
        borderRadius: 22, padding: '16px 16px',
        border: isFullDone ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.06)',
        background: isFullDone ? 'rgba(34,197,94,0.06)' : undefined,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.12, marginBottom: 2 }}>Routine du soir</div>
            <div className="t-num" style={{ fontSize: 36, color: isFullDone ? 'var(--ok)' : 'var(--primary)', lineHeight: 1 }}>
              {doneCount}<span style={{ fontSize: 20, color: 'var(--text-mute)', fontWeight: 400 }}>/{totalCount}</span>
            </div>
          </div>
          {streak > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                <Icons.Flame size={16} color="var(--primary)" />
                <span className="t-num" style={{ fontSize: 28, color: 'var(--primary)' }}>{streak}</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-mute)' }}>jours consécutifs</div>
            </div>
          )}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 999, height: 6, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{
            height: '100%', borderRadius: 999, transition: 'width 0.4s ease',
            width: `${pct}%`,
            background: isFullDone ? 'var(--ok)' : 'linear-gradient(90deg, var(--primary), var(--secondary))',
          }} />
        </div>
        {isFullDone && (
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ok)', fontWeight: 700, marginTop: 4 }}>
            Routine complète ! GG
          </div>
        )}
      </div>

      {/* 7-day history */}
      <div className="glass" style={{ borderRadius: 22, padding: '14px 16px' }}>
        <div style={{ fontSize: 10.5, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.12, marginBottom: 10 }}>7 derniers jours</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 5 }}>
          {weekHistory.map((d) => {
            const full = d.total > 0 && d.done === d.total;
            const partial = d.done > 0 && !full;
            return (
              <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  background: full ? 'var(--ok)' : partial ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.05)',
                  color: full ? '#fff' : partial ? 'var(--primary)' : 'var(--text-faint)',
                }}>
                  {full ? <Icons.Check size={14} /> : d.done > 0 ? d.done : '·'}
                </div>
                <span style={{ fontSize: 9, color: d.date === today ? 'var(--primary)' : 'var(--text-faint)', fontWeight: d.date === today ? 700 : 400 }}>
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.sort((a, b) => a.order - b.order).map((item) => {
          const checked = checkedIds.includes(item.id);
          return (
            <button key={item.id} onClick={() => toggleItem(viewDate, item.id)} className="tap" style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', borderRadius: 16, border: 'none', textAlign: 'left',
              background: checked ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)',
              outline: checked ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(255,255,255,0.06)',
              transition: 'background 0.2s',
              touchAction: 'manipulation',
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                border: checked ? 'none' : '2px solid rgba(255,255,255,0.2)',
                background: checked ? 'var(--ok)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}>
                {checked && <Icons.Check size={12} color="#fff" />}
              </div>
              <span style={{ fontSize: 18 }}>{item.emoji}</span>
              <span style={{
                flex: 1, fontSize: 14, fontWeight: 600,
                color: checked ? 'var(--text-mute)' : 'var(--text)',
                textDecoration: checked ? 'line-through' : 'none',
              }}>{item.name}</span>
              <button onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Supprimer "${item.name}" ?`)) deleteItem(item.id);
              }} className="tap" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', padding: '2px 4px' }}>
                <Icons.X size={14} />
              </button>
            </button>
          );
        })}
      </div>

      {/* Add item */}
      {!showAddForm ? (
        <button onClick={() => setShowAddForm(true)} className="tap" style={{
          width: '100%', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 16,
          padding: '14px', background: 'none', color: 'var(--text-mute)', fontSize: 13, fontWeight: 600,
        }}>+ Ajouter une habitude</button>
      ) : (
        <div className="glass" style={{ borderRadius: 18, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" placeholder="😴" value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value)}
              className="input-glass" style={{ width: 56, textAlign: 'center', fontSize: 18 }} />
            <div style={{ flex: 1, position: 'relative' }}>
              <input type="text" placeholder="Nom de l'habitude" value={newName}
                onChange={(e) => setNewName(e.target.value.slice(0, 15))}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                maxLength={15}
                autoFocus className="input-glass" style={{ width: '100%', paddingRight: 44 }} />
              <span style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                fontSize: 12, fontWeight: 800,
                padding: '3px 8px', borderRadius: 8, lineHeight: 1,
                background: newName.length >= 13 ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.08)',
                color: newName.length >= 13 ? 'var(--primary)' : 'var(--text-soft)',
                pointerEvents: 'none',
              }}>{15 - newName.length}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowAddForm(false)} className="tap" style={{
              flex: 1, background: 'none', border: 'none', color: 'var(--text-mute)', padding: '10px', fontSize: 13, fontWeight: 600,
            }}>Annuler</button>
            <button onClick={handleAdd} disabled={!newName.trim()} className="tap" style={{
              flex: 1, border: 'none', borderRadius: 12, padding: '10px',
              background: newName.trim() ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
              color: '#fff', fontWeight: 700, fontSize: 13, opacity: newName.trim() ? 1 : 0.4,
            }}>Ajouter</button>
          </div>
        </div>
      )}
    </div>
  );
}
