import type { ExerciseLog } from '../types';

interface MuscleMapProps {
  exercises: ExerciseLog[];
  size?: number;
}

const EXO_TO_MUSCLES: Record<string, string[]> = {
  chest:     ['pectoral_l', 'pectoral_r'],
  back:      ['traps', 'lats_l', 'lats_r', 'lower_back'],
  shoulders: ['deltoid_l', 'deltoid_r', 'rear_delt_l', 'rear_delt_r'],
  biceps:    ['biceps_l', 'biceps_r'],
  triceps:   ['triceps_l', 'triceps_r'],
  forearms:  ['forearm_l', 'forearm_r', 'forearm_lb', 'forearm_rb'],
  legs:      ['quad_l', 'quad_r', 'hamstring_l', 'hamstring_r', 'glute_l', 'glute_r'],
  calves:    ['calf_l', 'calf_r'],
  core:      ['abs', 'obliques_l', 'obliques_r'],
};

function intensityColor(intensity: number): string {
  if (intensity <= 0) return 'rgba(255,255,255,0.06)';
  if (intensity < 0.25) return 'rgba(255,107,53,0.35)';
  if (intensity < 0.5) return 'rgba(255,107,53,0.6)';
  if (intensity < 0.75) return 'rgba(255,90,30,0.85)';
  return 'rgba(196,30,58,1)';
}

export default function MuscleMap({ exercises, size = 280 }: MuscleMapProps) {
  const volumeByGroup: Record<string, number> = {};
  exercises.forEach((ex) => {
    const vol = ex.sets.reduce((s, st) => s + (st.weight || 1) * st.reps, 0);
    volumeByGroup[ex.muscleGroup] = (volumeByGroup[ex.muscleGroup] || 0) + Math.max(vol, 1);
  });

  const maxVol = Math.max(1, ...Object.values(volumeByGroup));
  const intensityByMuscle: Record<string, number> = {};
  Object.entries(volumeByGroup).forEach(([group, vol]) => {
    const muscles = EXO_TO_MUSCLES[group] || [];
    const intensity = vol / maxVol;
    muscles.forEach((m) => {
      intensityByMuscle[m] = Math.max(intensityByMuscle[m] || 0, intensity);
    });
  });

  const fill = (id: string) => intensityColor(intensityByMuscle[id] || 0);
  const stroke = 'rgba(255,255,255,0.15)';
  const sw = 0.6;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
      {/* FRONT VIEW */}
      <svg viewBox="0 0 100 200" width={size / 2} height={size} style={{ flexShrink: 0 }}>
        {/* Head */}
        <ellipse cx="50" cy="14" rx="8" ry="10" fill="rgba(255,255,255,0.04)" stroke={stroke} strokeWidth={sw} />
        {/* Neck */}
        <rect x="46" y="22" width="8" height="6" fill="rgba(255,255,255,0.04)" stroke={stroke} strokeWidth={sw} />

        {/* Shoulders/Deltoids */}
        <ellipse cx="35" cy="34" rx="9" ry="7" fill={fill('deltoid_l')} stroke={stroke} strokeWidth={sw} />
        <ellipse cx="65" cy="34" rx="9" ry="7" fill={fill('deltoid_r')} stroke={stroke} strokeWidth={sw} />

        {/* Pectorals */}
        <path d="M 50 30 L 38 38 L 38 56 L 50 60 Z" fill={fill('pectoral_l')} stroke={stroke} strokeWidth={sw} />
        <path d="M 50 30 L 62 38 L 62 56 L 50 60 Z" fill={fill('pectoral_r')} stroke={stroke} strokeWidth={sw} />

        {/* Biceps */}
        <ellipse cx="29" cy="50" rx="5" ry="9" fill={fill('biceps_l')} stroke={stroke} strokeWidth={sw} />
        <ellipse cx="71" cy="50" rx="5" ry="9" fill={fill('biceps_r')} stroke={stroke} strokeWidth={sw} />

        {/* Forearms */}
        <ellipse cx="26" cy="68" rx="4.5" ry="9" fill={fill('forearm_l')} stroke={stroke} strokeWidth={sw} />
        <ellipse cx="74" cy="68" rx="4.5" ry="9" fill={fill('forearm_r')} stroke={stroke} strokeWidth={sw} />

        {/* Abs */}
        <rect x="42" y="60" width="16" height="28" rx="3" fill={fill('abs')} stroke={stroke} strokeWidth={sw} />
        <line x1="50" y1="62" x2="50" y2="86" stroke={stroke} strokeWidth={sw} />
        <line x1="42" y1="69" x2="58" y2="69" stroke={stroke} strokeWidth={sw} />
        <line x1="42" y1="76" x2="58" y2="76" stroke={stroke} strokeWidth={sw} />
        <line x1="42" y1="83" x2="58" y2="83" stroke={stroke} strokeWidth={sw} />

        {/* Obliques */}
        <path d="M 38 56 L 42 60 L 42 86 L 36 84 Z" fill={fill('obliques_l')} stroke={stroke} strokeWidth={sw} />
        <path d="M 62 56 L 58 60 L 58 86 L 64 84 Z" fill={fill('obliques_r')} stroke={stroke} strokeWidth={sw} />

        {/* Hips */}
        <path d="M 36 86 Q 50 90 64 86 L 64 96 L 36 96 Z" fill="rgba(255,255,255,0.04)" stroke={stroke} strokeWidth={sw} />

        {/* Quads */}
        <path d="M 38 96 L 48 96 L 46 145 L 36 145 Z" fill={fill('quad_l')} stroke={stroke} strokeWidth={sw} />
        <path d="M 62 96 L 52 96 L 54 145 L 64 145 Z" fill={fill('quad_r')} stroke={stroke} strokeWidth={sw} />

        {/* Knees */}
        <ellipse cx="41" cy="148" rx="5" ry="3" fill="rgba(255,255,255,0.04)" stroke={stroke} strokeWidth={sw} />
        <ellipse cx="59" cy="148" rx="5" ry="3" fill="rgba(255,255,255,0.04)" stroke={stroke} strokeWidth={sw} />

        {/* Calves (visible front lower leg) */}
        <path d="M 37 152 L 45 152 L 44 188 L 38 188 Z" fill={fill('calf_l')} stroke={stroke} strokeWidth={sw} />
        <path d="M 63 152 L 55 152 L 56 188 L 62 188 Z" fill={fill('calf_r')} stroke={stroke} strokeWidth={sw} />

        <text x="50" y="198" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="6" fontWeight="700" fontFamily="system-ui">FACE</text>
      </svg>

      {/* BACK VIEW */}
      <svg viewBox="0 0 100 200" width={size / 2} height={size} style={{ flexShrink: 0 }}>
        {/* Head */}
        <ellipse cx="50" cy="14" rx="8" ry="10" fill="rgba(255,255,255,0.04)" stroke={stroke} strokeWidth={sw} />
        {/* Neck */}
        <rect x="46" y="22" width="8" height="6" fill="rgba(255,255,255,0.04)" stroke={stroke} strokeWidth={sw} />

        {/* Traps */}
        <path d="M 42 26 L 58 26 L 62 36 L 38 36 Z" fill={fill('traps')} stroke={stroke} strokeWidth={sw} />

        {/* Rear delts */}
        <ellipse cx="33" cy="36" rx="7" ry="6" fill={fill('rear_delt_l')} stroke={stroke} strokeWidth={sw} />
        <ellipse cx="67" cy="36" rx="7" ry="6" fill={fill('rear_delt_r')} stroke={stroke} strokeWidth={sw} />

        {/* Lats */}
        <path d="M 38 38 L 50 42 L 50 70 L 36 64 Z" fill={fill('lats_l')} stroke={stroke} strokeWidth={sw} />
        <path d="M 62 38 L 50 42 L 50 70 L 64 64 Z" fill={fill('lats_r')} stroke={stroke} strokeWidth={sw} />

        {/* Triceps */}
        <ellipse cx="29" cy="50" rx="5" ry="10" fill={fill('triceps_l')} stroke={stroke} strokeWidth={sw} />
        <ellipse cx="71" cy="50" rx="5" ry="10" fill={fill('triceps_r')} stroke={stroke} strokeWidth={sw} />

        {/* Forearms back */}
        <ellipse cx="26" cy="68" rx="4.5" ry="9" fill={fill('forearm_lb')} stroke={stroke} strokeWidth={sw} />
        <ellipse cx="74" cy="68" rx="4.5" ry="9" fill={fill('forearm_rb')} stroke={stroke} strokeWidth={sw} />

        {/* Lower back */}
        <path d="M 40 70 L 60 70 L 58 86 L 42 86 Z" fill={fill('lower_back')} stroke={stroke} strokeWidth={sw} />

        {/* Glutes */}
        <path d="M 36 86 Q 50 92 64 86 L 64 100 Q 50 104 36 100 Z" fill={fill('glute_l')} stroke={stroke} strokeWidth={sw} />
        <line x1="50" y1="88" x2="50" y2="103" stroke={stroke} strokeWidth={sw} />

        {/* Hamstrings */}
        <path d="M 38 100 L 48 100 L 46 145 L 36 145 Z" fill={fill('hamstring_l')} stroke={stroke} strokeWidth={sw} />
        <path d="M 62 100 L 52 100 L 54 145 L 64 145 Z" fill={fill('hamstring_r')} stroke={stroke} strokeWidth={sw} />

        {/* Calves */}
        <path d="M 37 150 L 45 150 L 44 188 L 38 188 Z" fill={fill('calf_l')} stroke={stroke} strokeWidth={sw} />
        <path d="M 63 150 L 55 150 L 56 188 L 62 188 Z" fill={fill('calf_r')} stroke={stroke} strokeWidth={sw} />

        <text x="50" y="198" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="6" fontWeight="700" fontFamily="system-ui">DOS</text>
      </svg>
    </div>
  );
}
