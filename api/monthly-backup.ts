// Monthly GDPR backup — runs via Vercel Cron on the 1st of each month at
// 09:00 UTC. For each user, fetches their full Supabase row and emails it back
// as a JSON attachment via Resend.
//
// Required env vars (same as weekly-report):
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//   - RESEND_API_KEY
//   - CRON_SECRET
//   - REPORT_FROM_EMAIL  (default: "RezaKit <noreply@resakit.fr>")

export const config = { runtime: 'nodejs' };

interface AuthUser { id: string; email: string | null }

async function fetchAllUsers(supabaseUrl: string, serviceKey: string): Promise<AuthUser[]> {
  const users: AuthUser[] = [];
  let page = 1;
  while (true) {
    const r = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=1000`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
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

async function fetchUserData(supabaseUrl: string, serviceKey: string, userId: string): Promise<unknown | null> {
  const r = await fetch(`${supabaseUrl}/rest/v1/user_data?user_id=eq.${userId}&select=*`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  if (!r.ok) return null;
  const arr = await r.json();
  return Array.isArray(arr) && arr[0] ? arr[0] : null;
}

function buildBackupHtml(name: string, dateLabel: string): string {
  const greeting = name ? `Salut ${name}` : 'Salut';
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#f5f5f5;">
  <div style="max-width:560px;margin:0 auto;padding:30px 20px;">
    <div style="text-align:center;margin-bottom:20px;">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:38px;letter-spacing:2px;color:#ff6b35;font-weight:800;">RezaKit</div>
      <div style="font-size:11px;color:#76767e;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Backup mensuel · ${dateLabel}</div>
    </div>
    <div style="background:#0E0E10;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:22px 20px;">
      <div style="font-size:18px;font-weight:800;color:#fff;margin-bottom:10px;">${greeting} 🔒</div>
      <p style="margin:0 0 14px;color:#bdbdc4;line-height:1.6;font-size:14px;">
        Voici la sauvegarde mensuelle de toutes tes données RezaKit en pièce jointe (JSON).
      </p>
      <p style="margin:0;color:#bdbdc4;line-height:1.6;font-size:13px;">
        Garde-la précieusement : si jamais tu perds ton compte ou tu veux migrer vers une autre app,
        ce fichier contient <strong style="color:#fff;">100% de tes données</strong> (séances, mesures, profil, settings).
      </p>
      <div style="margin-top:14px;padding:12px 14px;background:rgba(74,222,128,0.06);border:1px solid rgba(74,222,128,0.18);border-radius:10px;font-size:12px;color:#4ade80;">
        ✓ Conformité RGPD — droit à la portabilité des données (Art. 20)
      </div>
    </div>
    <div style="text-align:center;padding:24px 12px 6px;color:#44444a;font-size:10.5px;line-height:1.6;">
      Tu peux désactiver ces backups dans Paramètres → Confidentialité.<br>
      RezaKit · resakit.fr
    </div>
  </div>
</body></html>`;
}

async function sendBackupEmail(
  to: string,
  subject: string,
  html: string,
  jsonAttachment: string,
  filename: string,
  from: string,
  apiKey: string,
) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from, to, subject, html,
      attachments: [{
        filename,
        content: Buffer.from(jsonAttachment, 'utf-8').toString('base64'),
      }],
    }),
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`resend ${r.status}: ${txt}`);
  }
}

function profileName(localSettings: unknown): string {
  if (!localSettings || typeof localSettings !== 'object') return '';
  try {
    const raw = (localSettings as Record<string, string>).user_profile;
    if (!raw) return '';
    const parsed = JSON.parse(raw) as { name?: string };
    return parsed.name ?? '';
  } catch { return ''; }
}

export default async function handler(req: Request): Promise<Response> {
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
    return new Response(JSON.stringify({ error: 'Missing env vars' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  const now = new Date();
  const dateLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const dateIso   = now.toISOString().split('T')[0];

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

      const localSettings = (data as any)?.local_settings;
      const name = profileName(localSettings);

      const payload = {
        exportedAt: new Date().toISOString(),
        exportFormatVersion: 1,
        app: 'RezaKit',
        user: { id: u.id, email: u.email },
        cloudBackup: data,
      };
      const json = JSON.stringify(payload, null, 2);

      await sendBackupEmail(
        u.email,
        `🔒 Backup RezaKit · ${dateLabel}`,
        buildBackupHtml(name, dateLabel),
        json,
        `rezakit-backup-${dateIso}.json`,
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
