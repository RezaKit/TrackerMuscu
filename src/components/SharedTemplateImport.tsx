import { useEffect, useState } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { Icons } from './Icons';
import { tr, useLang } from '../utils/i18n';
import { clearShareParam, readShareFromURL, type SharedTemplate } from '../utils/templateShare';

interface SharedTemplateImportProps {
  onImported: (date: string) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'record') => void;
}

const TYPE_COLORS: Record<string, [string, string]> = {
  push:  ['#FF6B35', '#E14A0F'],
  pull:  ['#C41E3A', '#8B0E22'],
  legs:  ['#A78BFA', '#7C3AED'],
  upper: ['#FB923C', '#EA580C'],
  lower: ['#F87171', '#DC2626'],
};

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Shows a full-screen modal whenever the URL contains a `?share=` param.
 * The user picks a date and we plan the session for that day.
 */
export default function SharedTemplateImport({ onImported, showToast }: SharedTemplateImportProps) {
  useLang();
  const [template, setTemplate] = useState<SharedTemplate | null>(null);
  const [date, setDate] = useState<string>(todayIso());
  const [importing, setImporting] = useState(false);
  const planSession = useSessionStore((s) => s.planSession);

  useEffect(() => {
    const t = readShareFromURL();
    if (t) setTemplate(t);
  }, []);

  if (!template) return null;

  const close = () => {
    clearShareParam();
    setTemplate(null);
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      await planSession(date, template.type, template.exerciseNames);
      showToast(tr({
        fr: `✓ Séance planifiée pour le ${new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`,
        en: `✓ Workout planned for ${new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`,
        es: `✓ Sesión planificada para el ${new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`,
      }), 'success');
      clearShareParam();
      setTemplate(null);
      onImported(date);
    } catch {
      showToast(tr({ fr: "Erreur lors de l'import", en: 'Import error', es: 'Error al importar' }), 'info');
    } finally {
      setImporting(false);
    }
  };

  const [c1, c2] = TYPE_COLORS[template.type] ?? ['#FF6B35', '#E14A0F'];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(5,5,5,0.92)', backdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div className="glass" style={{
        width: '100%', maxWidth: 540, maxHeight: '92vh', overflowY: 'auto',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        background: '#0E0E10', borderTop: `2px solid ${c1}`,
        animation: 'slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '8px 24px 18px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.16 }}>
            {tr({ fr: 'Séance partagée', en: 'Shared workout', es: 'Sesión compartida' })}
          </div>
          {template.from && (
            <div style={{ fontSize: 13, color: 'var(--text-soft)', marginTop: 4 }}>
              {tr({ fr: 'De', en: 'From', es: 'De' })} <strong>{template.from}</strong>
            </div>
          )}
        </div>

        {/* Template card */}
        <div style={{ padding: '0 16px' }}>
          <div className="glass" style={{
            borderRadius: 20, padding: '18px 18px',
            background: `linear-gradient(135deg, ${c1}1F, ${c2}10)`,
            border: `1px solid ${c1}40`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{
                fontSize: 10.5, fontWeight: 700, letterSpacing: 0.16,
                padding: '4px 10px', borderRadius: 999,
                background: c1, color: '#fff', textTransform: 'uppercase',
              }}>{template.type}</span>
            </div>
            <h2 style={{ margin: '4px 0 4px', fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>{template.name}</h2>
            <div style={{ fontSize: 12, color: 'var(--text-mute)' }}>
              {template.exerciseNames.length} {template.exerciseNames.length > 1
                ? tr({ fr: 'exercices', en: 'exercises', es: 'ejercicios' })
                : tr({ fr: 'exercice', en: 'exercise', es: 'ejercicio' })}
            </div>

            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {template.exerciseNames.slice(0, 8).map((e, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)',
                }}>
                  <span style={{
                    flexShrink: 0, width: 22, height: 22, borderRadius: 6,
                    background: 'rgba(255,255,255,0.06)', color: 'var(--text-soft)',
                    fontSize: 10.5, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--mono)',
                  }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{e.name}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-mute)', textTransform: 'capitalize' }}>{e.muscleGroup}</div>
                  </div>
                </div>
              ))}
              {template.exerciseNames.length > 8 && (
                <div style={{ fontSize: 11, color: 'var(--text-mute)', textAlign: 'center', padding: '4px' }}>
                  + {template.exerciseNames.length - 8} {tr({ fr: 'autres', en: 'more', es: 'más' })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Date picker */}
        <div style={{ padding: '18px 16px 6px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.14, marginBottom: 8 }}>
            {tr({ fr: 'Planifier pour le', en: 'Schedule for', es: 'Planificar para' })}
          </div>
          <input
            type="date" value={date}
            min={todayIso()}
            onChange={(e) => setDate(e.target.value)}
            className="input-glass"
            style={{ width: '100%', padding: '14px 16px', fontSize: 16, fontFamily: 'var(--mono)' }}
          />
        </div>

        {/* Actions */}
        <div style={{ padding: '14px 16px 24px', display: 'flex', gap: 10 }}>
          <button onClick={close} className="tap" style={{
            flex: 1, border: 'none', borderRadius: 14, padding: '14px',
            background: 'rgba(255,255,255,0.05)', color: 'var(--text-soft)',
            fontWeight: 700, fontSize: 13,
          }}>
            {tr({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
          </button>
          <button onClick={handleImport} disabled={importing} className="tap" style={{
            flex: 2, border: 'none', borderRadius: 14, padding: '14px',
            background: `linear-gradient(135deg, ${c1}, ${c2})`,
            color: '#fff', fontWeight: 800, fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: `0 8px 24px ${c1}55`,
            opacity: importing ? 0.7 : 1,
          }}>
            <Icons.Calendar size={16} />
            {importing
              ? tr({ fr: 'Import...', en: 'Importing...', es: 'Importando...' })
              : tr({ fr: 'Ajouter au calendrier', en: 'Add to calendar', es: 'Añadir al calendario' })}
          </button>
        </div>
      </div>
    </div>
  );
}
