import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../db/supabase';
import { Icons } from './Icons';
import { t, tr, useLang } from '../utils/i18n';

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
    if (mode === 'reset') {
      if (!email.trim()) return;
      setLoading(true);
      setError('');
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'https://resakit.fr',
      });
      setLoading(false);
      if (err) setError(`${tr({ fr: 'Erreur', en: 'Error', es: 'Error' })} : ` + err.message);
      else setSuccess(tr({
        fr: 'Email envoyé ! Vérifie ta boîte mail pour réinitialiser ton mot de passe.',
        en: 'Email sent! Check your inbox to reset your password.',
        es: '¡Email enviado! Revisa tu bandeja para restablecer la contraseña.',
      }));
      return;
    }

    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');

    const err = mode === 'login'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password);

    setLoading(false);

    if (err) {
      if (err.includes('Invalid login')) setError(tr({ fr: 'Email ou mot de passe incorrect.', en: 'Invalid email or password.', es: 'Correo o contraseña incorrectos.' }));
      else if (err.includes('already registered')) setError(tr({ fr: 'Email déjà utilisé. Connecte-toi.', en: 'Email already in use. Sign in instead.', es: 'Correo ya en uso. Inicia sesión.' }));
      else if (err.includes('weak')) setError(tr({ fr: 'Mot de passe trop faible (min 6 caractères).', en: 'Password too weak (6 chars min).', es: 'Contraseña demasiado débil (mín 6 caracteres).' }));
      else setError(err);
    } else if (mode === 'signup') {
      setSuccess(tr({
        fr: 'Compte créé ! Vérifie tes emails pour confirmer, puis connecte-toi.',
        en: 'Account created! Check your email to confirm, then sign in.',
        es: '¡Cuenta creada! Revisa tu correo para confirmar e inicia sesión.',
      }));
      setMode('login');
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
