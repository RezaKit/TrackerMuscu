import { useTemplateStore } from '../stores/templateStore';
import type { SessionType } from '../types';

interface TemplateModalProps {
  sessionType: SessionType;
  onSelect: (exerciseNames: Array<{ name: string; muscleGroup: string }>) => void;
  onClose: () => void;
}

export default function TemplateModal({ sessionType, onSelect, onClose }: TemplateModalProps) {
  const { templates, deleteTemplate } = useTemplateStore();
  const filtered = templates.filter((t) => t.type === sessionType);

  return (
    <div
      className="fixed inset-0 bg-black/70 z-40 flex items-end"
      onClick={onClose}
    >
      <div
        className="bg-dark w-full rounded-t-2xl p-4 space-y-3 max-h-[80vh] overflow-y-auto border-t border-primary/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-black text-primary">
            Templates {sessionType.toUpperCase()}
          </h3>
          <button onClick={onClose} className="text-gray-400">
            ✕
          </button>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Aucun template pour ce type.
            <br />
            Crée-en un en fin de séance!
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => (
              <div
                key={t.id}
                className="bg-bg-dark border border-primary/20 rounded-lg p-3"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-primary">{t.name}</h4>
                  <button
                    onClick={() => deleteTemplate(t.id)}
                    className="text-secondary text-xs"
                  >
                    🗑️
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  {t.exerciseNames.length} exercices
                </p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {t.exerciseNames.slice(0, 4).map((e) => (
                    <span
                      key={e.name}
                      className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded"
                    >
                      {e.name}
                    </span>
                  ))}
                  {t.exerciseNames.length > 4 && (
                    <span className="text-[10px] text-gray-500 px-2 py-0.5">
                      +{t.exerciseNames.length - 4}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onSelect(t.exerciseNames)}
                  className="w-full bg-primary text-dark py-2 rounded font-bold text-sm"
                >
                  Charger
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full text-gray-500 py-2 text-sm"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
