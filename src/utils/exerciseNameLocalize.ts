// Localizes hard-coded French exercise names from seedTemplates / EXERCISE_INFO
// to the active language. Falls back to the original string if no translation
// is found — so user-created custom exercises stay untouched.

import { getLang } from './i18n';

type Tri = { fr: string; en: string; es: string };

const NAME_MAP: Record<string, Tri> = {
  // Pectoraux
  'développé couché smith':       { fr: 'Développé couché Smith',       en: 'Smith Bench Press',         es: 'Press banca Smith'        },
  'développé incliné smith':      { fr: 'Développé incliné Smith',      en: 'Incline Smith Bench',       es: 'Press inclinado Smith'    },
  'fly câble haut':               { fr: 'Fly câble haut',               en: 'High Cable Fly',            es: 'Aperturas cable alto'     },
  'fly câble bas':                { fr: 'Fly câble bas',                en: 'Low Cable Fly',             es: 'Aperturas cable bajo'     },
  'développé couché':             { fr: 'Développé couché',             en: 'Bench Press',               es: 'Press banca'              },
  // Épaules
  'développé épaule machine':     { fr: 'Développé épaule machine',     en: 'Machine Shoulder Press',    es: 'Press hombro máquina'     },
  'élévations latérales câble':   { fr: 'Élévations latérales câble',   en: 'Cable Lateral Raises',      es: 'Elevaciones laterales cable' },
  'face pull corde':              { fr: 'Face Pull corde',              en: 'Rope Face Pull',            es: 'Face Pull cuerda'         },
  // Triceps
  'pushdown corde':               { fr: 'Pushdown corde',               en: 'Rope Pushdown',             es: 'Pushdown cuerda'          },
  'extension triceps câble bas':  { fr: 'Extension triceps câble bas',  en: 'Low Cable Triceps Extension', es: 'Extensión tríceps cable bajo' },
  'skull crushers':               { fr: 'Skull Crushers',               en: 'Skull Crushers',            es: 'Skull Crushers'           },
  // Dos
  'tractions rest-pause':         { fr: 'Tractions rest-pause',         en: 'Pull-ups rest-pause',       es: 'Dominadas rest-pause'     },
  'lat pulldown prise large':     { fr: 'Lat Pulldown prise large',     en: 'Wide-Grip Lat Pulldown',    es: 'Jalón agarre ancho'       },
  'seated row':                   { fr: 'Seated Row',                   en: 'Seated Row',                es: 'Remo sentado'             },
  // Biceps
  'curl ez prise marteau':        { fr: 'Curl EZ prise marteau',        en: 'EZ Hammer Curl',            es: 'Curl EZ martillo'         },
  'curl câble barre droite':      { fr: 'Curl câble barre droite',      en: 'Straight-Bar Cable Curl',   es: 'Curl cable barra recta'   },
  'machine curl biceps':          { fr: 'Machine curl biceps',          en: 'Machine Biceps Curl',       es: 'Máquina curl bíceps'      },
  // Jambes
  'hack squat':                   { fr: 'Hack Squat',                   en: 'Hack Squat',                es: 'Hack Squat'               },
  'leg extension':                { fr: 'Leg Extension',                en: 'Leg Extension',             es: 'Extensión de piernas'     },
  'leg curl assis':               { fr: 'Leg Curl assis',               en: 'Seated Leg Curl',           es: 'Curl pierna sentado'      },
  'mollets debout machine':       { fr: 'Mollets debout machine',       en: 'Standing Calf Raise',       es: 'Gemelos de pie máquina'   },
  'back extension':               { fr: 'Back Extension',               en: 'Back Extension',            es: 'Hiperextensión'           },
};

export function localizeExerciseName(name: string): string {
  const entry = NAME_MAP[name.toLowerCase()];
  if (!entry) return name;
  return entry[getLang()];
}

// Localizes a session type label (push/pull/legs/upper/lower)
export function localizeSessionType(type: string): string {
  const lang = getLang();
  const map: Record<string, Tri> = {
    push:  { fr: 'PUSH',   en: 'PUSH',  es: 'PUSH'  },
    pull:  { fr: 'PULL',   en: 'PULL',  es: 'PULL'  },
    legs:  { fr: 'JAMBES', en: 'LEGS',  es: 'PIERNAS' },
    upper: { fr: 'UPPER',  en: 'UPPER', es: 'UPPER' },
    lower: { fr: 'LOWER',  en: 'LOWER', es: 'LOWER' },
  };
  return map[type.toLowerCase()]?.[lang] ?? type.toUpperCase();
}

// Localizes a template name (PUSH/PULL/JAMBES are the seed defaults).
export function localizeTemplateName(name: string): string {
  const lang = getLang();
  const map: Record<string, Tri> = {
    push:   { fr: 'PUSH',   en: 'PUSH',    es: 'PUSH'    },
    pull:   { fr: 'PULL',   en: 'PULL',    es: 'PULL'    },
    jambes: { fr: 'JAMBES', en: 'LEGS',    es: 'PIERNAS' },
    upper:  { fr: 'UPPER',  en: 'UPPER',   es: 'UPPER'   },
    lower:  { fr: 'LOWER',  en: 'LOWER',   es: 'LOWER'   },
  };
  return map[name.toLowerCase()]?.[lang] ?? name;
}
