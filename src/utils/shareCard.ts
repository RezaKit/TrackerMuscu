// Generates a beautiful shareable session card as a PNG using Canvas 2D.
// Works natively on iOS (Safari 14+) and Android without any external lib.

import { bodyFront } from '../db/bodyFront';
import { bodyBack } from '../db/bodyBack';
import { BORDER_FRONT_PATH, BORDER_BACK_PATH, type BodySlug } from '../db/bodyTypes';
import { tr, getLang } from './i18n';

export interface ShareCardData {
  sessionType: string;
  date: string;           // ISO date string
  exercises: Array<{ name: string; muscleGroup: string; sets: Array<{ weight: number; reps: number }> }>;
  totalVolume: number;    // kg
  totalSets: number;
  totalReps: number;
  records?: Array<{ exercise: string; weight: number; reps: number }>;
  userName?: string;
}

const TYPE_COLORS: Record<string, [string, string]> = {
  push:  ['#FF6B35', '#E14A0F'],
  pull:  ['#C41E3A', '#8B0E22'],
  legs:  ['#A78BFA', '#7C3AED'],
  upper: ['#FB923C', '#EA580C'],
  lower: ['#F87171', '#DC2626'],
};

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

const NON_HIGHLIGHT: ReadonlySet<BodySlug> = new Set([
  'head', 'hair', 'neck', 'hands', 'feet', 'ankles', 'knees',
]);

const muscleLabels = () => ({
  chest:    tr({ fr: 'Pectoraux', en: 'Chest',     es: 'Pectoral' }),
  back:     tr({ fr: 'Dos',       en: 'Back',      es: 'Espalda'  }),
  shoulders:tr({ fr: 'Épaules',   en: 'Shoulders', es: 'Hombros'  }),
  biceps:   'Biceps',
  triceps:  'Triceps',
  legs:     tr({ fr: 'Jambes',    en: 'Legs',      es: 'Piernas'  }),
  core:     tr({ fr: 'Abdos',     en: 'Core',      es: 'Abdomen'  }),
  forearms: tr({ fr: 'Avant-bras',en: 'Forearms',  es: 'Antebrazos' }),
  calves:   tr({ fr: 'Mollets',   en: 'Calves',    es: 'Pantorrillas' }),
});

function fmtDate(iso: string) {
  const lang = getLang();
  const locale = lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-GB';
  return new Date(iso + 'T00:00:00').toLocaleDateString(locale, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ──────────────────────────────────────────────────────────────────────────
// Muscle map — same intensity logic as <MuscleMap>, rendered as an SVG
// then rasterized to an Image we can drawImage onto the share canvas.
// ──────────────────────────────────────────────────────────────────────────

function intensityColor(intensity: number): string {
  if (intensity <= 0) return 'rgba(255,255,255,0.05)';
  const i = Math.min(1, Math.max(0, intensity));
  const hue = 130 - 130 * i;
  const sat = 70 + 20 * i;
  const light = 52 - 8 * i;
  return `hsl(${hue.toFixed(0)}, ${sat.toFixed(0)}%, ${light.toFixed(0)}%)`;
}

function computeIntensities(exercises: ShareCardData['exercises']): Partial<Record<BodySlug, number>> {
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
  const out: Partial<Record<BodySlug, number>> = {};
  Object.entries(volBySlug).forEach(([slug, vol]) => {
    out[slug as BodySlug] = (vol ?? 0) / max;
  });
  return out;
}

function buildMuscleSvg(exercises: ShareCardData['exercises']): string {
  const intensity = computeIntensities(exercises);
  const stroke = 'rgba(255,255,255,0.22)';
  const headFill = 'rgba(255,255,255,0.18)';
  const defaultFill = 'rgba(255,255,255,0.05)';

  const buildPaths = (parts: typeof bodyFront): string => {
    let out = '';
    for (const part of parts) {
      const slug = part.slug;
      if (!slug) continue;
      const fill = (slug === 'head' || slug === 'hair')
        ? headFill
        : NON_HIGHLIGHT.has(slug)
          ? defaultFill
          : intensityColor(intensity[slug] ?? 0);
      const draw = (d: string) => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="0.7" vector-effect="non-scaling-stroke"/>`;
      part.path?.common?.forEach((d) => { out += draw(d); });
      part.path?.left?.forEach((d) => { out += draw(d); });
      part.path?.right?.forEach((d) => { out += draw(d); });
    }
    return out;
  };

  // Two SVGs side-by-side, each in its own viewBox slice.
  // Total view: 0..1448 wide (724 + 724) × 1448 tall.
  const front = `<g><path d="${BORDER_FRONT_PATH}" fill="rgba(255,255,255,0.025)" stroke="${stroke}" stroke-width="1.4" vector-effect="non-scaling-stroke"/>${buildPaths(bodyFront)}</g>`;
  const back  = `<g><path d="${BORDER_BACK_PATH}" fill="rgba(255,255,255,0.025)" stroke="${stroke}" stroke-width="1.4" vector-effect="non-scaling-stroke"/>${buildPaths(bodyBack)}</g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1448 1448" width="1448" height="1448">${front}${back}</svg>`;
}

function svgToImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    // Use base64 data URL — bypasses tainted-canvas issues some browsers throw
    // on Blob URLs created from cross-origin SVG content references.
    const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = dataUrl;
  });
}

// ──────────────────────────────────────────────────────────────────────────

export async function generateShareCard(data: ShareCardData): Promise<Blob | null> {
  try {
    const W = 1080, H = 1620;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const [c1, c2] = TYPE_COLORS[data.sessionType] ?? ['#FF6B35', '#E14A0F'];
    const typeLabel = data.sessionType.charAt(0).toUpperCase() + data.sessionType.slice(1);
    const labels = muscleLabels();

    // ── Background ─────────────────────────────────────────
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(260, 280, 0, 260, 280, 580);
    glow.addColorStop(0, c1 + '22');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    const glow2 = ctx.createRadialGradient(820, 1300, 0, 820, 1300, 480);
    glow2.addColorStop(0, c2 + '18');
    glow2.addColorStop(1, 'transparent');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, W, H);

    const bar = ctx.createLinearGradient(0, 0, W, 0);
    bar.addColorStop(0, c1);
    bar.addColorStop(1, c2);
    ctx.fillStyle = bar;
    ctx.fillRect(0, 0, W, 8);

    // ── Logo ────────────────────────────────────────────────
    ctx.font = 'bold 52px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = c1;
    ctx.fillText('RezaKit', 72, 106);

    ctx.font = '600 26px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillText('resakit.fr', 74, 148);

    // ── Session type pill ───────────────────────────────────
    const pillW = 200, pillH = 58, pillX = W - 72 - pillW, pillY = 72;
    const pillGrad = ctx.createLinearGradient(pillX, 0, pillX + pillW, 0);
    pillGrad.addColorStop(0, c1);
    pillGrad.addColorStop(1, c2);
    ctx.fillStyle = pillGrad;
    roundRect(ctx, pillX, pillY, pillW, pillH, 18);
    ctx.fill();
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(typeLabel.toUpperCase(), pillX + pillW / 2, pillY + 38);
    ctx.textAlign = 'left';

    // ── Date ────────────────────────────────────────────────
    ctx.font = '500 30px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText(fmtDate(data.date), 72, 218);

    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(72, 248); ctx.lineTo(W - 72, 248);
    ctx.stroke();

    // ── Stats cards ─────────────────────────────────────────
    const stats = [
      { label: 'VOLUME',                                         value: data.totalVolume >= 1000 ? `${(data.totalVolume / 1000).toFixed(1)}t` : `${data.totalVolume}kg` },
      { label: tr({ fr: 'SÉRIES', en: 'SETS', es: 'SERIES' }),   value: String(data.totalSets) },
      { label: 'REPS',                                           value: String(data.totalReps) },
    ];
    const cardW = (W - 144 - 32) / 3;
    stats.forEach((s, i) => {
      const cx = 72 + i * (cardW + 16);
      const cy = 272;
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      roundRect(ctx, cx, cy, cardW, 160, 22);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 1;
      roundRect(ctx, cx, cy, cardW, 160, 22);
      ctx.stroke();

      ctx.font = '700 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.textAlign = 'center';
      ctx.fillText(s.label, cx + cardW / 2, cy + 44);

      ctx.font = 'bold 58px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = c1;
      ctx.fillText(s.value, cx + cardW / 2, cy + 120);
      ctx.textAlign = 'left';
    });

    // ── Muscle map ──────────────────────────────────────────
    let yOff = 472;
    try {
      const svg = buildMuscleSvg(data.exercises);
      const img = await svgToImage(svg);
      // Card backdrop
      const mapH = 460;
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      roundRect(ctx, 72, yOff, W - 144, mapH + 56, 22);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      roundRect(ctx, 72, yOff, W - 144, mapH + 56, 22);
      ctx.stroke();

      ctx.font = '700 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.textAlign = 'left';
      ctx.fillText(tr({ fr: 'MUSCLES TRAVAILLÉS', en: 'MUSCLES WORKED', es: 'MÚSCULOS TRABAJADOS' }), 96, yOff + 38);

      // FACE / DOS labels
      ctx.font = '800 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.textAlign = 'center';
      const labelY = yOff + mapH + 36;
      ctx.fillText(tr({ fr: 'FACE', en: 'FRONT', es: 'FRENTE' }), W / 2 - 200, labelY);
      ctx.fillText(tr({ fr: 'DOS',  en: 'BACK',  es: 'ESPALDA' }), W / 2 + 200, labelY);
      ctx.textAlign = 'left';

      // Image: map's intrinsic aspect is 1448:1448 (square). We draw it square,
      // centered in the card.
      const imgH = mapH - 8;
      const imgW = imgH; // 1:1
      const imgX = (W - imgW) / 2;
      const imgY = yOff + 50;
      ctx.drawImage(img, imgX, imgY, imgW, imgH);

      yOff += mapH + 80;
    } catch {
      // If SVG rasterisation fails, just skip the muscle map gracefully.
      yOff += 8;
    }

    // ── PR Banner ───────────────────────────────────────────
    if (data.records && data.records.length > 0) {
      const prH = 56 + data.records.length * 50;
      ctx.fillStyle = 'rgba(255,107,53,0.1)';
      roundRect(ctx, 72, yOff, W - 144, prH, 22);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,107,53,0.35)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, 72, yOff, W - 144, prH, 22);
      ctx.stroke();

      const recordsLabel = tr({ fr: 'NOUVEAUX RECORDS', en: 'NEW PRS', es: 'NUEVOS RÉCORDS' });
      const recordSingle = tr({ fr: 'NOUVEAU RECORD', en: 'NEW PR', es: 'NUEVO RÉCORD' });
      const banner = data.records.length > 1 ? `🏆  ${data.records.length} ${recordsLabel}` : `🏆  ${recordSingle}`;
      ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = c1;
      ctx.fillText(banner, 108, yOff + 44);

      data.records.slice(0, 3).forEach((r, i) => {
        ctx.font = '600 26px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(r.exercise, 108, yOff + 88 + i * 50);
        ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.38)';
        ctx.fillText(`${r.weight}kg × ${r.reps}`, 108 + ctx.measureText(r.exercise + '  ').width + 8, yOff + 88 + i * 50);
      });
      yOff += prH + 24;
    }

    // ── Exercises list (max 4 to leave room) ─────────────────
    ctx.font = '700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillText(tr({ fr: 'EXERCICES', en: 'EXERCISES', es: 'EJERCICIOS' }), 72, yOff + 8);
    yOff += 36;

    const remaining = H - 80 - yOff; // leave room for footer
    const slotH = 96;
    const maxByRoom = Math.max(1, Math.floor(remaining / slotH));
    const maxExos = Math.min(data.exercises.length, Math.min(5, maxByRoom));
    for (let i = 0; i < maxExos; i++) {
      const ex = data.exercises[i];
      const bestSet = ex.sets.reduce((b, s) => s.weight > b.weight ? s : b, { weight: 0, reps: 0 });
      const musLabel = (labels as any)[ex.muscleGroup] || ex.muscleGroup;

      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      roundRect(ctx, 72, yOff, W - 144, 82, 18);
      ctx.fill();

      const stripeGrad = ctx.createLinearGradient(72, 0, 72, 82);
      stripeGrad.addColorStop(0, c1);
      stripeGrad.addColorStop(1, c2);
      ctx.fillStyle = stripeGrad;
      roundRect(ctx, 72, yOff, 6, 82, 3);
      ctx.fill();

      ctx.font = '700 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText(ex.name, 102, yOff + 38);

      ctx.font = '500 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.32)';
      const setsWord = tr({ fr: 'séries', en: 'sets', es: 'series' });
      ctx.fillText(`${musLabel}  ·  ${ex.sets.length} ${setsWord}`, 102, yOff + 66);

      if (bestSet.weight > 0) {
        ctx.font = '700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillStyle = c1;
        ctx.textAlign = 'right';
        ctx.fillText(`${bestSet.weight}kg × ${bestSet.reps}`, W - 96, yOff + 50);
        ctx.textAlign = 'left';
      }

      yOff += slotH;
    }

    if (data.exercises.length > maxExos) {
      ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      const more = data.exercises.length - maxExos;
      const exoSing = tr({ fr: 'exercice', en: 'exercise', es: 'ejercicio' });
      const exoPlur = tr({ fr: 'exercices', en: 'exercises', es: 'ejercicios' });
      ctx.fillText(`+ ${more} ${more > 1 ? exoPlur : exoSing}`, 72, yOff + 12);
      yOff += 48;
    }

    // ── Bottom bar ──────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(0, H - 80, W, 80);

    ctx.font = '600 26px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    const madeWith = tr({ fr: 'Fait avec', en: 'Made with', es: 'Hecho con' });
    ctx.fillText(madeWith, 72, H - 28);
    ctx.fillStyle = c1;
    ctx.fillText(' RezaKit', 72 + ctx.measureText(madeWith).width, H - 28);

    if (data.userName) {
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.font = '600 26px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(data.userName, W - 72, H - 28);
      ctx.textAlign = 'left';
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
    });
  } catch {
    return null;
  }
}

export async function shareSession(data: ShareCardData): Promise<'shared' | 'downloaded' | 'error'> {
  const blob = await generateShareCard(data);
  if (!blob) return 'error';

  const filename = `rezakit-${data.sessionType}-${data.date}.png`;

  if (navigator.canShare?.({ files: [new File([blob], filename, { type: 'image/png' })] })) {
    try {
      await navigator.share({
        files: [new File([blob], filename, { type: 'image/png' })],
        title: tr({ fr: `Séance ${data.sessionType} — RezaKit`, en: `${data.sessionType} workout — RezaKit`, es: `Sesión ${data.sessionType} — RezaKit` }),
        text: tr({
          fr: `${data.totalSets} séries · ${Math.round(data.totalVolume)}kg volume`,
          en: `${data.totalSets} sets · ${Math.round(data.totalVolume)}kg volume`,
          es: `${data.totalSets} series · ${Math.round(data.totalVolume)}kg volumen`,
        }),
      });
      return 'shared';
    } catch {
      return 'error';
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  return 'downloaded';
}
