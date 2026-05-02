import { create } from 'zustand';
import { db } from '../db/db';
import type { CalorieEntry, MealType } from '../types';

interface CalorieStore {
  entries: CalorieEntry[];
  calorieGoal: number;
  loadEntries: () => Promise<void>;
  addEntry: (calories: number, label: string, type: 'in' | 'out', date: string, meal?: MealType) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  setGoal: (goal: number) => void;
  getDayStats: (date: string) => { in: number; out: number; net: number };
}

const GOAL_KEY = 'rezakit_calorie_goal';

export const useCalorieStore = create<CalorieStore>((set, get) => ({
  entries: [],
  calorieGoal: parseInt(localStorage.getItem(GOAL_KEY) || '2200', 10),

  loadEntries: async () => {
    const entries = await db.calories.toArray();
    set({ entries });
  },

  addEntry: async (calories, label, type, date, meal) => {
    const entry: CalorieEntry = {
      id: crypto.randomUUID(),
      date,
      type,
      calories,
      label,
      meal,
      createdAt: new Date().toISOString(),
    };
    await db.calories.put(entry);
    const entries = await db.calories.toArray();
    set({ entries });
  },

  deleteEntry: async (id) => {
    await db.calories.delete(id);
    const entries = await db.calories.toArray();
    set({ entries });
  },

  setGoal: (goal) => {
    localStorage.setItem(GOAL_KEY, String(goal));
    set({ calorieGoal: goal });
  },

  getDayStats: (date) => {
    const { entries } = get();
    const day = entries.filter((e) => e.date === date);
    const caloriesIn = day.filter((e) => e.type === 'in').reduce((s, e) => s + e.calories, 0);
    const caloriesOut = day.filter((e) => e.type === 'out').reduce((s, e) => s + e.calories, 0);
    return { in: caloriesIn, out: caloriesOut, net: caloriesIn - caloriesOut };
  },
}));
