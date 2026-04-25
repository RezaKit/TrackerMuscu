import { useMemo, useState } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { useCardioStore } from '../stores/cardioStore';
import { useBodyWeightStore } from '../stores/bodyweightStore';
import { getPersonalRecords } from '../utils/records';
import { exportAllToCSV, downloadCSV, getDateString, formatDate } from '../utils/export';
import { exportWeekAsText, downloadText } from '../utils/weekExport';
import { getDaysUntilRace, getCurrentWeek, PLAN } from '../utils/runningPlan';
import { useCalorieStore } from '../stores/calorieStore';
import { useRoutineStore } from '../stores/routineStore';

interface DashboardProps {
  onNewSession: () => void;
  onGoToCardio: () => void;
  onGoToDaily: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'record') => void;
}

const TYPE_COLORS: Record<string, string> = {
  push: 'bg-orange-500',
  pull: 'bg-red-600',
  legs: 'bg-gray-700',
  upper: 'bg-orange-600',
  lower: 'bg-red-700',
};

const TYPE_LABELS: Record<string, string> = {
  push: 'Push', pull: 'Pull', legs: 'Legs', upper: 'Upper', lower: 'Lower',
};

export default function Dashboard({ onNewSession, onGoToCardio, onGoToDaily, showToast }: DashboardProps) {
  const { sessions } = useSessionStore();
  const { courses, natations } = useCardioStore();
  const { weights, addWeight } = useBodyWeightStore();
  const { getDayStats, calorieGoal } = useCalorieStore();
  const { getCompletion, items: routineItems, getStreak: getRoutineStreak } = useRoutineStore();
  const [weightInput, setWeightInput] = useState('');
  const [showWeightForm, setShowWeightForm] = useState(false);

  const weekStats = useMemo(() => {
    const today = getDateString();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStart = getDateString(weekAgo);
    const weekSessions = sessions.filter((s) => s.date >= weekStart && s.date <= today);
    const weekCourses = courses.filter((c) => c.date >= weekStart && c.date <= today);
    const weekNatations = natations.filter((n) => n.date >= weekStart && n.date <= today);
    return {
      muscu: weekSessions.length,
      courseDistance: weekCourses.reduce((s, c) => s + c.distance, 0),
      courseCount: weekCourses.length,
      natationDistance: weekNatations.reduce((s, n) => s + n.distance, 0),
      natationCount: weekNatations.length,
    };
  }, [sessions, courses, natations]);

  const records = useMemo(() => getPersonalRecords(sessions).slice(0, 3), [sessions]);
  const latestWeight = weights.length > 0 ? weights[weights.length - 1] : null;
  const weightTrend = useMemo(() => {
    if (weights.length < 2) return 0;
    return weights[weights.length - 1].weight - weights[weights.length - 2].weight;
  }, [weights]);

  const todaySessions = useMemo(() => {
    const today = getDateString();
    return sessions.filter((s) => s.date === today);
  }, [sessions]);

  const currentStreak = useMemo(() => {
    if (sessions.length === 0) return 0;
    const allActivities = [
      ...sessions.map((s) => s.date),
      ...courses.map((c) => c.date),
      ...natations.map((n) => n.date),
    ];
    const sortedDates = Array.from(new Set(allActivities)).sort((a, b) => b.localeCompare(a));
    let streak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffDays = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 2) streak++;
      else break;
    }
    return streak;
  }, [sessions, courses, natations]);

  const handleAddWeight = async () => {
    const value = parseFloat(weightInput);
    if (!isNaN(value) && value > 0) {
      await addWeight(value);
      setWeightInput('');
      setShowWeightForm(false);
      showToast('Poids enregistré ✅', 'success');
    }
  };

  const handleExportCSV = async () => {
    const csv = exportAllToCSV(sessions, courses, natations, weights);
    downloadCSV(csv, `tracker-${getDateString()}.csv`);
    showToast('Export CSV téléchargé 📥', 'success');
  };

  const { entries: calorieEntries } = useCalorieStore();
  const { completions: routineCompletions, items: routineItemsFull } = useRoutineStore();

  const handleExportWeek = () => {
    const text = exportWeekAsText(sessions, courses, natations, weights, calorieEntries, routineCompletions, routineItemsFull);
    const today = new Date();
    const filename = `semaine-${today.toISOString().split('T')[0]}.txt`;
    downloadText(text, filename);
    showToast('Résumé semaine exporté 📄', 'success');
  };

  const daysUntilRace = getDaysUntilRace();
  const currentWeek = getCurrentWeek();
  const currentPlanWeek = currentWeek >= 1 && currentWeek <= PLAN.length ? PLAN[currentWeek - 1] : null;

  const todayCalories = getDayStats(getDateString());
  const todayRoutine = getCompletion(getDateString());
  const routineChecked = todayRoutine?.completedItemIds.length || 0;
  const routineTotal = routineItems.length;
  const routineStreak = getRoutineStreak();

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-primary">TRACKER</h1>
          <p className="text-xs text-gray-500">{formatDate(getDateString())}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportWeek}
            className="text-xs bg-dark text-gray-400 px-2.5 py-2 rounded-lg border border-primary/20 hover:border-primary/60 transition"
          >
            📄 Semaine
          </button>
          <button
            onClick={handleExportCSV}
            className="text-xs bg-dark text-gray-400 px-2.5 py-2 rounded-lg border border-primary/20 hover:border-primary/60 transition"
          >
            📥 CSV
          </button>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onNewSession}
        className="w-full bg-gradient-to-r from-primary to-secondary text-white py-4 rounded-xl font-black text-lg shadow-lg active:scale-95 transition"
      >
        + NOUVELLE SÉANCE
      </button>

      {/* Race countdown */}
      {daysUntilRace > 0 && currentPlanWeek && (
        <div className="bg-dark border border-primary/20 rounded-xl p-3 flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-wide">🏁 Semi-Marathon</p>
            <p className="text-xs text-gray-400">S{currentPlanWeek.week} · {currentPlanWeek.phase} · {currentPlanWeek.longRunKm}km dimanche</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-primary">{daysUntilRace}</p>
            <p className="text-[10px] text-gray-500">jours</p>
          </div>
        </div>
      )}

      {/* Séance du jour */}
      {todaySessions.length > 0 && (
        <div className="bg-dark border border-primary/30 rounded-xl p-4">
          <h2 className="text-xs font-bold text-primary mb-2 uppercase tracking-wide">✅ Aujourd'hui</h2>
          {todaySessions.map((s) => (
            <div key={s.id} className="flex items-center gap-2 text-sm text-gray-300">
              <div className={`w-2.5 h-2.5 rounded-full ${TYPE_COLORS[s.type]}`} />
              <span className="font-semibold">{TYPE_LABELS[s.type]}</span>
              <span className="text-gray-500 text-xs">· {s.exercises.length} exos · {s.exercises.reduce((t, e) => t + e.sets.length, 0)} sets</span>
            </div>
          ))}
        </div>
      )}

      {/* Stats semaine */}
      <div className="bg-dark border border-primary/20 rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xs font-bold text-primary uppercase tracking-wide">📊 7 derniers jours</h2>
          {currentStreak > 1 && (
            <span className="text-xs text-orange-400 font-bold">🔥 {currentStreak}j streak</span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-bg-dark rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-primary">{weekStats.muscu}</p>
            <p className="text-[10px] text-gray-500 uppercase mt-0.5">Muscu</p>
          </div>
          <div className="bg-bg-dark rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-blue-400">
              {weekStats.courseDistance.toFixed(1)}
              <span className="text-xs font-normal text-gray-500">km</span>
            </p>
            <p className="text-[10px] text-gray-500 uppercase mt-0.5">Course ({weekStats.courseCount})</p>
          </div>
          <div className="bg-bg-dark rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-cyan-400">
              {weekStats.natationDistance}
              <span className="text-xs font-normal text-gray-500">m</span>
            </p>
            <p className="text-[10px] text-gray-500 uppercase mt-0.5">Nat. ({weekStats.natationCount})</p>
          </div>
        </div>
      </div>

      {/* Poids corporel */}
      <div className="bg-dark border border-primary/20 rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xs font-bold text-primary uppercase tracking-wide">⚖️ Poids</h2>
          <button
            onClick={() => setShowWeightForm(!showWeightForm)}
            className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-lg font-semibold"
          >
            {showWeightForm ? 'Annuler' : '+ Ajouter'}
          </button>
        </div>

        {latestWeight ? (
          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-black text-primary">{latestWeight.weight} kg</p>
            {weightTrend !== 0 && (
              <span className={`text-sm font-bold ${weightTrend > 0 ? 'text-secondary' : 'text-green-400'}`}>
                {weightTrend > 0 ? '▲' : '▼'} {Math.abs(weightTrend).toFixed(1)} kg
              </span>
            )}
            <span className="text-xs text-gray-500 ml-auto">{formatDate(latestWeight.date)}</span>
          </div>
        ) : (
          !showWeightForm && <p className="text-sm text-gray-500">Aucune mesure enregistrée</p>
        )}

        {showWeightForm && (
          <div className="mt-3 flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              placeholder="Poids (kg)"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddWeight()}
              className="flex-1 bg-bg-dark border border-primary/40 rounded-lg px-3 py-2 text-primary font-bold focus:outline-none focus:border-primary"
              autoFocus
            />
            <button
              onClick={handleAddWeight}
              className="bg-primary text-dark px-4 py-2 rounded-lg font-bold"
            >
              ✓
            </button>
          </div>
        )}
      </div>

      {/* Records */}
      <div className="bg-dark border border-primary/20 rounded-xl p-4">
        <h2 className="text-xs font-bold text-primary mb-3 uppercase tracking-wide">🔥 Records</h2>
        {records.length > 0 ? (
          <div className="space-y-2.5">
            {records.map((r) => (
              <div key={r.exerciseName} className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-gray-200">{r.exerciseName}</p>
                  <p className="text-[10px] text-gray-500">{formatDate(r.date)}</p>
                </div>
                <p className="text-primary font-black text-sm">
                  {r.weight}kg <span className="text-gray-500 text-xs font-normal">× {r.reps}</span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Bats ton premier record 💪</p>
        )}
      </div>

      {/* Daily — calories + routine */}
      <button
        onClick={onGoToDaily}
        className="w-full bg-dark border border-primary/20 rounded-xl p-4 text-left hover:border-primary/40 transition"
      >
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xs font-bold text-primary uppercase tracking-wide">🌙 Daily</h2>
          <span className="text-[10px] text-gray-500">Tap pour gérer →</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-bg-dark rounded-lg p-2.5">
            <p className="text-[10px] text-gray-500 uppercase mb-1">Calories</p>
            <p className="text-lg font-black text-primary">
              {todayCalories.in > 0 ? todayCalories.in : '—'}
              <span className="text-xs font-normal text-gray-500">{todayCalories.in > 0 ? ' kcal' : ''}</span>
            </p>
            {todayCalories.in > 0 && (
              <p className="text-[10px] text-gray-600">/ {calorieGoal} kcal obj.</p>
            )}
          </div>
          <div className="bg-bg-dark rounded-lg p-2.5">
            <p className="text-[10px] text-gray-500 uppercase mb-1">Routine soir</p>
            {routineTotal > 0 ? (
              <>
                <p className="text-lg font-black text-primary">
                  {routineChecked}<span className="text-gray-500 font-normal text-sm">/{routineTotal}</span>
                </p>
                {routineStreak > 0 && <p className="text-[10px] text-orange-400">🔥 {routineStreak}j streak</p>}
              </>
            ) : (
              <p className="text-sm text-gray-600">—</p>
            )}
          </div>
        </div>
      </button>

      {/* Cardio shortcut */}
      <button
        onClick={onGoToCardio}
        className="w-full bg-dark border border-primary/20 text-primary py-3 rounded-xl font-bold hover:border-primary/60 transition text-sm"
      >
        🏃 Ajouter Course / Natation
      </button>
    </div>
  );
}
