import { useEffect, useRef, useState } from 'react';
import { tr, useLang } from '../utils/i18n';

interface ExerciseMediaProps {
  fxId?: string;
  name: string;
  /** Animated GIF from ExerciseDB OSS */
  gifUrl?: string;
  /** Legacy 2-frame fallback images */
  fallbackImages?: string[];
  flipSpeed?: number;
}

const VIDEO_BASE = (import.meta.env?.VITE_EXERCISE_VIDEO_BASE as string | undefined) || '';

function buildVideoFilename(name: string): string {
  return (
    name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[()]/g, '')
      .replace(/[^a-zA-Z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .split('-')
      .map((p) => p ? p[0].toUpperCase() + p.slice(1).toLowerCase() : '')
      .join('-') + '.mp4'
  );
}

type Mode = 'video' | 'gif' | 'flipbook' | 'placeholder';

function initMode(hasVideoBase: boolean, gifUrl?: string, fallbackCount = 0): Mode {
  if (hasVideoBase) return 'video';
  if (gifUrl) return 'gif';
  if (fallbackCount > 0) return 'flipbook';
  return 'placeholder';
}

export default function ExerciseMedia({ name, gifUrl, fallbackImages = [], flipSpeed = 1100 }: ExerciseMediaProps) {
  useLang();
  const hasVideoBase = VIDEO_BASE.length > 0;
  const [mode, setMode] = useState<Mode>(() => initMode(hasVideoBase, gifUrl, fallbackImages.length));
  const [frame, setFrame] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Reset when exercise changes
  useEffect(() => {
    setImgLoaded(false);
    setVideoReady(false);
    setFrame(0);
    setMode(initMode(hasVideoBase, gifUrl, fallbackImages.length));
  }, [gifUrl, hasVideoBase, fallbackImages.length]);

  // Flipbook driver
  useEffect(() => {
    if (mode !== 'flipbook' || fallbackImages.length < 2) return;
    const id = window.setInterval(() => setFrame((f) => (f + 1) % fallbackImages.length), flipSpeed);
    return () => window.clearInterval(id);
  }, [mode, fallbackImages.length, flipSpeed]);

  // Video autoplay
  useEffect(() => {
    if (mode !== 'video') return;
    videoRef.current?.play().catch(() => {});
  }, [mode]);

  const downgradeFromVideo = () => {
    if (gifUrl) setMode('gif');
    else if (fallbackImages.length) setMode('flipbook');
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
        borderRadius: 14, overflow: 'hidden', background: '#000',
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
            opacity: videoReady ? 1 : 0, transition: 'opacity 0.2s ease',
          }}
        />
        {!videoReady && <div className="skeleton" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />}
        <div style={{
          position: 'absolute', top: 8, right: 8, padding: '3px 8px', borderRadius: 6,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
          fontSize: 9, fontWeight: 800, letterSpacing: 0.6, color: '#fff', textTransform: 'uppercase',
        }}>● {tr({ fr: 'Vidéo', en: 'Video', es: 'Vídeo' })}</div>
      </div>
    );
  }

  if (mode === 'gif') {
    return (
      <div style={{
        position: 'relative', width: '100%', aspectRatio: '4/3',
        borderRadius: 14, overflow: 'hidden', background: '#fff',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
      }}>
        {!imgLoaded && <div className="skeleton" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />}
        <img
          src={gifUrl!}
          alt={name}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={() => setMode(fallbackImages.length ? 'flipbook' : 'placeholder')}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'contain', display: 'block',
            opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.25s ease',
          }}
        />
        <div style={{
          position: 'absolute', top: 8, right: 8, padding: '3px 8px', borderRadius: 6,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
          fontSize: 9, fontWeight: 800, letterSpacing: 0.6, color: '#fff', textTransform: 'uppercase',
        }}>▶ GIF</div>
      </div>
    );
  }

  // flipbook
  return (
    <div style={{
      position: 'relative', width: '100%', aspectRatio: '4/3',
      borderRadius: 14, overflow: 'hidden', background: '#fff',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
    }}>
      {fallbackImages.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={name}
          loading={i === 0 ? 'eager' : 'lazy'}
          onLoad={() => { if (i === 0) setImgLoaded(true); }}
          onError={() => { if (i === 0) setMode('placeholder'); }}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'contain', display: 'block',
            opacity: frame === i && imgLoaded ? 1 : 0,
            transition: 'opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      ))}
      {!imgLoaded && <div className="skeleton" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />}
      {fallbackImages.length >= 2 && (
        <div style={{
          position: 'absolute', top: 8, right: 8, padding: '3px 7px', borderRadius: 6,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
          fontSize: 9, fontWeight: 800, letterSpacing: 0.6, color: '#fff', textTransform: 'uppercase',
        }}>▶ {tr({ fr: 'Animé', en: 'Animated', es: 'Animado' })}</div>
      )}
    </div>
  );
}
