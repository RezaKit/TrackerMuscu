import Dexie, { type Table } from 'dexie';
import type { Session, Template, Course, Natation, BodyWeight, Exercise, CalorieEntry, RoutineItem, RoutineCompletion } from '../types';

export class TrackerDB extends Dexie {
  sessions!: Table<Session>;
  templates!: Table<Template>;
  courses!: Table<Course>;
  natations!: Table<Natation>;
  bodyweights!: Table<BodyWeight>;
  customExercises!: Table<Exercise>;
  calories!: Table<CalorieEntry>;
  routineItems!: Table<RoutineItem>;
  routineCompletions!: Table<RoutineCompletion>;

  constructor() {
    super('TrackerMuscu');
    this.version(2).stores({
      sessions: 'id, date, type, completed',
      templates: 'id, type, name',
      courses: 'id, date',
      natations: 'id, date',
      bodyweights: 'id, date',
      customExercises: 'id, name, muscleGroup',
    });
    this.version(3).stores({
      sessions: 'id, date, type, completed',
      templates: 'id, type, name',
      courses: 'id, date',
      natations: 'id, date',
      bodyweights: 'id, date',
      customExercises: 'id, name, muscleGroup',
      calories: 'id, date, type',
      routineItems: 'id, order',
      routineCompletions: 'id, date',
    });
  }
}

export const db = new TrackerDB();

export async function initDB() {
  await db.open();
}
