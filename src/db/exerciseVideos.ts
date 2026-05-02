// Curated YouTube video IDs per exercise — best technique demos picked manually.
// Pattern matching is fuzzy: we lowercase + check substring inclusion.
// Used by ExerciseTracker info modal to embed a thumbnail + play button.

export interface ExerciseVideo {
  id: string;     // YouTube video ID
  title: string;  // Display title
  channel: string;
}

// Each entry: keyword → video. Match is "exercise name lowercased CONTAINS keyword"
// OR "keyword CONTAINS exercise name lowercased" (whichever matches first wins).
const VIDEOS: Array<{ keywords: string[]; video: ExerciseVideo }> = [
  // ─── PECS ────────────────────────────────────────────────────────────────
  { keywords: ['développé couché', 'bench press'], video: { id: 'rT7DgCr-3pg', title: 'Développé couché — technique', channel: 'Athlean-X' }},
  { keywords: ['développé incliné', 'incline bench'], video: { id: '8iPEnn-ltC8', title: 'Développé incliné', channel: 'Jeff Nippard' }},
  { keywords: ['développé décliné', 'decline bench'], video: { id: 'LfyQBUKR8SE', title: 'Développé décliné', channel: 'ScottHermanFitness' }},
  { keywords: ['fly câble', 'cable fly', 'crossover'], video: { id: 'taI4XduLpTk', title: 'Cable Fly / Crossover', channel: 'Jeff Nippard' }},
  { keywords: ['fly haltère', 'dumbbell fly', 'écarté'], video: { id: 'eozdVDA78K0', title: 'Dumbbell Fly', channel: 'Athlean-X' }},
  { keywords: ['pompes', 'push up', 'push-up'], video: { id: 'IODxDxX7oi4', title: 'Push-up parfait', channel: 'Athlean-X' }},
  { keywords: ['dips'], video: { id: 'wjUmnZH528Y', title: 'Dips poitrine vs triceps', channel: 'Jeff Nippard' }},

  // ─── ÉPAULES ─────────────────────────────────────────────────────────────
  { keywords: ['développé épaule', 'overhead press', 'développé militaire', 'shoulder press'], video: { id: '2yjwXTZQDDI', title: 'Overhead Press', channel: 'Jeff Nippard' }},
  { keywords: ['élévation latérale', 'lateral raise'], video: { id: '3VcKaXpzqRo', title: 'Lateral Raise', channel: 'Jeff Nippard' }},
  { keywords: ['élévation frontale', 'front raise'], video: { id: '-t7fuZ0KhDA', title: 'Front Raise', channel: 'ScottHermanFitness' }},
  { keywords: ['face pull'], video: { id: 'rep-qVOkqgk', title: 'Face Pull', channel: 'Jeff Nippard' }},
  { keywords: ['arnold press'], video: { id: '6Z15_WdXmVw', title: 'Arnold Press', channel: 'Jeff Nippard' }},
  { keywords: ['shrug', 'haussement'], video: { id: 'cJRVVxmytaM', title: 'Shrugs trapèzes', channel: 'Jeff Nippard' }},

  // ─── DOS ─────────────────────────────────────────────────────────────────
  { keywords: ['traction', 'pull up', 'pull-up'], video: { id: 'eGo4IYlbE5g', title: 'Pull-up technique', channel: 'Athlean-X' }},
  { keywords: ['chin up', 'chin-up'], video: { id: 'b-ztMQpj8yc', title: 'Chin-up', channel: 'ScottHermanFitness' }},
  { keywords: ['lat pulldown', 'tirage vertical', 'tirage poulie haute'], video: { id: 'CAwf7n6Luuc', title: 'Lat Pulldown', channel: 'Jeff Nippard' }},
  { keywords: ['rowing barre', 'bent over row', 'tirage horizontal barre'], video: { id: 'kBWAon7ItDw', title: 'Bent Over Row', channel: 'Jeff Nippard' }},
  { keywords: ['rowing haltère', 'one arm row', 'tirage 1 bras'], video: { id: 'DMo3HJoawrU', title: 'One-Arm Dumbbell Row', channel: 'Jeff Nippard' }},
  { keywords: ['seated row', 'tirage assis'], video: { id: 'GZbfZ033f74', title: 'Seated Cable Row', channel: 'ScottHermanFitness' }},
  { keywords: ['t-bar row', 't bar row'], video: { id: 'j3Igk5nyZE4', title: 'T-Bar Row', channel: 'Jeff Nippard' }},
  { keywords: ['back extension', 'hyperextension'], video: { id: 'ph3pddpKzzw', title: 'Back Extension', channel: 'Jeff Nippard' }},

  // ─── BICEPS ──────────────────────────────────────────────────────────────
  { keywords: ['curl barre', 'barbell curl'], video: { id: 'kwG2ipFRgfo', title: 'Barbell Curl', channel: 'Jeff Nippard' }},
  { keywords: ['curl haltère', 'dumbbell curl'], video: { id: 'ykJmrZ5v0Oo', title: 'Dumbbell Curl', channel: 'Jeff Nippard' }},
  { keywords: ['curl marteau', 'hammer curl'], video: { id: 'CFBZ4jN1CMI', title: 'Hammer Curl', channel: 'Jeff Nippard' }},
  { keywords: ['curl ez', 'ez curl', 'curl pupitre', 'preacher curl'], video: { id: 'fIWP-FRFNU0', title: 'Preacher Curl', channel: 'ScottHermanFitness' }},
  { keywords: ['curl câble', 'cable curl'], video: { id: '85ZeVL_iqu8', title: 'Cable Curl', channel: 'ScottHermanFitness' }},
  { keywords: ['curl concentration'], video: { id: '0AUGkch3tzc', title: 'Concentration Curl', channel: 'ScottHermanFitness' }},

  // ─── TRICEPS ─────────────────────────────────────────────────────────────
  { keywords: ['pushdown', 'extension triceps poulie', 'triceps poulie'], video: { id: '2-LAMcpzODU', title: 'Tricep Pushdown', channel: 'Jeff Nippard' }},
  { keywords: ['skull crusher', 'extension triceps couché'], video: { id: 'd_KZxkY_0cM', title: 'Skull Crushers', channel: 'Jeff Nippard' }},
  { keywords: ['extension triceps haltère', 'overhead extension'], video: { id: 'YbX7Wd8jQ-Q', title: 'Overhead Tricep Extension', channel: 'Athlean-X' }},
  { keywords: ['développé serré', 'close grip bench'], video: { id: 'nEF0bv2FW94', title: 'Close-Grip Bench Press', channel: 'Jeff Nippard' }},
  { keywords: ['kickback'], video: { id: '6SS6K3lAwZ8', title: 'Tricep Kickback', channel: 'ScottHermanFitness' }},

  // ─── JAMBES ──────────────────────────────────────────────────────────────
  { keywords: ['squat barre', 'back squat', 'squat'], video: { id: 'gsNoPYwWXeM', title: 'Squat — technique', channel: 'Athlean-X' }},
  { keywords: ['front squat'], video: { id: 'tlfahNdNPPI', title: 'Front Squat', channel: 'Jeff Nippard' }},
  { keywords: ['hack squat'], video: { id: 'l7E-q15RJWY', title: 'Hack Squat', channel: 'Jeff Nippard' }},
  { keywords: ['leg press'], video: { id: 'IZxyjW7MPJQ', title: 'Leg Press', channel: 'Jeff Nippard' }},
  { keywords: ['soulevé de terre', 'deadlift'], video: { id: '1ZXobu7JvvE', title: 'Deadlift', channel: 'Athlean-X' }},
  { keywords: ['romanian deadlift', 'rdl', 'soulevé jambes tendues'], video: { id: '7AsZhVYU8Q0', title: 'Romanian Deadlift', channel: 'Jeff Nippard' }},
  { keywords: ['leg extension'], video: { id: 'YyvSfVjQeL0', title: 'Leg Extension', channel: 'Jeff Nippard' }},
  { keywords: ['leg curl'], video: { id: '1Tq3QdYUuHs', title: 'Leg Curl', channel: 'Jeff Nippard' }},
  { keywords: ['fente', 'lunge'], video: { id: 'QOVaHwm-Q6U', title: 'Lunges', channel: 'Athlean-X' }},
  { keywords: ['hip thrust'], video: { id: 'xDmFkJxPzeM', title: 'Hip Thrust', channel: 'Jeff Nippard' }},
  { keywords: ['glute bridge', 'pont fessier'], video: { id: 'wPM8icPu6H8', title: 'Glute Bridge', channel: 'Jeff Nippard' }},
  { keywords: ['mollets', 'calf raise'], video: { id: 'gwLzBJYoWlI', title: 'Calf Raises', channel: 'Jeff Nippard' }},

  // ─── ABDOS / CORE ────────────────────────────────────────────────────────
  { keywords: ['gainage', 'plank', 'planche'], video: { id: 'pSHjTRCQxIw', title: 'Plank', channel: 'Athlean-X' }},
  { keywords: ['crunch'], video: { id: 'Xyd_fa5zoEU', title: 'Crunch', channel: 'Jeff Nippard' }},
  { keywords: ['relevé jambes', 'leg raise'], video: { id: 'Pr1ieGZ5atk', title: 'Hanging Leg Raise', channel: 'Jeff Nippard' }},
  { keywords: ['russian twist'], video: { id: 'wkD8rjkodUI', title: 'Russian Twist', channel: 'ScottHermanFitness' }},
  { keywords: ['mountain climber'], video: { id: 'nmwgirgXLYM', title: 'Mountain Climber', channel: 'Athlean-X' }},
  { keywords: ['ab wheel', 'roue abdo'], video: { id: 'DwoP0Es6T_g', title: 'Ab Wheel Rollout', channel: 'Jeff Nippard' }},

  // ─── CARDIO / FULL BODY ──────────────────────────────────────────────────
  { keywords: ['burpee'], video: { id: 'TU8QYVW0gDU', title: 'Burpee', channel: 'Athlean-X' }},
  { keywords: ['jumping jack'], video: { id: 'iSSAk4XCsRA', title: 'Jumping Jacks', channel: 'NHS' }},
  { keywords: ['box jump'], video: { id: '52r_Ul5k03g', title: 'Box Jump', channel: 'Jeff Cavaliere' }},
];

/**
 * Find the best YouTube video match for an exercise name.
 * Returns null if no keyword matches.
 */
export function findExerciseVideo(exerciseName: string): ExerciseVideo | null {
  const name = exerciseName.toLowerCase().trim();
  if (!name) return null;

  // Score each entry by longest matching keyword
  let best: { score: number; video: ExerciseVideo } | null = null;

  for (const entry of VIDEOS) {
    for (const kw of entry.keywords) {
      const k = kw.toLowerCase();
      if (name.includes(k) || k.includes(name)) {
        const score = Math.min(name.length, k.length); // longer match = more specific
        if (!best || score > best.score) {
          best = { score, video: entry.video };
        }
      }
    }
  }

  return best?.video ?? null;
}

/**
 * Build a YouTube thumbnail URL from a video ID.
 * Quality: hqdefault (480x360), mqdefault (320x180), maxresdefault (1280x720)
 */
export function ytThumb(videoId: string, quality: 'hq' | 'mq' | 'max' = 'hq'): string {
  const q = quality === 'hq' ? 'hqdefault' : quality === 'mq' ? 'mqdefault' : 'maxresdefault';
  return `https://i.ytimg.com/vi/${videoId}/${q}.jpg`;
}

export function ytWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
