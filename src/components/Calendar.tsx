import { useMemo, useState } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { useCardioStore } from '../stores/cardioStore';
import { formatDateLong, getDateString } from '../utils/export';
import type { Session } from '../types';

const TYPE_COLORS: Record<string, string> = {
  push: 'bg-orange-500',
  pull: 'bg-red-600',
  legs: 'bg-gray-600',
  upper: 'bg-orange-600',
  lower: 'bg-red-700',
};

const TYPE_BORDER: Record<string, string> = {
  push: 'border-orange-500',
  pull: 'border-red-600',
  legs: 'border-gray-500',
  upper: 'border-orange-600',
  lower: 'border-red-700',
};

const TYPE_EMOJI: Record<string, string> = {
  push: '💪', pull: '🏋️', legs: '🦵', upper: '⬆️', lower: '⬇️',
};

const TYPE_LABELS: Record<string, string> = {
  push: 'Push', pull: 'Pull', legs: 'Legs', upper: 'Upper', lower: 'Lower',
};

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const DAY_NAMES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { sessions, deleteSession } = useSessionStore();
  const { courses, natations } = useCardioStore();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const firstDayIndex = firstDay === 0 ? 6 : firstDay - 1;

  const getDateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const activityMap = useMemo(() => {
    const map: Record<string, { sessions: Session[]; hasCourse: boolean; hasNat: boolean; courseKm: number }> = {};
    for (const s of sessions) {
      if (!map[s.date]) map[s.date] = { sessions: [], hasCourse: false, hasNat: false, courseKm: 0 };
      map[s.date].sessions.push(s);
    }
    for (const c of courses) {
      if (!map[c.date]) map[c.date] = { sessions: [], hasCourse: false, hasNat: false, courseKm: 0 };
      map[c.date].hasCourse = true;
      map[c.date].courseKm += c.distance;
    }
    for (const n of natations) {
      if (!map[n.date]) map[n.date] = { sessions: [], hasCourse: false, hasNat: false, courseKm: 0 };
      map[n.date].hasNat = true;
    }
    return map;
  }, [sessions, courses, natations]);

  const days: (number | null)[] = Array(firstDayIndex).fill(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const today = getDateString();

  const selectedInfo = selectedDate ? activityMap[selectedDate] : null;
  const selectedCourses = selectedDate ? courses.filter((c) => c.date === selectedDate) : [];
  const selectedNatations = selectedDate ? natations.filter((n) => n.date === selectedDate) : [];

  const monthSessionCount = sessions.filter((s) =>
    s.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)
  ).length;

  const monthCourseKm = courses
    .filter((c) => c.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
    .reduce((s, c) => s + c.distance, 0);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1));

  return (
    <div className="p-4 pb-28 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-primary">📅 CALENDRIER</h2>
        <div className="text-right text-xs text-gray-500">
          <span className="text-primary font-bold">{monthSessionCount}</span> séances
          {monthCourseKm > 0 && <span> · <span className="text-blue-400 font-bold">{monthCourseKm.toFixed(1)}km</span></span>}
        </div>
      </div>

      {/* Month navigation */}
      <div className="bg-dark border border-primary/20 rounded-xl overflow-hidden">
        <div className="flex justify-between items-center px-4 py-3 border-b border-primary/10">
          <button
            onClick={prevMonth}
            className="w-9 h-9 rounded-xl bg-bg-dark text-primary flex items-center justify-center active:scale-95 transition text-lg"
          >
            ‹
          </button>
          <div className="text-center">
            <h3 className="font-black text-base">{MONTH_NAMES[month]}</h3>
            <p className="text-xs text-gray-500">{year}</p>
          </div>
          <button
            onClick={nextMonth}
            className="w-9 h-9 rounded-xl bg-bg-dark text-primary flex items-center justify-center active:scale-95 transition text-lg"
          >
            ›
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 px-2 pt-3 pb-1">
          {DAY_NAMES.map((d, i) => (
            <div key={i} className="text-center text-[10px] font-black text-gray-600 uppercase">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1 p-2">
          {days.map((day, idx) => {
            if (!day) return <div key={idx} />;
            const dateStr = getDateStr(day);
            const info = activityMap[dateStr];
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const mainSession = info?.sessions[0];
            const hasMultiple = info?.sessions.length > 1;

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                className={`relative aspect-square rounded-xl text-xs flex flex-col items-center justify-center transition active:scale-90 ${
                  mainSession
                    ? `${TYPE_COLORS[mainSession.type]} text-white font-black shadow-sm`
                    : info?.hasCourse
                    ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300 font-bold'
                    : info?.hasNat
                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold'
                    : isToday
                    ? 'bg-bg-dark border-2 border-primary text-primary font-black'
                    : 'bg-bg-dark text-gray-500'
                } ${isSelected ? 'ring-2 ring-white/60 scale-95' : ''}`}
              >
                <span className="leading-none">{day}</span>
                {/* Indicators */}
                <div className="absolute bottom-0.5 flex gap-0.5 justify-center">
                  {mainSession && (info?.hasCourse || info?.hasNat) && (
                    <div className="w-1 h-1 rounded-full bg-white/70" />
                  )}
                  {info?.hasCourse && !mainSession && info?.hasNat && (
                    <div className="w-1 h-1 rounded-full bg-cyan-400" />
                  )}
                  {hasMultiple && (
                    <div className="w-1 h-1 rounded-full bg-white/80" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="border-t border-primary/10 px-3 py-2 grid grid-cols-3 gap-x-3 gap-y-1">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <div className="w-2.5 h-2.5 rounded-md bg-orange-500" />Push
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <div className="w-2.5 h-2.5 rounded-md bg-red-600" />Pull
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <div className="w-2.5 h-2.5 rounded-md bg-gray-600" />Legs
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <div className="w-2.5 h-2.5 rounded-md bg-blue-500/40 border border-blue-500/60" />Course
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <div className="w-2.5 h-2.5 rounded-md bg-cyan-500/40 border border-cyan-500/60" />Natation
          </div>
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDate && (
        <div className="bg-dark border border-primary/30 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-primary/10">
            <h3 className="font-black text-primary capitalize">{formatDateLong(selectedDate)}</h3>
          </div>

          <div className="p-3 space-y-2">
            {selectedInfo?.sessions.map((sess) => (
              <div
                key={sess.id}
                className={`bg-bg-dark rounded-xl border-l-4 ${TYPE_BORDER[sess.type]} p-3`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span>{TYPE_EMOJI[sess.type]}</span>
                    <div>
                      <p className="font-black text-primary text-sm">{TYPE_LABELS[sess.type]}</p>
                      <p className="text-[10px] text-gray-500">
                        {sess.exercises.length} exos · {sess.exercises.reduce((t, e) => t + e.sets.length, 0)} sets
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Supprimer cette séance ?')) {
                        deleteSession(sess.id);
                        setSelectedDate(null);
                      }
                    }}
                    className="text-secondary/70 text-sm hover:text-secondary transition"
                  >
                    🗑️
                  </button>
                </div>

                <div className="space-y-1.5">
                  {sess.exercises.map((ex) => (
                    <div key={ex.id} className="text-xs">
                      <p className="text-gray-300 font-semibold">{ex.exerciseName}</p>
                      <div className="flex gap-1 flex-wrap mt-0.5">
                        {ex.sets.map((s, i) => (
                          <span key={i} className="text-[10px] bg-dark px-2 py-0.5 rounded text-gray-400">
                            {s.weight}kg×{s.reps}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {selectedCourses.map((c) => (
              <div key={c.id} className="bg-bg-dark rounded-xl border-l-4 border-blue-500 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏃</span>
                  <div>
                    <p className="font-bold text-blue-400">{c.distance} km</p>
                    <p className="text-[10px] text-gray-500">
                      {c.time} min · {c.distance > 0 ? (c.time / c.distance).toFixed(1) : '-'} min/km
                    </p>
                  </div>
                </div>
                {c.notes && <p className="text-xs text-gray-500 italic mt-1">{c.notes}</p>}
              </div>
            ))}

            {selectedNatations.map((n) => (
              <div key={n.id} className="bg-bg-dark rounded-xl border-l-4 border-cyan-500 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏊</span>
                  <div>
                    <p className="font-bold text-cyan-400">{n.distance} m</p>
                    <p className="text-[10px] text-gray-500">
                      {n.time} min{n.style ? ` · ${n.style}` : ''}
                    </p>
                  </div>
                </div>
                {n.notes && <p className="text-xs text-gray-500 italic mt-1">{n.notes}</p>}
              </div>
            ))}

            {!selectedInfo?.sessions.length && selectedCourses.length === 0 && selectedNatations.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Aucune activité ce jour</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
