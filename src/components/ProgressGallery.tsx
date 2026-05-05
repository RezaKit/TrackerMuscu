import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchProgressPhotos, deleteProgressPhoto, type ProgressPhoto } from '../stores/progressPhotoStore';
import { useAuthStore } from '../stores/authStore';
import { Icons } from './Icons';
import { tr, getLang, useLang } from '../utils/i18n';

const SESSION_COLORS: Record<string, string> = {
  push: '#FF6B35', pull: '#C41E3A', legs: '#A78BFA', upper: '#FB923C', lower: '#F87171',
};

function fmtDate(iso: string) {
  const locale = getLang() === 'fr' ? 'fr-FR' : getLang() === 'es' ? 'es-ES' : 'en-GB';
  return new Date(iso + 'T00:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

interface ProgressGalleryProps {
  showToast: (msg: string, type?: 'success' | 'info' | 'record') => void;
}

export default function ProgressGallery({ showToast }: ProgressGalleryProps) {
  useLang();
  const { user } = useAuthStore();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState<ProgressPhoto | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchProgressPhotos(user.id).then((p) => { setPhotos(p); setLoading(false); });
  }, [user?.id]);

  const handleDelete = async (photo: ProgressPhoto, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm(tr({ fr: 'Supprimer cette photo définitivement ?', en: 'Delete this photo permanently?', es: '¿Eliminar esta foto definitivamente?' }))) return;
    const ok = await deleteProgressPhoto(photo);
    if (ok) {
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      setFullscreen(null);
      showToast(tr({ fr: 'Photo supprimée', en: 'Photo deleted', es: 'Foto eliminada' }), 'info');
    }
  };

  if (!user) {
    return (
      <div className="glass" style={{ borderRadius: 22, padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📷</div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{tr({ fr: 'Photos de progression', en: 'Progress photos', es: 'Fotos de progreso' })}</div>
        <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 6, lineHeight: 1.6 }}>
          {tr({ fr: 'Connecte-toi pour sauvegarder tes photos de posing dans le cloud.', en: 'Sign in to save your posing photos in the cloud.', es: 'Inicia sesión para guardar tus fotos de posing en la nube.' })}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-mute)', fontSize: 13 }}>
        {tr({ fr: 'Chargement...', en: 'Loading...', es: 'Cargando...' })}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="glass" style={{ borderRadius: 22, padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 14 }}>📸</div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{tr({ fr: 'Aucune photo pour l\'instant', en: 'No photos yet', es: 'Sin fotos por ahora' })}</div>
        <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 8, lineHeight: 1.6 }}>
          {tr({ fr: 'À la fin de ta prochaine séance, tu pourras prendre un posing photo.', en: 'At the end of your next workout, take a posing photo.', es: 'Al final de tu próxima sesión, podrás tomar una foto de posing.' })}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Fullscreen viewer */}
      {fullscreen && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: '#000',
            display: 'flex', flexDirection: 'column',
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
          onClick={() => setFullscreen(null)}
        >
          <div style={{
            position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
            left: 0, right: 0, padding: '0 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1,
          }}>
            <div style={{
              background: `${SESSION_COLORS[fullscreen.session_type] || '#FF6B35'}dd`,
              padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, color: '#fff',
            }}>
              {fullscreen.session_type.toUpperCase()} · {fmtDate(fullscreen.date)}
            </div>
            <button
              onClick={(e) => handleDelete(fullscreen, e)}
              style={{
                background: 'rgba(196,30,58,0.7)', border: 'none', borderRadius: 10,
                width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>
              <Icons.Trash size={16} color="#fff" />
            </button>
          </div>

          <img
            src={fullscreen.public_url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />

          {fullscreen.notes && (
            <div style={{
              position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
              left: 16, right: 16,
              background: 'rgba(0,0,0,0.75)', borderRadius: 14,
              padding: '10px 14px', fontSize: 13, color: '#fff', lineHeight: 1.5,
            }}>
              {fullscreen.notes}
            </div>
          )}
        </div>,
        document.body
      )}

      {/* Count */}
      <div style={{ fontSize: 11, color: 'var(--text-mute)', fontWeight: 600, marginBottom: 10 }}>
        {photos.length} photo{photos.length > 1 ? 's' : ''} · stockées dans le cloud
      </div>

      {/* Grid 3 cols */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3, borderRadius: 18, overflow: 'hidden' }}>
        {photos.map((photo) => (
          <div
            key={photo.id}
            style={{ position: 'relative', aspectRatio: '3/4', cursor: 'pointer', overflow: 'hidden' }}
            onClick={() => setFullscreen(photo)}
          >
            <img
              src={photo.public_url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              loading="lazy"
            />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
              padding: '18px 6px 6px',
            }}>
              <div style={{
                display: 'inline-block', fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                background: SESSION_COLORS[photo.session_type] || '#FF6B35',
                color: '#fff', padding: '2px 6px', borderRadius: 4,
              }}>
                {photo.session_type}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                {fmtDate(photo.date)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
