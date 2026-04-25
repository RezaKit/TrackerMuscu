import { useMemo } from 'react';
import { useCardioStore } from '../stores/cardioStore';
import { PLAN, getCurrentWeek, getDaysUntilRace, getWeekProgress } from '../utils/runningPlan';

const PHASE_COLORS: Record<string, string> = {
  'Découverte': 'text-blue-400',
  'Fondation': 'text-cyan-400',
  'Construction': 'text-green-400',
  'Endurance': 'text-yellow-400',
  'Spécifique': 'text-orange-400',
  'Peak': 'text-primary',
  'Affûtage': 'text-secondary',
};

const PHASE_BG: Record<string, string> = {
  'Découverte': 'border-blue-400/40 bg-blue-400/5',
  'Fondation': 'border-cyan-400/40 bg-cyan-400/5',
  'Construction': 'border-green-400/40 bg-green-400/5',
  'Endurance': 'border-yellow-400/40 bg-yellow-400/5',
  'Spécifique': 'border-orange-400/40 bg-orange-400/5',
  'Peak': 'border-primary/40 bg-primary/5',
  'Affûtage': 'border-secondary/40 bg-secondary/5',
};

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function RunningProgram() {
  const { courses } = useCardioStore();
  const currentWeek = getCurrentWeek();
  const daysUntilRace = getDaysUntilRace();
  const progress = getWeekProgress();

  const completedWeeks = useMemo(() => {
    const done = new Set<number>();
    for (const week of PLAN) {
      const weekEnd = new Date(week.sundayDate + 'T23:59:59');
      const weekStart = new Date(week.sundayDate);
      weekStart.setDate(weekStart.getDate() - 6);
      const hasCourse = courses.some((c) => {
        const d = new Date(c.date + 'T00:00:00');
        return d >= weekStart && d <= weekEnd;
      });
      if (hasCourse) done.add(week.week);
    }
    return done;
  }, [courses]);

  const raceOver = daysUntilRace === 0;

  return (
    <div className="p-4 pb-28 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-black text-primary">🏁 PROGRAMME</h2>
          <p className="text-xs text-gray-500">Semi-Marathon · 1er Novembre 2026</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-primary">{daysUntilRace}</p>
          <p className="text-[10px] text-gray-500 uppercase">jours restants</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-dark border border-primary/20 rounded-xl p-4 space-y-3">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Semaine {Math.max(1, currentWeek)} / {PLAN.length}</span>
          <span>{progress}% du programme</span>
        </div>
        <div className="w-full h-3 bg-bg-dark rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-600">
          <span>Apr 27</span>
          <span className="text-primary font-bold">🏁 Nov 1</span>
        </div>
      </div>

      {/* Phases legend */}
      <div className="bg-dark border border-primary/10 rounded-xl p-3">
        <div className="grid grid-cols-4 gap-1 text-[10px]">
          {['Découverte', 'Fondation', 'Construction', 'Endurance'].map((p) => (
            <div key={p} className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${PHASE_COLORS[p].replace('text-', 'bg-')}`} />
              <span className="text-gray-500">{p.slice(0, 6)}.</span>
            </div>
          ))}
          {['Spécifique', 'Peak', 'Affûtage'].map((p) => (
            <div key={p} className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${PHASE_COLORS[p].replace('text-', 'bg-')}`} />
              <span className="text-gray-500">{p.slice(0, 6)}.</span>
            </div>
          ))}
        </div>
      </div>

      {/* Current week highlight */}
      {currentWeek >= 1 && currentWeek <= PLAN.length && (() => {
        const w = PLAN[currentWeek - 1];
        const done = completedWeeks.has(w.week);
        return (
          <div className={`border-2 rounded-xl p-4 space-y-2 ${done ? 'border-green-500/50 bg-green-500/5' : 'border-primary bg-primary/5'}`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] text-primary font-bold uppercase tracking-widest">
                  {done ? '✅ Semaine actuelle — Terminée' : '⚡ Semaine actuelle'}
                </p>
                <p className="font-black text-lg text-text-light">Semaine {w.week} · {formatDateShort(w.sundayDate)}</p>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-black ${PHASE_COLORS[w.phase]}`}>{w.longRunKm}</p>
                <p className="text-[10px] text-gray-500">km dimanche</p>
              </div>
            </div>
            <p className={`text-xs font-bold ${PHASE_COLORS[w.phase]}`}>{w.phase}</p>
            <p className="text-xs text-gray-400">{w.description}</p>
            {w.optionalKm && (
              <div className="bg-bg-dark rounded-lg px-3 py-2 text-xs text-gray-400">
                + Option : sortie courte de <span className="text-primary font-bold">{w.optionalKm}km</span> en semaine (mercredi idéalement)
              </div>
            )}
            {w.isPeak && (
              <div className="bg-primary/20 rounded-lg px-3 py-2 text-xs text-primary font-bold text-center">
                🔥 SEMAINE SIMULATION — Va au bout des 21km !
              </div>
            )}
          </div>
        );
      })()}

      {/* Race day card */}
      {raceOver ? (
        <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-5 text-center">
          <p className="text-3xl font-black text-white">🏅 COURSE TERMINÉE !</p>
          <p className="text-white/80 text-sm mt-1">Félicitations pour ton Semi-Marathon</p>
        </div>
      ) : daysUntilRace <= 7 ? (
        <div className="bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-primary">🏁 LA COURSE APPROCHE !</p>
          <p className="text-sm text-gray-300">Semi-Marathon · 1er Novembre · 21.1km</p>
          <p className="text-xs text-gray-500 mt-1">{daysUntilRace} jour{daysUntilRace !== 1 ? 's' : ''} restant{daysUntilRace !== 1 ? 's' : ''}</p>
        </div>
      ) : null}

      {/* Full plan */}
      <div>
        <h3 className="text-xs text-gray-500 uppercase font-bold mb-2">Plan complet — 27 semaines</h3>
        <div className="space-y-1.5">
          {PLAN.map((week) => {
            const isCurrent = week.week === currentWeek;
            const isPast = week.week < currentWeek;
            const done = completedWeeks.has(week.week);

            return (
              <div
                key={week.week}
                className={`rounded-xl border px-3 py-2.5 flex items-center gap-3 transition ${
                  isCurrent
                    ? 'border-primary bg-primary/10'
                    : done
                    ? 'border-green-500/20 bg-green-500/5'
                    : isPast
                    ? 'border-gray-700/30 bg-bg-dark opacity-60'
                    : `${PHASE_BG[week.phase]}`
                }`}
              >
                <div className="text-center min-w-[28px]">
                  {done ? (
                    <span className="text-green-400 text-base">✓</span>
                  ) : week.isPeak ? (
                    <span className="text-base">🔥</span>
                  ) : week.isRecovery ? (
                    <span className="text-base">💤</span>
                  ) : week.isTaper ? (
                    <span className="text-base">🎯</span>
                  ) : (
                    <span className={`text-xs font-black ${isCurrent ? 'text-primary' : 'text-gray-500'}`}>
                      {week.week}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold ${PHASE_COLORS[week.phase]}`}>{week.phase}</span>
                    <span className="text-[10px] text-gray-600">{formatDateShort(week.sundayDate)}</span>
                  </div>
                  {week.isRecovery && (
                    <p className="text-[10px] text-gray-500">Récupération</p>
                  )}
                </div>

                <div className="text-right flex items-center gap-2">
                  {week.optionalKm && (
                    <span className="text-[9px] text-gray-600">+{week.optionalKm}km opt.</span>
                  )}
                  <div className="text-right">
                    <p className={`text-base font-black ${isCurrent ? 'text-primary' : done ? 'text-green-400' : 'text-gray-300'}`}>
                      {week.longRunKm}
                    </p>
                    <p className="text-[9px] text-gray-600">km</p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Race day */}
          <div className="rounded-xl border border-primary/40 bg-gradient-to-r from-primary/10 to-secondary/10 px-3 py-3 flex items-center gap-3">
            <span className="text-xl">🏁</span>
            <div className="flex-1">
              <p className="font-black text-primary text-sm">SEMI-MARATHON</p>
              <p className="text-[10px] text-gray-400">Dim 1 Novembre 2026</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-primary">21.1</p>
              <p className="text-[9px] text-gray-500">km</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-dark border border-primary/10 rounded-xl p-4 space-y-2">
        <h3 className="text-xs font-bold text-primary uppercase">Conseils clés</h3>
        <div className="space-y-1 text-xs text-gray-400">
          <p>• Allure confort = tu peux parler en courant</p>
          <p>• Hydrate-toi avant, pendant (si +60min), après</p>
          <p>• Max 2 sorties/semaine pour éviter les blessures</p>
          <p>• Si douleur : arrête, repos, consulte si ça persiste</p>
          <p>• Le taper (semaines 24-27) est normal — fais confiance</p>
        </div>
      </div>
    </div>
  );
}
