// Free Exercise DB integration — open-source dataset of 870+ exercises with
// images, instructions, primary/secondary muscles & equipment.
// Source: https://github.com/yuhonas/free-exercise-db (MIT)

import { getLang, type Lang } from './i18n';

const DATASET_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMAGE_BASE  = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

const CACHE_KEY    = 'rzk_fxdb_v1';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface FxExercise {
  id: string;
  name: string;
  force: 'pull' | 'push' | 'static' | null;
  level: 'beginner' | 'intermediate' | 'expert';
  mechanic: 'compound' | 'isolation' | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
}

let cache: FxExercise[] | null = null;
let pending: Promise<FxExercise[]> | null = null;

async function loadDataset(): Promise<FxExercise[]> {
  if (cache) return cache;
  if (pending) return pending;

  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts < CACHE_TTL_MS && Array.isArray(data) && data.length > 0) {
        cache = data;
        return data;
      }
    }
  } catch { /* ignore */ }

  pending = fetch(DATASET_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`fxdb ${r.status}`);
      return r.json();
    })
    .then((arr: FxExercise[]) => {
      cache = arr;
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: arr, ts: Date.now() }));
      } catch { /* quota */ }
      return arr;
    })
    .finally(() => { pending = null; });
  return pending;
}

// FR/ES → EN translation map for fuzzy lookup against the English-only dataset.
const FR_EN: Record<string, string> = {
  // Pectoraux
  'développé couché':         'bench press',
  'développé incliné':        'incline bench press',
  'développé décliné':        'decline bench press',
  'développé haltère':        'dumbbell bench press',
  'écarté':                   'fly',
  'fly câble':                'cable crossover',
  'cable fly':                'cable crossover',
  'fly haltère':              'dumbbell fly',
  'pompes':                   'pushups',
  'push up':                  'pushups',
  'dips':                     'dips',
  // Épaules
  'développé épaule':         'overhead press',
  'développé militaire':      'overhead press',
  'overhead press':           'overhead press',
  'shoulder press':           'shoulder press',
  'élévation latérale':       'side lateral raise',
  'élévation latérale haltère':'side lateral raise',
  'élévation frontale':       'front dumbbell raise',
  'face pull':                'face pull',
  'arnold press':             'arnold press',
  'shrug':                    'barbell shrug',
  'haussement épaule':        'barbell shrug',
  // Dos
  'traction':                 'pullups',
  'tractions':                'pullups',
  'pull up':                  'pullups',
  'chin up':                  'chin-up',
  'tirage vertical':          'wide-grip lat pulldown',
  'lat pulldown':             'wide-grip lat pulldown',
  'rowing barre':             'bent over barbell row',
  'bent over row':            'bent over barbell row',
  'rowing haltère':           'one-arm dumbbell row',
  'one arm row':              'one-arm dumbbell row',
  'tirage horizontal':        'seated cable row',
  'seated row':               'seated cable row',
  't-bar row':                't-bar row with handle',
  'soulevé de terre':         'barbell deadlift',
  'deadlift':                 'barbell deadlift',
  // Biceps
  'curl barre':               'barbell curl',
  'barbell curl':             'barbell curl',
  'curl haltère':             'dumbbell bicep curl',
  'dumbbell curl':            'dumbbell bicep curl',
  'curl marteau':             'hammer curls',
  'hammer curl':              'hammer curls',
  'curl pupitre':             'preacher curl',
  'preacher curl':            'preacher curl',
  'curl concentration':       'concentration curls',
  'curl câble':               'cable curl',
  // Triceps
  'pushdown':                 'tricep dumbbell kickback',
  'extension triceps':        'tricep dumbbell kickback',
  'skull crusher':            'lying triceps press',
  'overhead triceps':         'standing dumbbell triceps extension',
  'extension triceps poulie': 'triceps pushdown',
  // Jambes
  'squat':                    'barbell squat',
  'squat barre':              'barbell squat',
  'front squat':              'front barbell squat',
  'hack squat':               'hack squat',
  'leg press':                'leg press',
  'presse à cuisses':         'leg press',
  'fentes':                   'dumbbell lunges',
  'lunge':                    'dumbbell lunges',
  'leg extension':            'leg extensions',
  'leg curl':                 'leg curls',
  'hip thrust':               'glute bridge',
  'mollets':                  'standing calf raises',
  'calf raise':               'standing calf raises',
  'soulevé roumain':          'romanian deadlift',
  'romanian deadlift':        'romanian deadlift',
  // Abdos
  'crunch':                   'crunches',
  'sit-up':                   '3/4 sit-up',
  'gainage':                  'plank',
  'plank':                    'plank',
  'leg raise':                'hanging leg raise',
  'russian twist':            'russian twist',
  // Avant-bras
  'wrist curl':               'wrist roller',
};

function toEnglishSearch(name: string): string {
  const lower = name.toLowerCase().trim();
  if (FR_EN[lower]) return FR_EN[lower];
  for (const [fr, en] of Object.entries(FR_EN)) {
    if (lower.includes(fr)) return en;
  }
  return name;
}

export async function findFxExercise(name: string): Promise<FxExercise | null> {
  let list: FxExercise[];
  try {
    list = await loadDataset();
  } catch {
    return null;
  }
  const lower = name.toLowerCase().trim();

  // 1. Exact match
  const exact = list.find((e) => e.name.toLowerCase() === lower);
  if (exact) return exact;

  // 2. FR → EN
  const en = toEnglishSearch(name).toLowerCase();
  if (en !== lower) {
    const fromFr = list.find((e) => e.name.toLowerCase() === en);
    if (fromFr) return fromFr;
    const partial = list.find((e) => e.name.toLowerCase().includes(en) || en.includes(e.name.toLowerCase()));
    if (partial) return partial;
  }

  // 3. Substring fuzzy on raw input
  return list.find((e) => {
    const en = e.name.toLowerCase();
    return en.includes(lower) || lower.includes(en);
  }) || null;
}

export function fxImageUrl(image: string): string {
  return IMAGE_BASE + encodeURI(image);
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
};

const EQUIP: Record<string, Record<Lang, string>> = {
  'body only':       { fr: 'Poids du corps',  en: 'Bodyweight',     es: 'Peso corporal'  },
  machine:           { fr: 'Machine',          en: 'Machine',        es: 'Máquina'        },
  dumbbell:          { fr: 'Haltères',         en: 'Dumbbell',       es: 'Mancuernas'     },
  barbell:           { fr: 'Barre',            en: 'Barbell',        es: 'Barra'          },
  cable:             { fr: 'Câble',            en: 'Cable',          es: 'Cable'          },
  kettlebell:        { fr: 'Kettlebell',       en: 'Kettlebell',     es: 'Pesa rusa'      },
  bands:             { fr: 'Élastiques',       en: 'Bands',          es: 'Bandas'         },
  'foam roll':       { fr: 'Foam roller',      en: 'Foam roller',    es: 'Rodillo'        },
  'medicine ball':   { fr: 'Médecine ball',    en: 'Medicine ball',  es: 'Balón medicinal'},
  'exercise ball':   { fr: 'Swiss ball',       en: 'Stability ball', es: 'Pelota suiza'   },
  'e-z curl bar':    { fr: 'Barre EZ',         en: 'EZ-curl bar',    es: 'Barra Z'        },
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
// Instructions translation: cheap dictionary lookup.
// Free Exercise DB instructions are English only, so for FR/ES we run a list of
// regex replacements to localize the most common gym verbs and nouns. It's not
// LLM-quality but covers ~80% of cases readably and runs offline.
// ──────────────────────────────────────────────────────────────────────────

type Phrase = [RegExp, string];

const FR_PHRASES: Phrase[] = [
  // Pronouns / connectors
  [/\bThis will be your starting position\b/gi, 'C\'est ta position de départ'],
  [/\bbeginning position\b/gi, 'position de départ'],
  [/\bstarting position\b/gi, 'position de départ'],
  [/\bRepeat for the recommended amount of repetitions\b/gi, 'Répète le nombre de répétitions souhaité'],
  [/\bRepeat for [\w\s]+repetitions\b/gi, 'Répète l\'exercice'],
  [/\bRepeat\b/gi, 'Répète'],
  [/\bAt the same time\b/gi, 'En même temps'],
  [/\bAfter a (?:second|brief) pause\b/gi, 'Après une courte pause'],
  // Verbs
  [/\bLie (?:down )?(?:on (?:the|your))?\b/gi, 'Allonge-toi'],
  [/\bSit (?:down )?(?:on)?\b/gi, 'Assieds-toi'],
  [/\bStand (?:up )?(?:with)?\b/gi, 'Tiens-toi debout'],
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
  [/\bPush\b/gi, 'Pousse'],
  [/\bPull\b/gi, 'Tire'],
  [/\bSqueeze\b/gi, 'Contracte'],
  [/\bExtend\b/gi, 'Étends'],
  [/\bBend\b/gi, 'Plie'],
  [/\bRotate\b/gi, 'Tourne'],
  [/\bReturn to the starting position\b/gi, 'Reviens à la position de départ'],
  [/\bReturn\b/gi, 'Reviens'],
  // Body parts
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
  // Equipment
  [/\bbarbell\b/gi, 'barre'],
  [/\bdumbbells?\b/gi, 'haltère'],
  [/\bbench\b/gi, 'banc'],
  [/\bcable\b/gi, 'câble'],
  [/\bmachine\b/gi, 'machine'],
  [/\bweight\b/gi, 'charge'],
  [/\bbar\b/gi, 'barre'],
  // Common adjectives / adverbs
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
  [/\bRepeat\b/gi, 'Repite'],
  [/\bLie (?:down )?(?:on (?:the|your))?\b/gi, 'Túmbate'],
  [/\bSit (?:down )?(?:on)?\b/gi, 'Siéntate'],
  [/\bStand (?:up )?(?:with)?\b/gi, 'Ponte de pie'],
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

// ──────────────────────────────────────────────────────────────────────────
// Backwards-compat shims for existing components (will be removed once all
// refs are migrated). They route old wger calls to the new dataset.
// ──────────────────────────────────────────────────────────────────────────

export const muscleFr = (m: string) => muscleLabel(m);
export const equipFr  = (e: string) => equipLabel(e);
