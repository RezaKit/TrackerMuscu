const FAV_KEY = 'rezakit_exercise_favorites';
const AVOID_KEY = 'rezakit_exercise_avoided';

export type ExercisePref = 'favorite' | 'avoid' | 'neutral';

function load(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function save(key: string, list: string[]) {
  try { localStorage.setItem(key, JSON.stringify(list)); } catch {}
}

export function getFavorites(): string[] { return load(FAV_KEY); }
export function getAvoided(): string[] { return load(AVOID_KEY); }

export function getPref(name: string): ExercisePref {
  if (getFavorites().includes(name)) return 'favorite';
  if (getAvoided().includes(name)) return 'avoid';
  return 'neutral';
}

export function setPref(name: string, pref: ExercisePref): void {
  const favs = getFavorites().filter((n) => n !== name);
  const avoids = getAvoided().filter((n) => n !== name);
  if (pref === 'favorite') favs.push(name);
  if (pref === 'avoid') avoids.push(name);
  save(FAV_KEY, favs);
  save(AVOID_KEY, avoids);
}

export function togglePref(name: string, target: 'favorite' | 'avoid'): ExercisePref {
  const current = getPref(name);
  const next: ExercisePref = current === target ? 'neutral' : target;
  setPref(name, next);
  return next;
}

export function clearAll(): void {
  save(FAV_KEY, []);
  save(AVOID_KEY, []);
}
