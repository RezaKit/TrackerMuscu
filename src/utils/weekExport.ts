import type { Session, Course, Natation, BodyWeight } from '../types';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function dateToFR(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
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

  const fmtFR = (d: Date) => {
    const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  return {
    start: fmt(monday),
    end: fmt(sunday),
    label: `${fmtFR(monday)} — ${fmtFR(sunday)}`,
  };
}

export function exportWeekAsText(
  sessions: Session[],
  courses: Course[],
  natations: Natation[],
  weights: BodyWeight[]
): string {
  const { start, end, label } = getWeekBounds();

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

  const sep = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  const sep2 = '──────────────────────────────────────────';
  const lines: string[] = [];

  lines.push(sep);
  lines.push(`  TRACKER MUSCU — SEMAINE`);
  lines.push(`  ${label}`);
  lines.push(sep);
  lines.push('');

  // Musculation
  lines.push(`🏋️  MUSCULATION — ${weekSessions.length} séance${weekSessions.length !== 1 ? 's' : ''}`);
  lines.push(sep2);

  if (weekSessions.length === 0) {
    lines.push('  Aucune séance cette semaine.');
  } else {
    for (const s of weekSessions) {
      lines.push(`  ${dateToFR(s.date).toUpperCase()} — ${s.type.toUpperCase()}`);
      for (const ex of s.exercises) {
        const setsStr = ex.sets.map((st) => `${st.weight}×${st.reps}`).join(', ');
        lines.push(`    ${ex.exerciseName}: ${setsStr}`);
      }
      const totalSets = s.exercises.reduce((t, e) => t + e.sets.length, 0);
      lines.push(`    → ${s.exercises.length} exos · ${totalSets} sets`);
      lines.push('');
    }
  }

  lines.push('');

  // Course
  lines.push(`🏃  COURSE — ${weekCourses.length} sortie${weekCourses.length !== 1 ? 's' : ''}`);
  lines.push(sep2);

  if (weekCourses.length === 0) {
    lines.push('  Aucune course cette semaine.');
  } else {
    for (const c of weekCourses) {
      const pace = c.distance > 0 ? (c.time / c.distance).toFixed(2) : '-';
      lines.push(`  ${dateToFR(c.date)} — ${c.distance} km en ${c.time} min`);
      lines.push(`    Allure: ${pace} min/km`);
      if (c.notes) lines.push(`    Notes: ${c.notes}`);
    }
    const total = weekCourses.reduce((s, c) => s + c.distance, 0);
    lines.push(`  → Total: ${total.toFixed(1)} km`);
  }

  lines.push('');

  // Natation
  lines.push(`🏊  NATATION — ${weekNatations.length} séance${weekNatations.length !== 1 ? 's' : ''}`);
  lines.push(sep2);

  if (weekNatations.length === 0) {
    lines.push('  Aucune natation cette semaine.');
  } else {
    for (const n of weekNatations) {
      lines.push(`  ${dateToFR(n.date)} — ${n.distance} m en ${n.time} min`);
      if (n.style) lines.push(`    Style: ${n.style}`);
      if (n.notes) lines.push(`    Notes: ${n.notes}`);
    }
    const total = weekNatations.reduce((s, n) => s + n.distance, 0);
    lines.push(`  → Total: ${total} m`);
  }

  lines.push('');

  // Poids
  lines.push('⚖️  POIDS CORPOREL');
  lines.push(sep2);

  if (weekWeights.length === 0) {
    lines.push('  Aucune mesure cette semaine.');
  } else {
    for (const w of weekWeights) {
      lines.push(`  ${dateToFR(w.date)} — ${w.weight} kg`);
    }
    if (weekWeights.length >= 2) {
      const diff = weekWeights[weekWeights.length - 1].weight - weekWeights[0].weight;
      const sign = diff > 0 ? '+' : '';
      lines.push(`  → Évolution: ${sign}${diff.toFixed(1)} kg sur la semaine`);
    }
  }

  lines.push('');
  lines.push(sep);
  const now = new Date();
  lines.push(`  Généré le ${dateToFR(now.toISOString().split('T')[0])} ${pad(now.getHours())}:${pad(now.getMinutes())}`);
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
