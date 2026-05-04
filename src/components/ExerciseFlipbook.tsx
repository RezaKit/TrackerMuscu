import { useEffect, useState } from 'react';
import { fxImageUrl } from '../utils/exerciseDB';

interface FlipbookProps {
  images: string[];     // raw paths from Free Exercise DB (e.g. "Squat/0.jpg")
  alt?: string;
  /** ms between frames — 700 ms ≈ natural rep cadence */
  speed?: number;
  className?: string;
}

/**
 * Animates a 2-frame exercise sequence like a GIF (cross-fade between the two
 * positions). Falls back to a single static image if only one is available.
 */
export default function ExerciseFlipbook({ images, alt, speed = 700, className }: FlipbookProps) {
  const [frame, setFrame] = useState(0);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (images.length < 2) return;
    const id = window.setInterval(() => setFrame((f) => (f + 1) % images.length), speed);
    return () => window.clearInterval(id);
  }, [images.length, speed]);

  if (errored || images.length === 0) {
    return (
      <div className={className} style={{
        width: '100%', aspectRatio: '4/3', borderRadius: 14,
        background: 'rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-faint)', fontSize: 12, fontWeight: 600,
      }}>
        Pas d'image disponible
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        position: 'relative', width: '100%', aspectRatio: '4/3',
        borderRadius: 14, overflow: 'hidden',
        background: '#fff',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      {images.map((src, i) => (
        <img
          key={i}
          src={fxImageUrl(src)}
          alt={alt ?? ''}
          loading={i === 0 ? 'eager' : 'lazy'}
          onLoad={() => setLoaded((p) => ({ ...p, [i]: true }))}
          onError={() => setErrored(true)}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'contain', display: 'block',
            opacity: frame === i && loaded[i] ? 1 : 0,
            transition: 'opacity 0.18s ease',
          }}
        />
      ))}
      {!loaded[0] && (
        <div className="skeleton" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />
      )}
      {/* Subtle "GIF" badge */}
      {images.length >= 2 && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          padding: '3px 7px', borderRadius: 6,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
          fontSize: 9, fontWeight: 800, letterSpacing: 0.6,
          color: '#fff', textTransform: 'uppercase',
        }}>
          ▶ Animé
        </div>
      )}
    </div>
  );
}
