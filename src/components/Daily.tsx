import { useState, useMemo } from 'react';
import { useCalorieStore } from '../stores/calorieStore';
import { useRoutineStore } from '../stores/routineStore';
import { getDateString } from '../utils/export';
import type { MealType } from '../types';

type Tab = 'calories' | 'routine';

const MEAL_LABELS: Record<MealType, string> = {
  'petit-dej': '🌅 Petit-déj',
  dejeuner: '☀️ Déjeuner',
  diner: '🌙 Dîner',
  collation: '🍎 Collation',
};

const MEAL_COLORS: Record<MealType, string> = {
  'petit-dej': 'text-yellow-400',
  dejeuner: 'text-orange-400',
  diner: 'text-blue-400',
  collation: 'text-green-400',
};

interface DailyProps {
  showToast: (msg: string, type?: 'success' | 'info' | 'record') => void;
}

export default function Daily({ showToast }: DailyProps) {
  const [tab, setTab] = useState<Tab>('calories');
  const today = getDateString();

  return (
    <div className="pb-28">
      <div className="p-4 pb-0">
        <h2 className="text-xl font-black text-primary">🌙 DAILY</h2>
        <div className="flex gap-1 bg-dark rounded-xl p-1 mt-3">
          <button
            onClick={() => setTab('calories')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${tab === 'calories' ? 'bg-primary text-dark' : 'text-gray-400'}`}
          >
            🍽️ Calories
          </button>
          <button
            onClick={() => setTab('routine')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${tab === 'routine' ? 'bg-primary text-dark' : 'text-gray-400'}`}
          >
            🌙 Routine soir
          </button>
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
    const days = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(d);
      day.setDate(d.getDate() - i);
      const dateStr = day.toISOString().split('T')[0];
      const s = getDayStats(dateStr);
      return {
        date: dateStr,
        label: day.toLocaleDateString('fr-FR', { weekday: 'short' }),
        in: s.in,
        out: s.out,
      };
    }).reverse();
    return days;
  }, [entries]);

  const maxCalories = Math.max(...weekStats.map((d) => d.in), calorieGoal);

  const handleAdd = async () => {
    const cal = parseInt(calories);
    if (isNaN(cal) || cal <= 0 || !label.trim()) return;
    await addEntry(cal, label.trim(), type, date, type === 'in' ? meal : undefined);
    setCalories('');
    setLabel('');
    setShowForm(false);
    showToast(`${type === 'in' ? '🍽️' : '🔥'} ${cal} kcal enregistré`, 'success');
  };

  return (
    <div className="p-4 space-y-4">
      {/* Date selector */}
      <div className="flex gap-2 items-center">
        <input
          type="date"
          value={viewDate}
          onChange={(e) => setViewDate(e.target.value)}
          className="flex-1 bg-dark border border-primary/30 rounded-lg px-3 py-2 text-sm text-text-light focus:outline-none focus:border-primary"
        />
        {viewDate !== today && (
          <button onClick={() => setViewDate(today)} className="text-xs text-primary font-bold px-3 py-2 bg-primary/10 rounded-lg">
            Aujourd'hui
          </button>
        )}
      </div>

      {/* Day summary */}
      <div className="bg-dark border border-primary/20 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold">Calories ingérées</p>
            <p className="text-3xl font-black text-primary">{dayStats.in} <span className="text-sm text-gray-500 font-normal">kcal</span></p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase font-bold">Objectif</p>
            <button onClick={() => setShowGoalForm(!showGoalForm)} className="text-lg font-black text-gray-400 hover:text-primary transition">
              {calorieGoal} kcal
            </button>
          </div>
        </div>

        {showGoalForm && (
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              className="flex-1 bg-bg-dark border border-primary/40 rounded-lg px-3 py-1.5 text-sm text-text-light focus:outline-none focus:border-primary"
            />
            <button
              onClick={() => { setGoal(parseInt(goalInput)); setShowGoalForm(false); showToast('Objectif mis à jour ✅', 'success'); }}
              className="bg-primary text-dark px-3 py-1.5 rounded-lg font-bold text-sm"
            >✓</button>
          </div>
        )}

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="w-full h-2.5 bg-bg-dark rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${progressPct > 100 ? 'bg-secondary' : 'bg-gradient-to-r from-primary to-orange-400'}`}
              style={{ width: `${Math.min(progressPct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>{progressPct}%</span>
            <span className={remaining < 0 ? 'text-secondary' : 'text-gray-400'}>
              {remaining >= 0 ? `${remaining} kcal restantes` : `${Math.abs(remaining)} kcal dépassées`}
            </span>
          </div>
        </div>

        {dayStats.out > 0 && (
          <div className="flex justify-between text-xs pt-1 border-t border-primary/10">
            <span className="text-gray-500">🔥 Dépensées</span>
            <span className="text-orange-400 font-bold">−{dayStats.out} kcal</span>
          </div>
        )}
        {dayStats.out > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Net</span>
            <span className={`font-black ${dayStats.net > calorieGoal ? 'text-secondary' : 'text-green-400'}`}>
              {dayStats.net} kcal
            </span>
          </div>
        )}
      </div>

      {/* Weekly bar chart */}
      <div className="bg-dark border border-primary/20 rounded-xl p-4">
        <p className="text-[10px] text-gray-500 uppercase font-bold mb-3">7 derniers jours</p>
        <div className="flex items-end gap-1 h-16">
          {weekStats.map((d) => {
            const h = d.in > 0 ? Math.max(8, Math.round((d.in / maxCalories) * 64)) : 4;
            const isToday = d.date === today;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end" style={{ height: '56px' }}>
                  <div
                    className={`w-full rounded-t-md transition-all ${isToday ? 'bg-primary' : 'bg-primary/30'}`}
                    style={{ height: `${h}px` }}
                  />
                </div>
                <span className={`text-[9px] ${isToday ? 'text-primary font-bold' : 'text-gray-600'}`}>{d.label}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 border-t border-primary/10 pt-2 flex justify-end">
          <div className="flex items-center gap-1 text-[10px] text-gray-600">
            <div className="w-3 h-0.5 border-dashed border-t border-gray-600" />
            Objectif {calorieGoal} kcal
          </div>
        </div>
      </div>

      {/* Add button */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3.5 rounded-xl font-bold active:scale-95 transition"
        >
          + Enregistrer des calories
        </button>
      ) : (
        <div className="bg-dark border border-primary/30 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-primary text-sm">Nouvelle entrée</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 text-sm">✕</button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setType('in')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${type === 'in' ? 'bg-primary text-dark' : 'bg-bg-dark text-gray-400'}`}
            >🍽️ Mangées</button>
            <button
              onClick={() => setType('out')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${type === 'out' ? 'bg-orange-600 text-white' : 'bg-bg-dark text-gray-400'}`}
            >🔥 Dépensées</button>
          </div>

          {type === 'in' && (
            <div className="grid grid-cols-2 gap-1">
              {(Object.entries(MEAL_LABELS) as [MealType, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setMeal(key)}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition ${meal === key ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-bg-dark text-gray-500'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <input
            type="text"
            placeholder={type === 'in' ? 'Ex: Riz + poulet, Pizza...' : 'Ex: Séance muscu, Cardio...'}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full bg-bg-dark border border-primary/40 rounded-lg px-3 py-2 text-sm text-text-light focus:outline-none focus:border-primary"
          />

          <div className="flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="Calories (kcal)"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="flex-1 bg-bg-dark border border-primary/40 rounded-lg px-3 py-2 text-primary font-bold focus:outline-none focus:border-primary"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-bg-dark border border-primary/40 rounded-lg px-2 py-2 text-xs text-text-light"
            />
          </div>

          <button
            onClick={handleAdd}
            disabled={!calories || !label.trim()}
            className="w-full bg-primary text-dark py-2.5 rounded-lg font-black disabled:opacity-30"
          >✓ Enregistrer</button>
        </div>
      )}

      {/* Day entries */}
      {dayEntries.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-gray-500 uppercase font-bold">Entrées du jour</p>
          {dayEntries.map((e) => (
            <div key={e.id} className="bg-dark border border-primary/10 rounded-xl px-3 py-2.5 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${e.type === 'in' ? (e.meal ? MEAL_COLORS[e.meal] : 'text-primary') : 'text-orange-400'}`}>
                    {e.type === 'in' ? (e.meal ? MEAL_LABELS[e.meal].split(' ')[0] : '🍽️') : '🔥'}
                  </span>
                  <p className="text-sm text-gray-300">{e.label}</p>
                </div>
                {e.meal && <p className="text-[10px] text-gray-600 ml-5">{MEAL_LABELS[e.meal]}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-black text-sm ${e.type === 'out' ? 'text-orange-400' : 'text-primary'}`}>
                  {e.type === 'out' ? '−' : '+'}{e.calories}
                </span>
                <button onClick={() => deleteEntry(e.id)} className="text-secondary/60 text-sm hover:text-secondary">🗑️</button>
              </div>
            </div>
          ))}
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
    showToast('Habitude ajoutée ✅', 'success');
  };

  return (
    <div className="p-4 space-y-4">
      {/* Date selector */}
      <div className="flex gap-2 items-center">
        <input
          type="date"
          value={viewDate}
          onChange={(e) => setViewDate(e.target.value)}
          className="flex-1 bg-dark border border-primary/30 rounded-lg px-3 py-2 text-sm text-text-light focus:outline-none focus:border-primary"
        />
        {viewDate !== today && (
          <button onClick={() => setViewDate(today)} className="text-xs text-primary font-bold px-3 py-2 bg-primary/10 rounded-lg">
            Aujourd'hui
          </button>
        )}
      </div>

      {/* Summary */}
      <div className={`border rounded-xl p-4 space-y-2 ${isFullDone ? 'bg-green-500/10 border-green-500/30' : 'bg-dark border-primary/20'}`}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold">Routine du soir</p>
            <p className="text-2xl font-black text-primary">{doneCount}<span className="text-gray-500 font-normal text-base"> / {totalCount}</span></p>
          </div>
          <div className="text-right">
            {streak > 0 && (
              <div>
                <p className="text-2xl font-black text-orange-400">🔥{streak}</p>
                <p className="text-[10px] text-gray-500">jours consécutifs</p>
              </div>
            )}
          </div>
        </div>
        <div className="w-full h-2 bg-bg-dark rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isFullDone ? 'bg-green-500' : 'bg-gradient-to-r from-primary to-secondary'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {isFullDone && <p className="text-xs text-green-400 font-bold text-center">✅ Routine complète ! GG</p>}
      </div>

      {/* Week view */}
      <div className="bg-dark border border-primary/20 rounded-xl p-3">
        <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">7 derniers jours</p>
        <div className="flex justify-between gap-1">
          {weekHistory.map((d) => {
            const full = d.total > 0 && d.done === d.total;
            const partial = d.done > 0 && !full;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                  full ? 'bg-green-500 text-white' : partial ? 'bg-primary/40 text-primary' : 'bg-bg-dark text-gray-700'
                }`}>
                  {full ? '✓' : d.done > 0 ? d.done : '·'}
                </div>
                <span className={`text-[9px] ${d.date === today ? 'text-primary font-bold' : 'text-gray-600'}`}>{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {items
          .sort((a, b) => a.order - b.order)
          .map((item) => {
            const checked = checkedIds.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggleItem(viewDate, item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition active:scale-98 ${
                  checked
                    ? 'bg-green-500/10 border-green-500/40'
                    : 'bg-dark border-primary/20 hover:border-primary/40'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                  checked ? 'bg-green-500 border-green-500' : 'border-gray-600'
                }`}>
                  {checked && <span className="text-white text-xs font-black">✓</span>}
                </div>
                <span className="text-xl">{item.emoji}</span>
                <span className={`flex-1 text-left text-sm font-semibold ${checked ? 'text-gray-400 line-through' : 'text-text-light'}`}>
                  {item.name}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); if (confirm(`Supprimer "${item.name}" ?`)) deleteItem(item.id); }}
                  className="text-gray-700 hover:text-secondary text-xs p-1 transition"
                >✕</button>
              </button>
            );
          })}
      </div>

      {/* Add item */}
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full border border-dashed border-primary/30 text-gray-400 hover:text-primary hover:border-primary/60 py-3 rounded-xl text-sm transition"
        >
          + Ajouter une habitude
        </button>
      ) : (
        <div className="bg-dark border border-primary/20 rounded-xl p-3 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Emoji"
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value)}
              className="w-14 bg-bg-dark border border-primary/40 rounded-lg px-2 py-2 text-center text-xl focus:outline-none"
            />
            <input
              type="text"
              placeholder="Nom de l'habitude"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              autoFocus
              className="flex-1 bg-bg-dark border border-primary/40 rounded-lg px-3 py-2 text-sm text-text-light focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAddForm(false)} className="flex-1 text-gray-400 py-2 text-sm rounded-lg">Annuler</button>
            <button onClick={handleAdd} disabled={!newName.trim()} className="flex-1 bg-primary text-dark py-2 rounded-lg font-bold text-sm disabled:opacity-30">
              Ajouter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
