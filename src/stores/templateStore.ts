import { create } from 'zustand';
import { db } from '../db/db';
import type { Template, SessionType } from '../types';

interface TemplateStore {
  templates: Template[];
  loadTemplates: () => Promise<void>;
  createTemplate: (name: string, type: SessionType, exercises: Array<{ name: string; muscleGroup: string }>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<Template>) => Promise<void>;
}

export const useTemplateStore = create<TemplateStore>((set) => ({
  templates: [],

  loadTemplates: async () => {
    const templates = await db.templates.toArray();
    set({ templates });
  },

  createTemplate: async (name, type, exercises) => {
    const template: Template = {
      id: crypto.randomUUID(),
      name,
      type,
      exerciseNames: exercises,
      createdAt: new Date().toISOString(),
    };
    await db.templates.put(template);
    const templates = await db.templates.toArray();
    set({ templates });
  },

  deleteTemplate: async (id) => {
    await db.templates.delete(id);
    const templates = await db.templates.toArray();
    set({ templates });
  },

  updateTemplate: async (id, updates) => {
    const existing = await db.templates.get(id);
    if (!existing) return;
    await db.templates.put({ ...existing, ...updates });
    const templates = await db.templates.toArray();
    set({ templates });
  },
}));
