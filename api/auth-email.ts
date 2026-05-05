// auth-email.ts — Vercel Function that bypasses Supabase SMTP entirely.
// Generates auth links via the Supabase Admin API (service_role key)
// and sends them through Resend. This eliminates the 4 emails/hour default
// SMTP rate-limit and the "❌ {}" errors caused by SMTP misconfiguration.
//
// POST /api/auth-email
//   { type: 'confirm', email, password }  → creates user + sends magic link to confirm
//   { type: 'reset',   email }            → sends password-recovery link
//
// Required env vars (add in Vercel Dashboard → Settings → Environment Variables):
//   SUPABASE_URL              — same as VITE_SUPABASE_URL (your project URL)
//   SUPABASE_SERVICE_ROLE_KEY — from Supabase Dashboard → Project Settings → API (service_role)
//   RESEND_API_KEY            — from resend.com (free tier: 3 000 emails/month)
//   REPORT_FROM_EMAIL         — optional, defaults to "RezaKit <noreply@resakit.fr>"
//                               Requires domain verified in Resend. Without verification, use
//                               "RezaKit <onboarding@resend.dev>" (test only, sends to all).

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'nodejs' };

const APP_URL = 'https://resakit.fr';

// ─── Email templates ──────────────────────────────────────────────────────────

function confirmHtml(link: string, email: string) {
  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:30px 20px;background:#050505;color:#f5f5f5;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="font-family:Georgia,serif;font-size:42px;letter-spacing:2px;color:#ff6b35;font-weight:800;">RezaKit</div>
    <div style="font-size:11px;color:#76767e;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">Ton kit fitness complet</div>
  </div>
  <div style="background:linear-gradient(135deg,rgba(255,107,53,0.18),rgba(196,30,58,0.10));border:1px solid rgba(255,107,53,0.3);border-radius:18px;padding:28px 22px;">
    <h1 style="margin:0 0 14px;font-size:22px;color:#fff;font-weight:800;">Bienvenue 💪</h1>
    <p style="margin:0 0 18px;color:#bdbdc4;line-height:1.6;font-size:14px;">
      Plus qu'une étape avant de commencer à tracker tes séances, ta nutrition et tes records :
      <strong style="color:#fff;">confirme ton email</strong> en cliquant sur le bouton ci-dessous.
    </p>
    <p style="text-align:center;margin:24px 0 8px;">
      <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#ff6b35,#c41e3a);color:#fff;padding:15px 40px;border-radius:999px;text-decoration:none;font-weight:800;font-size:14px;letter-spacing:0.5px;">
        Confirmer mon email →
      </a>
    </p>
    <p style="margin:14px 0 0;color:#76767e;font-size:11.5px;line-height:1.5;text-align:center;">
      Le lien expire dans 1 h. Si tu n'as pas demandé cet email, ignore-le.
    </p>
  </div>
  <div style="margin-top:30px;padding:16px;background:#0E0E10;border:1px solid rgba(255,255,255,0.06);border-radius:12px;font-size:12px;color:#bdbdc4;line-height:1.6;">
    <strong style="color:#ff6b35;">Et après ?</strong> Une fois connecté tu pourras :
    <ul style="margin:8px 0 0 18px;padding:0;color:#76767e;">
      <li>📊 Tracker tes séances de muscu avec historique complet</li>
      <li>🤖 Coach IA personnalisé (Gemini)</li>
      <li>📈 Voir tous tes records et ta progression</li>
      <li>🏃 Importer Strava / Garmin</li>
    </ul>
  </div>
  <div style="text-align:center;margin-top:24px;color:#44444a;font-size:10px;line-height:1.6;">
    RezaKit · ${APP_URL}<br>
    Email envoyé à ${email} — compte créé à ta demande.
  </div>
</div>`.trim();
}

function resetHtml(link: string) {
  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:30px 20px;background:#050505;color:#f5f5f5;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="font-family:Georgia,serif;font-size:42px;letter-spacing:2px;color:#ff6b35;font-weight:800;">RezaKit</div>
  </div>
  <div style="background:#0E0E10;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:28px 22px;">
    <h1 style="margin:0 0 14px;font-size:20px;color:#fff;font-weight:800;">Mot de passe oublié ?</h1>
    <p style="margin:0 0 18px;color:#bdbdc4;line-height:1.6;font-size:14px;">
      Pas de souci. Clique ci-dessous pour choisir un nouveau mot de passe.
      Le lien expire dans <strong style="color:#fff;">1 heure</strong>.
    </p>
    <p style="text-align:center;margin:24px 0 8px;">
      <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#ff6b35,#c41e3a);color:#fff;padding:15px 40px;border-radius:999px;text-decoration:none;font-weight:800;font-size:14px;">
        Choisir un nouveau mot de passe →
      </a>
    </p>
    <p style="margin:14px 0 0;color:#76767e;font-size:11.5px;line-height:1.5;text-align:center;">
      Si tu n'as pas demandé ce changement, ignore cet email — ton compte reste sécurisé.
    </p>
  </div>
  <div style="text-align:center;margin-top:24px;color:#44444a;font-size:10px;">
    RezaKit · ${APP_URL}
  </div>
</div>`.trim();
}

// ─── Resend helper ────────────────────────────────────────────────────────────

async function sendViaResend(
  apiKey: string,
  from: string,
  to: string,
  subject: string,
  html: string,
): Promise<string> {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html }),
  });
  const body = await r.json().catch(() => ({})) as { id?: string; message?: string; name?: string };
  if (!r.ok) {
    console.error('[auth-email] Resend rejected:', r.status, JSON.stringify(body));
    throw new Error(`Resend ${r.status}: ${body.message || body.name || JSON.stringify(body)}`);
  }
  console.log('[auth-email] Resend accepted — email_id:', body.id, '| from:', from, '| to:', to);
  return body.id || 'ok';
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const supabaseUrl  = process.env.SUPABASE_URL;
  const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey    = process.env.RESEND_API_KEY;
  const fromEmail    = process.env.REPORT_FROM_EMAIL || 'RezaKit <noreply@resakit.fr>';

  // Diagnostic GET endpoint — read-only Resend status (no sensitive data exposed)
  if (req.method === 'GET') {
    if (!resendKey) {
      res.status(503).json({ error: 'RESEND_API_KEY not set' }); return;
    }
    try {
      const [domainRes, emailRes] = await Promise.all([
        fetch('https://api.resend.com/domains', { headers: { Authorization: `Bearer ${resendKey}` } }).then(r => r.json()),
        fetch('https://api.resend.com/emails', { headers: { Authorization: `Bearer ${resendKey}` } }).then(r => r.json()),
      ]);
      // Sanitize: show domain status + last 5 email IDs only (no link/HTML content)
      const domains = (domainRes.data || []).map((d: Record<string, unknown>) => ({
        name: d.name, status: d.status,
        records: (d.records as Record<string, unknown>[] || []).map((r: Record<string, unknown>) => ({ type: r.type, name: r.name, status: r.status })),
      }));
      const recentEmails = (emailRes.data || []).slice(0, 5).map((e: Record<string, unknown>) => ({
        id: e.id, from: e.from, to: e.to, subject: e.subject,
        created_at: e.created_at, last_event: e.last_event,
      }));
      res.status(200).json({
        from_email: fromEmail,
        env_set: { supabase_url: !!supabaseUrl, service_key: !!serviceKey, resend_key: !!resendKey },
        resend_domains: domains,
        resend_recent_emails: recentEmails,
      });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' }); return;
  }

  if (!supabaseUrl || !serviceKey || !resendKey) {
    res.status(503).json({ error: 'email_not_configured' }); return;
  }

  const { type, email, password } = (req.body ?? {}) as {
    type?: string; email?: string; password?: string;
  };

  if (!type || !email || typeof email !== 'string') {
    res.status(400).json({ error: 'Missing type or email' }); return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Invalid email format' }); return;
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── Reset password ──────────────────────────────────────────────────────────
  if (type === 'reset') {
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: APP_URL },
    });

    if (error || !data?.properties?.action_link) {
      // Don't reveal if the email exists — just succeed silently (anti-enumeration)
      res.status(200).json({ ok: true }); return;
    }

    try {
      await sendViaResend(
        resendKey, fromEmail, email,
        'Réinitialise ton mot de passe RezaKit',
        resetHtml(data.properties.action_link),
      );
    } catch (e: unknown) {
      console.error('[auth-email reset] Resend error:', e);
      const msg = e instanceof Error ? e.message : String(e);
      res.status(500).json({ error: `email_send_failed: ${msg}` }); return;
    }

    res.status(200).json({ ok: true }); return;
  }

  // ── Signup confirmation ─────────────────────────────────────────────────────
  if (type === 'confirm') {
    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'weak_password' }); return;
    }

    // Create user — admin.createUser does NOT send Supabase emails, so no SMTP needed.
    const { error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    });

    if (createErr) {
      const msg = (createErr.message || '').toLowerCase();
      const alreadyExists = msg.includes('already') || msg.includes('exists') || msg.includes('registered');
      if (!alreadyExists) {
        console.error('[auth-email confirm] createUser error:', createErr);
        res.status(400).json({ error: createErr.message }); return;
      }
      // User exists (possibly unconfirmed) → fall through and resend the magic link
    }

    // Magic link auto-confirms the email AND signs the user in when clicked.
    const { data: ml, error: mlErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (mlErr || !ml?.properties?.action_link) {
      console.error('[auth-email confirm] generateLink error:', mlErr);
      res.status(500).json({ error: mlErr?.message || 'link_gen_failed' }); return;
    }

    try {
      await sendViaResend(
        resendKey, fromEmail, email,
        'Bienvenue sur RezaKit 🏋️ — confirme ton email',
        confirmHtml(ml.properties.action_link, email),
      );
    } catch (e: unknown) {
      console.error('[auth-email confirm] Resend error:', e);
      const msg = e instanceof Error ? e.message : String(e);
      res.status(500).json({ error: `email_send_failed: ${msg}` }); return;
    }

    res.status(200).json({ ok: true }); return;
  }

  res.status(400).json({ error: 'Invalid type' });
}
