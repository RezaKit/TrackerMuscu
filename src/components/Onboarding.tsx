import { useState } from 'react';
import { Icons } from './Icons';
import { scheduleSync } from '../utils/cloudSync';
import { tr, useLang } from '../utils/i18n';

export type GoalType = 'muscle' | 'cut' | 'endurance' | 'health' | 'recomposition' | 'strength';

export interface UserProfile {
  name: string;
  goal: GoalType;
  level: 'beginner' | 'intermediate' | 'advanced';
  weeklyDays: number;
  devices: string[];
}

interface OnboardingProps {
  onDone: (profile: UserProfile) => void;
}

// Getters re-evaluate every render so the active locale is always picked up.
export function getGoals() {
  return [
    { id: 'muscle' as const,        emoji: '💪', label: tr({ fr: 'Prise de masse',  en: 'Muscle gain',    es: 'Ganar músculo'    }), desc: tr({ fr: 'Gagner du muscle et du volume',          en: 'Build muscle and size',                    es: 'Ganar músculo y volumen'           }) },
    { id: 'strength' as const,      emoji: '🏋️', label: tr({ fr: 'Force',           en: 'Strength',       es: 'Fuerza'           }), desc: tr({ fr: 'Squat, développé, soulevé de terre',    en: 'Squat, bench press, deadlift',             es: 'Sentadilla, press, peso muerto'    }) },
    { id: 'cut' as const,           emoji: '🔥', label: tr({ fr: 'Sèche',           en: 'Cut',            es: 'Definición'       }), desc: tr({ fr: 'Perdre du gras, conserver le muscle',   en: 'Lose fat, keep muscle',                    es: 'Perder grasa, conservar músculo'   }) },
    { id: 'recomposition' as const, emoji: '⚖️', label: tr({ fr: 'Recomposition',   en: 'Recomposition',  es: 'Recomposición'    }), desc: tr({ fr: 'Perdre du gras ET gagner du muscle',    en: 'Lose fat AND build muscle',                es: 'Perder grasa Y ganar músculo'      }) },
    { id: 'endurance' as const,     emoji: '🏃', label: tr({ fr: 'Endurance',       en: 'Endurance',      es: 'Resistencia'      }), desc: tr({ fr: 'Courir plus loin, nager plus vite',     en: 'Run further, swim faster',                 es: 'Correr más, nadar más rápido'      }) },
    { id: 'health' as const,        emoji: '✨', label: tr({ fr: 'Santé générale',   en: 'General health', es: 'Salud general'    }), desc: tr({ fr: 'Rester actif et en forme',              en: 'Stay active and fit',                      es: 'Mantenerse activo y en forma'      }) },
  ];
}

/** @deprecated Use getGoals() so labels react to language changes. */
export const GOALS = new Proxy([] as ReturnType<typeof getGoals>, {
  get(_t, prop: string | symbol): any {
    const list = getGoals();
    if (prop === 'length') return list.length;
    if (prop === Symbol.iterator) return list[Symbol.iterator].bind(list);
    if (typeof prop === 'string' && /^\d+$/.test(prop)) return list[Number(prop)];
    const value = (list as any)[prop];
    return typeof value === 'function' ? value.bind(list) : value;
  },
});

function getLevels() {
  return [
    { id: 'beginner' as const,     label: tr({ fr: 'Débutant',      en: 'Beginner',      es: 'Principiante'  }), desc: tr({ fr: '< 1 an de pratique',  en: '< 1 year of training', es: '< 1 año de entrenamiento' }) },
    { id: 'intermediate' as const, label: tr({ fr: 'Intermédiaire', en: 'Intermediate',  es: 'Intermedio'    }), desc: tr({ fr: '1 – 3 ans',            en: '1 – 3 years',          es: '1 – 3 años'               }) },
    { id: 'advanced' as const,     label: tr({ fr: 'Avancé',        en: 'Advanced',      es: 'Avanzado'      }), desc: tr({ fr: '3+ ans de pratique',   en: '3+ years of training', es: '3+ años de entrenamiento' }) },
  ];
}

function getDevices() {
  return [
    { id: 'garmin',  emoji: '⌚', label: 'Garmin' },
    { id: 'apple',   emoji: '⌚', label: 'Apple Watch' },
    { id: 'polar',   emoji: '⌚', label: 'Polar / Suunto' },
    { id: 'strava',  emoji: '🏃', label: 'Strava' },
    { id: 'fitbit',  emoji: '⌚', label: 'Fitbit' },
    { id: 'none',    emoji: '📱', label: tr({ fr: 'Aucun', en: 'None', es: 'Ninguno' }) },
  ];
}

export const GOAL_COLORS: Record<string, string> = {
  muscle:        'rgba(255,107,53,0.35)',
  strength:      'rgba(139,92,246,0.35)',
  cut:           'rgba(196,30,58,0.35)',
  recomposition: 'rgba(251,191,36,0.35)',
  endurance:     'rgba(96,165,250,0.35)',
  health:        'rgba(74,222,128,0.35)',
};

const TOTAL_SLIDES = 5;

export default function Onboarding({ onDone }: OnboardingProps) {
  useLang();
  const [slide, setSlide] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd');

  const [name, setName] = useState('');
  const [goal, setGoal] = useState<UserProfile['goal'] | ''>('');
  const [level, setLevel] = useState<UserProfile['level'] | ''>('');
  const [weeklyDays, setWeeklyDays] = useState(0);
  const [devices, setDevices] = useState<string[]>([]);

  const goals = getGoals();
  const levels = getLevels();
  const devicesList = getDevices();
  const glowColor = goal ? GOAL_COLORS[goal] : 'rgba(255,107,53,0.25)';

  const goTo = (next: number) => {
    if (animating) return;
    setDir(next > slide ? 'fwd' : 'back');
    setAnimating(true);
    setTimeout(() => {
      setSlide(next);
      setAnimating(false);
    }, 280);
  };

  const next = () => goTo(slide + 1);
  const back = () => goTo(slide - 1);

  const toggleDevice = (id: string) => {
    if (id === 'none') { setDevices(['none']); return; }
    setDevices((prev) => {
      const without = prev.filter((d) => d !== 'none');
      return without.includes(id) ? without.filter((d) => d !== id) : [...without, id];
    });
  };

  const finish = () => {
    if (!name.trim() || !goal || !level || !weeklyDays) return;
    const profile: UserProfile = {
      name: name.trim(),
      goal,
      level,
      weeklyDays,
      devices,
    };
    localStorage.setItem('user_profile', JSON.stringify(profile));
    localStorage.setItem('onboarding_done', '1');
    scheduleSync();
    onDone(profile);
  };

  const slideStyle = {
    transition: animating ? 'none' : 'opacity 0.28s ease, transform 0.28s ease',
    opacity: animating ? 0 : 1,
    transform: animating
      ? `translateX(${dir === 'fwd' ? '40px' : '-40px'})`
      : 'translateX(0)',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg-0)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '0 24px',
      paddingTop: 'env(safe-area-inset-top, 24px)',
      paddingBottom: 'env(safe-area-inset-bottom, 24px)',
    }}>
      {/* Ambient */}
      <div style={{
        position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
        width: 320, height: 320, borderRadius: '50%',
        background: glowColor,
        filter: 'blur(80px)', transition: 'background 0.6s ease',
        pointerEvents: 'none',
      }} />

      {/* Header row: back + dots (in normal flow, no absolute) */}
      <div style={{
        width: '100%', maxWidth: 400,
        display: 'flex', alignItems: 'center',
        marginTop: 10, marginBottom: 6,
        position: 'relative', zIndex: 1, minHeight: 32,
      }}>
        {slide > 0 ? (
          <button onClick={back} style={{
            background: 'none', border: 'none', color: 'var(--text-mute)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            padding: '4px 8px 4px 0',
            display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
          }}>← {tr({ fr: 'Retour', en: 'Back', es: 'Volver' })}</button>
        ) : (
          <div style={{ width: 60, flexShrink: 0 }} />
        )}
        <div style={{ flex: 1, display: 'flex', gap: 6, justifyContent: 'center' }}>
          {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
            <div key={i} style={{
              width: i === slide ? 22 : 7, height: 7, borderRadius: 999,
              background: i <= slide ? 'var(--primary)' : 'rgba(255,255,255,0.12)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>
        <div style={{ width: 60, flexShrink: 0 }} />
      </div>



      {/* Slide content */}
      <div style={{
        flex: 1, width: '100%', maxWidth: 400,
        display: 'flex', flexDirection: 'column',
        justifyContent: slide > 0 ? 'flex-start' : 'center',
        overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        position: 'relative', zIndex: 1,
        ...slideStyle,
      }}>

        {/* ── Slide 0: Bienvenue + nom ───────────── */}
        {slide === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: 84, height: 84, borderRadius: 28, marginBottom: 28,
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 16px 48px rgba(255,107,53,0.45)',
            }}>
              <Icons.Dumbbell size={42} color="#fff" stroke={2} />
            </div>
            <div className="t-display" style={{ fontSize: 44, textAlign: 'center', lineHeight: 0.95, marginBottom: 10 }}>
              {tr({ fr: 'BIENVENUE', en: 'WELCOME', es: 'BIENVENIDO' })}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-mute)', textAlign: 'center', marginBottom: 36, lineHeight: 1.5 }}>
              {tr({ fr: 'Quelques questions rapides pour personnaliser ton expérience et briefer ton coach IA.', en: 'A few quick questions to personalise your experience and brief your AI coach.', es: 'Unas preguntas rápidas para personalizar tu experiencia y configurar tu coach IA.' })}
            </div>
            <div style={{ width: '100%', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.12, color: 'var(--text-mute)', marginBottom: 10 }}>
                {tr({ fr: "Comment tu t'appelles ?", en: "What's your name?", es: '¿Cómo te llamas?' })}
              </div>
              <input
                type="text"
                placeholder={tr({ fr: 'Ton prénom', en: 'Your first name', es: 'Tu nombre' })}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && name.trim() && next()}
                className="input-glass"
                autoFocus
                style={{ fontSize: 18, fontFamily: 'var(--display)', letterSpacing: 0.5 }}
                autoCapitalize="words"
              />
            </div>
          </div>
        )}

        {/* ── Slide 1: Objectif ─────────────────── */}
        {slide === 1 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.12, color: 'var(--text-mute)', marginBottom: 10 }}>
              {tr({ fr: 'Ton objectif principal', en: 'Your main goal', es: 'Tu objetivo principal' })}
            </div>
            <div className="t-display" style={{ fontSize: 40, lineHeight: 0.95, marginBottom: 28 }}>
              {tr({ fr: "Pourquoi tu t'entraînes ?", en: 'Why do you train?', es: '¿Por qué entrenas?' })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {goals.map((g) => (
                <button key={g.id} onClick={() => setGoal(g.id)} className="tap" style={{
                  borderRadius: 20, padding: '16px 18px',
                  background: goal === g.id ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${goal === g.id ? 'var(--primary)' : 'rgba(255,255,255,0.08)'}`,
                  display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
                  transition: 'all 0.2s',
                }}>
                  <span style={{ fontSize: 28 }}>{g.emoji}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: goal === g.id ? 'var(--primary)' : 'var(--text)' }}>{g.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>{g.desc}</div>
                  </div>
                  {goal === g.id && (
                    <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icons.Check size={12} color="#fff" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Slide 2: Niveau ───────────────────── */}
        {slide === 2 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.12, color: 'var(--text-mute)', marginBottom: 10 }}>
              {tr({ fr: 'Expérience en salle', en: 'Gym experience', es: 'Experiencia en gimnasio' })}
            </div>
            <div className="t-display" style={{ fontSize: 40, lineHeight: 0.95, marginBottom: 28 }}>
              {tr({ fr: 'Ton niveau ?', en: 'Your level?', es: '¿Tu nivel?' })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {levels.map((l) => (
                <button key={l.id} onClick={() => setLevel(l.id)} className="tap" style={{
                  borderRadius: 20, padding: '20px 18px',
                  background: level === l.id ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${level === l.id ? 'var(--primary)' : 'rgba(255,255,255,0.08)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.2s',
                }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: level === l.id ? 'var(--primary)' : 'var(--text)' }}>{l.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 3 }}>{l.desc}</div>
                  </div>
                  {level === l.id && (
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icons.Check size={13} color="#fff" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Slide 3: Jours/semaine ────────────── */}
        {slide === 3 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.12, color: 'var(--text-mute)', marginBottom: 10 }}>
              {tr({ fr: "Fréquence d'entraînement", en: 'Training frequency', es: 'Frecuencia de entrenamiento' })}
            </div>
            <div className="t-display" style={{ fontSize: 40, lineHeight: 0.95, marginBottom: 12 }}>
              {tr({ fr: 'Combien de fois par semaine ?', en: 'How many times per week?', es: '¿Cuántas veces por semana?' })}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-mute)', marginBottom: 28, lineHeight: 1.5 }}>
              {tr({ fr: 'Toutes activités confondues — salle, course, natation.', en: 'All activities combined — gym, running, swimming.', es: 'Todas las actividades — gimnasio, carrera, natación.' })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[2, 3, 4, 5, 6, 7].map((d) => (
                <button key={d} onClick={() => setWeeklyDays(d)} className="tap" style={{
                  borderRadius: 20, padding: '24px 16px',
                  background: weeklyDays === d ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${weeklyDays === d ? 'var(--primary)' : 'rgba(255,255,255,0.08)'}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'all 0.2s',
                }}>
                  <span className="t-num" style={{ fontSize: 36, color: weeklyDays === d ? 'var(--primary)' : 'var(--text)' }}>{d}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-mute)', fontWeight: 600 }}>{d === 7 ? tr({ fr: 'tous les jours', en: 'every day', es: 'cada día' }) : tr({ fr: 'jours', en: 'days', es: 'días' })}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Slide 4: Appareils ────────────────── */}
        {slide === 4 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.12, color: 'var(--text-mute)', marginBottom: 10 }}>
              {tr({ fr: 'Appareils connectés', en: 'Connected devices', es: 'Dispositivos conectados' })}
            </div>
            <div className="t-display" style={{ fontSize: 40, lineHeight: 0.95, marginBottom: 8 }}>
              {tr({ fr: 'Tu as une montre ou une appli ?', en: 'Got a watch or an app?', es: '¿Tienes un reloj o una app?' })}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-mute)', marginBottom: 24, lineHeight: 1.5 }}>
              {tr({ fr: 'On pourra importer tes activités automatiquement. Tu peux en sélectionner plusieurs.', en: 'We can import your activities automatically. You can select multiple.', es: 'Podemos importar tus actividades automáticamente. Puedes seleccionar varios.' })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
              {devicesList.map((d) => {
                const on = devices.includes(d.id);
                return (
                  <button key={d.id} onClick={() => toggleDevice(d.id)} className="tap" style={{
                    borderRadius: 18, padding: '16px 12px',
                    background: on ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${on ? 'var(--primary)' : 'rgba(255,255,255,0.08)'}`,
                    display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'all 0.2s',
                  }}>
                    <span style={{ fontSize: 22 }}>{d.emoji}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: on ? 'var(--primary)' : 'var(--text)' }}>{d.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Recap */}
            {name && goal && level && weeklyDays > 0 && (
              <div className="glass" style={{ borderRadius: 18, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.12, marginBottom: 8 }}>{tr({ fr: 'Ton profil', en: 'Your profile', es: 'Tu perfil' })}</div>
                <div style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--text)' }}>{name}</strong> · {goals.find(g => g.id === goal)?.label} ·{' '}
                  {levels.find(l => l.id === level)?.label} · {weeklyDays}{tr({ fr: 'j/semaine', en: 'd/week', es: 'd/semana' })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CTA button */}
      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1, paddingBottom: 8 }}>
        {slide < TOTAL_SLIDES - 1 ? (
          <button
            onClick={next}
            disabled={
              (slide === 0 && !name.trim()) ||
              (slide === 1 && !goal) ||
              (slide === 2 && !level) ||
              (slide === 3 && !weeklyDays)
            }
            className="tap"
            style={{
              width: '100%', border: 'none', borderRadius: 20, padding: '18px',
              background: (
                (slide === 0 && name.trim()) ||
                (slide === 1 && goal) ||
                (slide === 2 && level) ||
                (slide === 3 && weeklyDays)
              ) ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'rgba(255,255,255,0.06)',
              color: '#fff', fontWeight: 700, fontSize: 16,
              opacity: (
                (slide === 0 && !name.trim()) ||
                (slide === 1 && !goal) ||
                (slide === 2 && !level) ||
                (slide === 3 && !weeklyDays)
              ) ? 0.4 : 1,
              boxShadow: '0 8px 28px rgba(255,107,53,0.3)',
              transition: 'all 0.25s',
            }}
          >
            {tr({ fr: 'Continuer →', en: 'Continue →', es: 'Continuar →' })}
          </button>
        ) : (
          <button
            onClick={finish}
            className="tap pulse-glow"
            style={{
              width: '100%', border: 'none', borderRadius: 20, padding: '18px',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: '#fff', fontWeight: 700, fontSize: 16,
              boxShadow: '0 12px 36px rgba(255,107,53,0.45)',
            }}
          >
            {tr({ fr: "C'est parti 🏋️", en: "Let's go 🏋️", es: '¡Vamos 🏋️' })}
          </button>
        )}

        {slide === 4 && devices.length === 0 && (
          <button onClick={finish} style={{
            width: '100%', background: 'none', border: 'none',
            color: 'var(--text-mute)', fontSize: 12, marginTop: 12, cursor: 'pointer', padding: '6px',
          }}>
            {tr({ fr: 'Passer cette étape', en: 'Skip this step', es: 'Omitir este paso' })}
          </button>
        )}
      </div>
    </div>
  );
}
