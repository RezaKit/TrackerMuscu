import { useMemo, useState } from 'react';
import { bodyFront } from '../db/bodyFront';
import { bodyBack } from '../db/bodyBack';
import { BORDER_FRONT_PATH, BORDER_BACK_PATH, type BodyPart, type BodySlug } from '../db/bodyTypes';
import type { ExerciseLog } from '../types';

interface MuscleMapProps {
  exercises: ExerciseLog[];
  size?: number;
  /** Compact = no labels/legend, used inside info modal */
  compact?: boolean;
}

// Map our coarse muscle groups to the highlighter slugs
const GROUP_TO_SLUGS: Record<string, BodySlug[]> = {
  chest:     ['chest'],
  back:      ['upper-back', 'lower-back', 'trapezius'],
  shoulders: ['deltoids', 'trapezius'],
  biceps:    ['biceps'],
  triceps:   ['triceps'],
  forearms:  ['forearm'],
  legs:      ['quadriceps', 'hamstring', 'gluteal', 'adductors'],
  calves:    ['calves', 'tibialis'],
  core:      ['abs', 'obliques'],
};

const SLUG_FR: Record<BodySlug, string> = {
  abs: 'Abdominaux', adductors: 'Adducteurs', ankles: 'Chevilles',
  biceps: 'Biceps', calves: 'Mollets', chest: 'Pectoraux',
  deltoids: 'Deltoïdes', feet: 'Pieds', forearm: 'Avant-bras',
  gluteal: 'Fessiers', hair: 'Cheveux', hamstring: 'Ischio-jambiers',
  hands: 'Mains', head: 'Tête', knees: 'Genoux',
  'lower-back': 'Bas du dos', neck: 'Cou', obliques: 'Obliques',
  quadriceps: 'Quadriceps', tibialis: 'Tibial', trapezius: 'Trapèzes',
  triceps: 'Triceps', 'upper-back': 'Haut du dos',
};

// Slugs we never highlight (decorative or non-trainable)
const NON_HIGHLIGHT: ReadonlySet<BodySlug> = new Set([
  'head', 'hair', 'neck', 'hands', 'feet', 'ankles', 'knees',
]);

const DEFAULT_FILL = 'rgba(255,255,255,0.05)';
const HEAD_FILL = 'rgba(255,255,255,0.18)';
const STROKE = 'rgba(255,255,255,0.22)';

// Green → yellow → red gradient. Linear interpolation in HSL space.
function intensityColor(intensity: number): string {
  if (intensity <= 0) return DEFAULT_FILL;
  const i = Math.min(1, Math.max(0, intensity));
  // Hue: 130 (green) at i=0 → 0 (red) at i=1
  const hue = 130 - 130 * i;
  // Saturation grows slightly so low values aren't too pastel
  const sat = 70 + 20 * i;
  const light = 52 - 8 * i;
  return `hsl(${hue.toFixed(0)}, ${sat.toFixed(0)}%, ${light.toFixed(0)}%)`;
}

function legendStop(t: number) {
  return intensityColor(t);
}

export default function MuscleMap({ exercises, size = 280, compact = false }: MuscleMapProps) {
  const [selected, setSelected] = useState<BodySlug | null>(null);

  // Aggregate volume per muscle slug
  const { intensityBySlug, volumeBySlug } = useMemo(() => {
    const volByGroup: Record<string, number> = {};
    exercises.forEach((ex) => {
      const vol = ex.sets.reduce((s, st) => s + (st.weight || 1) * st.reps, 0);
      volByGroup[ex.muscleGroup] = (volByGroup[ex.muscleGroup] || 0) + Math.max(vol, 1);
    });

    const volBySlug: Partial<Record<BodySlug, number>> = {};
    Object.entries(volByGroup).forEach(([group, vol]) => {
      const slugs = GROUP_TO_SLUGS[group];
      if (!slugs) return;
      slugs.forEach((s) => { volBySlug[s] = (volBySlug[s] ?? 0) + vol; });
    });

    const max = Math.max(1, ...Object.values(volBySlug).map((v) => v ?? 0));
    const intBySlug: Partial<Record<BodySlug, number>> = {};
    Object.entries(volBySlug).forEach(([slug, vol]) => {
      intBySlug[slug as BodySlug] = (vol ?? 0) / max;
    });
    return { intensityBySlug: intBySlug, volumeBySlug: volBySlug };
  }, [exercises]);

  const handleTap = (slug?: BodySlug) => {
    if (!slug || NON_HIGHLIGHT.has(slug)) return;
    setSelected((s) => (s === slug ? null : slug));
  };

  const renderPaths = (data: BodyPart[]) => {
    const out: JSX.Element[] = [];
    data.forEach((part) => {
      const slug = part.slug;
      if (!slug) return;
      const intensity = intensityBySlug[slug] ?? 0;
      const isWorked = intensity > 0;
      const isSelected = selected === slug;
      const fill = slug === 'head' || slug === 'hair'
        ? HEAD_FILL
        : NON_HIGHLIGHT.has(slug)
        ? DEFAULT_FILL
        : intensityColor(intensity);

      const stroke = isSelected ? '#fff' : STROKE;
      const strokeWidth = isSelected ? 2.5 : 0.7;
      const className = isWorked && !isSelected ? 'muscle-active-path' : '';

      const renderOne = (d: string, key: string) => (
        <path
          key={key}
          d={d}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
          className={className}
          onClick={(e) => { e.stopPropagation(); handleTap(slug); }}
          style={{ cursor: NON_HIGHLIGHT.has(slug) ? 'default' : 'pointer', transition: 'fill 0.25s ease, stroke-width 0.2s ease' }}
        />
      );

      part.path?.common?.forEach((d, i) => out.push(renderOne(d, `${slug}-c-${i}`)));
      part.path?.left?.forEach((d, i) => out.push(renderOne(d, `${slug}-l-${i}`)));
      part.path?.right?.forEach((d, i) => out.push(renderOne(d, `${slug}-r-${i}`)));
    });
    return out;
  };

  const w = size / 2;
  const h = size;

  // Tooltip card content
  const selectedLabel = selected ? SLUG_FR[selected] : null;
  const selectedVolume = selected ? volumeBySlug[selected] ?? 0 : 0;
  const selectedIntensity = selected ? Math.round((intensityBySlug[selected] ?? 0) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: compact ? 6 : 12 }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: compact ? 8 : 14 }}>
        {/* FRONT */}
        <svg viewBox="0 0 724 1448" width={w} height={h} style={{ flexShrink: 0, overflow: 'visible' }}
          onClick={() => setSelected(null)}>
          {/* Body outline */}
          <path d={BORDER_FRONT_PATH} fill="rgba(255,255,255,0.025)" stroke={STROKE} strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
          {renderPaths(bodyFront)}
          {!compact && (
            <text x={362} y={1430} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={28} fontWeight={800} letterSpacing={4} fontFamily="system-ui">FACE</text>
          )}
        </svg>

        {/* BACK */}
        <svg viewBox="724 0 724 1448" width={w} height={h} style={{ flexShrink: 0, overflow: 'visible' }}
          onClick={() => setSelected(null)}>
          <path d={BORDER_BACK_PATH} fill="rgba(255,255,255,0.025)" stroke={STROKE} strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
          {renderPaths(bodyBack)}
          {!compact && (
            <text x={1086} y={1430} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={28} fontWeight={800} letterSpacing={4} fontFamily="system-ui">DOS</text>
          )}
        </svg>
      </div>

      {/* Selected muscle info card */}
      {!compact && selected && (
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          padding: '10px 14px',
          minWidth: 200,
          textAlign: 'center',
          animation: 'fadeIn 0.18s ease-out',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: 1.2 }}>
            {selectedLabel}
          </div>
          {selectedVolume > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <span className="t-num" style={{ fontSize: 22, color: intensityColor(selectedIntensity / 100) }}>
                  {selectedIntensity}%
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>intensité</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-soft)', marginTop: 2 }}>
                Volume : <span className="t-mono">{Math.round(selectedVolume)}</span>
              </div>
            </>
          ) : (
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>Pas encore travaillé</div>
          )}
        </div>
      )}

      {/* Gradient legend */}
      {!compact && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: selected ? 0 : 4 }}>
          <span style={{ fontSize: 9.5, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>Léger</span>
          <div style={{
            width: 140, height: 6, borderRadius: 999,
            background: `linear-gradient(to right, ${legendStop(0.05)}, ${legendStop(0.3)}, ${legendStop(0.6)}, ${legendStop(0.85)}, ${legendStop(1)})`,
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
          }} />
          <span style={{ fontSize: 9.5, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>Intense</span>
        </div>
      )}
    </div>
  );
}
