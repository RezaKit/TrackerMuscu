import { create } from 'zustand';
import { db } from '../db/db';
import type { Course, Natation } from '../types';

interface CardioStore {
  courses: Course[];
  natations: Natation[];

  loadAll: () => Promise<void>;

  addCourse: (distance: number, time: number, date?: string, notes?: string) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;

  addNatation: (distance: number, time: number, date?: string, style?: string, notes?: string) => Promise<void>;
  deleteNatation: (id: string) => Promise<void>;
}

export const useCardioStore = create<CardioStore>((set) => ({
  courses: [],
  natations: [],

  loadAll: async () => {
    const [courses, natations] = await Promise.all([
      db.courses.toArray(),
      db.natations.toArray(),
    ]);
    set({ courses, natations });
  },

  addCourse: async (distance, time, date, notes) => {
    const course: Course = {
      id: crypto.randomUUID(),
      date: date || new Date().toISOString().split('T')[0],
      distance,
      time,
      notes,
      createdAt: new Date().toISOString(),
    };
    await db.courses.put(course);
    const courses = await db.courses.toArray();
    set({ courses });
  },

  deleteCourse: async (id) => {
    await db.courses.delete(id);
    const courses = await db.courses.toArray();
    set({ courses });
  },

  addNatation: async (distance, time, date, style, notes) => {
    const natation: Natation = {
      id: crypto.randomUUID(),
      date: date || new Date().toISOString().split('T')[0],
      distance,
      time,
      style,
      notes,
      createdAt: new Date().toISOString(),
    };
    await db.natations.put(natation);
    const natations = await db.natations.toArray();
    set({ natations });
  },

  deleteNatation: async (id) => {
    await db.natations.delete(id);
    const natations = await db.natations.toArray();
    set({ natations });
  },
}));
