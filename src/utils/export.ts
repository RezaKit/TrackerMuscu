import type { Session, Course, Natation, BodyWeight } from '../types';
import Papa from 'papaparse';

export function exportAllToCSV(
  sessions: Session[],
  courses: Course[],
  natations: Natation[],
  bodyweights: BodyWeight[]
): string {
  const sessionData = sessions.flatMap((session) =>
    session.exercises.flatMap((exercise) =>
      exercise.sets.map((set) => ({
        type: 'Musculation',
        date: session.date,
        sessionType: session.type,
        exercise: exercise.exerciseName,
        muscle: exercise.muscleGroup,
        weight_kg: set.weight,
        reps: set.reps,
        series: set.setNumber,
        distance: '',
        time_min: '',
        notes: session.notes || '',
      }))
    )
  );

  const courseData = courses.map((c) => ({
    type: 'Course',
    date: c.date,
    sessionType: '',
    exercise: '',
    muscle: '',
    weight_kg: '',
    reps: '',
    series: '',
    distance: c.distance,
    time_min: c.time,
    notes: c.notes || '',
  }));

  const natationData = natations.map((n) => ({
    type: 'Natation',
    date: n.date,
    sessionType: n.style || '',
    exercise: '',
    muscle: '',
    weight_kg: '',
    reps: '',
    series: '',
    distance: n.distance,
    time_min: n.time,
    notes: n.notes || '',
  }));

  const weightData = bodyweights.map((b) => ({
    type: 'Bodyweight',
    date: b.date,
    sessionType: '',
    exercise: '',
    muscle: '',
    weight_kg: b.weight,
    reps: '',
    series: '',
    distance: '',
    time_min: '',
    notes: b.notes || '',
  }));

  const allData = [...sessionData, ...courseData, ...natationData, ...weightData].sort(
    (a, b) => String(a.date).localeCompare(String(b.date))
  );
  return Papa.unparse(allData);
}

export function downloadCSV(content: string, filename = 'tracker-export.csv') {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function getDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`;
  return `${m}min`;
}
