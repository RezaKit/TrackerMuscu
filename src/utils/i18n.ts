// Lightweight i18n. Stored in localStorage, default = device language → fallback FR.
// Components subscribe to `rezakit:lang-changed` to re-render when the user changes language.

export type Lang = 'fr' | 'en' | 'es';

const LS_KEY = 'rezakit_lang';

const SUPPORTED: Lang[] = ['fr', 'en', 'es'];

function detectDeviceLang(): Lang {
  const nav = (navigator.language || 'fr').toLowerCase();
  if (nav.startsWith('en')) return 'en';
  if (nav.startsWith('es')) return 'es';
  return 'fr';
}

let current: Lang = (() => {
  try {
    const saved = localStorage.getItem(LS_KEY) as Lang | null;
    if (saved && SUPPORTED.includes(saved)) return saved;
  } catch {}
  return detectDeviceLang();
})();

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang) {
  current = lang;
  try { localStorage.setItem(LS_KEY, lang); } catch {}
  window.dispatchEvent(new CustomEvent('rezakit:lang-changed', { detail: lang }));
}

export const LANG_LABELS: Record<Lang, { native: string; flag: string }> = {
  fr: { native: 'Français',  flag: '🇫🇷' },
  en: { native: 'English',   flag: '🇬🇧' },
  es: { native: 'Español',   flag: '🇪🇸' },
};

// ───────────────────────────────────────────────────────────────────────────
// Translation dictionary. Keys are namespaced by feature.
// Add new strings here and they automatically work via t('key').
// ───────────────────────────────────────────────────────────────────────────

const DICT: Record<string, Record<Lang, string>> = {
  // Navbar
  'nav.home':         { fr: 'Home',       en: 'Home',     es: 'Inicio'    },
  'nav.calendar':     { fr: 'Calendrier', en: 'Calendar', es: 'Calendario'},
  'nav.stats':        { fr: 'Stats',      en: 'Stats',    es: 'Estadísticas' },
  'nav.params':       { fr: 'Paramètres', en: 'Settings', es: 'Ajustes'   },

  // Params — sections
  'params.title':           { fr: 'Paramètres',          en: 'Settings',          es: 'Ajustes'           },
  'params.general':         { fr: 'Général',             en: 'General',           es: 'General'           },
  'params.account':         { fr: 'Compte',              en: 'Account',           es: 'Cuenta'            },
  'params.changePassword':  { fr: 'Changer le mot de passe', en: 'Change password', es: 'Cambiar contraseña' },
  'params.changeEmail':     { fr: 'Changer l\'adresse email', en: 'Change email', es: 'Cambiar correo'    },
  'params.forgotPassword':  { fr: 'Mot de passe oublié ?', en: 'Forgot password?', es: '¿Contraseña olvidada?' },
  'params.notLoggedIn':     { fr: 'Non connecté',         en: 'Not signed in',     es: 'No conectado'      },
  'params.signIn':          { fr: 'Se connecter',         en: 'Sign in',           es: 'Conectarse'        },
  'params.aiKey':           { fr: 'Clé API Coach IA',     en: 'AI Coach API Key',  es: 'Clave API Coach IA'},
  'params.aiKeyOk':         { fr: 'Coach IA activé ✓',    en: 'AI Coach enabled ✓',es: 'Coach IA activado ✓'},
  'params.aiActivate':      { fr: 'Activer le Coach IA',  en: 'Enable AI Coach',   es: 'Activar Coach IA'  },
  'params.howToGetKey':     { fr: 'Comment obtenir la clé (2 min)', en: 'How to get your API key (2 min)', es: 'Cómo obtener la clave (2 min)' },
  'params.invite':          { fr: 'Inviter un ami',       en: 'Invite a friend',   es: 'Invitar a un amigo'},
  'params.inviteShare':     { fr: 'Partager l\'app 🏋️',   en: 'Share the app 🏋️', es: 'Compartir la app 🏋️' },
  'params.goal':            { fr: 'Objectif principal',   en: 'Main goal',         es: 'Objetivo principal'},
  'params.goalSub':         { fr: 'L\'IA adapte tous ses conseils à ton objectif.', en: 'The AI adapts all advice to your goal.', es: 'La IA adapta todos sus consejos a tu objetivo.' },
  'params.modify':          { fr: 'Modifier',             en: 'Edit',              es: 'Modificar'         },
  'params.cancel':          { fr: 'Annuler',              en: 'Cancel',            es: 'Cancelar'          },
  'params.legal':           { fr: 'Confidentialité & Légal', en: 'Privacy & Legal', es: 'Privacidad y legal' },
  'params.legalSub':        { fr: 'Mentions, RGPD, conditions', en: 'Notices, GDPR, terms', es: 'Avisos, RGPD, términos' },
  'params.signOut':         { fr: 'Se déconnecter',       en: 'Sign out',          es: 'Cerrar sesión'     },
  'params.reset':           { fr: 'Réinitialiser le compte', en: 'Reset account',  es: 'Reiniciar cuenta'  },
  'params.language':        { fr: 'Langue',               en: 'Language',          es: 'Idioma'            },
  'params.languageSub':     { fr: 'L\'app s\'adapte à ta langue préférée.', en: 'The app adapts to your preferred language.', es: 'La app se adapta a tu idioma.' },

  // Common buttons / states
  'common.loading':         { fr: 'Chargement...',        en: 'Loading...',        es: 'Cargando...'       },
  'common.save':            { fr: 'Enregistrer',          en: 'Save',              es: 'Guardar'           },
  'common.close':           { fr: 'Fermer',               en: 'Close',             es: 'Cerrar'            },
  'common.delete':          { fr: 'Supprimer',            en: 'Delete',            es: 'Eliminar'          },
  'common.edit':            { fr: 'Modifier',             en: 'Edit',              es: 'Modificar'         },
  'common.confirm':         { fr: 'Confirmer',            en: 'Confirm',           es: 'Confirmar'         },
  'common.back':            { fr: 'Retour',               en: 'Back',              es: 'Volver'            },
  'common.start':           { fr: 'Lancer',               en: 'Start',             es: 'Iniciar'           },
  'common.continue':        { fr: 'Continuer',            en: 'Continue',          es: 'Continuar'         },
  'common.yes':             { fr: 'Oui',                  en: 'Yes',               es: 'Sí'                },
  'common.no':              { fr: 'Non',                  en: 'No',                es: 'No'                },

  // Templates
  'tpl.startNow':           { fr: 'Lancer cette séance',  en: 'Start this workout',es: 'Iniciar esta sesión'},
  'tpl.askAI':              { fr: '🤖 Modifier avec l\'IA',  en: '🤖 Edit with AI', es: '🤖 Editar con IA'   },
  'tpl.delete':             { fr: 'Supprimer',            en: 'Delete',            es: 'Eliminar'          },
  'tpl.empty':              { fr: 'Aucun template sauvegardé.', en: 'No template saved yet.', es: 'Ningún template guardado.' },

  // History session
  'history.repeat':         { fr: 'Refaire cette séance', en: 'Redo this workout', es: 'Repetir esta sesión'},
  'history.analyzeAI':      { fr: '🤖 Analyser avec l\'IA',  en: '🤖 Analyse with AI', es: '🤖 Analizar con IA' },

  // Update banner
  'update.available':       { fr: 'Nouvelle version dispo', en: 'New version available', es: 'Nueva versión disponible' },
  'update.reload':          { fr: 'Recharger',            en: 'Reload',            es: 'Recargar'          },

  // Dashboard
  'dash.greet.morning':     { fr: 'Bonjour',              en: 'Good morning',      es: 'Buenos días'       },
  'dash.greet.afternoon':   { fr: 'Bon après-midi',       en: 'Good afternoon',    es: 'Buenas tardes'     },
  'dash.greet.evening':     { fr: 'Bonsoir',              en: 'Good evening',      es: 'Buenas noches'     },
  'dash.todayPlan':         { fr: 'Au programme',         en: 'On schedule',       es: 'En programa'       },
  'dash.startSession':      { fr: 'Lancer une séance',    en: 'Start a workout',   es: 'Iniciar sesión'    },
  'dash.todaySession':      { fr: 'Séance du jour',       en: 'Today\'s workout',  es: 'Sesión de hoy'     },
  'dash.recentSessions':    { fr: 'Séances récentes',     en: 'Recent workouts',   es: 'Sesiones recientes'},
  'dash.viewAll':           { fr: 'Voir tout',            en: 'View all',          es: 'Ver todo'          },
  'dash.measurements':      { fr: 'Mesures',              en: 'Measurements',      es: 'Mediciones'        },
  'dash.askCoach':          { fr: 'Coach IA',             en: 'AI Coach',          es: 'Coach IA'          },
  'dash.daily':             { fr: 'Routine du jour',      en: 'Daily routine',     es: 'Rutina diaria'     },
  'dash.streak':            { fr: 'jours d\'affilée',     en: 'day streak',        es: 'días seguidos'     },
  'dash.thisWeek':          { fr: 'Cette semaine',        en: 'This week',         es: 'Esta semana'       },
  'dash.totalVolume':       { fr: 'Volume total',         en: 'Total volume',      es: 'Volumen total'     },
  'dash.totalSessions':     { fr: 'Séances',              en: 'Workouts',          es: 'Sesiones'          },

  // Session
  'session.title':          { fr: 'Séance en cours',      en: 'Active workout',    es: 'Sesión activa'     },
  'session.addExercise':    { fr: 'Ajouter un exercice',  en: 'Add exercise',      es: 'Añadir ejercicio'  },
  'session.endSession':     { fr: 'Terminer la séance',   en: 'End workout',       es: 'Terminar sesión'   },
  'session.cancelSession':  { fr: 'Annuler',              en: 'Cancel',            es: 'Cancelar'          },
  'session.weight':         { fr: 'Poids (kg)',           en: 'Weight (kg)',       es: 'Peso (kg)'         },
  'session.reps':           { fr: 'Répétitions',          en: 'Reps',              es: 'Repeticiones'      },
  'session.addSet':         { fr: 'Ajouter série',        en: 'Add set',           es: 'Añadir serie'      },
  'session.set':            { fr: 'Série',                en: 'Set',               es: 'Serie'             },
  'session.previousSession':{ fr: 'Séance précédente',    en: 'Previous workout',  es: 'Sesión anterior'   },
  'session.noHistory':      { fr: 'Pas d\'historique',    en: 'No history yet',    es: 'Sin historial'     },
  'session.saveTemplate':   { fr: 'Sauver comme template',en: 'Save as template',  es: 'Guardar como plantilla' },
  'session.exerciseInfo':   { fr: 'Comment l\'exécuter',  en: 'How to perform',    es: 'Cómo ejecutarlo'   },
  'session.musclesTargeted':{ fr: 'Muscles ciblés',       en: 'Target muscles',    es: 'Músculos trabajados' },
  'session.equipment':      { fr: 'Matériel',             en: 'Equipment',         es: 'Equipo'            },
  'session.level':          { fr: 'Niveau',               en: 'Level',             es: 'Nivel'             },

  // Calendar
  'cal.title':              { fr: 'Calendrier',           en: 'Calendar',          es: 'Calendario'        },
  'cal.session':            { fr: 'Séance',               en: 'Workout',           es: 'Sesión'            },
  'cal.run':                { fr: 'Course',               en: 'Run',               es: 'Carrera'           },
  'cal.swim':               { fr: 'Natation',             en: 'Swim',              es: 'Natación'          },
  'cal.todo':               { fr: 'À faire',              en: 'To do',             es: 'Pendiente'         },
  'cal.startThis':          { fr: 'Lancer cette séance',  en: 'Start this workout', es: 'Iniciar esta sesión' },
  'cal.redo':               { fr: 'Refaire',              en: 'Redo',              es: 'Repetir'           },
  'cal.analyze':            { fr: '🤖 Analyser IA',       en: '🤖 Analyse with AI', es: '🤖 Analizar con IA'},
  'cal.nothing':            { fr: 'Rien de prévu ce jour',en: 'Nothing planned',   es: 'Nada planeado'     },
  'cal.delete':             { fr: 'Supprimer cette séance ?', en: 'Delete this workout?', es: '¿Eliminar esta sesión?' },

  // Cardio
  'cardio.title':           { fr: 'Cardio',               en: 'Cardio',            es: 'Cardio'            },
  'cardio.running':         { fr: 'Course',               en: 'Running',           es: 'Carrera'           },
  'cardio.swimming':        { fr: 'Natation',             en: 'Swimming',          es: 'Natación'          },
  'cardio.distance':        { fr: 'Distance',             en: 'Distance',          es: 'Distancia'         },
  'cardio.duration':        { fr: 'Durée',                en: 'Duration',          es: 'Duración'          },
  'cardio.pace':            { fr: 'Allure',               en: 'Pace',              es: 'Ritmo'             },
  'cardio.add':             { fr: 'Ajouter une course',   en: 'Add a run',         es: 'Añadir carrera'    },
  'cardio.empty':           { fr: 'Aucune activité enregistrée', en: 'No activity logged yet', es: 'Ninguna actividad registrada' },

  // Settings (Config)
  'set.title':              { fr: 'Config',               en: 'Config',            es: 'Configuración'     },
  'set.section':            { fr: 'Configuration',        en: 'Configuration',     es: 'Configuración'     },
  'set.tab.exercises':      { fr: 'Exercices',            en: 'Exercises',         es: 'Ejercicios'        },
  'set.tab.templates':      { fr: 'Templates',            en: 'Templates',         es: 'Plantillas'        },
  'set.tab.routine':        { fr: 'Routine',              en: 'Routine',           es: 'Rutina'            },
  'set.myExos':             { fr: 'Mes exercices custom', en: 'My custom exercises', es: 'Mis ejercicios personalizados' },
  'set.addExo':             { fr: '+ Ajouter',            en: '+ Add',             es: '+ Añadir'          },
  'set.exoName':            { fr: 'Nom de l\'exercice',   en: 'Exercise name',     es: 'Nombre del ejercicio' },
  'set.create':             { fr: 'Créer l\'exercice',    en: 'Create exercise',   es: 'Crear ejercicio'   },
  'set.tplExpand':          { fr: 'Toucher pour voir',    en: 'Tap to view',       es: 'Tocar para ver'    },
  'set.tplCollapse':        { fr: 'Toucher pour réduire', en: 'Tap to collapse',   es: 'Tocar para cerrar' },
  'set.editAI':             { fr: '🤖 Modifier IA',       en: '🤖 Edit with AI',   es: '🤖 Editar con IA'  },
  'set.start':              { fr: 'Lancer',               en: 'Start',             es: 'Iniciar'           },

  // Auth
  'auth.signIn':            { fr: 'Se connecter',         en: 'Sign in',           es: 'Iniciar sesión'    },
  'auth.signUp':            { fr: 'S\'inscrire',          en: 'Sign up',           es: 'Registrarse'       },
  'auth.email':             { fr: 'Email',                en: 'Email',             es: 'Correo'            },
  'auth.password':          { fr: 'Mot de passe',         en: 'Password',          es: 'Contraseña'        },
  'auth.forgot':            { fr: 'Mot de passe oublié',  en: 'Forgot password',   es: 'Olvidé mi contraseña' },
  'auth.skip':              { fr: 'Continuer sans compte', en: 'Continue without account', es: 'Continuar sin cuenta' },
  'auth.haveAccount':       { fr: 'Déjà un compte ?',     en: 'Already have an account?', es: '¿Ya tienes cuenta?' },
  'auth.noAccount':         { fr: 'Pas encore de compte ?', en: 'No account yet?', es: '¿Sin cuenta aún?'  },
  'auth.legalAgree':        { fr: 'En t\'inscrivant, tu acceptes notre', en: 'By signing up, you agree to our', es: 'Al registrarte, aceptas nuestra' },
  'auth.legalLink':         { fr: 'politique de confidentialité', en: 'privacy policy', es: 'política de privacidad' },

  // Privacy / Data export
  'privacy.export':         { fr: 'Exporter mes données', en: 'Export my data',    es: 'Exportar mis datos'},
  'privacy.exportSub':      { fr: 'Télécharge un fichier JSON contenant TOUTES tes données (RGPD - droit à la portabilité).', en: 'Download a JSON file with ALL your data (GDPR portability right).', es: 'Descarga un JSON con TODOS tus datos (derecho RGPD).' },
  'privacy.exporting':      { fr: 'Préparation de l\'export...', en: 'Preparing export...', es: 'Preparando exportación...' },
  'privacy.exportDone':     { fr: 'Export téléchargé ✓',  en: 'Export downloaded ✓', es: 'Exportación descargada ✓' },

  // Onboarding
  'onb.welcome':            { fr: 'Bienvenue 💪',         en: 'Welcome 💪',        es: 'Bienvenido 💪'     },
  'onb.start':              { fr: 'Commencer',            en: 'Get started',       es: 'Empezar'           },
  'onb.next':               { fr: 'Suivant',              en: 'Next',              es: 'Siguiente'         },
  'onb.back':               { fr: 'Retour',               en: 'Back',              es: 'Volver'            },
  'onb.finish':             { fr: 'Terminer',             en: 'Finish',            es: 'Terminar'          },
  'onb.yourName':           { fr: 'Comment t\'appelles-tu ?', en: 'What\'s your name?', es: '¿Cómo te llamas?' },
  'onb.yourGoal':           { fr: 'Ton objectif principal ?', en: 'Your main goal?', es: '¿Tu objetivo principal?' },
  'onb.yourLevel':          { fr: 'Ton niveau ?',         en: 'Your level?',       es: '¿Tu nivel?'        },
  'onb.weeklyDays':         { fr: 'Combien de jours/semaine ?', en: 'How many days per week?', es: '¿Cuántos días por semana?' },
  'onb.devices':            { fr: 'Tes appareils connectés ?', en: 'Connected devices?', es: '¿Dispositivos conectados?' },

  // Coach
  'coach.title':            { fr: 'Coach IA',             en: 'AI Coach',          es: 'Coach IA'          },
  'coach.placeholder':      { fr: 'Pose une question à ton coach...', en: 'Ask your coach...', es: 'Pregunta a tu coach...' },
  'coach.send':             { fr: 'Envoyer',              en: 'Send',              es: 'Enviar'            },
  'coach.clear':            { fr: 'Effacer la conversation', en: 'Clear conversation', es: 'Borrar conversación' },
  'coach.execute':          { fr: 'Exécuter',             en: 'Execute',           es: 'Ejecutar'          },
  'coach.cancelAction':     { fr: 'Annuler',              en: 'Cancel',            es: 'Cancelar'          },
  'coach.thinking':         { fr: 'Réflexion...',         en: 'Thinking...',       es: 'Pensando...'       },
  'coach.noKey':            { fr: 'Clé API Google manquante. Configure-la dans Paramètres.', en: 'Google API key missing. Set it up in Settings.', es: 'Falta la clave API. Configúrala en Ajustes.' },

  // Daily / Routine
  'daily.title':            { fr: 'Aujourd\'hui',         en: 'Today',             es: 'Hoy'               },
  'daily.routine':          { fr: 'Routine du soir',      en: 'Evening routine',   es: 'Rutina nocturna'   },
  'daily.calories':         { fr: 'Calories',             en: 'Calories',          es: 'Calorías'          },
  'daily.weight':           { fr: 'Poids du jour',        en: 'Today\'s weight',   es: 'Peso de hoy'       },
  'daily.addMeal':          { fr: 'Ajouter un repas',     en: 'Add a meal',        es: 'Añadir comida'     },

  // Stats / Analytics
  'stats.title':            { fr: 'Statistiques',         en: 'Stats',             es: 'Estadísticas'      },
  'stats.records':          { fr: 'Records',              en: 'Records',           es: 'Récords'           },
  'stats.progression':      { fr: 'Progression',          en: 'Progression',       es: 'Progresión'        },
  'stats.distribution':     { fr: 'Répartition muscles',  en: 'Muscle distribution', es: 'Distribución muscular' },
  'stats.empty':            { fr: 'Pas encore assez de données.', en: 'Not enough data yet.', es: 'Aún no hay suficientes datos.' },

  // Measurements
  'meas.title':             { fr: 'Mesures',              en: 'Measurements',      es: 'Mediciones'        },
  'meas.add':               { fr: 'Nouvelle mesure',      en: 'New measurement',   es: 'Nueva medición'    },
  'meas.last':              { fr: 'Dernière mesure',      en: 'Latest measurement',es: 'Última medición'   },
  'meas.history':           { fr: 'Historique',           en: 'History',           es: 'Historial'         },
  'meas.save':              { fr: 'Enregistrer',          en: 'Save',              es: 'Guardar'           },

  // Toasts
  'toast.synced':           { fr: 'Données synchronisées ☁', en: 'Data synced ☁', es: 'Datos sincronizados ☁' },
  'toast.signedOut':        { fr: 'Déconnecté',           en: 'Signed out',        es: 'Sesión cerrada'    },
  'toast.sessionSaved':     { fr: 'Séance enregistrée',   en: 'Workout saved',     es: 'Sesión guardada'   },
  'toast.linkCopied':       { fr: 'Lien copié !',         en: 'Link copied!',      es: '¡Enlace copiado!'  },
  'toast.deleted':          { fr: 'Supprimé',             en: 'Deleted',           es: 'Eliminado'         },
  'toast.saved':            { fr: 'Enregistré ✓',         en: 'Saved ✓',           es: 'Guardado ✓'        },

  // Legal
  'legal.title':            { fr: 'Légal & Confidentialité', en: 'Legal & Privacy', es: 'Legal y Privacidad' },
  'legal.tab.notices':      { fr: 'Mentions',             en: 'Notices',           es: 'Avisos'            },
  'legal.tab.privacy':      { fr: 'Confidentialité',      en: 'Privacy',           es: 'Privacidad'        },
  'legal.tab.terms':        { fr: 'CGU',                  en: 'Terms',             es: 'Términos'          },
};

export function t(key: string): string {
  const entry = DICT[key];
  if (!entry) return key; // fallback: surface the key so missing translations are visible
  return entry[current] ?? entry.fr ?? key;
}

/** Inline translation helper for ad-hoc strings.
 *  Use when a string lives in a single component and isn't worth a key in DICT.
 *
 *    tr({ fr: 'Voir tout', en: 'See all', es: 'Ver todo' })
 */
export function tr(map: Partial<Record<Lang, string>>): string {
  return map[current] ?? map.en ?? map.fr ?? '';
}

// React hook helper
import { useEffect, useState } from 'react';
export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>(current);
  useEffect(() => {
    const onChange = (e: any) => setLangState(e.detail as Lang);
    window.addEventListener('rezakit:lang-changed', onChange);
    return () => window.removeEventListener('rezakit:lang-changed', onChange);
  }, []);
  return [lang, setLang];
}
