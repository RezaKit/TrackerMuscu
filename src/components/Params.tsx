import { useEffect, useState } from 'react';
import { useAuthStore, formatAuthError } from '../stores/authStore';
import { supabase } from '../db/supabase';
import { db } from '../db/db';
import { Icons } from './Icons';
import { scheduleSync } from '../utils/cloudSync';
import { GOALS, GOAL_COLORS, type GoalType, type UserProfile } from './Onboarding';
import {
  isStravaConnected, getStravaAthlete, disconnectStrava,
  stravaAuthUrl, syncStravaActivities, syncGarminCalories,
} from '../utils/strava';
import { LANG_LABELS, useLang, type Lang, t, tr } from '../utils/i18n';
import { exportAllDataToJson } from '../utils/dataExport';

interface ParamsProps {
  showToast: (msg: string, type?: 'success' | 'info' | 'record') => void;
  onShowAuth?: () => void;
  onShowLegal?: () => void;
}

function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem('user_profile');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function Params({ showToast, onShowAuth, onShowLegal }: ParamsProps) {
  const { user, signOut } = useAuthStore();
  const [lang, setLang] = useLang();

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showKey, setShowKey] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [stravaConnected, setStravaConnected] = useState(isStravaConnected);
  const [stravaSyncing, setStravaSyncing] = useState(false);
  const stravaAthlete = getStravaAthlete();
  const garminConnected = !!localStorage.getItem('garmin_token');
  const [garminSyncing, setGarminSyncing] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(loadProfile);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExportData = async () => {
    setExporting(true);
    try {
      await exportAllDataToJson();
      showToast(t('privacy.exportDone'), 'success');
    } catch {
      showToast(tr({ fr: 'Erreur lors de l\'export', en: 'Export error', es: 'Error al exportar' }), 'info');
    } finally {
      setExporting(false);
    }
  };

  // Re-sync state from localStorage after cloud restore (prevents the
  // "API key disappears on a fresh device" race condition: useState() reads
  // localStorage before restoreFromCloud has rewritten it).
  useEffect(() => {
    const refresh = () => {
      setApiKey(localStorage.getItem('gemini_api_key') || '');
      setProfile(loadProfile());
      setStravaConnected(isStravaConnected());
    };
    window.addEventListener('rezakit:cloud-restored', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('rezakit:cloud-restored', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const handleGoalChange = (goal: GoalType) => {
    if (!profile) return;
    const updated = { ...profile, goal };
    localStorage.setItem('user_profile', JSON.stringify(updated));
    setProfile(updated);
    setShowGoalPicker(false);
    scheduleSync();
    showToast(tr({ fr: 'Objectif mis à jour', en: 'Goal updated', es: 'Objetivo actualizado' }), 'success');
  };

  const handleResetAccount = async () => {
    setResetting(true);
    try {
      await Promise.all([
        db.sessions.clear(),
        db.templates.clear(),
        db.courses.clear(),
        db.natations.clear(),
        db.bodyweights.clear(),
        db.customExercises.clear(),
        db.calories.clear(),
        db.routineItems.clear(),
        db.routineCompletions.clear(),
      ]);
      const keysToRemove = [
        'ai_chat_history', 'ai_coach_memory', 'coach_profile',
        'strava_token', 'strava_refresh', 'strava_expires',
        'strava_athlete_id', 'strava_name', 'strava_imported_ids', 'strava_cal_imported_ids',
        'garmin_token', 'garmin_secret',
        'rezakit_calorie_goal',
      ];
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      if (user) {
        await supabase.from('user_data').delete().eq('user_id', user.id);
      }
      showToast(tr({ fr: 'Compte réinitialisé — toutes les données supprimées', en: 'Account reset — all data deleted', es: 'Cuenta restablecida — todos los datos eliminados' }), 'info');
      setShowResetConfirm(false);
      window.location.reload();
    } catch {
      showToast(tr({ fr: 'Erreur lors de la réinitialisation', en: 'Reset error', es: 'Error al restablecer' }), 'info');
    }
    setResetting(false);
  };

  const handleChangePassword = async () => {
    if (newPassword !== newPassword2) { showToast(tr({ fr: 'Les mots de passe ne correspondent pas', en: 'Passwords do not match', es: 'Las contraseñas no coinciden' }), 'info'); return; }
    if (newPassword.length < 6) { showToast(tr({ fr: 'Minimum 6 caractères', en: 'Minimum 6 characters', es: 'Mínimo 6 caracteres' }), 'info'); return; }
    if (loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        console.error('[auth.updatePassword] error:', error);
        showToast(tr({ fr: 'Erreur : ', en: 'Error: ', es: 'Error: ' }) + formatAuthError(error), 'info');
      } else {
        setNewPassword(''); setNewPassword2('');
        showToast(tr({ fr: 'Mot de passe modifié ✓', en: 'Password updated ✓', es: 'Contraseña actualizada ✓' }), 'success');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.includes('@')) { showToast(tr({ fr: 'Email invalide', en: 'Invalid email', es: 'Email inválido' }), 'info'); return; }
    if (loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) {
        console.error('[auth.updateEmail] error:', error);
        showToast(tr({ fr: 'Erreur : ', en: 'Error: ', es: 'Error: ' }) + formatAuthError(error), 'info');
      } else {
        setNewEmail('');
        showToast(tr({ fr: 'Vérifie ton nouvel email pour confirmer', en: 'Check your new email to confirm', es: 'Revisa tu nuevo correo para confirmar' }), 'success');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    if (loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: 'https://resakit.fr',
      });
      if (error) {
        console.error('[auth.resetPasswordForEmail] error:', error);
        showToast(tr({ fr: 'Erreur : ', en: 'Error: ', es: 'Error: ' }) + formatAuthError(error), 'info');
      } else {
        setResetSent(true);
        showToast(tr({ fr: 'Email de réinitialisation envoyé !', en: 'Reset email sent!', es: '¡Correo de restablecimiento enviado!' }), 'success');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStravaSync = async () => {
    setStravaSyncing(true);
    const { imported, skipped, caloriesImported } = await syncStravaActivities();
    setStravaSyncing(false);
    if (imported > 0 || caloriesImported > 0) {
      const parts = [];
      if (imported > 0) parts.push(`${imported} activité${imported > 1 ? 's' : ''}`);
      if (caloriesImported > 0) parts.push(`${caloriesImported} kcal`);
      showToast(`Strava : ${parts.join(' · ')} ${tr({ fr: 'importés !', en: 'imported!', es: '¡importados!' })}`, 'success');
    } else {
      showToast(`${tr({ fr: 'Aucune nouvelle activité', en: 'No new activity', es: 'Sin nueva actividad' })} (${skipped} ${tr({ fr: 'déjà importées', en: 'already imported', es: 'ya importadas' })})`, 'info');
    }
  };

  const handleGarminSync = async () => {
    setGarminSyncing(true);
    const cal = await syncGarminCalories();
    setGarminSyncing(false);
    if (cal > 0) showToast(`Garmin : ${cal} kcal ${tr({ fr: 'actives importées !', en: 'active calories imported!', es: '¡calorías activas importadas!' })}`, 'success');
    else showToast(tr({ fr: "Garmin : déjà à jour pour aujourd'hui", en: "Garmin: already up to date for today", es: "Garmin: ya actualizado para hoy" }), 'info');
  };

  const handleStravaDisconnect = () => {
    disconnectStrava();
    setStravaConnected(false);
    showToast(tr({ fr: 'Strava déconnecté', en: 'Strava disconnected', es: 'Strava desconectado' }), 'info');
  };

  const handleGarminConnect = async () => {
    try {
      const res = await fetch('/api/garmin/request-token');
      if (!res.ok) {
        const err = await res.json() as { error: string };
        showToast(err.error || tr({ fr: 'Garmin non disponible', en: 'Garmin unavailable', es: 'Garmin no disponible' }), 'info');
        return;
      }
      const data = await res.json() as { authorize_url: string };
      window.location.href = data.authorize_url;
    } catch {
      showToast(tr({ fr: 'Erreur de connexion Garmin', en: 'Garmin connection error', es: 'Error de conexión Garmin' }), 'info');
    }
  };

  const handleShare = () => {
    const url = 'https://resakit.fr';
    const text = tr({ fr: 'Essaie RezaKit — ton kit fitness complet : séances, cardio, nutrition et coach IA', en: 'Try RezaKit — your complete fitness kit: workouts, cardio, nutrition and AI coach', es: 'Prueba RezaKit — tu kit fitness completo: sesiones, cardio, nutrición y coach IA' });
    if (navigator.share) {
      navigator.share({ title: 'RezaKit', text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => showToast(tr({ fr: 'Lien copié !', en: 'Link copied!', es: '¡Enlace copiado!' }), 'success'));
    }
  };

  return (
    <div className="page-enter">
      <div style={{ padding: '14px 22px 14px' }}>
        <div style={{ fontSize: 11, color: 'var(--text-mute)', letterSpacing: 0.16, fontWeight: 700, textTransform: 'uppercase' }}>{t('params.general')}</div>
        <h1 className="t-display" style={{ margin: '4px 0 0', fontSize: 52, lineHeight: 0.88 }}>{t('params.title')}</h1>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Langue ─────────────────────────────── */}
        <div className="glass" style={{ borderRadius: 22, padding: '18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 11, flexShrink: 0,
              background: 'rgba(96,165,250,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>🌍</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{t('params.language')}</div>
              <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>{t('params.languageSub')}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {(Object.keys(LANG_LABELS) as Lang[]).map((code) => {
              const isOn = lang === code;
              const meta = LANG_LABELS[code];
              return (
                <button
                  key={code}
                  onClick={() => { setLang(code); showToast(`✓ ${meta.native}`, 'success'); }}
                  className="tap"
                  style={{
                    flex: 1, padding: '10px 6px',
                    border: `1.5px solid ${isOn ? 'var(--primary)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 12,
                    background: isOn ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.03)',
                    color: isOn ? 'var(--text)' : 'var(--text-soft)',
                    fontWeight: 700, fontSize: 12,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}
                >
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{meta.flag}</span>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{meta.native}</span>
                </button>
              );
            })}
          </div>
        </div>


        {/* ── Compte ────────────────────────────── */}
        {user ? (
          <>
            <div className="glass" style={{ borderRadius: 22, padding: '18px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 16, flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 700, color: '#fff',
                }}>
                  {user.email?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{user.email?.split('@')[0]}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 2 }}>{user.email}</div>
                </div>
              </div>
            </div>

            <div className="glass" style={{ borderRadius: 22, padding: '18px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>{t('params.changePassword')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ position: 'relative' }}>
                  <input type={showPwd ? 'text' : 'password'} placeholder={tr({ fr: 'Nouveau mot de passe', en: 'New password', es: 'Nueva contraseña' })}
                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="input-glass" style={{ paddingRight: 52 }} />
                  <button onClick={() => setShowPwd(s => !s)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-mute)', fontSize: 12, cursor: 'pointer',
                  }}>{showPwd ? tr({ fr: 'Cacher', en: 'Hide', es: 'Ocultar' }) : tr({ fr: 'Voir', en: 'Show', es: 'Ver' })}</button>
                </div>
                <input type={showPwd ? 'text' : 'password'} placeholder={tr({ fr: 'Confirmer le mot de passe', en: 'Confirm password', es: 'Confirmar contraseña' })}
                  value={newPassword2} onChange={(e) => setNewPassword2(e.target.value)}
                  className="input-glass" />
                {newPassword && newPassword2 && newPassword !== newPassword2 && (
                  <div style={{ fontSize: 11, color: 'var(--secondary)', fontWeight: 600 }}>
                    ❌ {tr({ fr: 'Les mots de passe ne correspondent pas', en: 'Passwords do not match', es: 'Las contraseñas no coinciden' })}
                  </div>
                )}
                <button onClick={handleChangePassword}
                  disabled={loading || !newPassword || newPassword !== newPassword2} className="tap" style={{
                    border: 'none', borderRadius: 12, padding: '11px',
                    background: newPassword && newPassword === newPassword2 ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                    color: '#fff', fontWeight: 700, fontSize: 13,
                    opacity: newPassword && newPassword === newPassword2 && !loading ? 1 : 0.4,
                  }}>
                  {loading ? '...' : tr({ fr: 'Modifier le mot de passe', en: 'Update password', es: 'Actualizar contraseña' })}
                </button>
              </div>
            </div>

            <div className="glass" style={{ borderRadius: 22, padding: '18px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t('params.changeEmail')}</div>
              <div style={{ fontSize: 11, color: 'var(--text-mute)', marginBottom: 14 }}>
                {tr({ fr: 'Un email de confirmation sera envoyé aux deux adresses.', en: 'A confirmation email will be sent to both addresses.', es: 'Se enviará un correo de confirmación a ambas direcciones.' })}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input type="email" placeholder={tr({ fr: 'Nouvel email', en: 'New email', es: 'Nuevo correo' })} value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="input-glass" autoCapitalize="none" />
                <button onClick={handleChangeEmail} disabled={loading || !newEmail.includes('@')} className="tap" style={{
                  border: 'none', borderRadius: 12, padding: '11px',
                  background: newEmail.includes('@') ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.06)',
                  color: newEmail.includes('@') ? 'var(--primary)' : 'var(--text-mute)',
                  fontWeight: 700, fontSize: 13,
                  opacity: newEmail.includes('@') && !loading ? 1 : 0.4,
                }}>
                  {loading ? '...' : tr({ fr: "Modifier l'email", en: 'Update email', es: 'Actualizar correo' })}
                </button>
              </div>
            </div>

            <div className="glass" style={{ borderRadius: 22, padding: '16px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t('params.forgotPassword')}</div>
              <div style={{ fontSize: 11, color: 'var(--text-mute)', marginBottom: 12, lineHeight: 1.5 }}>
                {tr({ fr: 'Envoie un lien de réinitialisation sur', en: 'Send a reset link to', es: 'Enviar un enlace de restablecimiento a' })}{' '}
                <strong style={{ color: 'var(--text-soft)' }}>{user.email}</strong>
              </div>
              <button onClick={handleResetPassword} disabled={loading || resetSent} className="tap" style={{
                width: '100%', border: 'none', borderRadius: 12, padding: '11px',
                background: resetSent ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.06)',
                color: resetSent ? 'var(--ok)' : 'var(--text-mute)',
                fontWeight: 700, fontSize: 13, opacity: loading ? 0.4 : 1,
              }}>
                {resetSent ? tr({ fr: '✓ Email envoyé !', en: '✓ Email sent!', es: '✓ ¡Correo enviado!' }) : loading ? '...' : tr({ fr: 'Envoyer le lien de réinitialisation', en: 'Send reset link', es: 'Enviar enlace de restablecimiento' })}
              </button>
            </div>
          </>
        ) : (
          <div className="glass" style={{ borderRadius: 22, padding: '24px', textAlign: 'center' }}>
            <Icons.Settings size={28} color="var(--text-faint)" />
            <div style={{ marginTop: 10, fontWeight: 700, fontSize: 14 }}>{t('params.notLoggedIn')}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-mute)', marginBottom: 16 }}>
              {tr({ fr: 'Connecte-toi pour synchroniser tes données et gérer ton compte.', en: 'Sign in to sync your data and manage your account.', es: 'Inicia sesión para sincronizar tus datos y gestionar tu cuenta.' })}
            </div>
            <button onClick={onShowAuth} className="tap" style={{
              border: 'none', borderRadius: 14, padding: '12px 24px',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: '#fff', fontWeight: 700, fontSize: 14,
            }}>
              {t('params.signIn')}
            </button>
          </div>
        )}

        {/* ── Clé API Gemini ────────────────────── */}
        <div className="glass" style={{ borderRadius: 22, padding: '18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 11, flexShrink: 0,
              background: apiKey ? 'rgba(74,222,128,0.12)' : 'rgba(255,107,53,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icons.Bot size={18} color={apiKey ? 'var(--ok)' : 'var(--primary)'} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{apiKey ? tr({ fr: 'Coach IA activé ✓', en: 'AI Coach enabled ✓', es: 'Coach IA activado ✓' }) : tr({ fr: 'Clé API Coach IA', en: 'AI Coach API Key', es: 'Clave API Coach IA' })}</div>
              <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>
                {apiKey ? tr({ fr: 'Gemini 2.5 Flash · Gratuit', en: 'Gemini 2.5 Flash · Free', es: 'Gemini 2.5 Flash · Gratuito' }) : tr({ fr: 'aistudio.google.com · Gratuit', en: 'aistudio.google.com · Free', es: 'aistudio.google.com · Gratuito' })}
              </div>
            </div>
          </div>
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="input-glass"
              // ⚠️ font-size MUST stay >= 16px on iOS — anything smaller triggers
              // a Safari auto-zoom on focus that locks the layout. Don't override.
              style={{ paddingRight: 52, fontFamily: 'var(--mono)' }}
            />
            <button onClick={() => setShowKey(s => !s)} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'var(--text-mute)', fontSize: 12, cursor: 'pointer',
            }}>
              {showKey ? tr({ fr: 'Cacher', en: 'Hide', es: 'Ocultar' }) : tr({ fr: 'Voir', en: 'Show', es: 'Ver' })}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => {
              if (apiKey.trim()) { localStorage.setItem('gemini_api_key', apiKey.trim()); scheduleSync(); showToast(tr({ fr: 'Coach IA activé !', en: 'AI Coach enabled!', es: '¡Coach IA activado!' }), 'success'); }
            }} disabled={!apiKey.trim()} className="tap" style={{
              flex: 1, border: 'none', borderRadius: 12, padding: '11px',
              background: apiKey.trim() ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
              color: '#fff', fontWeight: 700, fontSize: 13, opacity: apiKey.trim() ? 1 : 0.4,
            }}>
              {tr({ fr: 'Activer le Coach IA', en: 'Enable AI Coach', es: 'Activar Coach IA' })}
            </button>
            {localStorage.getItem('gemini_api_key') && (
              <button onClick={() => {
                localStorage.removeItem('gemini_api_key');
                setApiKey('');
                showToast(tr({ fr: 'Clé supprimée', en: 'Key deleted', es: 'Clave eliminada' }), 'info');
              }} className="tap" style={{
                border: 'none', borderRadius: 12, padding: '10px 14px',
                background: 'rgba(196,30,58,0.15)', color: 'var(--secondary)', fontWeight: 700, fontSize: 13,
              }}>
                {tr({ fr: 'Effacer', en: 'Remove', es: 'Eliminar' })}
              </button>
            )}
          </div>

          {/* Guide obtenir la clé */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 0.1, marginBottom: 12 }}>
              {tr({ fr: 'Comment obtenir la clé (2 min)', en: 'How to get your API key (2 min)', es: 'Cómo obtener la clave (2 min)' })}
            </div>
            {[
              {
                n: '1',
                text: tr({ fr: 'Va sur aistudio.google.com', en: 'Go to aistudio.google.com', es: 'Ve a aistudio.google.com' }),
                sub: tr({ fr: 'Connecte-toi avec ton compte Google (gratuit)', en: 'Sign in with your Google account (free)', es: 'Inicia sesión con tu cuenta Google (gratis)' }),
                link: 'https://aistudio.google.com/apikey',
              },
              {
                n: '2',
                text: tr({ fr: 'Clique « Create API key »', en: 'Click "Create API key"', es: 'Haz clic en "Create API key"' }),
                sub: tr({ fr: "Si on te demande un projet : choisis « Gemini API » ou crée un nouveau projet, peu importe", en: 'If asked for a project: choose "Gemini API" or create a new one, it does not matter', es: 'Si te piden proyecto: elige "Gemini API" o crea uno nuevo, no importa' }),
              },
              {
                n: '3',
                text: tr({ fr: 'Vérifie le plan : Free tier', en: 'Check the plan: Free tier', es: 'Verifica el plan: Free tier' }),
                sub: tr({ fr: "En haut tu dois voir « Free » — pas de carte bancaire requise. C'est ce qu'il faut.", en: 'You should see "Free" at the top — no credit card required. That is what you need.', es: 'Debes ver "Free" arriba — sin tarjeta bancaria requerida. Es lo que necesitas.' }),
              },
              {
                n: '4',
                text: tr({ fr: 'Copie la clé (commence par AIzaSy…)', en: 'Copy the key (starts with AIzaSy…)', es: 'Copia la clave (empieza con AIzaSy…)' }),
                sub: tr({ fr: 'Colle-la dans le champ ci-dessus puis clique « Activer le Coach IA »', en: 'Paste it in the field above then click "Enable AI Coach"', es: 'Pégala en el campo de arriba y haz clic en "Activar Coach IA"' }),
              },
            ].map(({ n, text, sub, link }) => (
              <div key={n} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 22, height: 22, borderRadius: 7, background: 'var(--primary)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  {n}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>
                    {link ? (
                      <a href={link} target="_blank" rel="noopener noreferrer"
                        style={{ color: 'var(--primary)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                        {text} ↗
                      </a>
                    ) : text}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 1, lineHeight: 1.45 }}>{sub}</div>
                </div>
              </div>
            ))}
            <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.12)', marginTop: 4 }}>
              <div style={{ fontSize: 11, color: 'var(--ok)', fontWeight: 700, marginBottom: 4 }}>
                {tr({ fr: '✓ Free tier — pas de carte bancaire requise', en: '✓ Free tier — no credit card required', es: '✓ Free tier — sin tarjeta bancaria requerida' })}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-mute)', lineHeight: 1.5 }}>
                {tr({ fr: 'Modèle utilisé :', en: 'Model used:', es: 'Modelo usado:' })} <strong style={{ color: 'var(--text-soft)' }}>gemini-2.5-flash</strong>
                <br />{tr({ fr: 'Limite : ~10 requêtes/min, 250/jour. Largement suffisant pour discuter avec ton coach.', en: 'Limit: ~10 requests/min, 250/day. More than enough to chat with your coach.', es: 'Límite: ~10 solicitudes/min, 250/día. Más que suficiente para chatear con tu coach.' })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Strava ───────────────────────────── */}
        <div className="glass" style={{ borderRadius: 22, padding: '18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 11, flexShrink: 0,
              background: stravaConnected ? 'rgba(252,76,2,0.15)' : 'rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>🏃</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                Strava {stravaConnected ? '✓' : ''}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>
                {stravaConnected
                  ? `${tr({ fr: 'Connecté', en: 'Connected', es: 'Conectado' })}${stravaAthlete ? ` · ${stravaAthlete.name}` : ''}`
                  : tr({ fr: 'Importe tes courses et natations automatiquement', en: 'Automatically import your runs and swims', es: 'Importa tus carreras y nataciones automáticamente' })}
              </div>
            </div>
          </div>

          {stravaConnected ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleStravaSync} disabled={stravaSyncing} className="tap" style={{
                flex: 1, border: 'none', borderRadius: 12, padding: '11px',
                background: 'rgba(252,76,2,0.15)', color: '#FC4C02', fontWeight: 700, fontSize: 13,
                opacity: stravaSyncing ? 0.5 : 1,
              }}>
                {stravaSyncing ? `⟳ ${tr({ fr: 'Sync...', en: 'Sync...', es: 'Sincron...' })}` : `↓ ${tr({ fr: 'Synchroniser', en: 'Sync', es: 'Sincronizar' })}`}
              </button>
              <button onClick={handleStravaDisconnect} className="tap" style={{
                border: 'none', borderRadius: 12, padding: '10px 14px',
                background: 'rgba(196,30,58,0.12)', color: 'var(--secondary)', fontWeight: 700, fontSize: 13,
              }}>
                {tr({ fr: 'Déconnecter', en: 'Disconnect', es: 'Desconectar' })}
              </button>
            </div>
          ) : (
            <button onClick={() => window.location.href = stravaAuthUrl()} className="tap" style={{
              width: '100%', border: 'none', borderRadius: 12, padding: '12px',
              background: '#FC4C02', color: '#fff', fontWeight: 700, fontSize: 13,
            }}>
              {tr({ fr: 'Connecter Strava', en: 'Connect Strava', es: 'Conectar Strava' })}
            </button>
          )}
        </div>

        {/* ── Garmin ───────────────────────────── */}
        <div className="glass" style={{ borderRadius: 22, padding: '18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 11, flexShrink: 0,
              background: garminConnected ? 'rgba(0,168,107,0.15)' : 'rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>⌚</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                Garmin {garminConnected ? '✓' : ''}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>
                {garminConnected
                  ? tr({ fr: 'Connecté · calories importées automatiquement', en: 'Connected · calories imported automatically', es: 'Conectado · calorías importadas automáticamente' })
                  : tr({ fr: 'Montre Garmin → calories brûlées auto', en: 'Garmin watch → burned calories auto', es: 'Reloj Garmin → calorías quemadas auto' })}
              </div>
            </div>
          </div>

          {garminConnected ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleGarminSync} disabled={garminSyncing} className="tap" style={{
                flex: 1, border: 'none', borderRadius: 12, padding: '11px',
                background: 'rgba(0,168,107,0.15)', color: '#00A86B', fontWeight: 700, fontSize: 13,
                opacity: garminSyncing ? 0.5 : 1,
              }}>
                {garminSyncing ? `⟳ ${tr({ fr: 'Sync...', en: 'Sync...', es: 'Sincron...' })}` : `↓ ${tr({ fr: 'Calories du jour', en: "Today's calories", es: 'Calorías de hoy' })}`}
              </button>
              <button onClick={() => {
                localStorage.removeItem('garmin_token');
                localStorage.removeItem('garmin_secret');
                showToast(tr({ fr: 'Garmin déconnecté', en: 'Garmin disconnected', es: 'Garmin desconectado' }), 'info');
              }} className="tap" style={{
                border: 'none', borderRadius: 12, padding: '10px 14px',
                background: 'rgba(196,30,58,0.12)', color: 'var(--secondary)', fontWeight: 700, fontSize: 13,
              }}>
                {tr({ fr: 'Déconnecter', en: 'Disconnect', es: 'Desconectar' })}
              </button>
            </div>
          ) : (
            <>
              <button onClick={handleGarminConnect} className="tap" style={{
                width: '100%', border: 'none', borderRadius: 12, padding: '12px',
                background: 'rgba(0,168,107,0.15)', color: '#00A86B', fontWeight: 700, fontSize: 13,
                marginBottom: 8,
              }}>
                {tr({ fr: 'Connecter Garmin', en: 'Connect Garmin', es: 'Conectar Garmin' })}
              </button>
              <div style={{ fontSize: 10.5, color: 'var(--text-faint)', lineHeight: 1.5, textAlign: 'center' }}>
                {tr({ fr: 'Nécessite un compte développeur Garmin Health API approuvé.', en: 'Requires an approved Garmin Health API developer account.', es: 'Requiere una cuenta de desarrollador Garmin Health API aprobada.' })}{'\n'}
                {tr({ fr: 'Compatible Forerunner, Fenix, Venu, Vivoactive...', en: 'Compatible with Forerunner, Fenix, Venu, Vivoactive...', es: 'Compatible con Forerunner, Fenix, Venu, Vivoactive...' })}
              </div>
            </>
          )}
        </div>

        {/* ── Inviter un ami ────────────────────── */}
        <div className="glass" style={{ borderRadius: 22, padding: '18px 16px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{tr({ fr: 'Inviter un ami', en: 'Invite a friend', es: 'Invitar a un amigo' })}</div>
          <div style={{ fontSize: 11, color: 'var(--text-mute)', marginBottom: 14 }}>
            {tr({ fr: "Partage l'app — compte gratuit, toutes les fonctionnalités incluses.", en: 'Share the app — free account, all features included.', es: 'Comparte la app — cuenta gratuita, todas las funciones incluidas.' })}
          </div>
          <button onClick={handleShare} className="tap" style={{
            width: '100%', borderRadius: 14, padding: '12px',
            background: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(196,30,58,0.1))',
            color: 'var(--primary)', fontWeight: 700, fontSize: 13,
            border: '1px solid rgba(255,107,53,0.25)',
          }}>
            {tr({ fr: "Partager l'app 🏋️", en: 'Share the app 🏋️', es: 'Compartir la app 🏋️' })}
          </button>
          <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--mono)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              resakit.fr
            </div>
            <button onClick={() => navigator.clipboard.writeText('https://resakit.fr').then(() => showToast(tr({ fr: 'Lien copié !', en: 'Link copied!', es: '¡Enlace copiado!' }), 'success'))}
              className="tap" style={{ background: 'none', border: 'none', color: 'var(--text-mute)', fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
              {tr({ fr: 'Copier', en: 'Copy', es: 'Copiar' })}
            </button>
          </div>
        </div>

        {/* ── Objectif ──────────────────────────── */}
        {profile && (
          <div className="glass" style={{ borderRadius: 22, padding: '18px 16px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{tr({ fr: 'Objectif principal', en: 'Main goal', es: 'Objetivo principal' })}</div>
            <div style={{ fontSize: 11, color: 'var(--text-mute)', marginBottom: 14 }}>
              {tr({ fr: "L'IA adapte tous ses conseils à ton objectif.", en: 'The AI adapts all advice to your goal.', es: 'La IA adapta todos sus consejos a tu objetivo.' })}
            </div>
            {!showGoalPicker ? (
              <button onClick={() => setShowGoalPicker(true)} className="tap" style={{
                width: '100%', border: `1.5px solid ${GOAL_COLORS[profile.goal]?.replace('0.35', '0.5') || 'rgba(255,255,255,0.12)'}`,
                borderRadius: 14, padding: '12px 16px',
                background: GOAL_COLORS[profile.goal]?.replace('0.35', '0.12') || 'rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{GOALS.find(g => g.id === profile.goal)?.emoji}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                      {GOALS.find(g => g.id === profile.goal)?.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 1 }}>
                      {GOALS.find(g => g.id === profile.goal)?.desc}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-mute)', fontWeight: 600 }}>{tr({ fr: 'Modifier', en: 'Edit', es: 'Modificar' })}</span>
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {GOALS.map((g) => (
                  <button key={g.id} onClick={() => handleGoalChange(g.id as GoalType)} className="tap" style={{
                    borderRadius: 14, padding: '12px 16px',
                    background: profile.goal === g.id ? GOAL_COLORS[g.id]?.replace('0.35', '0.15') : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${profile.goal === g.id ? GOAL_COLORS[g.id]?.replace('0.35', '0.5') : 'rgba(255,255,255,0.08)'}`,
                    display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                  }}>
                    <span style={{ fontSize: 22 }}>{g.emoji}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: profile.goal === g.id ? 'var(--text)' : 'var(--text-soft)' }}>{g.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>{g.desc}</div>
                    </div>
                    {profile.goal === g.id && (
                      <div style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icons.Check size={10} color="#fff" />
                      </div>
                    )}
                  </button>
                ))}
                <button onClick={() => setShowGoalPicker(false)} style={{ background: 'none', border: 'none', color: 'var(--text-mute)', fontSize: 12, padding: '4px', cursor: 'pointer' }}>
                  {tr({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Export RGPD ───────────────────────── */}
        <div className="glass" style={{ borderRadius: 22, padding: '18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 11, flexShrink: 0,
              background: 'rgba(74,222,128,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ok)', fontSize: 18,
            }}>📦</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{t('privacy.export')}</div>
              <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>{t('privacy.exportSub')}</div>
            </div>
          </div>
          <button
            onClick={handleExportData}
            disabled={exporting}
            className="tap"
            style={{
              width: '100%', marginTop: 10, borderRadius: 12, padding: '12px',
              background: exporting ? 'rgba(255,255,255,0.06)' : 'rgba(74,222,128,0.12)',
              color: exporting ? 'var(--text-mute)' : 'var(--ok)',
              fontWeight: 700, fontSize: 13,
              border: '1px solid rgba(74,222,128,0.22)',
              opacity: exporting ? 0.6 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {exporting ? <>⟳ {t('privacy.exporting')}</> : <>📦 {t('privacy.export')} (JSON)</>}
          </button>
        </div>

        {/* ── Légal & Confidentialité ─────────── */}
        {onShowLegal && (
          <button onClick={onShowLegal} className="tap glass" style={{
            borderRadius: 22, padding: '18px 16px', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 12,
            border: '1px solid var(--glass-border)',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 11, flexShrink: 0,
              background: 'rgba(96,165,250,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--info)', fontSize: 18,
            }}>🛡️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{tr({ fr: 'Confidentialité & Légal', en: 'Privacy & Legal', es: 'Privacidad y legal' })}</div>
              <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>
                {tr({ fr: 'RGPD, mentions légales, CGU', en: 'GDPR, legal notices, terms', es: 'RGPD, avisos legales, términos' })}
              </div>
            </div>
            <span style={{ display: 'inline-flex', transform: 'rotate(180deg)' }}>
              <Icons.ChevronLeft size={14} color="var(--text-mute)" />
            </span>
          </button>
        )}

        {/* ── Reset compte ──────────────────────── */}
        {!showResetConfirm ? (
          <button onClick={() => setShowResetConfirm(true)} className="tap" style={{
            width: '100%', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18,
            padding: '13px', background: 'transparent',
            color: 'var(--text-mute)', fontWeight: 600, fontSize: 13,
          }}>
            {tr({ fr: 'Réinitialiser toutes mes données', en: 'Reset all my data', es: 'Restablecer todos mis datos' })}
          </button>
        ) : (
          <div className="glass" style={{ borderRadius: 22, padding: '18px 16px', border: '1px solid rgba(196,30,58,0.3)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: 'var(--secondary)' }}>⚠️ {tr({ fr: 'Réinitialisation totale', en: 'Full reset', es: 'Restablecimiento total' })}</div>
            <div style={{ fontSize: 12, color: 'var(--text-mute)', marginBottom: 16, lineHeight: 1.6 }}>
              {tr({ fr: 'Toutes tes séances, templates, cardio, calories, poids, routine et historique IA seront supprimés définitivement. Le compte Supabase reste actif.', en: 'All your workouts, templates, cardio, calories, weight, routine and AI history will be permanently deleted. Your Supabase account remains active.', es: 'Todas tus sesiones, plantillas, cardio, calorías, peso, rutina e historial IA serán eliminados permanentemente. La cuenta Supabase permanece activa.' })}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleResetAccount} disabled={resetting} className="tap" style={{
                flex: 1, border: 'none', borderRadius: 12, padding: '11px',
                background: 'rgba(196,30,58,0.15)', color: 'var(--secondary)', fontWeight: 700, fontSize: 13,
                opacity: resetting ? 0.5 : 1,
              }}>
                {resetting ? `⟳ ${tr({ fr: 'Suppression...', en: 'Deleting...', es: 'Eliminando...' })}` : tr({ fr: 'Confirmer la suppression', en: 'Confirm deletion', es: 'Confirmar eliminación' })}
              </button>
              <button onClick={() => setShowResetConfirm(false)} className="tap" style={{
                border: 'none', borderRadius: 12, padding: '10px 14px',
                background: 'rgba(255,255,255,0.06)', color: 'var(--text-mute)', fontWeight: 700, fontSize: 13,
              }}>
                {tr({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
              </button>
            </div>
          </div>
        )}

        {/* ── Déconnexion ───────────────────────── */}
        {user && (
          <button onClick={async () => { await signOut(); showToast(tr({ fr: 'Déconnecté', en: 'Signed out', es: 'Sesión cerrada' }), 'info'); }}
            className="tap" style={{
              width: '100%', border: '1px solid rgba(196,30,58,0.3)', borderRadius: 18,
              padding: '14px', background: 'rgba(196,30,58,0.08)',
              color: 'var(--secondary)', fontWeight: 700, fontSize: 14,
            }}>
            {tr({ fr: 'Se déconnecter', en: 'Sign out', es: 'Cerrar sesión' })}
          </button>
        )}

        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
