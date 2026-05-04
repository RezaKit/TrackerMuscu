import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../db/supabase';
import { db } from '../db/db';
import { Icons } from './Icons';
import { scheduleSync } from '../utils/cloudSync';
import { GOALS, GOAL_COLORS, type GoalType, type UserProfile } from './Onboarding';
import {
  isStravaConnected, getStravaAthlete, disconnectStrava,
  stravaAuthUrl, syncStravaActivities, syncGarminCalories,
} from '../utils/strava';
import { LANG_LABELS, useLang, type Lang, t } from '../utils/i18n';

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
    showToast('Objectif mis à jour', 'success');
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
      showToast('Compte réinitialisé — toutes les données supprimées', 'info');
      setShowResetConfirm(false);
      window.location.reload();
    } catch {
      showToast('Erreur lors de la réinitialisation', 'info');
    }
    setResetting(false);
  };

  const handleChangePassword = async () => {
    if (newPassword !== newPassword2) { showToast('Les mots de passe ne correspondent pas', 'info'); return; }
    if (newPassword.length < 6) { showToast('Minimum 6 caractères', 'info'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) showToast('Erreur : ' + error.message, 'info');
    else { setNewPassword(''); setNewPassword2(''); showToast('Mot de passe modifié ✓', 'success'); }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.includes('@')) { showToast('Email invalide', 'info'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setLoading(false);
    if (error) showToast('Erreur : ' + error.message, 'info');
    else { setNewEmail(''); showToast('Vérifie ton nouvel email pour confirmer', 'success'); }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: 'https://resakit.fr',
    });
    setLoading(false);
    setResetSent(true);
    showToast('Email de réinitialisation envoyé !', 'success');
  };

  const handleStravaSync = async () => {
    setStravaSyncing(true);
    const { imported, skipped, caloriesImported } = await syncStravaActivities();
    setStravaSyncing(false);
    if (imported > 0 || caloriesImported > 0) {
      const parts = [];
      if (imported > 0) parts.push(`${imported} activité${imported > 1 ? 's' : ''}`);
      if (caloriesImported > 0) parts.push(`${caloriesImported} kcal`);
      showToast(`Strava : ${parts.join(' · ')} importés !`, 'success');
    } else {
      showToast(`Aucune nouvelle activité (${skipped} déjà importées)`, 'info');
    }
  };

  const handleGarminSync = async () => {
    setGarminSyncing(true);
    const cal = await syncGarminCalories();
    setGarminSyncing(false);
    if (cal > 0) showToast(`Garmin : ${cal} kcal actives importées !`, 'success');
    else showToast('Garmin : déjà à jour pour aujourd\'hui', 'info');
  };

  const handleStravaDisconnect = () => {
    disconnectStrava();
    setStravaConnected(false);
    showToast('Strava déconnecté', 'info');
  };

  const handleGarminConnect = async () => {
    try {
      const res = await fetch('/api/garmin/request-token');
      if (!res.ok) {
        const err = await res.json() as { error: string };
        showToast(err.error || 'Garmin non disponible', 'info');
        return;
      }
      const data = await res.json() as { authorize_url: string };
      window.location.href = data.authorize_url;
    } catch {
      showToast('Erreur de connexion Garmin', 'info');
    }
  };

  const handleShare = () => {
    const url = 'https://resakit.fr';
    const text = 'Essaie RezaKit — ton kit fitness complet : séances, cardio, nutrition et coach IA';
    if (navigator.share) {
      navigator.share({ title: 'RezaKit', text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => showToast('Lien copié !', 'success'));
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
                  <input type={showPwd ? 'text' : 'password'} placeholder="Nouveau mot de passe"
                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="input-glass" style={{ paddingRight: 52 }} />
                  <button onClick={() => setShowPwd(s => !s)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-mute)', fontSize: 12, cursor: 'pointer',
                  }}>{showPwd ? 'Cacher' : 'Voir'}</button>
                </div>
                <input type={showPwd ? 'text' : 'password'} placeholder="Confirmer le mot de passe"
                  value={newPassword2} onChange={(e) => setNewPassword2(e.target.value)}
                  className="input-glass" />
                {newPassword && newPassword2 && newPassword !== newPassword2 && (
                  <div style={{ fontSize: 11, color: 'var(--secondary)', fontWeight: 600 }}>
                    ❌ Les mots de passe ne correspondent pas
                  </div>
                )}
                <button onClick={handleChangePassword}
                  disabled={loading || !newPassword || newPassword !== newPassword2} className="tap" style={{
                    border: 'none', borderRadius: 12, padding: '11px',
                    background: newPassword && newPassword === newPassword2 ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                    color: '#fff', fontWeight: 700, fontSize: 13,
                    opacity: newPassword && newPassword === newPassword2 && !loading ? 1 : 0.4,
                  }}>
                  {loading ? '...' : 'Modifier le mot de passe'}
                </button>
              </div>
            </div>

            <div className="glass" style={{ borderRadius: 22, padding: '18px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t('params.changeEmail')}</div>
              <div style={{ fontSize: 11, color: 'var(--text-mute)', marginBottom: 14 }}>
                Un email de confirmation sera envoyé aux deux adresses.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input type="email" placeholder="Nouvel email" value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="input-glass" autoCapitalize="none" />
                <button onClick={handleChangeEmail} disabled={loading || !newEmail.includes('@')} className="tap" style={{
                  border: 'none', borderRadius: 12, padding: '11px',
                  background: newEmail.includes('@') ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.06)',
                  color: newEmail.includes('@') ? 'var(--primary)' : 'var(--text-mute)',
                  fontWeight: 700, fontSize: 13,
                  opacity: newEmail.includes('@') && !loading ? 1 : 0.4,
                }}>
                  {loading ? '...' : "Modifier l'email"}
                </button>
              </div>
            </div>

            <div className="glass" style={{ borderRadius: 22, padding: '16px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t('params.forgotPassword')}</div>
              <div style={{ fontSize: 11, color: 'var(--text-mute)', marginBottom: 12, lineHeight: 1.5 }}>
                Envoie un lien de réinitialisation sur{' '}
                <strong style={{ color: 'var(--text-soft)' }}>{user.email}</strong>
              </div>
              <button onClick={handleResetPassword} disabled={loading || resetSent} className="tap" style={{
                width: '100%', border: 'none', borderRadius: 12, padding: '11px',
                background: resetSent ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.06)',
                color: resetSent ? 'var(--ok)' : 'var(--text-mute)',
                fontWeight: 700, fontSize: 13, opacity: loading ? 0.4 : 1,
              }}>
                {resetSent ? '✓ Email envoyé !' : loading ? '...' : 'Envoyer le lien de réinitialisation'}
              </button>
            </div>
          </>
        ) : (
          <div className="glass" style={{ borderRadius: 22, padding: '24px', textAlign: 'center' }}>
            <Icons.Settings size={28} color="var(--text-faint)" />
            <div style={{ marginTop: 10, fontWeight: 700, fontSize: 14 }}>{t('params.notLoggedIn')}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-mute)', marginBottom: 16 }}>
              Connecte-toi pour synchroniser tes données et gérer ton compte.
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
              <div style={{ fontWeight: 700, fontSize: 14 }}>{apiKey ? 'Coach IA activé ✓' : 'Clé API Coach IA'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>
                {apiKey ? 'Gemini 2.5 Flash · Gratuit' : 'aistudio.google.com · Gratuit'}
              </div>
            </div>
          </div>
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <input type={showKey ? 'text' : 'password'} placeholder="AIzaSy..."
              value={apiKey} onChange={(e) => setApiKey(e.target.value)}
              className="input-glass" style={{ paddingRight: 52, fontFamily: 'var(--mono)', fontSize: 13 }} />
            <button onClick={() => setShowKey(s => !s)} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'var(--text-mute)', fontSize: 12, cursor: 'pointer',
            }}>
              {showKey ? 'Cacher' : 'Voir'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => {
              if (apiKey.trim()) { localStorage.setItem('gemini_api_key', apiKey.trim()); scheduleSync(); showToast('Coach IA activé !', 'success'); }
            }} disabled={!apiKey.trim()} className="tap" style={{
              flex: 1, border: 'none', borderRadius: 12, padding: '11px',
              background: apiKey.trim() ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
              color: '#fff', fontWeight: 700, fontSize: 13, opacity: apiKey.trim() ? 1 : 0.4,
            }}>
              Activer le Coach IA
            </button>
            {localStorage.getItem('gemini_api_key') && (
              <button onClick={() => {
                localStorage.removeItem('gemini_api_key');
                setApiKey('');
                showToast('Clé supprimée', 'info');
              }} className="tap" style={{
                border: 'none', borderRadius: 12, padding: '10px 14px',
                background: 'rgba(196,30,58,0.15)', color: 'var(--secondary)', fontWeight: 700, fontSize: 13,
              }}>
                Effacer
              </button>
            )}
          </div>

          {/* Guide obtenir la clé */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 0.1, marginBottom: 12 }}>
              Comment obtenir la clé (2 min)
            </div>
            {[
              {
                n: '1',
                text: 'Va sur aistudio.google.com',
                sub: 'Connecte-toi avec ton compte Google (gratuit)',
                link: 'https://aistudio.google.com/apikey',
              },
              {
                n: '2',
                text: 'Clique « Create API key »',
                sub: 'Si on te demande un projet : choisis « Gemini API » ou crée un nouveau projet, peu importe',
              },
              {
                n: '3',
                text: 'Vérifie le plan : Free tier',
                sub: 'En haut tu dois voir « Free » — pas de carte bancaire requise. C\'est ce qu\'il faut.',
              },
              {
                n: '4',
                text: 'Copie la clé (commence par AIzaSy…)',
                sub: 'Colle-la dans le champ ci-dessus puis clique « Activer le Coach IA »',
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
                ✓ Free tier — pas de carte bancaire requise
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-mute)', lineHeight: 1.5 }}>
                Modèle utilisé : <strong style={{ color: 'var(--text-soft)' }}>gemini-2.5-flash</strong>
                <br />Limite : ~10 requêtes/min, 250/jour. Largement suffisant pour discuter avec ton coach.
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
                  ? `Connecté${stravaAthlete ? ` · ${stravaAthlete.name}` : ''}`
                  : 'Importe tes courses et natations automatiquement'}
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
                {stravaSyncing ? '⟳ Sync...' : '↓ Synchroniser'}
              </button>
              <button onClick={handleStravaDisconnect} className="tap" style={{
                border: 'none', borderRadius: 12, padding: '10px 14px',
                background: 'rgba(196,30,58,0.12)', color: 'var(--secondary)', fontWeight: 700, fontSize: 13,
              }}>
                Déconnecter
              </button>
            </div>
          ) : (
            <button onClick={() => window.location.href = stravaAuthUrl()} className="tap" style={{
              width: '100%', border: 'none', borderRadius: 12, padding: '12px',
              background: '#FC4C02', color: '#fff', fontWeight: 700, fontSize: 13,
            }}>
              Connecter Strava
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
                  ? 'Connecté · calories importées automatiquement'
                  : 'Montre Garmin → calories brûlées auto'}
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
                {garminSyncing ? '⟳ Sync...' : '↓ Calories du jour'}
              </button>
              <button onClick={() => {
                localStorage.removeItem('garmin_token');
                localStorage.removeItem('garmin_secret');
                showToast('Garmin déconnecté', 'info');
              }} className="tap" style={{
                border: 'none', borderRadius: 12, padding: '10px 14px',
                background: 'rgba(196,30,58,0.12)', color: 'var(--secondary)', fontWeight: 700, fontSize: 13,
              }}>
                Déconnecter
              </button>
            </div>
          ) : (
            <>
              <button onClick={handleGarminConnect} className="tap" style={{
                width: '100%', border: 'none', borderRadius: 12, padding: '12px',
                background: 'rgba(0,168,107,0.15)', color: '#00A86B', fontWeight: 700, fontSize: 13,
                marginBottom: 8,
              }}>
                Connecter Garmin
              </button>
              <div style={{ fontSize: 10.5, color: 'var(--text-faint)', lineHeight: 1.5, textAlign: 'center' }}>
                Nécessite un compte développeur Garmin Health API approuvé.{'\n'}
                Compatible Forerunner, Fenix, Venu, Vivoactive...
              </div>
            </>
          )}
        </div>

        {/* ── Inviter un ami ────────────────────── */}
        <div className="glass" style={{ borderRadius: 22, padding: '18px 16px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Inviter un ami</div>
          <div style={{ fontSize: 11, color: 'var(--text-mute)', marginBottom: 14 }}>
            Partage l'app — compte gratuit, toutes les fonctionnalités incluses.
          </div>
          <button onClick={handleShare} className="tap" style={{
            width: '100%', borderRadius: 14, padding: '12px',
            background: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(196,30,58,0.1))',
            color: 'var(--primary)', fontWeight: 700, fontSize: 13,
            border: '1px solid rgba(255,107,53,0.25)',
          }}>
            Partager l'app 🏋️
          </button>
          <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--mono)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              resakit.fr
            </div>
            <button onClick={() => navigator.clipboard.writeText('https://resakit.fr').then(() => showToast('Lien copié !', 'success'))}
              className="tap" style={{ background: 'none', border: 'none', color: 'var(--text-mute)', fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
              Copier
            </button>
          </div>
        </div>

        {/* ── Objectif ──────────────────────────── */}
        {profile && (
          <div className="glass" style={{ borderRadius: 22, padding: '18px 16px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Objectif principal</div>
            <div style={{ fontSize: 11, color: 'var(--text-mute)', marginBottom: 14 }}>
              L'IA adapte tous ses conseils à ton objectif.
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
                <span style={{ fontSize: 11, color: 'var(--text-mute)', fontWeight: 600 }}>Modifier</span>
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
                  Annuler
                </button>
              </div>
            )}
          </div>
        )}

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
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Confidentialité & Légal</div>
              <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>
                RGPD, mentions légales, CGU
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
            Réinitialiser toutes mes données
          </button>
        ) : (
          <div className="glass" style={{ borderRadius: 22, padding: '18px 16px', border: '1px solid rgba(196,30,58,0.3)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: 'var(--secondary)' }}>⚠️ Réinitialisation totale</div>
            <div style={{ fontSize: 12, color: 'var(--text-mute)', marginBottom: 16, lineHeight: 1.6 }}>
              Toutes tes séances, templates, cardio, calories, poids, routine et historique IA seront supprimés définitivement. Le compte Supabase reste actif.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleResetAccount} disabled={resetting} className="tap" style={{
                flex: 1, border: 'none', borderRadius: 12, padding: '11px',
                background: 'rgba(196,30,58,0.15)', color: 'var(--secondary)', fontWeight: 700, fontSize: 13,
                opacity: resetting ? 0.5 : 1,
              }}>
                {resetting ? '⟳ Suppression...' : 'Confirmer la suppression'}
              </button>
              <button onClick={() => setShowResetConfirm(false)} className="tap" style={{
                border: 'none', borderRadius: 12, padding: '10px 14px',
                background: 'rgba(255,255,255,0.06)', color: 'var(--text-mute)', fontWeight: 700, fontSize: 13,
              }}>
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* ── Déconnexion ───────────────────────── */}
        {user && (
          <button onClick={async () => { await signOut(); showToast('Déconnecté', 'info'); }}
            className="tap" style={{
              width: '100%', border: '1px solid rgba(196,30,58,0.3)', borderRadius: 18,
              padding: '14px', background: 'rgba(196,30,58,0.08)',
              color: 'var(--secondary)', fontWeight: 700, fontSize: 14,
            }}>
            Se déconnecter
          </button>
        )}

        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
