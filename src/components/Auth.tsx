import { useState } from 'react';
import { useAuthStore, formatAuthError } from '../stores/authStore';
import { supabase } from '../db/supabase';
import { Icons } from './Icons';
import { t, tr, useLang } from '../utils/i18n';

function humanizeAuthError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid_credentials')) return tr({ fr: 'Email ou mot de passe incorrect.', en: 'Invalid email or password.', es: 'Correo o contraseña incorrectos.' });
  if (m.includes('already registered') || m.includes('already_registered') || m.includes('user_already_exists')) return tr({ fr: 'Email déjà utilisé. Connecte-toi.', en: 'Email already in use. Sign in instead.', es: 'Correo ya en uso. Inicia sesión.' });
  if (m.includes('weak') || m.includes('weak_password') || m.includes('password should be')) return tr({ fr: 'Mot de passe trop faible (min 6 caractères).', en: 'Password too weak (6 chars min).', es: 'Contraseña demasiado débil (mín 6 caracteres).' });
  if (m.includes('rate') || m.includes('429') || m.includes('over_email_send') || m.includes('email_rate_limit')) return tr({ fr: 'Trop de tentatives. Réessaie dans quelques minutes.', en: 'Too many attempts. Try again in a few minutes.', es: 'Demasiados intentos. Vuelve a intentarlo en unos minutos.' });
  if (m.includes('email_send_failed') || m.includes('email_provider_disabled') || m.includes('smtp')) return tr({ fr: "L'envoi d'email a échoué. Le serveur mail n'est pas encore configuré — réessaie plus tard ou contacte le support.", en: 'Email delivery failed. Mail server is not configured yet — try again later or contact support.', es: 'No se pudo enviar el correo. El servidor de correo no está configurado todavía — inténtalo más tarde o contacta soporte.' });
  if (m.includes('confirmation') || m.includes('not_confirmed') || m.includes('email_not_confirmed')) return tr({ fr: 'Tu dois confirmer ton email avant de te connecter.', en: 'Please confirm your email before signing in.', es: 'Debes confirmar tu correo antes de iniciar sesión.' });
  if (m.includes('invalid email') || m.includes('invalid_email')) return tr({ fr: 'Email invalide.', en: 'Invalid email.', es: 'Correo inválido.' });
  if (m === 'unknown_error' || m === '{}' || !m) return tr({ fr: 'Erreur inconnue. Vérifie ta connexion et réessaie. Si le problème persiste, le serveur mail est peut-être en panne.', en: 'Unknown error. Check your connection and retry. If it persists, the mail server may be down.', es: 'Error desconocido. Verifica tu conexión y reintenta. Si persiste, el servidor de correo puede estar caído.' });
  return raw;
}

interface AuthProps {
  onSkip: () => void;
  onShowLegal?: () => void;
}

export default function Auth({ onSkip, onShowLegal }: AuthProps) {
  useLang();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { signIn, signUp } = useAuthStore();

  const handleSubmit = async () => {
    if (loading) return; // debounce double-submit (Enter + click)

    if (mode === 'reset') {
      if (!email.trim()) return;
      setLoading(true);
      setError('');
      setSuccess('');
      try {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: 'https://resakit.fr',
        });
        if (err) {
          console.error('[auth.reset] error:', err);
          setError(humanizeAuthError(formatAuthError(err)));
        } else {
          setSuccess(tr({
            fr: 'Email envoyé ! Vérifie ta boîte mail (et tes spams) pour réinitialiser ton mot de passe.',
            en: 'Email sent! Check your inbox (and spam) to reset your password.',
            es: '¡Email enviado! Revisa tu bandeja (y spam) para restablecer la contraseña.',
          }));
        }
      } catch (e) {
        console.error('[auth.reset] thrown:', e);
        setError(humanizeAuthError(formatAuthError(e)));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email.trim() || !password.trim()) return;
    if (mode === 'signup' && password.length < 6) {
      setError(tr({ fr: 'Mot de passe trop faible (min 6 caractères).', en: 'Password too weak (6 chars min).', es: 'Contraseña demasiado débil (mín 6 caracteres).' }));
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const err = mode === 'login'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);

      if (err) {
        setError(humanizeAuthError(err));
      } else if (mode === 'signup') {
        setSuccess(tr({
          fr: 'Compte créé ! Vérifie tes emails (et tes spams) pour confirmer, puis connecte-toi.',
          en: 'Account created! Check your inbox (and spam) to confirm, then sign in.',
          es: '¡Cuenta creada! Revisa tu correo (y spam) para confirmar e inicia sesión.',
        }));
        setMode('login');
      }
    } catch (e) {
      console.error('[auth.submit] thrown:', e);
      setError(humanizeAuthError(formatAuthError(e)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg-0)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      overflowY: 'auto',
    }}>
      <div className="ambient-bg" />

      <div style={{ width: '100%', maxWidth: 380, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 24, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 12px 36px rgba(255,107,53,0.4)',
          }}>
            <Icons.Dumbbell size={36} color="#fff" stroke={2} />
          </div>
          <h1 className="t-display" style={{ fontSize: 48, lineHeight: 0.9, marginBottom: 8 }}>
            REZA<br />KIT
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-mute)', letterSpacing: 0.1 }}>
            {tr({ fr: 'Sync cloud · Multi-appareils', en: 'Cloud sync · Multi-device', es: 'Sync nube · Multidispositivo' })}
          </p>
        </div>

        {/* Card */}
        <div className="glass" style={{ borderRadius: 28, padding: '28px 24px' }}>

          {mode === 'reset' ? (
            <>
              <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-mute)', fontSize: 13, marginBottom: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                ← {tr({ fr: 'Retour à la connexion', en: 'Back to sign in', es: 'Volver al inicio' })}
              </button>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>{t('auth.forgot')}</div>
              <div style={{ fontSize: 12, color: 'var(--text-mute)', marginBottom: 20, lineHeight: 1.5 }}>
                {tr({
                  fr: 'Entre ton email, on t\'envoie un lien pour réinitialiser ton mot de passe.',
                  en: 'Enter your email and we\'ll send a reset link.',
                  es: 'Ingresa tu correo, te enviamos un enlace para restablecerla.',
                })}
              </div>
              <input
                type="email"
                placeholder={t('auth.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="input-glass"
                autoCapitalize="none"
                autoCorrect="off"
                autoFocus
              />
              {error && (
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--secondary)', fontWeight: 600 }}>❌ {error}</div>
              )}
              {success && (
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ok)', fontWeight: 600 }}>✓ {success}</div>
              )}
              <button onClick={handleSubmit} disabled={loading || !email.trim()}
                className="tap" style={{
                  marginTop: 16, width: '100%', border: 'none', borderRadius: 16,
                  padding: '16px',
                  background: email.trim() && !loading ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'rgba(255,255,255,0.06)',
                  color: '#fff', fontWeight: 700, fontSize: 15,
                  opacity: email.trim() && !loading ? 1 : 0.5,
                  boxShadow: email.trim() && !loading ? '0 8px 24px rgba(255,107,53,0.35)' : 'none',
                }}>
                {loading ? '...' : tr({ fr: 'Envoyer le lien', en: 'Send link', es: 'Enviar enlace' })}
              </button>
            </>
          ) : (
            <>
              <div className="glass" style={{ borderRadius: 14, padding: 4, display: 'flex', marginBottom: 24 }}>
                {(['login', 'signup'] as const).map((m) => (
                  <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                    className="tap" style={{
                      flex: 1, border: 'none', borderRadius: 10, padding: '9px',
                      background: mode === m ? 'var(--primary)' : 'transparent',
                      color: mode === m ? '#fff' : 'var(--text-mute)',
                      fontSize: 13, fontWeight: 700,
                    }}>
                    {m === 'login' ? t('auth.signIn') : t('auth.signUp')}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  type="email"
                  placeholder={t('auth.email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-glass"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
                <input
                  type="password"
                  placeholder={t('auth.password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  className="input-glass"
                />
              </div>

              {mode === 'login' && (
                <button onClick={() => { setMode('reset'); setError(''); setSuccess(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-mute)', fontSize: 12, marginTop: 10, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                  {t('auth.forgot')} ?
                </button>
              )}

              {error && (
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--secondary)', fontWeight: 600 }}>❌ {error}</div>
              )}
              {success && (
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ok)', fontWeight: 600 }}>✓ {success}</div>
              )}

              <button onClick={handleSubmit} disabled={loading || !email || !password}
                className="tap" style={{
                  marginTop: 20, width: '100%', border: 'none', borderRadius: 16,
                  padding: '16px',
                  background: email && password && !loading
                    ? 'linear-gradient(135deg, var(--primary), var(--secondary))'
                    : 'rgba(255,255,255,0.06)',
                  color: '#fff', fontWeight: 700, fontSize: 15,
                  opacity: email && password && !loading ? 1 : 0.5,
                  boxShadow: email && password && !loading ? '0 8px 24px rgba(255,107,53,0.35)' : 'none',
                  transition: 'all 0.2s',
                }}>
                {loading
                  ? '...'
                  : mode === 'login'
                  ? t('auth.signIn')
                  : tr({ fr: 'Créer mon compte', en: 'Create my account', es: 'Crear mi cuenta' })}
              </button>

              {/* RGPD-compliant privacy notice on signup */}
              {mode === 'signup' && onShowLegal && (
                <div style={{
                  marginTop: 14,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'rgba(96,165,250,0.06)',
                  border: '1px solid rgba(96,165,250,0.18)',
                  fontSize: 11,
                  color: 'var(--text-mute)',
                  lineHeight: 1.5,
                  textAlign: 'center',
                }}>
                  {t('auth.legalAgree')}{' '}
                  <button onClick={onShowLegal} style={{
                    background: 'none', border: 'none', padding: 0,
                    color: 'var(--info)', fontWeight: 700, cursor: 'pointer',
                    textDecoration: 'underline', fontSize: 11,
                  }}>
                    {t('auth.legalLink')}
                  </button>.
                </div>
              )}
            </>
          )}
        </div>

        {mode !== 'reset' && (
          <button onClick={onSkip} className="tap" style={{
            marginTop: 20, width: '100%', background: 'none', border: 'none',
            color: 'var(--text-mute)', fontSize: 13, fontWeight: 600, padding: '10px',
          }}>
            {t('auth.skip')}
          </button>
        )}
      </div>
    </div>
  );
}
