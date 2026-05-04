// Generates a beautiful shareable session card as a PNG using Canvas 2D.
// Works natively on iOS (Safari 14+) and Android without any external lib.

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

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pectoraux', back: 'Dos', shoulders: 'Épaules',
  biceps: 'Biceps', triceps: 'Triceps', legs: 'Jambes',
  core: 'Abdos', forearms: 'Avant-bras', calves: 'Mollets',
};

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', {
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

export async function generateShareCard(data: ShareCardData): Promise<Blob | null> {
  try {
    const W = 1080, H = 1350;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const [c1, c2] = TYPE_COLORS[data.sessionType] ?? ['#FF6B35', '#E14A0F'];
    const typeLabel = data.sessionType.charAt(0).toUpperCase() + data.sessionType.slice(1);

    // ── Background ──────────────────────────────────────────────────────────
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, W, H);

    // Ambient glow top-left
    const glow = ctx.createRadialGradient(260, 280, 0, 260, 280, 580);
    glow.addColorStop(0, c1 + '22');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Ambient glow bottom-right
    const glow2 = ctx.createRadialGradient(820, 1100, 0, 820, 1100, 480);
    glow2.addColorStop(0, c2 + '18');
    glow2.addColorStop(1, 'transparent');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, W, H);

    // ── Top accent bar ───────────────────────────────────────────────────────
    const bar = ctx.createLinearGradient(0, 0, W, 0);
    bar.addColorStop(0, c1);
    bar.addColorStop(1, c2);
    ctx.fillStyle = bar;
    ctx.fillRect(0, 0, W, 8);

    // ── Logo ─────────────────────────────────────────────────────────────────
    ctx.font = 'bold 52px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillStyle = c1;
    ctx.fillText('RezaKit', 72, 106);

    ctx.font = '600 26px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillText('resakit.fr', 74, 148);

    // ── Session type pill ────────────────────────────────────────────────────
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

    // ── Date ─────────────────────────────────────────────────────────────────
    ctx.font = '500 30px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText(fmtDate(data.date), 72, 218);

    // ── Divider ───────────────────────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(72, 248); ctx.lineTo(W - 72, 248);
    ctx.stroke();

    // ── Stats cards ──────────────────────────────────────────────────────────
    const stats = [
      { label: 'VOLUME', value: data.totalVolume >= 1000 ? `${(data.totalVolume / 1000).toFixed(1)}t` : `${data.totalVolume}kg` },
      { label: 'SÉRIES',  value: String(data.totalSets)  },
      { label: 'REPS',    value: String(data.totalReps)  },
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

    // ── PR Banner ────────────────────────────────────────────────────────────
    let yOff = 472;
    if (data.records && data.records.length > 0) {
      const prH = 56 + data.records.length * 50;
      ctx.fillStyle = 'rgba(255,107,53,0.1)';
      roundRect(ctx, 72, yOff, W - 144, prH, 22);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,107,53,0.35)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, 72, yOff, W - 144, prH, 22);
      ctx.stroke();

      ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = c1;
      ctx.fillText(`🏆  ${data.records.length} NOUVEAU${data.records.length > 1 ? 'X' : ''} RECORD${data.records.length > 1 ? 'S' : ''}`, 108, yOff + 44);

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

    // ── Exercises list ───────────────────────────────────────────────────────
    ctx.font = '700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillText('EXERCICES', 72, yOff + 8);
    yOff += 36;

    const maxExos = Math.min(data.exercises.length, 6);
    for (let i = 0; i < maxExos; i++) {
      const ex = data.exercises[i];
      const bestSet = ex.sets.reduce((b, s) => s.weight > b.weight ? s : b, { weight: 0, reps: 0 });
      const musLabel = MUSCLE_LABELS[ex.muscleGroup] || ex.muscleGroup;

      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      roundRect(ctx, 72, yOff, W - 144, 82, 18);
      ctx.fill();

      // Accent left stripe
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
      ctx.fillText(`${musLabel}  ·  ${ex.sets.length} séries`, 102, yOff + 66);

      if (bestSet.weight > 0) {
        ctx.font = '700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillStyle = c1;
        ctx.textAlign = 'right';
        ctx.fillText(`${bestSet.weight}kg × ${bestSet.reps}`, W - 96, yOff + 50);
        ctx.textAlign = 'left';
      }

      yOff += 96;
    }

    if (data.exercises.length > 6) {
      ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.fillText(`+ ${data.exercises.length - 6} exercice${data.exercises.length - 6 > 1 ? 's' : ''}`, 72, yOff + 12);
      yOff += 48;
    }

    // ── Bottom bar ────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(0, H - 80, W, 80);

    ctx.font = '600 26px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillText('Fait avec', 72, H - 28);
    ctx.fillStyle = c1;
    ctx.fillText(' RezaKit', 72 + ctx.measureText('Fait avec').width, H - 28);

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
        title: `Séance ${data.sessionType} — RezaKit`,
        text: `${data.totalSets} séries · ${Math.round(data.totalVolume)}kg volume`,
      });
      return 'shared';
    } catch {
      // user cancelled — not an error
      return 'error';
    }
  }

  // Fallback: download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  return 'downloaded';
}
