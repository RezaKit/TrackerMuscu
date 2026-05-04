// Weekly Sunday digest — runs via Vercel Cron every Sunday at 20:00 UTC
// (= 21:00 Paris in summer, 22:00 Paris in winter).
//
// Auth: protected by `CRON_SECRET` header that Vercel Cron sends automatically
// when invoking. We also require it to be passed in the Authorization header.
//
// Required env vars:
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY  (NOT the public anon key — needs admin access)
//   - RESEND_API_KEY              (resend.com — free tier: 3000 emails/month)
//   - CRON_SECRET                 (any random long string, also added to Vercel Cron)
//   - REPORT_FROM_EMAIL           (default: "RezaKit <noreply@resakit.fr>")

export const config = { runtime: 'nodejs' };

interface SetEntry { weight: number; reps: number; setNumber?: number }
interface ExerciseLog {
  exerciseName: string;
  muscleGroup: string;
  sets: SetEntry[];
}
interface Session {
  id: string;
  date: string;            // YYYY-MM-DD
  type: string;
  exercises: ExerciseLog[];
  completed: boolean;
}

interface UserData {
  user_id: string;
  sessions: Session[] | null;
  local_settings: Record<string, string> | null;
}

interface AuthUser {
  id: string;
  email: string | null;
}

const PARIS_TZ_OFFSET_HOURS_FALLBACK = 1;

function isoDay(d: Date): string {
  return d.toISOString().split('T')[0];
}

function startOfPastWeek(now: Date): Date {
  // Last Monday → today (Sunday). 7 days window.
  const start = new Date(now);
  start.setUTCDate(now.getUTCDate() - 6);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function endOfNextWeek(now: Date): Date {
  const end = new Date(now);
  end.setUTCDate(now.getUTCDate() + 7);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

function computeStats(sessions: Session[], now: Date) {
  const weekAgo = startOfPastWeek(now);
  const nextWeekEnd = endOfNextWeek(now);
  const todayIso = isoDay(now);

  const completedThisWeek: Session[] = [];
  const plannedNextWeek: Session[] = [];

  for (const s of sessions) {
    const d = new Date(s.date + 'T00:00:00Z');
    if (s.completed && d >= weekAgo && d <= now) completedThisWeek.push(s);
    else if (!s.completed && s.date >= todayIso && d <= nextWeekEnd) plannedNextWeek.push(s);
  }

  let totalSets = 0;
  let totalVolume = 0;
  const muscleVolume: Record<string, number> = {};
  for (const s of completedThisWeek) {
    for (const e of s.exercises) {
      for (const st of e.sets) {
        totalSets += 1;
        const vol = (st.weight || 1) * st.reps;
        totalVolume += vol;
        muscleVolume[e.muscleGroup] = (muscleVolume[e.muscleGroup] || 0) + vol;
      }
    }
  }

  const topMuscles = Object.entries(muscleVolume)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([m]) => m);

  return {
    completedThisWeek,
    plannedNextWeek,
    totalSets,
    totalVolume: Math.round(totalVolume),
    topMuscles,
    sessionCount: completedThisWeek.length,
  };
}

const MUSCLE_FR: Record<string, string> = {
  chest: 'Pectoraux', back: 'Dos', shoulders: 'Épaules',
  biceps: 'Biceps', triceps: 'Triceps', forearms: 'Avant-bras',
  legs: 'Jambes', calves: 'Mollets', core: 'Abdos',
};
const SESSION_TYPE_FR: Record<string, string> = {
  push: 'Push', pull: 'Pull', legs: 'Legs', upper: 'Upper', lower: 'Lower',
};

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}

function buildHtml(name: string, stats: ReturnType<typeof computeStats>): string {
  const greeting = name ? `Salut ${name} 💪` : 'Salut 💪';
  const sessionWord = stats.sessionCount === 1 ? 'séance' : 'séances';
  const muscleList = stats.topMuscles.length
    ? stats.topMuscles.map((m) => MUSCLE_FR[m] || m).join(' · ')
    : 'Aucun groupe travaillé cette semaine';

  const plannedRows = stats.plannedNextWeek.length
    ? stats.plannedNextWeek
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((s) => `
          <tr>
            <td style="padding:10px 14px;border-bottom:1px solid #1f1f25;color:#bdbdc4;font-size:13px;">${fmtDate(s.date)}</td>
            <td style="padding:10px 14px;border-bottom:1px solid #1f1f25;color:#fff;font-weight:600;font-size:13px;">${SESSION_TYPE_FR[s.type] || s.type}</td>
            <td style="padding:10px 14px;border-bottom:1px solid #1f1f25;color:#76767e;font-size:12px;">${s.exercises.length} exo${s.exercises.length > 1 ? 's' : ''}</td>
          </tr>`).join('')
    : `<tr><td colspan="3" style="padding:18px 14px;color:#76767e;font-size:13px;text-align:center;">Aucune séance planifiée pour la semaine prochaine.<br><span style="color:#ff6b35;font-size:12px;">→ Demande à ton coach IA de t'en programmer une !</span></td></tr>`;

  const completedRows = stats.completedThisWeek.length
    ? stats.completedThisWeek
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((s) => `
          <tr>
            <td style="padding:10px 14px;border-bottom:1px solid #1f1f25;color:#bdbdc4;font-size:13px;">${fmtDate(s.date)}</td>
            <td style="padding:10px 14px;border-bottom:1px solid #1f1f25;color:#fff;font-weight:600;font-size:13px;">${SESSION_TYPE_FR[s.type] || s.type}</td>
            <td style="padding:10px 14px;border-bottom:1px solid #1f1f25;color:#76767e;font-size:12px;">${s.exercises.reduce((acc, e) => acc + e.sets.length, 0)} séries</td>
          </tr>`).join('')
    : `<tr><td colspan="3" style="padding:18px 14px;color:#76767e;font-size:13px;text-align:center;">Pas de séance enregistrée cette semaine.<br><span style="color:#ff6b35;font-size:12px;">On se rattrape la semaine pro 🔥</span></td></tr>`;

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Ton récap RezaKit</title>
  </head>
  <body style="margin:0;padding:0;background:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#f5f5f5;">
    <div style="max-width:560px;margin:0 auto;padding:24px 16px;">

      <div style="text-align:center;padding:20px 0 8px;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:38px;letter-spacing:2px;color:#ff6b35;font-weight:800;">RezaKit</div>
        <div style="font-size:11px;color:#76767e;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Récap hebdo · Dimanche</div>
      </div>

      <div style="background:linear-gradient(135deg,rgba(255,107,53,0.18),rgba(196,30,58,0.10));border:1px solid rgba(255,107,53,0.3);border-radius:18px;padding:22px 20px;margin:18px 0 14px;">
        <div style="font-size:18px;font-weight:800;color:#fff;margin-bottom:6px;">${greeting}</div>
        <div style="font-size:14px;color:#bdbdc4;line-height:1.55;">
          Voici ton récap de la semaine et ce qui t'attend.
        </div>
      </div>

      <table style="width:100%;border-spacing:8px 0;margin:14px 0;">
        <tr>
          <td style="background:#0E0E10;border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:16px 14px;text-align:center;width:33%;">
            <div style="font-family:'Bebas Neue',sans-serif;font-size:32px;color:#ff6b35;line-height:1;">${stats.sessionCount}</div>
            <div style="font-size:10px;color:#76767e;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-top:4px;">${sessionWord}</div>
          </td>
          <td style="background:#0E0E10;border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:16px 14px;text-align:center;width:33%;">
            <div style="font-family:'Bebas Neue',sans-serif;font-size:32px;color:#ff6b35;line-height:1;">${stats.totalSets}</div>
            <div style="font-size:10px;color:#76767e;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-top:4px;">Séries</div>
          </td>
          <td style="background:#0E0E10;border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:16px 14px;text-align:center;width:33%;">
            <div style="font-family:'Bebas Neue',sans-serif;font-size:32px;color:#ff6b35;line-height:1;">${stats.totalVolume.toLocaleString('fr-FR')}</div>
            <div style="font-size:10px;color:#76767e;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-top:4px;">Volume kg·rep</div>
          </td>
        </tr>
      </table>

      <div style="background:#0E0E10;border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:14px 16px;margin:14px 0;">
        <div style="font-size:10px;color:#76767e;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;margin-bottom:6px;">Muscles dominants</div>
        <div style="font-size:14px;color:#f5f5f5;font-weight:700;">${muscleList}</div>
      </div>

      <div style="margin:24px 0 6px;font-size:11px;color:#76767e;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">Cette semaine — fait</div>
      <table style="width:100%;background:#0E0E10;border:1px solid rgba(255,255,255,0.06);border-radius:14px;border-collapse:separate;overflow:hidden;">
        ${completedRows}
      </table>

      <div style="margin:22px 0 6px;font-size:11px;color:#ff6b35;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">Semaine prochaine — prévu</div>
      <table style="width:100%;background:#0E0E10;border:1px solid rgba(255,107,53,0.18);border-radius:14px;border-collapse:separate;overflow:hidden;">
        ${plannedRows}
      </table>

      <div style="text-align:center;padding:30px 0 10px;">
        <a href="https://resakit.fr" style="display:inline-block;background:linear-gradient(135deg,#ff6b35,#c41e3a);color:#fff;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:800;font-size:14px;letter-spacing:0.5px;">
          Ouvrir RezaKit →
        </a>
      </div>

      <div style="text-align:center;padding:24px 12px 6px;color:#44444a;font-size:10.5px;line-height:1.6;">
        Tu reçois cet email car tu as un compte RezaKit. Pour ne plus le recevoir,<br>
        réponds simplement avec « STOP » et on te désinscrit.
      </div>
    </div>
  </body>
</html>`;
}

async function fetchAllUsers(supabaseUrl: string, serviceKey: string): Promise<AuthUser[]> {
  // Use admin endpoint to list users in pages of 1000
  const users: AuthUser[] = [];
  let page = 1;
  while (true) {
    const r = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=1000`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });
    if (!r.ok) throw new Error(`auth list ${r.status}`);
    const j = await r.json() as { users: AuthUser[] };
    if (!j.users?.length) break;
    users.push(...j.users.map((u) => ({ id: u.id, email: u.email ?? null })));
    if (j.users.length < 1000) break;
    page += 1;
  }
  return users;
}

async function fetchUserData(supabaseUrl: string, serviceKey: string, userId: string): Promise<UserData | null> {
  const r = await fetch(`${supabaseUrl}/rest/v1/user_data?user_id=eq.${userId}&select=user_id,sessions,local_settings`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });
  if (!r.ok) return null;
  const arr = await r.json() as UserData[];
  return arr[0] ?? null;
}

function getProfileName(localSettings: Record<string, string> | null): string {
  try {
    const raw = localSettings?.user_profile;
    if (!raw) return '';
    const parsed = JSON.parse(raw) as { name?: string };
    return parsed.name ?? '';
  } catch { return ''; }
}

async function sendEmail(to: string, subject: string, html: string, from: string, apiKey: string) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`resend ${r.status}: ${txt}`);
  }
}

export default async function handler(req: Request): Promise<Response> {
  // 1. Auth
  const expected = process.env.CRON_SECRET;
  const got = req.headers.get('authorization');
  if (!expected || got !== `Bearer ${expected}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey   = process.env.RESEND_API_KEY;
  const fromEmail   = process.env.REPORT_FROM_EMAIL || 'RezaKit <noreply@resakit.fr>';

  if (!supabaseUrl || !serviceKey || !resendKey) {
    return new Response(JSON.stringify({ error: 'Missing env vars (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / RESEND_API_KEY)' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  const now = new Date();
  void PARIS_TZ_OFFSET_HOURS_FALLBACK;

  let users: AuthUser[];
  try {
    users = await fetchAllUsers(supabaseUrl, serviceKey);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Failed to list users: ' + e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  const results = { sent: 0, skipped: 0, failed: 0 };

  for (const u of users) {
    if (!u.email) { results.skipped += 1; continue; }
    try {
      const data = await fetchUserData(supabaseUrl, serviceKey, u.id);
      if (!data) { results.skipped += 1; continue; }
      const sessions = data.sessions ?? [];
      // Skip users that have literally never logged a session (cold accounts)
      if (sessions.length === 0) { results.skipped += 1; continue; }

      const stats = computeStats(sessions, now);
      const name  = getProfileName(data.local_settings);
      const html  = buildHtml(name, stats);

      await sendEmail(
        u.email,
        `🏋️ Ton récap RezaKit — ${stats.sessionCount} séance${stats.sessionCount === 1 ? '' : 's'} cette semaine`,
        html,
        fromEmail,
        resendKey,
      );
      results.sent += 1;
    } catch {
      results.failed += 1;
    }
  }

  return new Response(JSON.stringify({ ok: true, ...results }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
