import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from './Icons';
import { uploadProgressPhoto } from '../stores/progressPhotoStore';
import { useAuthStore } from '../stores/authStore';
import type { SessionType } from '../types';

interface PostSessionPhotoProps {
  sessionType: SessionType;
  date: string;
  onDone: () => void;
}

const SESSION_COLORS: Record<SessionType, string> = {
  push: '#FF6B35', pull: '#C41E3A', legs: '#A78BFA', upper: '#FB923C', lower: '#F87171',
};

const SESSION_LABELS: Record<SessionType, string> = {
  push: 'Push', pull: 'Pull', legs: 'Legs', upper: 'Upper', lower: 'Lower',
};

export default function PostSessionPhoto({ sessionType, date, onDone }: PostSessionPhotoProps) {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const color = SESSION_COLORS[sessionType];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    setUploading(true);
    setError('');
    const result = await uploadProgressPhoto(selectedFile, user.id, date, sessionType, notes || undefined);
    setUploading(false);
    if (!result) {
      setError('Erreur upload. Vérifie ta connexion.');
      return;
    }
    onDone();
  };

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'var(--bg-0)',
      display: 'flex', flexDirection: 'column',
      paddingTop: 'env(safe-area-inset-top, 0px)',
    }}>
      {/* Header */}
      <div style={{ padding: '18px 18px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.16 }}>
            Séance {SESSION_LABELS[sessionType]} terminée 🎉
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginTop: 3, lineHeight: 1.1 }}>
            Photo de posing
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 4 }}>
            Garde une trace de ta progression
          </div>
        </div>
        <button onClick={onDone} style={{
          background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12,
          padding: '8px 14px', color: 'var(--text-mute)', fontWeight: 700, fontSize: 12, cursor: 'pointer', flexShrink: 0,
        }}>
          Passer
        </button>
      </div>

      <div style={{ flex: 1, padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
        {!preview ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="tap"
            style={{
              flex: 1, borderRadius: 28,
              border: `2px dashed ${color}50`,
              background: `${color}08`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 16, cursor: 'pointer', minHeight: 260,
            }}
          >
            <div style={{
              width: 80, height: 80, borderRadius: 24,
              background: `${color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1.5px solid ${color}40`,
            }}>
              <Icons.Camera size={38} color={color} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: '#fff' }}>Ouvrir la caméra</div>
              <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 5, lineHeight: 1.5 }}>
                Face ou dos — tu choisis
              </div>
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', flex: 1, minHeight: 260 }}>
            <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <button
              onClick={() => { setPreview(null); setSelectedFile(null); }}
              style={{
                position: 'absolute', top: 12, right: 12,
                background: 'rgba(0,0,0,0.65)', border: 'none', borderRadius: 10,
                width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>
              <Icons.X size={16} color="#fff" />
            </button>
            <div style={{
              position: 'absolute', top: 12, left: 12,
              background: `${color}dd`, borderRadius: 8,
              padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase',
            }}>
              {SESSION_LABELS[sessionType]} · {date}
            </div>
          </div>
        )}

        <input
          type="text"
          placeholder="Note rapide (optionnel)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input-glass"
          style={{ fontSize: 13 }}
        />

        {error && (
          <div style={{ fontSize: 12, color: 'var(--secondary)', fontWeight: 600, textAlign: 'center' }}>{error}</div>
        )}

        <button
          onClick={preview ? handleUpload : () => fileInputRef.current?.click()}
          disabled={uploading}
          className="tap"
          style={{
            border: 'none', borderRadius: 18, padding: '16px',
            background: uploading ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${color}, ${color}bb)`,
            color: '#fff', fontWeight: 700, fontSize: 15,
            opacity: uploading ? 0.5 : 1,
            marginBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          }}>
          {uploading ? '⟳ Envoi en cours...' : preview ? '☁ Sauvegarder' : 'Prendre une photo'}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>,
    document.body
  );
}
