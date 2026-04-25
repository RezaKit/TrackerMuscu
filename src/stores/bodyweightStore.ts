import { create } from 'zustand';
import { db } from '../db/db';
import type { BodyWeight } from '../types';

interface BodyWeightStore {
  weights: BodyWeight[];
  loadWeights: () => Promise<void>;
  addWeight: (weight: number, date?: string, notes?: string) => Promise<void>;
  deleteWeight: (id: string) => Promise<void>;
}

export const useBodyWeightStore = create<BodyWeightStore>((set) => ({
  weights: [],

  loadWeights: async () => {
    const weights = await db.bodyweights.toArray();
    set({ weights: weights.sort((a, b) => a.date.localeCompare(b.date)) });
  },

  addWeight: async (weight, date, notes) => {
    const entry: BodyWeight = {
      id: crypto.randomUUID(),
      date: date || new Date().toISOString().split('T')[0],
      weight,
      notes,
      createdAt: new Date().toISOString(),
    };
    await db.bodyweights.put(entry);
    const weights = await db.bodyweights.toArray();
    set({ weights: weights.sort((a, b) => a.date.localeCompare(b.date)) });
  },

  deleteWeight: async (id) => {
    await db.bodyweights.delete(id);
    const weights = await db.bodyweights.toArray();
    set({ weights: weights.sort((a, b) => a.date.localeCompare(b.date)) });
  },
}));
