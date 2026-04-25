import { create } from 'zustand';
import { db } from '../db/db';
import { getAllExercises as getPresets } from '../db/seedExercises';
import type { Exercise } from '../types';

interface ExerciseStore {
  customExercises: Exercise[];
  loadCustomExercises: () => Promise<void>;
  createExercise: (name: string, muscleGroup: string) => Promise<Exercise>;
  deleteExercise: (id: string) => Promise<void>;
  getAllExercises: () => Exercise[];
}

export const useExerciseStore = create<ExerciseStore>((set, get) => ({
  customExercises: [],

  loadCustomExercises: async () => {
    const customExercises = await db.customExercises.toArray();
    set({ customExercises });
  },

  createExercise: async (name, muscleGroup) => {
    const exercise: Exercise = {
      id: crypto.randomUUID(),
      name: name.trim(),
      muscleGroup,
    };
    await db.customExercises.put(exercise);
    const customExercises = await db.customExercises.toArray();
    set({ customExercises });
    return exercise;
  },

  deleteExercise: async (id) => {
    await db.customExercises.delete(id);
    const customExercises = await db.customExercises.toArray();
    set({ customExercises });
  },

  getAllExercises: () => {
    const presets = getPresets().map((e) => ({ ...e, id: `preset-${e.name}` }));
    const { customExercises } = get();
    const merged = [...presets];
    for (const custom of customExercises) {
      if (!merged.some((e) => e.name.toLowerCase() === custom.name.toLowerCase())) {
        merged.push(custom);
      }
    }
    return merged.sort((a, b) => a.name.localeCompare(b.name));
  },
}));
