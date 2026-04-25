import Dexie, { type Table } from 'dexie';
import type { Session, Template, Course, Natation, BodyWeight, Exercise } from '../types';

export class TrackerDB extends Dexie {
  sessions!: Table<Session>;
  templates!: Table<Template>;
  courses!: Table<Course>;
  natations!: Table<Natation>;
  bodyweights!: Table<BodyWeight>;
  customExercises!: Table<Exercise>;

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
  }
}

export const db = new TrackerDB();

export async function initDB() {
  await db.open();
}
