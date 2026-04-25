import { create } from 'zustand';
import { db } from '../db/db';
import type { RoutineItem, RoutineCompletion } from '../types';

const DEFAULT_ITEMS: RoutineItem[] = [
  { id: 'r1', name: 'Étirements', emoji: '🧘', order: 0 },
  { id: 'r2', name: 'Lecture', emoji: '📚', order: 1 },
  { id: 'r3', name: 'No écrans 30min', emoji: '📵', order: 2 },
  { id: 'r4', name: 'Au lit avant 23h', emoji: '🛌', order: 3 },
  { id: 'r5', name: 'Méditation', emoji: '🧠', order: 4 },
  { id: 'r6', name: 'Journaling', emoji: '✍️', order: 5 },
];

interface RoutineStore {
  items: RoutineItem[];
  completions: RoutineCompletion[];
  loadAll: () => Promise<void>;
  addItem: (name: string, emoji: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleItem: (date: string, itemId: string) => Promise<void>;
  getCompletion: (date: string) => RoutineCompletion | null;
  getStreak: () => number;
}

export const useRoutineStore = create<RoutineStore>((set, get) => ({
  items: [],
  completions: [],

  loadAll: async () => {
    let items = await db.routineItems.toArray();
    if (items.length === 0) {
      await db.routineItems.bulkPut(DEFAULT_ITEMS);
      items = DEFAULT_ITEMS;
    }
    const completions = await db.routineCompletions.toArray();
    set({ items, completions });
  },

  addItem: async (name, emoji) => {
    const { items } = get();
    const item: RoutineItem = {
      id: crypto.randomUUID(),
      name,
      emoji,
      order: items.length,
    };
    await db.routineItems.put(item);
    const updated = await db.routineItems.toArray();
    set({ items: updated });
  },

  deleteItem: async (id) => {
    await db.routineItems.delete(id);
    const items = await db.routineItems.toArray();
    set({ items });
  },

  toggleItem: async (date, itemId) => {
    const { completions } = get();
    const existing = completions.find((c) => c.date === date);

    if (existing) {
      const has = existing.completedItemIds.includes(itemId);
      const updated: RoutineCompletion = {
        ...existing,
        completedItemIds: has
          ? existing.completedItemIds.filter((id) => id !== itemId)
          : [...existing.completedItemIds, itemId],
      };
      await db.routineCompletions.put(updated);
    } else {
      const newCompletion: RoutineCompletion = {
        id: crypto.randomUUID(),
        date,
        completedItemIds: [itemId],
        createdAt: new Date().toISOString(),
      };
      await db.routineCompletions.put(newCompletion);
    }

    const updated = await db.routineCompletions.toArray();
    set({ completions: updated });
  },

  getCompletion: (date) => {
    const { completions } = get();
    return completions.find((c) => c.date === date) || null;
  },

  getStreak: () => {
    const { completions, items } = get();
    if (items.length === 0) return 0;
    const threshold = Math.ceil(items.length / 2);
    const doneDates = completions
      .filter((c) => c.completedItemIds.length >= threshold)
      .map((c) => c.date)
      .sort((a, b) => b.localeCompare(a));
    if (doneDates.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (doneDates[0] !== today && doneDates[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 1; i < doneDates.length; i++) {
      const prev = new Date(doneDates[i - 1]);
      const curr = new Date(doneDates[i]);
      const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000);
      if (diff === 1) streak++;
      else break;
    }
    return streak;
  },
}));
