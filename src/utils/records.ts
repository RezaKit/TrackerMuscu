import type { Session, Record as PersonalRecord } from '../types';

export function getPersonalRecords(sessions: Session[]): PersonalRecord[] {
  const records: { [key: string]: PersonalRecord } = {};

  for (const session of sessions) {
    for (const exercise of session.exercises) {
      for (const set of exercise.sets) {
        const existing = records[exercise.exerciseName];
        if (!existing || set.weight > existing.weight) {
          records[exercise.exerciseName] = {
            exerciseName: exercise.exerciseName,
            weight: set.weight,
            reps: set.reps,
            date: session.date,
          };
        }
      }
    }
  }

  return Object.values(records).sort((a, b) => b.date.localeCompare(a.date));
}

export function getLatestRecord(sessions: Session[]): PersonalRecord | null {
  const records = getPersonalRecords(sessions);
  return records.length > 0 ? records[0] : null;
}

export function isNewRecord(
  sessions: Session[],
  exerciseName: string,
  weight: number
): boolean {
  const records = getPersonalRecords(sessions);
  const existing = records.find((r) => r.exerciseName === exerciseName);
  return !existing || weight > existing.weight;
}

export function getExerciseHistory(
  sessions: Session[],
  exerciseName: string
): Array<{ date: string; weight: number; reps: number; setNumber: number }> {
  const history: Array<{ date: string; weight: number; reps: number; setNumber: number }> = [];

  for (const session of sessions) {
    for (const exercise of session.exercises) {
      if (exercise.exerciseName === exerciseName) {
        for (const set of exercise.sets) {
          history.push({
            date: session.date,
            weight: set.weight,
            reps: set.reps,
            setNumber: set.setNumber,
          });
        }
      }
    }
  }

  return history.sort((a, b) => a.date.localeCompare(b.date));
}
