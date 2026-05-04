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
};

export function t(key: string): string {
  const entry = DICT[key];
  if (!entry) return key; // fallback: surface the key so missing translations are visible
  return entry[current] ?? entry.fr ?? key;
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
