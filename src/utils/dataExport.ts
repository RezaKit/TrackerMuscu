// GDPR-compliant full-data export. Returns a JSON blob containing every piece
// of personal data the app holds about the user, both locally (IndexedDB +
// localStorage) and remotely (Supabase user_data row).

import { db } from '../db/db';
import { supabase } from '../db/supabase';

// localStorage keys we treat as user data (everything else = transient cache).
const USER_LS_KEYS = [
  'gemini_api_key',
  'user_profile',
  'onboarding_done',
  'strava_token', 'strava_refresh', 'strava_expires',
  'strava_athlete_id', 'strava_name', 'strava_imported_ids', 'strava_cal_imported_ids',
  'garmin_token', 'garmin_secret',
  'rezakit_calorie_goal',
  'rezakit_exercise_favorites',
  'rezakit_exercise_avoided',
  'coach_profile',
  'ai_coach_memory',
  'ai_chat_history',
  'rezakit_lang',
];

interface ExportPayload {
  exportedAt: string;
  exportFormatVersion: 1;
  app: 'RezaKit';
  user: { id: string | null; email: string | null };
  localStorage: Record<string, unknown>;
  indexedDB: {
    sessions: unknown[];
    templates: unknown[];
    courses: unknown[];
    natations: unknown[];
    bodyweights: unknown[];
    customExercises: unknown[];
    calories: unknown[];
    routineItems: unknown[];
    routineCompletions: unknown[];
    bodyMeasurements: unknown[];
  };
  cloudBackup?: unknown | null;
}

function safeParse(raw: string | null): unknown {
  if (raw === null) return null;
  try { return JSON.parse(raw); } catch { return raw; }
}

export async function buildFullExport(): Promise<ExportPayload> {
  const { data: { user } } = await supabase.auth.getUser();

  // 1. localStorage
  const localStorageDump: Record<string, unknown> = {};
  for (const k of USER_LS_KEYS) {
    const v = localStorage.getItem(k);
    if (v !== null) localStorageDump[k] = safeParse(v);
  }

  // 2. IndexedDB (Dexie)
  const [
    sessions, templates, courses, natations,
    bodyweights, customExercises, calories,
    routineItems, routineCompletions, bodyMeasurements,
  ] = await Promise.all([
    db.sessions.toArray(),
    db.templates.toArray(),
    db.courses.toArray(),
    db.natations.toArray(),
    db.bodyweights.toArray(),
    db.customExercises.toArray(),
    db.calories.toArray(),
    db.routineItems.toArray(),
    db.routineCompletions.toArray(),
    db.bodyMeasurements.toArray(),
  ]);

  // 3. Supabase cloud row (if signed in)
  let cloudBackup: unknown | null = null;
  if (user) {
    const { data } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', user.id)
      .single();
    cloudBackup = data ?? null;
  }

  return {
    exportedAt: new Date().toISOString(),
    exportFormatVersion: 1,
    app: 'RezaKit',
    user: { id: user?.id ?? null, email: user?.email ?? null },
    localStorage: localStorageDump,
    indexedDB: {
      sessions, templates, courses, natations,
      bodyweights, customExercises, calories,
      routineItems, routineCompletions, bodyMeasurements,
    },
    cloudBackup,
  };
}

export function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

export async function exportAllDataToJson(): Promise<void> {
  const payload = await buildFullExport();
  const date = new Date().toISOString().split('T')[0];
  downloadJson(`rezakit-export-${date}.json`, payload);
}
