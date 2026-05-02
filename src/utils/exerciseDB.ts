// Free exercise data from wger.de — no API key needed, CORS-enabled, cached 7 days

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
const PREFIX = 'rzk_wger_';

export interface WgerInfo {
  id: number;
  images: string[];          // wger exercise photos
  muscles: string[];         // primary muscles (English)
  musclesSecondary: string[];
  equipment: string[];
  descriptionEn: string;
}

// Translate common French gym names → English for wger search
const FR_TO_EN: Record<string, string> = {
  'développé couché': 'bench press',
  'développé incliné': 'incline bench press',
  'développé décliné': 'decline bench press',
  'développé épaule': 'overhead press',
  'développé militaire': 'overhead press',
  'soulevé de terre': 'deadlift',
  'squat': 'squat',
  'hack squat': 'hack squat',
  'tractions': 'pull-up',
  'traction': 'pull-up',
  'dips': 'dip',
  'pompes': 'push-up',
  'rowing': 'bent over row',
  'tirage': 'lat pulldown',
  'curl': 'bicep curl',
  'leg press': 'leg press',
  'fentes': 'lunge',
  'hip thrust': 'hip thrust',
  'mollets': 'calf raise',
  'gainage': 'plank',
  'crunch': 'crunch',
  'face pull': 'face pull',
  'shrug': 'shrug',
  'élévations latérales': 'lateral raise',
  'élévations frontales': 'front raise',
  'skull crushers': 'skull crushers',
  'pushdown': 'tricep pushdown',
  'back extension': 'back extension',
};

function toSearchTerm(name: string): string {
  const lower = name.toLowerCase();
  for (const [fr, en] of Object.entries(FR_TO_EN)) {
    if (lower.includes(fr)) return en;
  }
  return name;
}

function cacheKey(name: string) {
  return PREFIX + name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

async function wger<T>(path: string): Promise<T> {
  const res = await fetch(`https://wger.de/api/v2${path}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`wger ${path} → ${res.status}`);
  return res.json();
}

export async function fetchExerciseInfo(name: string): Promise<WgerInfo | null> {
  const key = cacheKey(name);

  // Read cache
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts < CACHE_TTL) return data;
    }
  } catch { /* ignore */ }

  const term = toSearchTerm(name);

  try {
    // 1. Search by name
    const search = await wger<{ suggestions: Array<{ data: { base_id: number } }> }>(
      `/exercise/search/?term=${encodeURIComponent(term)}&format=json&language=english`
    );
    const baseId = search.suggestions?.[0]?.data?.base_id;
    if (!baseId) return null;

    // 2. Full exercise info
    const info = await wger<{
      muscles:           Array<{ name_en: string }>;
      muscles_secondary: Array<{ name_en: string }>;
      equipment:         Array<{ name: string }>;
      images:            Array<{ image: string; is_main: boolean }>;
      translations:      Array<{ language: number; description: string }>;
    }>(`/exerciseinfo/${baseId}/?format=json`);

    const englishDesc = info.translations?.find(t => t.language === 2)?.description ?? '';
    // Strip HTML tags
    const descText = englishDesc.replace(/<[^>]*>/g, '').trim();

    const result: WgerInfo = {
      id: baseId,
      images:           info.images?.filter(i => i.image).map(i => i.image) ?? [],
      muscles:          info.muscles?.map(m => m.name_en).filter(Boolean) ?? [],
      musclesSecondary: info.muscles_secondary?.map(m => m.name_en).filter(Boolean) ?? [],
      equipment:        info.equipment?.map(e => e.name).filter(Boolean) ?? [],
      descriptionEn:    descText,
    };

    localStorage.setItem(key, JSON.stringify({ data: result, ts: Date.now() }));
    return result;
  } catch {
    return null;
  }
}

// Muscle name → French label
export const MUSCLE_FR: Record<string, string> = {
  'Chest':                 'Pectoraux',
  'Front Deltoid':         'Deltoïde antérieur',
  'Side Deltoid':          'Deltoïde médian',
  'Rear Deltoid':          'Deltoïde postérieur',
  'Deltoids':              'Deltoïdes',
  'Biceps brachii':        'Biceps',
  'Brachialis':            'Brachial antérieur',
  'Triceps brachii':       'Triceps',
  'Latissimus Dorsi':      'Grand dorsal',
  'Trapezius':             'Trapèzes',
  'Rhomboids':             'Rhomboïdes',
  'Teres Major':           'Grand rond',
  'Quadriceps femoris':    'Quadriceps',
  'Biceps femoris':        'Ischio-jambiers',
  'Glutes':                'Fessiers',
  'Gastrocnemius':         'Mollets',
  'Soleus':                'Soléaire',
  'Rectus abdominis':      'Abdominaux',
  'Obliques':              'Obliques',
  'Erector spinae':        'Érecteurs spinaux',
  'Serratus anterior':     'Dentelé antérieur',
};

export function muscleFr(name: string): string {
  return MUSCLE_FR[name] ?? name;
}

// Equipment name → French
export const EQUIP_FR: Record<string, string> = {
  'Barbell':         'Barre',
  'Dumbbell':        'Haltères',
  'Kettlebell':      'Kettlebell',
  'Cable':           'Câble',
  'Machine':         'Machine',
  'Body weight':     'Poids du corps',
  'Bands':           'Élastiques',
  'Foam roll':       'Foam roller',
  'Gym mat':         'Tapis',
  'Pull-up bar':     'Barre de traction',
  'Bench':           'Banc',
  'None (weights)':  'Poids libres',
  'Other':           'Autre',
};

export function equipFr(name: string): string {
  return EQUIP_FR[name] ?? name;
}
