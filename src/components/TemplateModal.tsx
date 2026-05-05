import { createPortal } from 'react-dom';
import { useTemplateStore } from '../stores/templateStore';
import { Icons } from './Icons';
import { tr, useLang } from '../utils/i18n';
import { encodeShareLink } from '../utils/templateShare';
import type { SessionType } from '../types';

interface TemplateModalProps {
  sessionType: SessionType;
  onSelect: (exerciseNames: Array<{ name: string; muscleGroup: string }>) => void;
  onClose: () => void;
}

export default function TemplateModal({ sessionType, onSelect, onClose }: TemplateModalProps) {
  useLang();
  const { templates, deleteTemplate } = useTemplateStore();
  const filtered = templates.filter((t) => t.type === sessionType);

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.25s ease',
      }} />
      <div className="glass-strong" style={{
        position: 'relative', maxHeight: '80%',
        background: 'rgba(20,20,24,0.95)',
        borderTopLeftRadius: 32, borderTopRightRadius: 32,
        display: 'flex', flexDirection: 'column',
        animation: 'slideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <div style={{ width: 40, height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.2)', margin: '10px auto 4px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 22px 10px' }}>
          <h2 className="t-display" style={{ margin: 0, fontSize: 28 }}>{tr({fr:'Templates',en:'Templates',es:'Plantillas'})} {sessionType.toUpperCase()}</h2>
          <button onClick={onClose} className="tap" style={{
            background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 999,
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)',
          }}><Icons.X size={18} /></button>
        </div>

        <div style={{
          overflowY: 'auto', padding: '8px 18px 24px', display: 'flex', flexDirection: 'column', gap: 10,
          WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-mute)', fontSize: 13 }}>
              {tr({fr:'Aucun template pour ce type.',en:'No template for this type.',es:'Sin plantillas para este tipo.'})}<br />{tr({fr:'Crée-en un en fin de séance!',en:'Create one at the end of a workout!',es:'¡Crea una al final del entreno!'})}
            </div>
          ) : (
            filtered.map((t) => (
              <div key={t.id} className="glass" style={{ borderRadius: 18, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)' }}>{t.name}</span>
                  <button onClick={() => deleteTemplate(t.id)} className="tap" style={{ background: 'none', border: 'none', color: 'var(--text-mute)' }}>
                    <Icons.Trash size={14} />
                  </button>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-mute)', marginBottom: 10 }}>{t.exerciseNames.length} {tr({fr:'exercices',en:'exercises',es:'ejercicios'})}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                  {t.exerciseNames.slice(0, 4).map((e) => (
                    <span key={e.name} style={{ fontSize: 10, background: 'rgba(255,107,53,0.1)', color: 'var(--primary)', padding: '3px 8px', borderRadius: 999, fontWeight: 600 }}>
                      {e.name}
                    </span>
                  ))}
                  {t.exerciseNames.length > 4 && (
                    <span style={{ fontSize: 10, color: 'var(--text-mute)', padding: '3px 8px' }}>+{t.exerciseNames.length - 4}</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => onSelect(t.exerciseNames)} className="tap" style={{
                    flex: 2, border: 'none', borderRadius: 12, padding: '10px',
                    background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: 13,
                  }}>{tr({fr:'Charger',en:'Load',es:'Cargar'})}</button>
                  <button onClick={async () => {
                    let from: string | undefined;
                    try { from = JSON.parse(localStorage.getItem('user_profile') || 'null')?.name; } catch {}
                    const url = encodeShareLink(t, from);
                    if (navigator.share) navigator.share({ title: 'RezaKit', text: t.name, url }).catch(() => {});
                    else navigator.clipboard.writeText(url);
                  }} className="tap" style={{
                    flexShrink: 0, border: 'none', borderRadius: 12, padding: '10px 14px',
                    background: 'rgba(74,222,128,0.15)', color: 'var(--ok)', fontWeight: 700, fontSize: 13,
                  }} aria-label={tr({fr:'Partager',en:'Share',es:'Compartir'})}>
                    <Icons.Share size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
