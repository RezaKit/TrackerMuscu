import { supabase } from '../db/supabase';
import { db } from '../db/db';

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let syncing = false;

const LS_KEYS = [
  'gemini_api_key',
  'user_profile',
  'onboarding_done',
  'strava_token',
  'strava_refresh',
  'strava_expires',
  'strava_athlete_id',
  'strava_name',
  'strava_imported_ids',
  'strava_cal_imported_ids',
  'garmin_token',
  'garmin_secret',
  'rezakit_calorie_goal',
  'coach_profile',
] as const;

function captureLocalStorage(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of LS_KEYS) {
    const v = localStorage.getItem(key);
    if (v !== null) out[key] = v;
  }
  return out;
}

function restoreLocalStorage(data: Record<string, string>): void {
  for (const key of LS_KEYS) {
    if (key in data && data[key] !== undefined) {
      localStorage.setItem(key, data[key]);
    }
  }
}

// Call after any data mutation — debounced 4 seconds
export function scheduleSync() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(pushToCloud, 4000);
}

export async function pushToCloud(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  if (syncing) return false;
  syncing = true;

  try {
    const [
      sessions, templates, courses, natations,
      bodyweights, customExercises, calories,
      routineItems, routineCompletions,
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
    ]);

    const coachMemory = localStorage.getItem('ai_coach_memory') || null;
    const chatHistory = localStorage.getItem('ai_chat_history') || '[]';

    const { error } = await supabase.from('user_data').upsert({
      user_id: user.id,
      sessions,
      templates,
      courses,
      natations,
      body_weights: bodyweights,
      custom_exercises: customExercises,
      calorie_entries: calories,
      routine_items: routineItems,
      routine_completions: routineCompletions,
      coach_memory: coachMemory ? JSON.parse(coachMemory) : null,
      chat_history: JSON.parse(chatHistory),
      local_settings: captureLocalStorage(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    return !error;
  } catch {
    return false;
  } finally {
    syncing = false;
  }
}

export async function restoreFromCloud(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('user_data')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !data) return false;

  try {
    await Promise.all([
      db.sessions.clear(),
      db.templates.clear(),
      db.courses.clear(),
      db.natations.clear(),
      db.bodyweights.clear(),
      db.customExercises.clear(),
      db.calories.clear(),
      db.routineItems.clear(),
      db.routineCompletions.clear(),
    ]);

    await Promise.all([
      data.sessions?.length      && db.sessions.bulkPut(data.sessions),
      data.templates?.length     && db.templates.bulkPut(data.templates),
      data.courses?.length       && db.courses.bulkPut(data.courses),
      data.natations?.length     && db.natations.bulkPut(data.natations),
      data.body_weights?.length  && db.bodyweights.bulkPut(data.body_weights),
      data.custom_exercises?.length && db.customExercises.bulkPut(data.custom_exercises),
      data.calorie_entries?.length  && db.calories.bulkPut(data.calorie_entries),
      data.routine_items?.length    && db.routineItems.bulkPut(data.routine_items),
      data.routine_completions?.length && db.routineCompletions.bulkPut(data.routine_completions),
    ].filter(Boolean));

    if (data.coach_memory) {
      localStorage.setItem('ai_coach_memory', JSON.stringify(data.coach_memory));
    }
    if (data.chat_history?.length) {
      localStorage.setItem('ai_chat_history', JSON.stringify(data.chat_history));
    }
    if (data.local_settings && typeof data.local_settings === 'object') {
      restoreLocalStorage(data.local_settings as Record<string, string>);
    }

    return true;
  } catch {
    return false;
  }
}
