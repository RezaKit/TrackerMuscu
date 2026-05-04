import { useEffect, useRef, useState } from 'react';
import { fxImageUrl } from '../utils/exerciseDB';

interface ExerciseMediaProps {
  /** Free Exercise DB id, e.g. "Barbell_Squat" */
  fxId?: string;
  /** Display name, used as alt and to build the video filename */
  name: string;
  /** 2-frame fallback (Free Exercise DB images) */
  fallbackImages?: string[];
  /** Cross-fade speed (ms) when using flipbook */
  flipSpeed?: number;
}

const VIDEO_BASE = (import.meta.env?.VITE_EXERCISE_VIDEO_BASE as string | undefined) || '';

/** Build candidate MP4 filename from an exercise name.
 *  "Lever Pec Deck Fly (Chest)" → "Lever-Pec-Deck-Fly-Chest.mp4"
 *  Mirrors the ExerciseDB official naming convention. */
function buildVideoFilename(name: string): string {
  return (
    name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')      // strip accents
      .replace(/[()]/g, '')                 // drop parentheses
      .replace(/[^a-zA-Z0-9 -]/g, '')       // drop other punctuation
      .replace(/\s+/g, '-')                 // spaces → hyphens
      .replace(/-+/g, '-')                  // collapse hyphens
      .replace(/^-|-$/g, '')                // trim hyphens
      .split('-')
      .map((p) => p ? p[0].toUpperCase() + p.slice(1).toLowerCase() : '')
      .join('-') + '.mp4'
  );
}

type Mode = 'video' | 'flipbook' | 'placeholder';

/**
 * Renders an exercise demo. Tries an MP4 video first (autoplay/loop/muted),
 * falls back to a 2-frame flipbook of the static images, falls back again
 * to a plain placeholder when neither is available.
 *
 * MP4 URL is built from `VITE_EXERCISE_VIDEO_BASE + buildVideoFilename(name)`.
 * If the env var is empty (default), the flipbook is used directly without any
 * network attempt — keeping the offline path fast.
 */
export default function ExerciseMedia({ name, fallbackImages = [], flipSpeed = 1100 }: ExerciseMediaProps) {
  const hasVideoBase = VIDEO_BASE.length > 0;
  const [mode, setMode] = useState<Mode>(hasVideoBase ? 'video' : (fallbackImages.length ? 'flipbook' : 'placeholder'));
  const [frame, setFrame] = useState(0);
  const [imgLoaded, setImgLoaded] = useState<Record<number, boolean>>({});
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Flipbook driver
  useEffect(() => {
    if (mode !== 'flipbook' || fallbackImages.length < 2) return;
    const id = window.setInterval(() => setFrame((f) => (f + 1) % fallbackImages.length), flipSpeed);
    return () => window.clearInterval(id);
  }, [mode, fallbackImages.length, flipSpeed]);

  // Video failure / autoplay handling
  useEffect(() => {
    if (mode !== 'video') return;
    const v = videoRef.current;
    if (!v) return;
    // iOS occasionally blocks autoplay even with muted+playsInline if the user
    // hasn't yet interacted with the page. Trigger play() explicitly.
    v.play().catch(() => { /* user gesture required, the poster stays visible */ });
  }, [mode]);

  const downgradeFromVideo = () => {
    if (fallbackImages.length) setMode('flipbook');
    else setMode('placeholder');
  };

  if (mode === 'placeholder') {
    return (
      <div style={{
        width: '100%', aspectRatio: '4/3', borderRadius: 14,
        background: 'rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-faint)', fontSize: 12, fontWeight: 600,
      }}>—</div>
    );
  }

  if (mode === 'video') {
    const src = `${VIDEO_BASE.replace(/\/$/, '')}/${buildVideoFilename(name)}`;
    return (
      <div style={{
        position: 'relative', width: '100%', aspectRatio: '4/3',
        borderRadius: 14, overflow: 'hidden',
        background: '#000',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
      }}>
        <video
          ref={videoRef}
          src={src}
          autoPlay loop muted playsInline preload="auto"
          onCanPlay={() => setVideoReady(true)}
          onError={downgradeFromVideo}
          onAbort={downgradeFromVideo}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'contain', display: 'block',
            opacity: videoReady ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}
        />
        {!videoReady && (
          <div className="skeleton" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />
        )}
        <div style={{
          position: 'absolute', top: 8, right: 8,
          padding: '3px 8px', borderRadius: 6,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
          fontSize: 9, fontWeight: 800, letterSpacing: 0.6,
          color: '#fff', textTransform: 'uppercase',
        }}>● Vidéo</div>
      </div>
    );
  }

  // mode === 'flipbook'
  return (
    <div style={{
      position: 'relative', width: '100%', aspectRatio: '4/3',
      borderRadius: 14, overflow: 'hidden',
      background: '#fff',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
    }}>
      {fallbackImages.map((src, i) => (
        <img
          key={i}
          src={fxImageUrl(src)}
          alt={name}
          loading={i === 0 ? 'eager' : 'lazy'}
          onLoad={() => setImgLoaded((p) => ({ ...p, [i]: true }))}
          onError={() => { if (i === 0) setMode('placeholder'); }}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'contain', display: 'block',
            opacity: frame === i && imgLoaded[i] ? 1 : 0,
            transition: 'opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      ))}
      {!imgLoaded[0] && (
        <div className="skeleton" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />
      )}
      {fallbackImages.length >= 2 && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          padding: '3px 7px', borderRadius: 6,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
          fontSize: 9, fontWeight: 800, letterSpacing: 0.6,
          color: '#fff', textTransform: 'uppercase',
        }}>▶ Animé</div>
      )}
    </div>
  );
}
