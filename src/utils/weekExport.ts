import type { Session, Course, Natation, BodyWeight, CalorieEntry, RoutineCompletion, RoutineItem } from '../types';
import { getLang } from './i18n';

type Lang = 'fr' | 'en' | 'es';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatDate(dateStr: string, lang: Lang): string {
  const d = new Date(dateStr + 'T00:00:00');
  const locale = lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-GB';
  return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
}

function getWeekBounds(): { start: string; end: string; label: string } {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  return {
    start: fmt(monday),
    end: fmt(sunday),
    label: `${fmt(monday)} — ${fmt(sunday)}`,
  };
}

const I18N: Record<Lang, Record<string, string>> = {
  fr: {
    title: 'REZAKIT — SEMAINE',
    strength: 'MUSCULATION',
    seance: 'séance', seances: 'séances',
    noStrength: 'Aucune séance cette semaine.',
    run: 'COURSE',
    sortie: 'sortie', sorties: 'sorties',
    noRun: 'Aucune course cette semaine.',
    swim: 'NATATION',
    swim1: 'séance', swimN: 'séances',
    noSwim: 'Aucune natation cette semaine.',
    weight: 'POIDS CORPOREL',
    noWeight: 'Aucune mesure cette semaine.',
    evolution: 'Évolution',
    nutrition: 'NUTRITION',
    noNutrition: 'Aucune donnée nutritionnelle cette semaine.',
    consumed: 'kcal ingérées',
    spent: 'kcal dépensées',
    avgDaily: 'Moy. journalière',
    evening: 'ROUTINE DU SOIR',
    noRoutine: 'Aucune routine enregistrée cette semaine.',
    nights: 'soir(s) trackés',
    fullRoutines: 'routine(s) complète(s)',
    total: 'Total',
    exos: 'exos',
    sets: 'sets',
    pace: 'Allure',
    notes: 'Notes',
    style: 'Style',
    generated: 'Généré le',
    nothing: 'rien',
  },
  en: {
    title: 'REZAKIT — WEEKLY RECAP',
    strength: 'STRENGTH TRAINING',
    seance: 'workout', seances: 'workouts',
    noStrength: 'No workout logged this week.',
    run: 'RUNNING',
    sortie: 'run', sorties: 'runs',
    noRun: 'No run this week.',
    swim: 'SWIMMING',
    swim1: 'session', swimN: 'sessions',
    noSwim: 'No swim this week.',
    weight: 'BODY WEIGHT',
    noWeight: 'No measurement this week.',
    evolution: 'Change',
    nutrition: 'NUTRITION',
    noNutrition: 'No nutrition data this week.',
    consumed: 'kcal eaten',
    spent: 'kcal burned',
    avgDaily: 'Daily avg.',
    evening: 'EVENING ROUTINE',
    noRoutine: 'No routine logged this week.',
    nights: 'night(s) tracked',
    fullRoutines: 'full routine(s)',
    total: 'Total',
    exos: 'exos',
    sets: 'sets',
    pace: 'Pace',
    notes: 'Notes',
    style: 'Style',
    generated: 'Generated on',
    nothing: 'nothing',
  },
  es: {
    title: 'REZAKIT — SEMANA',
    strength: 'MUSCULACIÓN',
    seance: 'sesión', seances: 'sesiones',
    noStrength: 'Sin sesión registrada esta semana.',
    run: 'CARRERA',
    sortie: 'salida', sorties: 'salidas',
    noRun: 'Sin carrera esta semana.',
    swim: 'NATACIÓN',
    swim1: 'sesión', swimN: 'sesiones',
    noSwim: 'Sin natación esta semana.',
    weight: 'PESO CORPORAL',
    noWeight: 'Sin medición esta semana.',
    evolution: 'Evolución',
    nutrition: 'NUTRICIÓN',
    noNutrition: 'Sin datos nutricionales esta semana.',
    consumed: 'kcal consumidas',
    spent: 'kcal quemadas',
    avgDaily: 'Media diaria',
    evening: 'RUTINA NOCTURNA',
    noRoutine: 'Sin rutina registrada esta semana.',
    nights: 'noche(s) registrada(s)',
    fullRoutines: 'rutina(s) completa(s)',
    total: 'Total',
    exos: 'ejerc.',
    sets: 'series',
    pace: 'Ritmo',
    notes: 'Notas',
    style: 'Estilo',
    generated: 'Generado el',
    nothing: 'nada',
  },
};

export function exportWeekAsText(
  sessions: Session[],
  courses: Course[],
  natations: Natation[],
  weights: BodyWeight[],
  calories: CalorieEntry[] = [],
  routineCompletions: RoutineCompletion[] = [],
  routineItems: RoutineItem[] = []
): string {
  const lang: Lang = (getLang() as Lang) || 'fr';
  const t = I18N[lang];
  const locale = lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-GB';

  const { start, end } = getWeekBounds();

  const weekSessions = sessions
    .filter((s) => s.date >= start && s.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date));

  const weekCourses = courses
    .filter((c) => c.date >= start && c.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date));

  const weekNatations = natations
    .filter((n) => n.date >= start && n.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date));

  const weekWeights = weights
    .filter((w) => w.date >= start && w.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date));

  const sep  = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  const sep2 = '──────────────────────────────────────────';
  const lines: string[] = [];

  const weekLabel = (() => {
    const d1 = new Date(start + 'T00:00:00');
    const d2 = new Date(end   + 'T00:00:00');
    return `${d1.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} — ${d2.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  })();

  lines.push(sep);
  lines.push(`  ${t.title}`);
  lines.push(`  ${weekLabel}`);
  lines.push(sep);
  lines.push('');

  // Musculation
  const strWord = weekSessions.length === 1 ? t.seance : t.seances;
  lines.push(`🏋️  ${t.strength} — ${weekSessions.length} ${strWord}`);
  lines.push(sep2);

  if (weekSessions.length === 0) {
    lines.push(`  ${t.noStrength}`);
  } else {
    for (const s of weekSessions) {
      lines.push(`  ${formatDate(s.date, lang).toUpperCase()} — ${s.type.toUpperCase()}`);
      for (const ex of s.exercises) {
        const setsStr = ex.sets.map((st) => `${st.weight}×${st.reps}`).join(', ');
        lines.push(`    ${ex.exerciseName}: ${setsStr}`);
      }
      const totalSets = s.exercises.reduce((acc, e) => acc + e.sets.length, 0);
      lines.push(`    → ${s.exercises.length} ${t.exos} · ${totalSets} ${t.sets}`);
      lines.push('');
    }
  }

  lines.push('');

  // Course
  const runWord = weekCourses.length === 1 ? t.sortie : t.sorties;
  lines.push(`🏃  ${t.run} — ${weekCourses.length} ${runWord}`);
  lines.push(sep2);

  if (weekCourses.length === 0) {
    lines.push(`  ${t.noRun}`);
  } else {
    for (const c of weekCourses) {
      const pace = c.distance > 0 ? (c.time / c.distance).toFixed(2) : '-';
      const unit = lang === 'fr' ? 'min/km' : lang === 'es' ? 'min/km' : 'min/km';
      lines.push(`  ${formatDate(c.date, lang)} — ${c.distance} km ${lang === 'fr' ? 'en' : lang === 'es' ? 'en' : 'in'} ${c.time} min`);
      lines.push(`    ${t.pace}: ${pace} ${unit}`);
      if (c.notes) lines.push(`    ${t.notes}: ${c.notes}`);
    }
    const total = weekCourses.reduce((s, c) => s + c.distance, 0);
    lines.push(`  → ${t.total}: ${total.toFixed(1)} km`);
  }

  lines.push('');

  // Natation
  const swimWord = weekNatations.length === 1 ? t.swim1 : t.swimN;
  lines.push(`🏊  ${t.swim} — ${weekNatations.length} ${swimWord}`);
  lines.push(sep2);

  if (weekNatations.length === 0) {
    lines.push(`  ${t.noSwim}`);
  } else {
    for (const n of weekNatations) {
      lines.push(`  ${formatDate(n.date, lang)} — ${n.distance} m ${lang === 'fr' ? 'en' : lang === 'es' ? 'en' : 'in'} ${n.time} min`);
      if (n.style) lines.push(`    ${t.style}: ${n.style}`);
      if (n.notes) lines.push(`    ${t.notes}: ${n.notes}`);
    }
    const total = weekNatations.reduce((s, n) => s + n.distance, 0);
    lines.push(`  → ${t.total}: ${total} m`);
  }

  lines.push('');

  // Poids
  lines.push(`⚖️  ${t.weight}`);
  lines.push(sep2);

  if (weekWeights.length === 0) {
    lines.push(`  ${t.noWeight}`);
  } else {
    for (const w of weekWeights) {
      lines.push(`  ${formatDate(w.date, lang)} — ${w.weight} kg`);
    }
    if (weekWeights.length >= 2) {
      const diff = weekWeights[weekWeights.length - 1].weight - weekWeights[0].weight;
      const sign = diff > 0 ? '+' : '';
      lines.push(`  → ${t.evolution}: ${sign}${diff.toFixed(1)} kg`);
    }
  }

  lines.push('');

  // Calories
  const weekCalories = calories.filter((c) => c.date >= start && c.date <= end);
  const daysWithCal = Array.from(new Set(weekCalories.map((c) => c.date))).sort();
  lines.push(`🍽️  ${t.nutrition}`);
  lines.push(sep2);
  if (weekCalories.length === 0) {
    lines.push(`  ${t.noNutrition}`);
  } else {
    for (const date of daysWithCal) {
      const dayEntries = weekCalories.filter((c) => c.date === date);
      const totalIn  = dayEntries.filter((c) => c.type === 'in').reduce((s, c) => s + c.calories, 0);
      const totalOut = dayEntries.filter((c) => c.type === 'out').reduce((s, c) => s + c.calories, 0);
      lines.push(`  ${formatDate(date, lang)} — ${totalIn} ${t.consumed}${totalOut > 0 ? ` · ${totalOut} ${t.spent}` : ''}`);
      dayEntries.filter((c) => c.type === 'in').forEach((e) => {
        lines.push(`    ${e.label}: ${e.calories} kcal`);
      });
    }
    const avgIn = Math.round(weekCalories.filter((c) => c.type === 'in').reduce((s, c) => s + c.calories, 0) / Math.max(daysWithCal.length, 1));
    lines.push(`  → ${t.avgDaily}: ${avgIn} kcal`);
  }

  lines.push('');

  // Routine du soir
  const weekRoutine = routineCompletions.filter((r) => r.date >= start && r.date <= end).sort((a, b) => a.date.localeCompare(b.date));
  lines.push(`🌙  ${t.evening}`);
  lines.push(sep2);
  if (routineItems.length === 0 || weekRoutine.length === 0) {
    lines.push(`  ${t.noRoutine}`);
  } else {
    const fullDays = weekRoutine.filter((r) => r.completedItemIds.length === routineItems.length).length;
    lines.push(`  ${weekRoutine.length} ${t.nights} · ${fullDays} ${t.fullRoutines}`);
    for (const r of weekRoutine) {
      const checked = routineItems.filter((i) => r.completedItemIds.includes(i.id)).map((i) => `${i.emoji}${i.name}`);
      lines.push(`  ${formatDate(r.date, lang)}: ${checked.join(', ') || t.nothing}`);
    }
  }

  lines.push('');
  lines.push(sep);
  const now = new Date();
  lines.push(`  ${t.generated} ${formatDate(now.toISOString().split('T')[0], lang)} ${pad(now.getHours())}:${pad(now.getMinutes())}`);
  lines.push(sep);

  return lines.join('\n');
}

export function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
