import { useCardioStore } from '../stores/cardioStore';
import { useCalorieStore } from '../stores/calorieStore';

const TOKEN_KEY = 'strava_token';
const REFRESH_KEY = 'strava_refresh';
const EXPIRES_KEY = 'strava_expires';
const IMPORTED_KEY = 'strava_imported_ids';
const CAL_IMPORTED_KEY = 'strava_cal_imported_ids';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CLIENT_ID = (import.meta as any).env?.VITE_STRAVA_CLIENT_ID ?? '';

export function isStravaConnected(): boolean {
  return !!localStorage.getItem(TOKEN_KEY);
}

export function getStravaAthlete(): { id: string; name: string } | null {
  const id = localStorage.getItem('strava_athlete_id');
  const name = localStorage.getItem('strava_name');
  if (!id || !name) return null;
  return { id, name };
}

export function disconnectStrava(): void {
  [TOKEN_KEY, REFRESH_KEY, EXPIRES_KEY, 'strava_athlete_id', 'strava_name', IMPORTED_KEY, CAL_IMPORTED_KEY].forEach((k) =>
    localStorage.removeItem(k)
  );
}

export function stravaAuthUrl(): string {
  const redirectUri = `${window.location.origin}/api/strava-callback`;
  return `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=activity:read_all&approval_prompt=auto`;
}

async function refreshToken(): Promise<boolean> {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) return false;
  try {
    const res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: '', // refresh via backend would be safer, but Strava allows client-side refresh
        refresh_token: refresh,
        grant_type: 'refresh_token',
      }),
    });
    if (!res.ok) return false;
    const data = await res.json() as { access_token: string; refresh_token: string; expires_at: number };
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(REFRESH_KEY, data.refresh_token);
    localStorage.setItem(EXPIRES_KEY, String(data.expires_at));
    return true;
  } catch {
    return false;
  }
}

async function getValidToken(): Promise<string | null> {
  const token = localStorage.getItem(TOKEN_KEY);
  const expires = Number(localStorage.getItem(EXPIRES_KEY));
  if (!token) return null;
  if (Date.now() / 1000 > expires - 300) {
    const ok = await refreshToken();
    if (!ok) return null;
  }
  return localStorage.getItem(TOKEN_KEY);
}

function getImportedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(IMPORTED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markImported(ids: string[]): void {
  const existing = getImportedIds();
  ids.forEach((id) => existing.add(id));
  localStorage.setItem(IMPORTED_KEY, JSON.stringify(Array.from(existing)));
}

function getCalImportedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(CAL_IMPORTED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markCalImported(ids: string[]): void {
  const existing = getCalImportedIds();
  ids.forEach((id) => existing.add(id));
  localStorage.setItem(CAL_IMPORTED_KEY, JSON.stringify(Array.from(existing)));
}

function getActivityLabel(type: string): string {
  const labels: Record<string, string> = {
    Run: 'Course', Swim: 'Natation', 'Pool Swim': 'Natation',
    Ride: 'Vélo', VirtualRide: 'Vélo (virtual)', Walk: 'Marche',
    Hike: 'Randonnée', WeightTraining: 'Musculation', Yoga: 'Yoga',
    Workout: 'Entraînement', Soccer: 'Football', Tennis: 'Tennis',
  };
  return labels[type] || type;
}

export async function syncStravaActivities(): Promise<{ imported: number; skipped: number; caloriesImported: number }> {
  const token = await getValidToken();
  if (!token) return { imported: 0, skipped: 0, caloriesImported: 0 };

  const res = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=100&page=1', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return { imported: 0, skipped: 0, caloriesImported: 0 };
  const activities = await res.json() as Array<{
    id: number;
    type: string;
    distance: number;
    moving_time: number;
    start_date_local: string;
    total_elevation_gain: number;
    average_heartrate?: number;
    calories?: number;
  }>;

  const imported_ids = getImportedIds();
  const cal_imported_ids = getCalImportedIds();
  const { addCourse, addNatation } = useCardioStore.getState();
  const { addEntry } = useCalorieStore.getState();
  let imported = 0;
  let skipped = 0;
  let caloriesImported = 0;
  const newIds: string[] = [];
  const newCalIds: string[] = [];

  for (const activity of activities) {
    const id = String(activity.id);
    const date = activity.start_date_local.split('T')[0];
    const distanceKm = activity.distance / 1000;
    const minutes = Math.round(activity.moving_time / 60);

    // Import cardio (runs and swims)
    if (!imported_ids.has(id)) {
      if (activity.type === 'Run' && distanceKm > 0) {
        await addCourse(distanceKm, minutes, date);
        newIds.push(id);
        imported++;
      } else if ((activity.type === 'Swim' || activity.type === 'Pool Swim') && activity.distance > 0) {
        await addNatation(activity.distance, minutes, date, 'Crawl');
        newIds.push(id);
        imported++;
      } else {
        skipped++;
      }
    }

    // Import calories for ALL activity types
    if (!cal_imported_ids.has(id) && activity.calories && activity.calories > 0) {
      await addEntry(activity.calories, `Strava · ${getActivityLabel(activity.type)}`, 'out', date);
      newCalIds.push(id);
      caloriesImported += activity.calories;
    }
  }

  markImported(newIds);
  markCalImported(newCalIds);
  return { imported, skipped, caloriesImported };
}

export async function syncGarminDailies(): Promise<{ calories: number; date: string } | null> {
  const token = localStorage.getItem('garmin_token');
  const secret = localStorage.getItem('garmin_secret');
  if (!token || !secret) return null;

  try {
    const res = await fetch(`/api/garmin/dailies?token=${encodeURIComponent(token)}&secret=${encodeURIComponent(secret)}&days=1`);
    if (!res.ok) return null;
    const data = await res.json() as Array<{ calendarDate: string; activeKilocalories: number; bmrKilocalories: number }>;
    if (!data || data.length === 0) return null;
    const today = data[data.length - 1];
    return {
      date: today.calendarDate,
      calories: today.activeKilocalories || 0,
    };
  } catch {
    return null;
  }
}

export async function syncGarminCalories(): Promise<number> {
  const data = await syncGarminDailies();
  if (!data || data.calories <= 0) return 0;

  const { entries, addEntry } = useCalorieStore.getState();
  const alreadyLogged = entries.some(
    (e) => e.date === data.date && e.label === 'Garmin · Calories actives' && e.type === 'out'
  );
  if (alreadyLogged) return 0;

  await addEntry(data.calories, 'Garmin · Calories actives', 'out', data.date);
  return data.calories;
}
