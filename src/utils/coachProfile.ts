export interface CoachProfile {
  injuries: string[];    // blessures/limitations permanentes
  updatedAt: string;
}

const PROFILE_KEY = 'coach_profile';

export function loadCoachProfile(): CoachProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : { injuries: [], updatedAt: '' };
  } catch {
    return { injuries: [], updatedAt: '' };
  }
}

export function saveCoachProfile(profile: CoachProfile): void {
  try {
    profile.updatedAt = new Date().toISOString();
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch { /* quota */ }
}

export function addInjury(description: string): void {
  const profile = loadCoachProfile();
  if (!profile.injuries.includes(description)) {
    profile.injuries.push(description);
    saveCoachProfile(profile);
  }
}

export function clearInjuries(): void {
  saveCoachProfile({ injuries: [], updatedAt: new Date().toISOString() });
}
