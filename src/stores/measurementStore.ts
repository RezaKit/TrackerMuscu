import { create } from 'zustand';
import { db } from '../db/db';
import type { BodyMeasurement, MeasurementKey } from '../types';
import { scheduleSync } from '../utils/cloudSync';

interface MeasurementStore {
  measurements: BodyMeasurement[];
  loadMeasurements: () => Promise<void>;
  addMeasurement: (values: Partial<Record<MeasurementKey, number>>, date?: string, notes?: string) => Promise<void>;
  deleteMeasurement: (id: string) => Promise<void>;
}

export const useMeasurementStore = create<MeasurementStore>((set) => ({
  measurements: [],

  loadMeasurements: async () => {
    const measurements = await db.bodyMeasurements.toArray();
    measurements.sort((a, b) => b.date.localeCompare(a.date));
    set({ measurements });
  },

  addMeasurement: async (values, date, notes) => {
    const today = new Date().toISOString().split('T')[0];
    const m: BodyMeasurement = {
      id: crypto.randomUUID(),
      date: date || today,
      values,
      notes,
      createdAt: new Date().toISOString(),
    };
    await db.bodyMeasurements.put(m);
    const measurements = await db.bodyMeasurements.toArray();
    measurements.sort((a, b) => b.date.localeCompare(a.date));
    set({ measurements });
    scheduleSync();
  },

  deleteMeasurement: async (id) => {
    await db.bodyMeasurements.delete(id);
    const measurements = await db.bodyMeasurements.toArray();
    measurements.sort((a, b) => b.date.localeCompare(a.date));
    set({ measurements });
    scheduleSync();
  },
}));

export const MEASUREMENT_LABELS: Record<MeasurementKey, { label: string; emoji: string; unit: string }> = {
  waist:        { label: 'Tour de taille',     emoji: '📏', unit: 'cm' },
  hips:         { label: 'Tour de hanches',    emoji: '🍑', unit: 'cm' },
  chest:        { label: 'Tour de poitrine',   emoji: '💪', unit: 'cm' },
  shoulders:    { label: 'Tour d\'épaules',    emoji: '🏋️', unit: 'cm' },
  biceps_left:  { label: 'Biceps gauche',      emoji: '💪', unit: 'cm' },
  biceps_right: { label: 'Biceps droit',       emoji: '💪', unit: 'cm' },
  thigh_left:   { label: 'Cuisse gauche',      emoji: '🦵', unit: 'cm' },
  thigh_right:  { label: 'Cuisse droite',      emoji: '🦵', unit: 'cm' },
  calf_left:    { label: 'Mollet gauche',      emoji: '🦵', unit: 'cm' },
  calf_right:   { label: 'Mollet droit',       emoji: '🦵', unit: 'cm' },
  neck:         { label: 'Tour de cou',        emoji: '🧣', unit: 'cm' },
  body_fat:     { label: 'Masse grasse',       emoji: '🔥', unit: '%' },
};
