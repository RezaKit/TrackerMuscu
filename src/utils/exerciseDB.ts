// ExerciseDB OSS — 1,500 exercises with animated GIFs (180p, free, no auth).
// Source: https://oss.exercisedb.dev
// API uses an envelope: { success, meta, data: [...] }

import { getLang, type Lang } from './i18n';

const API_BASE = 'https://oss.exercisedb.dev/api/v1';

// localStorage cache: per-name lookup, 30-day TTL.
const CACHE_KEY    = 'rzk_fxdb_v3';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface FxExercise {
  id: string;
  name: string;
  gifUrl?: string;
  force?: 'pull' | 'push' | 'static' | null;
  level?: 'beginner' | 'intermediate' | 'expert';
  mechanic?: 'compound' | 'isolation' | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category?: string;
  images?: string[];
}

interface RawExercise {
  exerciseId: string;
  name: string;
  gifUrl: string;
  targetMuscles: string[];
  bodyParts: string[];
  equipments: string[];
  secondaryMuscles: string[];
  instructions: string[];
}

function mapRaw(raw: RawExercise): FxExercise {
  return {
    id: raw.exerciseId,
    name: raw.name,
    gifUrl: raw.gifUrl || undefined,
    primaryMuscles: raw.targetMuscles ?? [],
    secondaryMuscles: raw.secondaryMuscles ?? [],
    equipment: raw.equipments?.[0] ?? null,
    instructions: (raw.instructions ?? []).map((s) => s.replace(/^Step:\d+\s*/i, '')),
  };
}

// In-memory cache keyed by lowercased search term
const memCache = new Map<string, FxExercise | null>();

// localStorage cache for persistence
type DiskCache = Record<string, { hit: FxExercise | null; ts: number }>;

function readDisk(): DiskCache {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch { return {}; }
}

function writeDisk(d: DiskCache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(d));
  } catch { /* quota — best-effort */ }
}

// FR/ES → EN lookup map (used to convert user input to the dataset language).
const FR_EN: Record<string, string> = {
  'développé couché':         'bench press',
  'développé incliné':        'incline bench press',
  'développé décliné':        'decline bench press',
  'développé haltère':        'dumbbell bench press',
  'écarté':                   'fly',
  'fly câble':                'cable crossover',
  'cable fly':                'cable crossover',
  'fly haltère':              'dumbbell fly',
  'pompes':                   'push up',
  'push up':                  'push up',
  'dips':                     'dips',
  'développé épaule':         'overhead press',
  'développé militaire':      'overhead press',
  'overhead press':           'overhead press',
  'shoulder press':           'shoulder press',
  'élévation latérale':       'lateral raise',
  'élévation latérale haltère':'dumbbell lateral raise',
  'élévation frontale':       'front raise',
  'face pull':                'face pull',
  'arnold press':             'arnold press',
  'shrug':                    'shrug',
  'haussement épaule':        'shrug',
  'traction':                 'pull up',
  'tractions':                'pull up',
  'pull up':                  'pull up',
  'chin up':                  'chin up',
  'tirage vertical':          'lat pulldown',
  'lat pulldown':             'lat pulldown',
  'rowing barre':             'barbell row',
  'bent over row':            'barbell row',
  'rowing haltère':           'dumbbell row',
  'one arm row':              'dumbbell row',
  'tirage horizontal':        'cable row',
  'seated row':               'cable row',
  't-bar row':                't bar row',
  'soulevé de terre':         'deadlift',
  'deadlift':                 'deadlift',
  'curl barre':               'barbell curl',
  'barbell curl':             'barbell curl',
  'curl haltère':             'dumbbell curl',
  'dumbbell curl':            'dumbbell curl',
  'curl marteau':             'hammer curl',
  'hammer curl':              'hammer curl',
  'curl pupitre':             'preacher curl',
  'preacher curl':            'preacher curl',
  'curl concentration':       'concentration curl',
  'curl câble':               'cable curl',
  'pushdown':                 'triceps pushdown',
  'extension triceps':        'triceps extension',
  'skull crusher':            'skull crusher',
  'overhead triceps':         'overhead triceps extension',
  'extension triceps poulie': 'triceps pushdown',
  'squat':                    'squat',
  'squat barre':              'barbell squat',
  'front squat':              'front squat',
  'hack squat':               'hack squat',
  'leg press':                'leg press',
  'presse à cuisses':         'leg press',
  'fentes':                   'lunge',
  'lunge':                    'lunge',
  'leg extension':            'leg extension',
  'leg curl':                 'leg curl',
  'hip thrust':               'hip thrust',
  'mollets':                  'calf raise',
  'calf raise':               'calf raise',
  'soulevé roumain':          'romanian deadlift',
  'romanian deadlift':        'romanian deadlift',
  'crunch':                   'crunch',
  'sit-up':                   'sit up',
  'gainage':                  'plank',
  'plank':                    'plank',
  'leg raise':                'leg raise',
  'russian twist':            'russian twist',
  'wrist curl':               'wrist curl',
};

function toEnglishSearch(name: string): string {
  const lower = name.toLowerCase().trim();
  if (FR_EN[lower]) return FR_EN[lower];
  for (const [fr, en] of Object.entries(FR_EN)) {
    if (lower.includes(fr)) return en;
  }
  return name;
}

/**
 * Fuzzy-search the API for an exercise by name. Returns the best match or null.
 * Result is memoized in-memory and persisted to localStorage for 30 days.
 */
export async function findFxExercise(name: string): Promise<FxExercise | null> {
  const key = name.toLowerCase().trim();
  if (!key) return null;

  if (memCache.has(key)) return memCache.get(key)!;

  // Disk cache check
  const disk = readDisk();
  const entry = disk[key];
  if (entry && Date.now() - entry.ts < CACHE_TTL_MS) {
    memCache.set(key, entry.hit);
    return entry.hit;
  }

  // Hit the API. Try the localized term, then fall back to FR→EN translation.
  const search = toEnglishSearch(name);

  let hit: FxExercise | null = null;
  try {
    const url = `${API_BASE}/exercises/search?search=${encodeURIComponent(search)}&threshold=0.4&limit=5`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`fxdb ${r.status}`);
    const json = await r.json();
    const list: RawExercise[] = Array.isArray(json) ? json : (json?.data ?? []);
    if (list.length > 0) {
      // Prefer exact (case-insensitive) match if present
      const lower = search.toLowerCase();
      const exact = list.find((e) => e.name.toLowerCase() === lower);
      hit = mapRaw(exact ?? list[0]);
    }
  } catch {
    hit = null;
  }

  memCache.set(key, hit);
  // Persist (best-effort)
  disk[key] = { hit, ts: Date.now() };
  writeDisk(disk);

  return hit;
}

/** Legacy shim — no longer used since we removed the GitHub image base. */
export function fxImageUrl(image: string): string {
  return image;
}

// ──────────────────────────────────────────────────────────────────────────
// Translations — muscles, equipment, level, force, mechanic, category
// ──────────────────────────────────────────────────────────────────────────

const MUSCLES: Record<string, Record<Lang, string>> = {
  abdominals:   { fr: 'Abdominaux',     en: 'Abdominals',    es: 'Abdominales'   },
  abductors:    { fr: 'Abducteurs',     en: 'Abductors',     es: 'Abductores'    },
  adductors:    { fr: 'Adducteurs',     en: 'Adductors',     es: 'Aductores'     },
  biceps:       { fr: 'Biceps',         en: 'Biceps',        es: 'Bíceps'        },
  calves:       { fr: 'Mollets',        en: 'Calves',        es: 'Pantorrillas'  },
  chest:        { fr: 'Pectoraux',      en: 'Chest',         es: 'Pectoral'      },
  forearms:     { fr: 'Avant-bras',     en: 'Forearms',      es: 'Antebrazos'    },
  glutes:       { fr: 'Fessiers',       en: 'Glutes',        es: 'Glúteos'       },
  hamstrings:   { fr: 'Ischio-jambiers',en: 'Hamstrings',    es: 'Isquiotibiales'},
  lats:         { fr: 'Grand dorsal',   en: 'Lats',          es: 'Dorsal'        },
  'lower back': { fr: 'Bas du dos',     en: 'Lower back',    es: 'Lumbares'      },
  'middle back':{ fr: 'Milieu du dos',  en: 'Middle back',   es: 'Dorsal medio'  },
  neck:         { fr: 'Cou',            en: 'Neck',          es: 'Cuello'        },
  quadriceps:   { fr: 'Quadriceps',     en: 'Quadriceps',    es: 'Cuádriceps'    },
  shoulders:    { fr: 'Épaules',        en: 'Shoulders',     es: 'Hombros'       },
  traps:        { fr: 'Trapèzes',       en: 'Traps',         es: 'Trapecios'     },
  triceps:      { fr: 'Triceps',        en: 'Triceps',       es: 'Tríceps'       },
  // ExerciseDB OSS API names
  pectorals:                { fr: 'Pectoraux',          en: 'Pectorals',          es: 'Pectorales'          },
  deltoids:                 { fr: 'Deltoïdes',           en: 'Deltoids',           es: 'Deltoides'           },
  quads:                    { fr: 'Quadriceps',          en: 'Quads',              es: 'Cuádriceps'          },
  abs:                      { fr: 'Abdominaux',          en: 'Abs',                es: 'Abdominales'         },
  'hip flexors':            { fr: 'Fléchisseurs hanches',en: 'Hip flexors',        es: 'Flexores de cadera'  },
  spine:                    { fr: 'Colonne vertébrale',  en: 'Spine',              es: 'Columna vertebral'   },
  'serratus anterior':      { fr: 'Grand dentelé',       en: 'Serratus anterior',  es: 'Serrato anterior'    },
  'cardiovascular system':  { fr: 'Cardio',              en: 'Cardiovascular',     es: 'Cardiovascular'      },
  'upper back':             { fr: 'Haut du dos',         en: 'Upper back',         es: 'Parte superior espalda'},
  'levator scapulae':       { fr: 'Élévateur scapulaire',en: 'Levator scapulae',   es: 'Elevador escápula'   },
};

const EQUIP: Record<string, Record<Lang, string>> = {
  'body only':       { fr: 'Poids du corps',  en: 'Bodyweight',     es: 'Peso corporal'  },
  'body weight':     { fr: 'Poids du corps',  en: 'Bodyweight',     es: 'Peso corporal'  },
  machine:           { fr: 'Machine',          en: 'Machine',        es: 'Máquina'        },
  dumbbell:          { fr: 'Haltères',         en: 'Dumbbell',       es: 'Mancuernas'     },
  barbell:           { fr: 'Barre',            en: 'Barbell',        es: 'Barra'          },
  cable:             { fr: 'Câble',            en: 'Cable',          es: 'Cable'          },
  kettlebell:        { fr: 'Kettlebell',       en: 'Kettlebell',     es: 'Pesa rusa'      },
  bands:             { fr: 'Élastiques',       en: 'Bands',          es: 'Bandas'         },
  band:              { fr: 'Élastique',        en: 'Band',           es: 'Banda'          },
  'foam roll':       { fr: 'Foam roller',      en: 'Foam roller',    es: 'Rodillo'        },
  'medicine ball':   { fr: 'Médecine ball',    en: 'Medicine ball',  es: 'Balón medicinal'},
  'exercise ball':   { fr: 'Swiss ball',       en: 'Stability ball', es: 'Pelota suiza'   },
  'stability ball':  { fr: 'Swiss ball',       en: 'Stability ball', es: 'Pelota suiza'   },
  'e-z curl bar':    { fr: 'Barre EZ',         en: 'EZ-curl bar',    es: 'Barra Z'        },
  rope:              { fr: 'Corde',            en: 'Rope',           es: 'Cuerda'         },
  hammer:            { fr: 'Marteau',          en: 'Hammer',         es: 'Martillo'       },
  smith:             { fr: 'Smith machine',    en: 'Smith machine',  es: 'Máquina Smith'  },
  assisted:          { fr: 'Assisté',          en: 'Assisted',       es: 'Asistido'       },
  other:             { fr: 'Autre',            en: 'Other',          es: 'Otro'           },
};

const LEVELS: Record<string, Record<Lang, string>> = {
  beginner:     { fr: 'Débutant',      en: 'Beginner',     es: 'Principiante'  },
  intermediate: { fr: 'Intermédiaire', en: 'Intermediate', es: 'Intermedio'    },
  expert:       { fr: 'Avancé',        en: 'Expert',       es: 'Avanzado'      },
};

const MECHANIC: Record<string, Record<Lang, string>> = {
  compound:  { fr: 'Polyarticulaire', en: 'Compound',  es: 'Compuesto'  },
  isolation: { fr: 'Isolation',       en: 'Isolation', es: 'Aislamiento'},
};

const FORCE: Record<string, Record<Lang, string>> = {
  pull:   { fr: 'Tirer',  en: 'Pull',   es: 'Tirar'    },
  push:   { fr: 'Pousser',en: 'Push',   es: 'Empujar'  },
  static: { fr: 'Isométrique', en: 'Static', es: 'Isométrico' },
};

const CATEGORY: Record<string, Record<Lang, string>> = {
  strength:        { fr: 'Force',         en: 'Strength',      es: 'Fuerza'       },
  cardio:          { fr: 'Cardio',        en: 'Cardio',        es: 'Cardio'       },
  stretching:      { fr: 'Étirement',     en: 'Stretching',    es: 'Estiramiento' },
  plyometrics:     { fr: 'Pliométrie',    en: 'Plyometrics',   es: 'Pliometría'   },
  powerlifting:    { fr: 'Powerlifting',  en: 'Powerlifting',  es: 'Powerlifting' },
  strongman:       { fr: 'Strongman',     en: 'Strongman',     es: 'Strongman'    },
  'olympic weightlifting': { fr: 'Haltérophilie', en: 'Olympic weightlifting', es: 'Halterofilia' },
};

function localize(map: Record<string, Record<Lang, string>>, key: string | null | undefined): string {
  if (!key) return '';
  const lang = getLang();
  const e = map[key.toLowerCase()];
  return e?.[lang] ?? e?.en ?? key;
}

export const muscleLabel   = (m: string)             => localize(MUSCLES, m);
export const equipLabel    = (e: string | null)      => localize(EQUIP, e ?? '');
export const levelLabel    = (l: string)             => localize(LEVELS, l);
export const mechanicLabel = (m: string | null)      => localize(MECHANIC, m ?? '');
export const forceLabel    = (f: string | null)      => localize(FORCE, f ?? '');
export const categoryLabel = (c: string)             => localize(CATEGORY, c);

// ──────────────────────────────────────────────────────────────────────────
// Instructions translation (regex-based, ~80% coverage, runs offline)
// ──────────────────────────────────────────────────────────────────────────

type Phrase = [RegExp, string];

const FR_PHRASES: Phrase[] = [
  [/\bThis will be your starting position\b/gi, 'C\'est ta position de départ'],
  [/\bbeginning position\b/gi, 'position de départ'],
  [/\bstarting position\b/gi, 'position de départ'],
  [/\bRepeat for the recommended amount of repetitions\b/gi, 'Répète le nombre de répétitions souhaité'],
  [/\bRepeat for the desired number of repetitions\b/gi, 'Répète le nombre de répétitions souhaité'],
  [/\bRepeat for [\w\s]+repetitions\b/gi, 'Répète l\'exercice'],
  [/\bRepeat\b/gi, 'Répète'],
  [/\bAt the same time\b/gi, 'En même temps'],
  [/\bAfter a (?:second|brief) pause\b/gi, 'Après une courte pause'],
  [/\bLie face down\b/gi, 'Allonge-toi face contre le sol'],
  [/\bLie flat\b/gi, 'Allonge-toi à plat'],
  [/\bLie (?:down )?(?:on (?:the|your))?\b/gi, 'Allonge-toi'],
  [/\bSit (?:down )?(?:on)?\b/gi, 'Assieds-toi'],
  [/\bStand (?:up )?(?:with)?\b/gi, 'Tiens-toi debout'],
  [/\bGrasp\b/gi, 'Saisis'],
  [/\bGrab\b/gi, 'Saisis'],
  [/\bHold\b/gi, 'Tiens'],
  [/\bInhale\b/gi, 'Inspire'],
  [/\bExhale\b/gi, 'Expire'],
  [/\bBreathe out\b/gi, 'Expire'],
  [/\bBreathe in\b/gi, 'Inspire'],
  [/\bSlowly\b/gi, 'Lentement'],
  [/\bLower\b/gi, 'Abaisse'],
  [/\bRaise\b/gi, 'Lève'],
  [/\bLift\b/gi, 'Soulève'],
  [/\bPress\b/gi, 'Appuie'],
  [/\bPush\b/gi, 'Pousse'],
  [/\bPull\b/gi, 'Tire'],
  [/\bSqueeze\b/gi, 'Contracte'],
  [/\bExtend\b/gi, 'Étends'],
  [/\bBend\b/gi, 'Plie'],
  [/\bRotate\b/gi, 'Tourne'],
  [/\bEngage\b/gi, 'Engage'],
  [/\bPause\b/gi, 'Pause'],
  [/\bReturn to the starting position\b/gi, 'Reviens à la position de départ'],
  [/\bReturn\b/gi, 'Reviens'],
  [/\bshoulders?\b/gi, 'épaules'],
  [/\bchest\b/gi, 'poitrine'],
  [/\bback\b/gi, 'dos'],
  [/\bhead\b/gi, 'tête'],
  [/\bknees?\b/gi, 'genoux'],
  [/\bhips?\b/gi, 'hanches'],
  [/\belbows?\b/gi, 'coudes'],
  [/\bfeet\b/gi, 'pieds'],
  [/\bfoot\b/gi, 'pied'],
  [/\bhands?\b/gi, 'mains'],
  [/\barms?\b/gi, 'bras'],
  [/\blegs?\b/gi, 'jambes'],
  [/\babs\b/gi, 'abdos'],
  [/\bcore\b/gi, 'gainage'],
  [/\bbarbell\b/gi, 'barre'],
  [/\bdumbbells?\b/gi, 'haltère'],
  [/\bbench\b/gi, 'banc'],
  [/\bcable\b/gi, 'câble'],
  [/\bmachine\b/gi, 'machine'],
  [/\bweight\b/gi, 'charge'],
  [/\bbar\b/gi, 'barre'],
  [/\bshoulder[- ]width\b/gi, 'largeur d\'épaules'],
  [/\bovergrip\b/gi, 'prise pronation'],
  [/\bundergrip\b/gi, 'prise supination'],
  [/\bgrip\b/gi, 'prise'],
  [/\bperpendicular to\b/gi, 'perpendiculaire à'],
  [/\bstraight\b/gi, 'droit'],
  [/\bbent\b/gi, 'plié'],
  [/\btorso\b/gi, 'torse'],
  [/\bcontraction\b/gi, 'contraction'],
  [/\brepetitions?\b/gi, 'répétitions'],
  [/\breps?\b/gi, 'répétitions'],
  [/\bset\b/gi, 'série'],
];

const ES_PHRASES: Phrase[] = [
  [/\bThis will be your starting position\b/gi, 'Esta es tu posición de inicio'],
  [/\bstarting position\b/gi, 'posición de inicio'],
  [/\bRepeat for the recommended amount of repetitions\b/gi, 'Repite el número de repeticiones recomendado'],
  [/\bRepeat for the desired number of repetitions\b/gi, 'Repite el número de repeticiones deseado'],
  [/\bRepeat\b/gi, 'Repite'],
  [/\bLie face down\b/gi, 'Túmbate boca abajo'],
  [/\bLie flat\b/gi, 'Túmbate plano'],
  [/\bLie (?:down )?(?:on (?:the|your))?\b/gi, 'Túmbate'],
  [/\bSit (?:down )?(?:on)?\b/gi, 'Siéntate'],
  [/\bStand (?:up )?(?:with)?\b/gi, 'Ponte de pie'],
  [/\bGrasp\b/gi, 'Agarra'],
  [/\bGrab\b/gi, 'Agarra'],
  [/\bHold\b/gi, 'Sujeta'],
  [/\bInhale\b/gi, 'Inhala'],
  [/\bExhale\b/gi, 'Exhala'],
  [/\bBreathe out\b/gi, 'Exhala'],
  [/\bBreathe in\b/gi, 'Inhala'],
  [/\bSlowly\b/gi, 'Lentamente'],
  [/\bLower\b/gi, 'Baja'],
  [/\bRaise\b/gi, 'Sube'],
  [/\bLift\b/gi, 'Levanta'],
  [/\bPush\b/gi, 'Empuja'],
  [/\bPull\b/gi, 'Tira'],
  [/\bSqueeze\b/gi, 'Contrae'],
  [/\bExtend\b/gi, 'Extiende'],
  [/\bBend\b/gi, 'Flexiona'],
  [/\bEngage\b/gi, 'Activa'],
  [/\bReturn to the starting position\b/gi, 'Vuelve a la posición de inicio'],
  [/\bReturn\b/gi, 'Vuelve'],
  [/\bshoulders?\b/gi, 'hombros'],
  [/\bchest\b/gi, 'pecho'],
  [/\bback\b/gi, 'espalda'],
  [/\bknees?\b/gi, 'rodillas'],
  [/\bhips?\b/gi, 'caderas'],
  [/\belbows?\b/gi, 'codos'],
  [/\bfeet\b/gi, 'pies'],
  [/\bhands?\b/gi, 'manos'],
  [/\barms?\b/gi, 'brazos'],
  [/\blegs?\b/gi, 'piernas'],
  [/\babs\b/gi, 'abdominales'],
  [/\bbarbell\b/gi, 'barra'],
  [/\bdumbbells?\b/gi, 'mancuerna'],
  [/\bbench\b/gi, 'banco'],
  [/\bcable\b/gi, 'cable'],
  [/\bmachine\b/gi, 'máquina'],
  [/\bweight\b/gi, 'peso'],
  [/\brepetitions?\b/gi, 'repeticiones'],
  [/\breps?\b/gi, 'repeticiones'],
];

export function localizeInstructions(steps: string[]): string[] {
  const lang = getLang();
  if (lang === 'en') return steps;
  const phrases = lang === 'fr' ? FR_PHRASES : ES_PHRASES;
  return steps.map((step) => {
    let out = step;
    for (const [re, rep] of phrases) out = out.replace(re, rep);
    return out;
  });
}

// Backwards-compat shims
export const muscleFr = (m: string) => muscleLabel(m);
export const equipFr  = (e: string) => equipLabel(e);
