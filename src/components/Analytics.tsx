import { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import { useSessionStore } from '../stores/sessionStore';
import { useCardioStore } from '../stores/cardioStore';
import { useBodyWeightStore } from '../stores/bodyweightStore';

type Tab = 'muscle' | 'cardio' | 'bodyweight';

const CUSTOM_TOOLTIP = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark border border-primary/40 rounded-lg px-3 py-2 text-xs">
        <p className="text-primary font-bold">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.value} {p.name}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const { sessions } = useSessionStore();
  const { courses, natations } = useCardioStore();
  const { weights } = useBodyWeightStore();

  const [tab, setTab] = useState<Tab>('muscle');
  const [selectedExercise, setSelectedExercise] = useState('');

  const allExercises = useMemo(() => {
    const s = new Set<string>();
    sessions.forEach((sess) => sess.exercises.forEach((ex) => s.add(ex.exerciseName)));
    return Array.from(s).sort();
  }, [sessions]);

  const exerciseData = useMemo(() => {
    if (!selectedExercise) return null;
    const history: Record<string, { weights: number[]; reps: number[] }> = {};
    sessions.forEach((sess) => {
      sess.exercises.forEach((ex) => {
        if (ex.exerciseName === selectedExercise) {
          if (!history[sess.date]) history[sess.date] = { weights: [], reps: [] };
          ex.sets.forEach((s) => {
            history[sess.date].weights.push(s.weight);
            history[sess.date].reps.push(s.reps);
          });
        }
      });
    });

    const data = Object.entries(history)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { weights: ws, reps }]) => {
        const maxW = Math.max(...ws);
        const maxR = Math.max(...reps);
        const d = new Date(date + 'T00:00:00');
        return {
          date: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
          weight: maxW,
          reps: maxR,
          oneRM: Math.round(maxW * (1 + maxR / 30)),
        };
      });

    const allWeights = data.map((d) => d.weight);
    const maxW = Math.max(...allWeights);
    const progressKg = data.length >= 2 ? data[data.length - 1].weight - data[0].weight : 0;
    const maxOneRM = Math.max(...data.map((d) => d.oneRM));

    return { data, stats: { max: maxW, count: data.length, progressKg, maxOneRM } };
  }, [sessions, selectedExercise]);

  const cardioData = useMemo(() => {
    const courseChart = [...courses]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((c) => ({
        date: new Date(c.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        distance: c.distance,
        pace: c.distance > 0 ? parseFloat((c.time / c.distance).toFixed(2)) : 0,
      }));

    const natChart = [...natations]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((n) => ({
        date: new Date(n.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        distance: n.distance,
        pace: n.distance > 0 ? parseFloat((n.time / (n.distance / 100)).toFixed(2)) : 0,
      }));

    return { courseChart, natChart };
  }, [courses, natations]);

  const weightChart = useMemo(() => {
    return [...weights]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((w) => ({
        date: new Date(w.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        weight: w.weight,
      }));
  }, [weights]);

  const globalStats = useMemo(() => {
    const totalVolume = sessions.reduce(
      (sum, sess) =>
        sum + sess.exercises.reduce(
          (es, ex) => es + ex.sets.reduce((ss, s) => ss + s.weight * s.reps, 0), 0
        ), 0
    );
    return {
      totalSessions: sessions.length,
      totalVolume,
      totalCourseKm: courses.reduce((s, c) => s + c.distance, 0),
      totalNatM: natations.reduce((s, n) => s + n.distance, 0),
    };
  }, [sessions, courses, natations]);

  return (
    <div className="p-4 pb-28 space-y-4">
      <h2 className="text-xl font-black text-primary">📈 ANALYTIQUES</h2>

      {/* Global stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-dark border border-primary/20 rounded-xl p-3">
          <p className="text-[10px] text-gray-500 uppercase">Séances</p>
          <p className="text-2xl font-black text-primary">{globalStats.totalSessions}</p>
        </div>
        <div className="bg-dark border border-primary/20 rounded-xl p-3">
          <p className="text-[10px] text-gray-500 uppercase">Volume total</p>
          <p className="text-2xl font-black text-primary">
            {(globalStats.totalVolume / 1000).toFixed(1)}
            <span className="text-sm font-normal text-gray-500">k kg</span>
          </p>
        </div>
        <div className="bg-dark border border-primary/20 rounded-xl p-3">
          <p className="text-[10px] text-gray-500 uppercase">Course</p>
          <p className="text-2xl font-black text-primary">
            {globalStats.totalCourseKm.toFixed(1)}
            <span className="text-sm font-normal text-gray-500"> km</span>
          </p>
        </div>
        <div className="bg-dark border border-primary/20 rounded-xl p-3">
          <p className="text-[10px] text-gray-500 uppercase">Natation</p>
          <p className="text-2xl font-black text-primary">
            {globalStats.totalNatM}
            <span className="text-sm font-normal text-gray-500"> m</span>
          </p>
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 bg-dark rounded-xl p-1">
        {(['muscle', 'cardio', 'bodyweight'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
              tab === t ? 'bg-primary text-dark' : 'text-gray-400'
            }`}
          >
            {t === 'muscle' ? '🏋️ Muscu' : t === 'cardio' ? '🏃 Cardio' : '⚖️ Poids'}
          </button>
        ))}
      </div>

      {/* MUSCLE TAB */}
      {tab === 'muscle' && (
        <div className="space-y-3">
          <div className="bg-dark border border-primary/20 rounded-xl p-3">
            <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Exercice</label>
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="w-full bg-bg-dark border border-primary/30 rounded-lg px-3 py-2 text-text-light text-sm focus:outline-none focus:border-primary"
            >
              <option value="">-- Choisir un exercice --</option>
              {allExercises.map((ex) => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
          </div>

          {selectedExercise && exerciseData && exerciseData.data.length > 0 && (
            <>
              <div className="grid grid-cols-4 gap-1.5">
                <div className="bg-dark border border-primary/20 rounded-xl p-2 text-center">
                  <p className="text-[10px] text-gray-500">Max</p>
                  <p className="text-base font-black text-primary">{exerciseData.stats.max}kg</p>
                </div>
                <div className="bg-dark border border-primary/20 rounded-xl p-2 text-center">
                  <p className="text-[10px] text-gray-500">1RM est.</p>
                  <p className="text-base font-black text-primary">{exerciseData.stats.maxOneRM}kg</p>
                </div>
                <div className="bg-dark border border-primary/20 rounded-xl p-2 text-center">
                  <p className="text-[10px] text-gray-500">Progrès</p>
                  <p className={`text-base font-black ${exerciseData.stats.progressKg >= 0 ? 'text-green-400' : 'text-secondary'}`}>
                    {exerciseData.stats.progressKg >= 0 ? '+' : ''}{exerciseData.stats.progressKg}kg
                  </p>
                </div>
                <div className="bg-dark border border-primary/20 rounded-xl p-2 text-center">
                  <p className="text-[10px] text-gray-500">Sessions</p>
                  <p className="text-base font-black text-primary">{exerciseData.stats.count}</p>
                </div>
              </div>

              <div className="bg-dark border border-primary/20 rounded-xl p-3">
                <p className="text-xs text-gray-500 font-bold mb-3 uppercase">Poids max par séance (kg)</p>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={exerciseData.data}>
                    <defs>
                      <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#666" style={{ fontSize: '10px' }} />
                    <YAxis stroke="#666" style={{ fontSize: '10px' }} domain={['auto', 'auto']} />
                    <Tooltip content={<CUSTOM_TOOLTIP />} />
                    <Area
                      type="monotone"
                      dataKey="weight"
                      name="kg"
                      stroke="#FF6B35"
                      fill="url(#weightGrad)"
                      strokeWidth={2}
                      dot={{ fill: '#FF6B35', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {exerciseData.stats.progressKg > 0 && (
                <div className="bg-dark border border-green-500/30 rounded-xl p-3 text-xs text-green-400">
                  📈 +{exerciseData.stats.progressKg}kg sur {exerciseData.stats.count} séances — belle progression !
                </div>
              )}
            </>
          )}

          {allExercises.length === 0 && (
            <div className="bg-dark border border-primary/10 rounded-xl p-6 text-center text-gray-500 text-sm">
              Lance des séances pour voir tes stats !
            </div>
          )}
        </div>
      )}

      {/* CARDIO TAB */}
      {tab === 'cardio' && (
        <div className="space-y-3">
          {cardioData.courseChart.length > 0 && (
            <div className="bg-dark border border-primary/20 rounded-xl p-3">
              <p className="text-xs text-gray-500 font-bold mb-3 uppercase">Course — Distance (km)</p>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={cardioData.courseChart}>
                  <defs>
                    <linearGradient id="courseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#666" style={{ fontSize: '10px' }} />
                  <YAxis stroke="#666" style={{ fontSize: '10px' }} />
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                  <Area type="monotone" dataKey="distance" name="km" stroke="#60a5fa" fill="url(#courseGrad)" strokeWidth={2} dot={{ fill: '#60a5fa', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {cardioData.courseChart.length > 0 && (
            <div className="bg-dark border border-primary/20 rounded-xl p-3">
              <p className="text-xs text-gray-500 font-bold mb-3 uppercase">Allure course (min/km)</p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={cardioData.courseChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#666" style={{ fontSize: '10px' }} />
                  <YAxis stroke="#666" style={{ fontSize: '10px' }} reversed />
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                  <Line type="monotone" dataKey="pace" name="min/km" stroke="#FF6B35" strokeWidth={2} dot={{ fill: '#FF6B35', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {cardioData.natChart.length > 0 && (
            <div className="bg-dark border border-primary/20 rounded-xl p-3">
              <p className="text-xs text-gray-500 font-bold mb-3 uppercase">Natation — Distance (m)</p>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={cardioData.natChart}>
                  <defs>
                    <linearGradient id="natGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#666" style={{ fontSize: '10px' }} />
                  <YAxis stroke="#666" style={{ fontSize: '10px' }} />
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                  <Area type="monotone" dataKey="distance" name="m" stroke="#22d3ee" fill="url(#natGrad)" strokeWidth={2} dot={{ fill: '#22d3ee', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {cardioData.courseChart.length === 0 && cardioData.natChart.length === 0 && (
            <div className="bg-dark border border-primary/10 rounded-xl p-6 text-center text-gray-500 text-sm">
              Ajoute des sorties course/natation pour voir tes stats !
            </div>
          )}
        </div>
      )}

      {/* BODYWEIGHT TAB */}
      {tab === 'bodyweight' && (
        <div className="space-y-3">
          {weightChart.length >= 2 ? (
            <>
              <div className="bg-dark border border-primary/20 rounded-xl p-3">
                <p className="text-xs text-gray-500 font-bold mb-3 uppercase">Poids corporel (kg)</p>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={weightChart}>
                    <defs>
                      <linearGradient id="weightBodyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C41E3A" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#C41E3A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#666" style={{ fontSize: '10px' }} />
                    <YAxis stroke="#666" style={{ fontSize: '10px' }} domain={['auto', 'auto']} />
                    <Tooltip content={<CUSTOM_TOOLTIP />} />
                    <Area type="monotone" dataKey="weight" name="kg" stroke="#C41E3A" fill="url(#weightBodyGrad)" strokeWidth={2} dot={{ fill: '#C41E3A', r: 3 }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {(() => {
                const first = weightChart[0].weight;
                const last = weightChart[weightChart.length - 1].weight;
                const diff = last - first;
                const min = Math.min(...weightChart.map((w) => w.weight));
                return (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-dark border border-primary/20 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-gray-500">Actuel</p>
                      <p className="text-lg font-black text-primary">{last}kg</p>
                    </div>
                    <div className="bg-dark border border-primary/20 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-gray-500">Min</p>
                      <p className="text-lg font-black text-green-400">{min}kg</p>
                    </div>
                    <div className="bg-dark border border-primary/20 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-gray-500">Évolution</p>
                      <p className={`text-lg font-black ${diff <= 0 ? 'text-green-400' : 'text-secondary'}`}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(1)}kg
                      </p>
                    </div>
                  </div>
                );
              })()}
            </>
          ) : weightChart.length === 1 ? (
            <div className="bg-dark border border-primary/20 rounded-xl p-4 text-center">
              <p className="text-3xl font-black text-primary">{weightChart[0].weight} kg</p>
              <p className="text-xs text-gray-500 mt-1">Ajoute d'autres mesures pour voir la courbe</p>
            </div>
          ) : (
            <div className="bg-dark border border-primary/10 rounded-xl p-6 text-center text-gray-500 text-sm">
              Enregistre ton poids depuis le dashboard pour voir la courbe !
            </div>
          )}
        </div>
      )}
    </div>
  );
}
