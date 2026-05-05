import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useSessionStore } from '../stores/sessionStore';
import { supabase } from '../db/supabase';
import { Icons } from './Icons';
import { tr, useLang } from '../utils/i18n';
import { getDateString } from '../utils/export';

interface Profile {
  user_id: string;
  username: string;
  avatar: string;
}

interface FriendEntry {
  profile: Profile;
  sessions: number;
  volumeKg: number;
  isSelf: boolean;
}

const AVATARS = ['💪', '🔥', '⚡', '🏋️', '🦅', '🐺', '👊', '🎯', '🚀', '🌟'];

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return getDateString(d);
}

export default function Leaderboard() {
  useLang();
  const { user } = useAuthStore();
  const { sessions } = useSessionStore();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('💪');
  const [saving, setSaving] = useState(false);
  const [friendCode, setFriendCode] = useState('');
  const [addingFriend, setAddingFriend] = useState(false);
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [pendingInvites, setPendingInvites] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const weekStart = getMonday(new Date());

  // Compute own weekly stats from local sessions
  const ownSessions = sessions.filter((s) => s.completed && s.date >= weekStart);
  const ownVolume = ownSessions.reduce((sum, s) =>
    sum + s.exercises.reduce((es, ex) =>
      es + ex.sets.reduce((ss, set) => ss + set.weight * set.reps, 0), 0), 0);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Load own profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setUsername(profileData.username);
        setAvatar(profileData.avatar);
      } else {
        setEditMode(true);
        setUsername(user.email?.split('@')[0] ?? 'athlete');
      }

      // Push own weekly stats
      await supabase.from('weekly_stats').upsert({
        user_id: user.id,
        week_start: weekStart,
        sessions: ownSessions.length,
        volume_kg: Math.round(ownVolume),
      }, { onConflict: 'user_id,week_start' });

      // Load friends
      const { data: friendships } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');

      const friendIds = (friendships ?? []).map((f: any) =>
        f.requester_id === user.id ? f.addressee_id : f.requester_id);

      const allIds = [...friendIds, user.id];

      const [{ data: profiles }, { data: stats }] = await Promise.all([
        supabase.from('profiles').select('*').in('user_id', allIds),
        supabase.from('weekly_stats').select('*')
          .in('user_id', allIds)
          .eq('week_start', weekStart),
      ]);

      const entries: FriendEntry[] = (allIds).map((uid) => {
        const p = (profiles ?? []).find((x: any) => x.user_id === uid);
        const s = (stats ?? []).find((x: any) => x.user_id === uid);
        return {
          profile: p ?? { user_id: uid, username: uid === user.id ? (username || 'Moi') : '?', avatar: '💪' },
          sessions: uid === user.id ? ownSessions.length : (s?.sessions ?? 0),
          volumeKg: uid === user.id ? Math.round(ownVolume) : (s?.volume_kg ?? 0),
          isSelf: uid === user.id,
        };
      }).filter((e) => e.profile.user_id);

      // Sort by volume desc
      entries.sort((a, b) => b.volumeKg - a.volumeKg);
      setFriends(entries);

      // Pending invites (others invited me)
      const { data: pending } = await supabase
        .from('friendships')
        .select('requester_id')
        .eq('addressee_id', user.id)
        .eq('status', 'pending');

      if (pending?.length) {
        const { data: pendingProfiles } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', pending.map((p: any) => p.requester_id));
        setPendingInvites(pendingProfiles ?? []);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !username.trim()) return;
    setSaving(true);
    setError('');
    try {
      const { error: err } = await supabase.from('profiles').upsert({
        user_id: user.id,
        username: username.trim(),
        avatar,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (err) throw err;
      setProfile({ user_id: user.id, username: username.trim(), avatar });
      setEditMode(false);
      loadData();
    } catch (e: any) {
      setError(e.message?.includes('unique') ? tr({ fr: 'Ce pseudo est déjà pris', en: 'Username already taken', es: 'Nombre de usuario ya en uso' }) : e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddFriend = async () => {
    if (!user || !friendCode.trim()) return;
    setAddingFriend(true);
    setError('');
    try {
      const raw = friendCode.trim().toLowerCase().replace(/^#/, '');

      // Try as #FRIEND_CODE first (last 4 hex chars of user_id)
      let target: { user_id: string; username: string } | null = null;
      if (/^[0-9a-f]{4}$/.test(raw)) {
        const { data } = await supabase
          .from('profiles')
          .select('user_id, username')
          .like('user_id', `%${raw}`)
          .limit(2);
        if (data && data.length === 1) target = data[0];
        else if (data && data.length > 1) {
          setError(tr({ fr: 'Code ambigu — utilise le pseudo', en: 'Ambiguous code — use the username', es: 'Código ambiguo — usa el nombre' }));
          return;
        }
      }

      // Fall back to username lookup
      if (!target) {
        const { data, error: lookupErr } = await supabase
          .from('profiles')
          .select('user_id, username')
          .eq('username', raw)
          .single();
        if (lookupErr || !data) {
          setError(tr({ fr: 'Utilisateur introuvable', en: 'User not found', es: 'Usuario no encontrado' }));
          return;
        }
        target = data;
      }

      if (target.user_id === user.id) {
        setError(tr({ fr: 'Tu ne peux pas t\'ajouter toi-même', en: 'You cannot add yourself', es: 'No puedes añadirte a ti mismo' }));
        return;
      }

      const { error: insertErr } = await supabase.from('friendships').insert({
        requester_id: user.id,
        addressee_id: target.user_id,
      });
      if (insertErr && !insertErr.message.includes('duplicate')) throw insertErr;
      setFriendCode('');
      loadData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAddingFriend(false);
    }
  };

  const friendCodeOf = (uid: string) => '#' + uid.slice(-4).toUpperCase();
  const myFriendCode = user ? friendCodeOf(user.id) : '';

  const copyMyCode = async () => {
    try {
      await navigator.clipboard.writeText(myFriendCode);
    } catch { /* noop */ }
  };

  const handleAcceptInvite = async (requesterId: string) => {
    if (!user) return;
    await supabase.from('friendships')
      .update({ status: 'accepted' })
      .eq('requester_id', requesterId)
      .eq('addressee_id', user.id);
    loadData();
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!user) return;
    await supabase.from('friendships').delete()
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${user.id})`);
    loadData();
  };

  if (!user) {
    return (
      <div style={{ padding: '40px 22px', textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>
        {tr({ fr: 'Connecte-toi pour accéder au classement', en: 'Sign in to access the leaderboard', es: 'Inicia sesión para acceder al ranking' })}
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0 20px' }}>
      {/* Profile setup / edit */}
      {(!profile || editMode) ? (
        <div style={{ padding: '0 16px 20px' }}>
          <div className="glass" style={{ borderRadius: 22, padding: '20px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>
              {tr({ fr: 'Crée ton profil public', en: 'Create your public profile', es: 'Crea tu perfil público' })}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-mute)', marginBottom: 16 }}>
              {tr({ fr: 'Visible uniquement de tes amis', en: 'Visible only to your friends', es: 'Solo visible para tus amigos' })}
            </div>

            {/* Avatar picker */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {AVATARS.map((a) => (
                <button key={a} onClick={() => setAvatar(a)} className="tap" style={{
                  border: `2px solid ${avatar === a ? 'var(--primary)' : 'transparent'}`,
                  borderRadius: 12, padding: '8px', fontSize: 22, background: 'rgba(255,255,255,0.04)',
                  lineHeight: 1,
                }}>{a}</button>
              ))}
            </div>

            <input
              type="text"
              placeholder={tr({ fr: 'Pseudo', en: 'Username', es: 'Apodo' })}
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              maxLength={20}
              className="input-glass"
              style={{ marginBottom: 12 }}
            />

            {error && <div style={{ fontSize: 12, color: 'var(--secondary)', marginBottom: 10 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSaveProfile} disabled={saving || !username.trim()} className="tap" style={{
                flex: 1, border: 'none', borderRadius: 14, padding: '12px',
                background: username.trim() ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                color: '#fff', fontWeight: 700, fontSize: 13, opacity: saving ? 0.6 : 1,
              }}>
                {saving ? '...' : tr({ fr: 'Enregistrer', en: 'Save', es: 'Guardar' })}
              </button>
              {profile && (
                <button onClick={() => { setEditMode(false); setError(''); }} className="tap glass" style={{
                  border: '1px solid var(--glass-border)', borderRadius: 14, padding: '12px 16px',
                  color: 'var(--text-mute)', fontWeight: 700, fontSize: 13,
                }}>
                  {tr({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Profile chip with friend code */
        <div style={{ padding: '0 16px 14px' }}>
          <div className="glass" style={{ borderRadius: 18, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 28, lineHeight: 1 }}>{profile.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{profile.username}</div>
                <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>
                  {tr({ fr: 'Cette semaine', en: 'This week', es: 'Esta semana' })} · {ownSessions.length} {tr({ fr: 'séances', en: 'sessions', es: 'sesiones' })} · {Math.round(ownVolume / 1000)}t
                </div>
              </div>
              <button onClick={() => setEditMode(true)} className="tap" style={{
                background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10,
                padding: '6px 10px', color: 'var(--text-mute)', fontSize: 12,
              }}>
                <Icons.Edit size={13} />
              </button>
            </div>
            {/* Friend code: shareable ID */}
            <div onClick={copyMyCode} className="tap" style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 12,
              background: 'rgba(255,107,53,0.10)',
              border: '1px dashed rgba(255,107,53,0.35)',
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: 0.16 }}>
                {tr({ fr: 'Ton code ami', en: 'Your friend code', es: 'Tu código de amigo' })}
              </div>
              <div className="t-mono" style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)', letterSpacing: 1, marginLeft: 'auto' }}>
                {myFriendCode}
              </div>
              <span style={{ fontSize: 14, color: 'var(--text-mute)' }}>📋</span>
            </div>
          </div>
        </div>
      )}

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div style={{ padding: '0 16px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-mute)', letterSpacing: 0.12, marginBottom: 8 }}>
            {tr({ fr: 'Demandes reçues', en: 'Friend requests', es: 'Solicitudes recibidas' })}
          </div>
          {pendingInvites.map((p) => (
            <div key={p.user_id} className="glass" style={{ borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 22 }}>{p.avatar}</div>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{p.username}</div>
              <button onClick={() => handleAcceptInvite(p.user_id)} className="tap" style={{
                border: 'none', borderRadius: 10, padding: '6px 14px',
                background: 'var(--ok)', color: '#fff', fontWeight: 700, fontSize: 12,
              }}>
                {tr({ fr: 'Accepter', en: 'Accept', es: 'Aceptar' })}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add friend */}
      <div style={{ padding: '0 16px 20px' }}>
        <div className="glass" style={{ borderRadius: 18, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-mute)', letterSpacing: 0.12, marginBottom: 10 }}>
            {tr({ fr: 'Ajouter un ami', en: 'Add friend', es: 'Añadir amigo' })}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder={tr({ fr: 'Code #A3F9 ou pseudo', en: 'Code #A3F9 or username', es: 'Código #A3F9 o nombre' })}
              value={friendCode}
              onChange={(e) => { setFriendCode(e.target.value); setError(''); }}
              className="input-glass"
              style={{ flex: 1 }}
            />
            <button onClick={handleAddFriend} disabled={addingFriend || !friendCode.trim()} className="tap" style={{
              border: 'none', borderRadius: 12, padding: '0 16px',
              background: friendCode.trim() ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
              color: '#fff', fontWeight: 700, opacity: addingFriend ? 0.6 : 1,
            }}>
              <Icons.UserPlus size={16} />
            </button>
          </div>
          {error && <div style={{ fontSize: 11, color: 'var(--secondary)', marginTop: 8 }}>{error}</div>}
        </div>
      </div>

      {/* Leaderboard */}
      {loading ? (
        <div style={{ padding: '20px 16px' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: 72, borderRadius: 18, marginBottom: 10 }} />
          ))}
        </div>
      ) : friends.length > 0 ? (
        <div style={{ padding: '0 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-mute)', letterSpacing: 0.12, marginBottom: 10 }}>
            {tr({ fr: 'Classement · cette semaine', en: 'Ranking · this week', es: 'Clasificación · esta semana' })}
          </div>
          {friends.map((entry, idx) => {
            const rank = idx + 1;
            const rankColors = ['#f59e0b', '#94a3b8', '#cd7c3e'];
            const rankColor = rank <= 3 ? rankColors[rank - 1] : 'var(--text-mute)';
            return (
              <div key={entry.profile.user_id} className="glass" style={{
                borderRadius: 18, padding: '14px 16px', marginBottom: 10,
                background: entry.isSelf ? 'rgba(255,107,53,0.06)' : undefined,
                border: entry.isSelf ? '1px solid rgba(255,107,53,0.2)' : undefined,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 28, textAlign: 'center', fontWeight: 800, fontSize: 16, color: rankColor, flexShrink: 0 }}>
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                  </div>
                  <div style={{ fontSize: 26, flexShrink: 0 }}>{entry.profile.avatar}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {entry.profile.username}
                      {entry.isSelf && <span style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 700, padding: '1px 6px', background: 'rgba(255,107,53,0.12)', borderRadius: 6 }}>toi</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 1 }}>
                      {entry.sessions} {tr({ fr: 'séances', en: 'sessions', es: 'sesiones' })} · {(entry.volumeKg / 1000).toFixed(1)}t
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="t-num" style={{ fontSize: 22, color: entry.isSelf ? 'var(--primary)' : 'var(--text)' }}>
                      {(entry.volumeKg / 1000).toFixed(1)}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-mute)', fontWeight: 600 }}>t</div>
                  </div>
                  {!entry.isSelf && (
                    <button onClick={() => handleRemoveFriend(entry.profile.user_id)} className="tap" style={{
                      background: 'none', border: 'none', color: 'var(--text-mute)', padding: '4px',
                    }}>
                      <Icons.X size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        profile && (
          <div style={{ padding: '20px 22px', textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>
            <Icons.Users size={32} color="var(--text-mute)" />
            <div style={{ marginTop: 12, fontWeight: 600 }}>
              {tr({ fr: 'Aucun ami encore. Partage ton pseudo !', en: 'No friends yet. Share your username!', es: '¡Sin amigos aún. Comparte tu nombre!' })}
            </div>
            <div style={{ marginTop: 6, fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>
              {profile.username}
            </div>
          </div>
        )
      )}
    </div>
  );
}
