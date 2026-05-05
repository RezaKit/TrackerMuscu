import { create } from 'zustand';
import { db } from '../db/db';
import type { BodyMeasurement, MeasurementKey } from '../types';
import { scheduleSync } from '../utils/cloudSync';
import { tr } from '../utils/i18n';

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

interface MeasurementCfg { label: string; emoji: string; unit: string }

/**
 * Returns localized measurement labels. Called per-render so the active locale
 * is always picked up — getLang() is reactive via useLang() in components.
 */
export function getMeasurementLabels(): Record<MeasurementKey, MeasurementCfg> {
  return {
    waist:        { label: tr({ fr: 'Tour de taille',     en: 'Waist',           es: 'Cintura'         }), emoji: '📏',  unit: 'cm' },
    hips:         { label: tr({ fr: 'Tour de hanches',    en: 'Hips',            es: 'Caderas'         }), emoji: '🍑',  unit: 'cm' },
    chest:        { label: tr({ fr: 'Tour de poitrine',   en: 'Chest',           es: 'Pecho'           }), emoji: '💪',  unit: 'cm' },
    shoulders:    { label: tr({ fr: 'Tour d\'épaules',    en: 'Shoulders',       es: 'Hombros'         }), emoji: '🏋️', unit: 'cm' },
    biceps_left:  { label: tr({ fr: 'Biceps gauche',      en: 'Left biceps',     es: 'Bíceps izquierdo'}), emoji: '💪',  unit: 'cm' },
    biceps_right: { label: tr({ fr: 'Biceps droit',       en: 'Right biceps',    es: 'Bíceps derecho' }), emoji: '💪',  unit: 'cm' },
    thigh_left:   { label: tr({ fr: 'Cuisse gauche',      en: 'Left thigh',      es: 'Muslo izquierdo'}), emoji: '🦵',  unit: 'cm' },
    thigh_right:  { label: tr({ fr: 'Cuisse droite',      en: 'Right thigh',     es: 'Muslo derecho'  }), emoji: '🦵',  unit: 'cm' },
    calf_left:    { label: tr({ fr: 'Mollet gauche',      en: 'Left calf',       es: 'Pantorrilla izq.'}), emoji: '🦵',  unit: 'cm' },
    calf_right:   { label: tr({ fr: 'Mollet droit',       en: 'Right calf',      es: 'Pantorrilla der.'}), emoji: '🦵',  unit: 'cm' },
    neck:         { label: tr({ fr: 'Tour de cou',        en: 'Neck',            es: 'Cuello'          }), emoji: '🧣',  unit: 'cm' },
    body_fat:     { label: tr({ fr: 'Masse grasse',       en: 'Body fat',        es: 'Grasa corporal' }), emoji: '🔥',  unit: '%'  },
  };
}

/** @deprecated Use getMeasurementLabels() to ensure live locale switching. */
export const MEASUREMENT_LABELS: Record<MeasurementKey, MeasurementCfg> = new Proxy({} as Record<MeasurementKey, MeasurementCfg>, {
  get(_t, key: string) { return getMeasurementLabels()[key as MeasurementKey]; },
});
