import { useEffect, useRef, useState } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { useTemplateStore } from '../stores/templateStore';
import { useBodyWeightStore } from '../stores/bodyweightStore';
import { useCalorieStore } from '../stores/calorieStore';
import { useCardioStore } from '../stores/cardioStore';
import { getPersonalRecords } from '../utils/records';
import { scheduleSync } from '../utils/cloudSync';
import { loadCoachProfile, saveCoachProfile, loadCoachProfile as getProfile } from '../utils/coachProfile';
import { getFavorites, getAvoided } from '../utils/exercisePrefs';
import {
  loadMemory, saveMemory, clearMemory,
  shouldCompact, splitForCompaction, compactHistory,
} from '../utils/coachMemory';
import { Icons } from './Icons';
import { useAuthStore } from '../stores/authStore';
import PostSessionPhoto from './PostSessionPhoto';
import type { SessionType, MealType } from '../types';

interface AICoachProps {
  onBack: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface PendingAction {
  type: string;
  args: Record<string, unknown>;
  label: string;
  preview: string;
  contentsAtCall: any[];
}

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  push: 'Push (Pecto / Épaules / Triceps)',
  pull: 'Pull (Dos / Biceps)',
  legs: 'Legs (Quadri / Ischio / Mollets)',
  upper: 'Upper (Haut du corps)',
  lower: 'Lower (Bas du corps)',
};

const QUICK_PROMPTS = [
  'Bilan de ma semaine d\'entraînement',
  'Crée-moi une séance adaptée à mon objectif',
  'Génère un plan 4 semaines adapté à mon profil',
  'J\'ai mal à l\'épaule droite, note-le',
  'Logger mon poids : 78kg',
];

const GEMINI_TOOLS = [{
  functionDeclarations: [
    {
      name: 'create_session',
      description: 'Planifie une séance dans le calendrier pour une date précise.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'YYYY-MM-DD' },
          type: { type: 'string', enum: ['push', 'pull', 'legs', 'upper', 'lower'] },
          exercises: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, muscleGroup: { type: 'string' } }, required: ['name', 'muscleGroup'] } },
          notes: { type: 'string' },
        },
        required: ['date', 'type'],
      },
    },
    {
      name: 'create_template',
      description: 'Crée un template d\'entraînement réutilisable.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: ['push', 'pull', 'legs', 'upper', 'lower'] },
          exercises: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, muscleGroup: { type: 'string' } }, required: ['name', 'muscleGroup'] } },
        },
        required: ['name', 'type', 'exercises'],
      },
    },
    {
      name: 'delete_session',
      description: 'Supprime une séance existante par son ID.',
      parameters: {
        type: 'object',
        properties: {
          session_id: { type: 'string', description: 'ID de la séance à supprimer' },
          session_date: { type: 'string', description: 'Date de la séance (pour confirmation)' },
          session_type: { type: 'string', description: 'Type de séance (pour confirmation)' },
        },
        required: ['session_id', 'session_date', 'session_type'],
      },
    },
    {
      name: 'reschedule_session',
      description: 'Déplace une séance existante à une nouvelle date.',
      parameters: {
        type: 'object',
        properties: {
          session_id: { type: 'string' },
          old_date: { type: 'string', description: 'Date actuelle de la séance' },
          new_date: { type: 'string', description: 'Nouvelle date YYYY-MM-DD' },
          session_type: { type: 'string' },
        },
        required: ['session_id', 'old_date', 'new_date', 'session_type'],
      },
    },
    {
      name: 'update_session_notes',
      description: 'Modifie les notes d\'une séance existante.',
      parameters: {
        type: 'object',
        properties: {
          session_id: { type: 'string' },
          session_date: { type: 'string' },
          notes: { type: 'string', description: 'Nouvelles notes à enregistrer' },
        },
        required: ['session_id', 'notes'],
      },
    },
    {
      name: 'log_weight',
      description: 'Enregistre le poids corporel de l\'utilisateur.',
      parameters: {
        type: 'object',
        properties: {
          weight: { type: 'number', description: 'Poids en kg' },
          date: { type: 'string', description: 'YYYY-MM-DD (aujourd\'hui si absent)' },
          notes: { type: 'string' },
        },
        required: ['weight'],
      },
    },
    {
      name: 'add_calorie',
      description: 'Ajoute une entrée calories (mangée ou dépensée).',
      parameters: {
        type: 'object',
        properties: {
          calories: { type: 'number' },
          label: { type: 'string', description: 'Nom de l\'aliment ou activité' },
          type: { type: 'string', enum: ['in', 'out'], description: '"in" = mangé, "out" = dépensé' },
          meal: { type: 'string', enum: ['petit-dej', 'dejeuner', 'diner', 'collation'] },
          date: { type: 'string', description: 'YYYY-MM-DD (aujourd\'hui si absent)' },
        },
        required: ['calories', 'label', 'type'],
      },
    },
    {
      name: 'add_cardio',
      description: 'Enregistre une course à pied ou une séance de natation.',
      parameters: {
        type: 'object',
        properties: {
          activity_type: { type: 'string', enum: ['run', 'swim'], description: '"run" = course, "swim" = natation' },
          distance: { type: 'number', description: 'Distance en km (course) ou mètres (natation)' },
          duration: { type: 'number', description: 'Durée en minutes' },
          date: { type: 'string', description: 'YYYY-MM-DD' },
          notes: { type: 'string' },
        },
        required: ['activity_type', 'distance', 'duration'],
      },
    },
    {
      name: 'save_injury',
      description: 'Enregistre une blessure ou limitation physique dans la mémoire permanente du coach. L\'IA en tiendra compte dans toutes les futures conversations.',
      parameters: {
        type: 'object',
        properties: {
          description: { type: 'string', description: 'Ex: "douleur épaule droite, éviter les élévations latérales et le développé militaire"' },
        },
        required: ['description'],
      },
    },
    {
      name: 'clear_injuries',
      description: 'Efface toutes les blessures enregistrées (utilisateur guéri).',
      parameters: { type: 'object', properties: {} },
    },
    {
      name: 'create_periodization_plan',
      description: 'Génère un plan d\'entraînement sur plusieurs semaines avec toutes les séances planifiées dans le calendrier.',
      parameters: {
        type: 'object',
        properties: {
          weeks: { type: 'number', description: 'Nombre de semaines (1-12)' },
          sessions: {
            type: 'array',
            description: 'Toutes les séances à créer sur la période',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string', description: 'YYYY-MM-DD' },
                type: { type: 'string', enum: ['push', 'pull', 'legs', 'upper', 'lower'] },
                exercises: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, muscleGroup: { type: 'string' } }, required: ['name', 'muscleGroup'] } },
              },
              required: ['date', 'type'],
            },
          },
        },
        required: ['weeks', 'sessions'],
      },
    },
  ],
}];

function dayDiff(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / 86400000;
}

function formatError(msg: string): string {
  if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate limit')) {
    const m = msg.match(/retry in ([\d.]+)s/i);
    const secs = m ? Math.ceil(parseFloat(m[1])) : null;
    return secs
      ? `Quota Gemini atteint ☕ Réessaie dans ${secs}s.`
      : 'Quota Gemini atteint. Réessaie dans quelques instants.';
  }
  if (msg.includes('503') || msg.toLowerCase().includes('unavailable')) return 'Serveur Gemini indisponible. Réessaie dans 30s.';
  if ((msg.includes('401') || msg.includes('403')) && !msg.includes('API_KEY')) return 'Accès refusé. Vérifie ta clé API.';
  if (msg.includes('400') && msg.toLowerCase().includes('api_key')) return 'Clé API invalide. Vérifie dans Paramètres → Clé API.';
  if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('failed to fetch')) return 'Connexion impossible. Vérifie ton réseau.';
  return 'Une erreur est survenue. Réessaie.';
}

function parseInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*\n]+?\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i} style={{ color: 'var(--text)', fontWeight: 700 }}>{p.slice(2, -2)}</strong>
          : p || null
      )}
    </>
  );
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  lines.forEach((line, i) => {
    const listMatch = line.match(/^\s*[\*\-•]\s+(.+)/);
    if (listMatch) {
      nodes.push(
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 3 }}>
          <span style={{ color: 'var(--primary)', flexShrink: 0, fontSize: 15, lineHeight: '1.55' }}>·</span>
          <span>{parseInline(listMatch[1])}</span>
        </div>
      );
    } else if (line.trim() === '') {
      nodes.push(<div key={i} style={{ height: 5 }} />);
    } else {
      nodes.push(<div key={i}>{parseInline(line)}</div>);
    }
  });
  return <>{nodes}</>;
}

const GOAL_LABELS: Record<string, string> = {
  muscle: 'Prise de masse', strength: 'Force', cut: 'Sèche',
  recomposition: 'Recomposition', endurance: 'Endurance', health: 'Santé générale',
};
const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé',
};

function getUserProfile() {
  try { return JSON.parse(localStorage.getItem('user_profile') || '{}'); } catch { return {}; }
}

function buildContext(sessions: any[], weights: any[], entries: any[], courses: any[], templates: any[]) {
  const today = new Date().toISOString().split('T')[0];

  const up = getUserProfile();
  const profileStr = up.name ? `PROFIL UTILISATEUR (PRIORITÉ ABSOLUE):
Prénom: ${up.name}
Objectif: ${GOAL_LABELS[up.goal] || up.goal || 'non défini'} ← adapte TOUS tes conseils à cet objectif
Niveau: ${LEVEL_LABELS[up.level] || up.level || 'non défini'}
Entraînements/semaine: ${up.weeklyDays || 'non défini'} séances
Appareils: ${up.devices?.length ? up.devices.join(', ') : 'aucun'}

RÈGLES D'ADAPTATION AU PROFIL:
- Objectif ${GOAL_LABELS[up.goal] || ''}: adapte calories cibles, volume, fréquence, exercices recommandés
- Niveau ${LEVEL_LABELS[up.level] || ''}: adapte la complexité des programmes et la charge de travail
- ${up.weeklyDays} séances/semaine: ne propose JAMAIS plus de ${up.weeklyDays} séances par semaine
- Si l'utilisateur change son objectif ou ses jours dans les paramètres, adapte immédiatement tes recommandations

` : '';

  // Sessions with IDs for AI reference
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  const recent = sorted.slice(0, 10);
  const sessionLines = recent.map((s) => {
    const exos = s.exercises.map((e: any) => {
      const max = Math.max(0, ...e.sets.map((st: any) => st.weight));
      return `    - ${e.exerciseName}${max > 0 ? `: max ${max}kg` : ''}`;
    }).join('\n');
    const status = s.completed ? '✓' : '📅 planifiée';
    return `${s.date} [${s.type.toUpperCase()}] [id:${s.id}] ${status}${s.notes ? ` — "${s.notes}"` : ''}\n${exos}`;
  }).join('\n');

  // Overtraining check
  const last7 = sessions.filter((s) => dayDiff(s.date) <= 7 && s.completed);
  const last7count = last7.length;
  let consecutiveDays = 0;
  const doneDates = new Set(sessions.filter((s) => s.completed).map((s) => s.date));
  let d = new Date();
  while (doneDates.has(d.toISOString().split('T')[0])) {
    consecutiveDays++;
    d = new Date(d.getTime() - 86400000);
  }
  const overtrainWarning = last7count >= 6 || consecutiveDays >= 5
    ? `\n⚠️ SURMENAGE DÉTECTÉ: ${last7count} séances en 7 jours, ${consecutiveDays} jours consécutifs. Rappelle la récupération.`
    : '';

  const prs = getPersonalRecords(sessions);
  const prLines = prs.slice(0, 10).map((r) => `${r.exerciseName}: ${r.weight}kg × ${r.reps}`).join('\n');

  const lastWeight = [...weights].sort((a: any, b: any) => b.date.localeCompare(a.date))[0];
  const weightStr = lastWeight ? `${lastWeight.weight}kg (le ${lastWeight.date})` : 'non renseigné';

  const last7cals = entries.filter((e: any) => dayDiff(e.date) <= 7);
  const calIn = last7cals.filter((e: any) => e.type === 'in').reduce((s: number, e: any) => s + e.calories, 0);
  const calOut = last7cals.filter((e: any) => e.type === 'out').reduce((s: number, e: any) => s + e.calories, 0);

  const lastRun = [...courses].sort((a: any, b: any) => b.date.localeCompare(a.date))[0];
  const runStr = lastRun ? `${lastRun.distance}km en ${lastRun.time}min (le ${lastRun.date})` : 'aucune';

  const userTemplates = templates
    .filter((t: any) => !['push-default', 'pull-default', 'legs-default', 'upper-default', 'lower-default'].includes(t.id))
    .map((t: any) => `${t.name} (${t.type})`)
    .join(', ') || 'aucun';

  const profile = loadCoachProfile();
  const injuriesStr = profile.injuries.length > 0
    ? `\n🩹 BLESSURES/LIMITATIONS (PERMANENT): ${profile.injuries.join(' | ')}`
    : '';

  const favs = getFavorites();
  const avoids = getAvoided();
  const prefStr = (favs.length > 0 || avoids.length > 0) ? `
PRÉFÉRENCES EXERCICES (à respecter strictement):
${favs.length > 0 ? `⭐ Favoris (à privilégier dans tes créations): ${favs.join(', ')}` : ''}
${avoids.length > 0 ? `🚫 À éviter (NE JAMAIS proposer ces exercices): ${avoids.join(', ')}` : ''}` : '';

  return `${profileStr}DONNÉES UTILISATEUR:
Date: ${today}
Poids: ${weightStr}
Séances 7 derniers jours: ${last7count} (${consecutiveDays} jours consécutifs)
Calories semaine: ${calIn} kcal mangées, ${calOut} kcal sport
Dernière course: ${runStr}${overtrainWarning}${injuriesStr}${prefStr}

RECORDS PERSONNELS:
${prLines || 'Aucun'}

SÉANCES RÉCENTES (avec IDs pour modification):
${sessionLines || 'Aucune'}

TEMPLATES: ${userTemplates}

TES CAPACITÉS: create_session, create_template, delete_session, reschedule_session, update_session_notes, log_weight, add_calorie, add_cardio, save_injury, clear_injuries, create_periodization_plan. Propose-les naturellement sans attendre qu'on te le demande.`;
}

async function callGemini(
  contents: any[],
  systemText: string,
  apiKey: string,
  attempt = 0,
  forceFunction = false,
): Promise<{ text?: string; functionCall?: { name: string; args: Record<string, unknown> } }> {
  const body: any = {
    contents,
    tools: GEMINI_TOOLS,
    systemInstruction: { parts: [{ text: systemText }] },
    generationConfig: { maxOutputTokens: 1200, temperature: 0.8 },
  };
  if (forceFunction) {
    body.toolConfig = { functionCallingConfig: { mode: 'ANY' } };
  }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const status = res.status;
    if (status === 503 && attempt < 2) {
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      return callGemini(contents, systemText, apiKey, attempt + 1, forceFunction);
    }
    throw new Error(`${status}: ${(err as any).error?.message || ''}`);
  }
  const data = await res.json();
  const parts: any[] = data.candidates?.[0]?.content?.parts ?? [];
  const fnPart = parts.find((p) => p.functionCall);
  if (fnPart) return { functionCall: fnPart.functionCall };
  const text = parts.map((p) => p.text ?? '').join('');
  return { text };
}

function buildActionPreview(name: string, args: Record<string, unknown>): { label: string; preview: string } {
  switch (name) {
    case 'create_session': {
      const a = args as { date: string; type: SessionType; exercises?: { name: string }[]; notes?: string };
      const exos = a.exercises?.map((e) => e.name).join(', ') || 'à définir';
      return { label: '🏋️ Créer une séance', preview: `${SESSION_TYPE_LABELS[a.type]}\nDate : ${a.date}\nExercices : ${exos}${a.notes ? `\nNote : ${a.notes}` : ''}` };
    }
    case 'create_template': {
      const a = args as { name: string; type: SessionType; exercises: { name: string }[] };
      return { label: '📋 Créer un template', preview: `"${a.name}" — ${SESSION_TYPE_LABELS[a.type]}\nExercices : ${a.exercises.map((e) => e.name).join(', ')}` };
    }
    case 'delete_session': {
      const a = args as { session_date: string; session_type: string };
      return { label: '🗑 Supprimer une séance', preview: `Séance ${a.session_type?.toUpperCase()} du ${a.session_date}` };
    }
    case 'reschedule_session': {
      const a = args as { old_date: string; new_date: string; session_type: string };
      return { label: '📅 Déplacer une séance', preview: `${a.session_type?.toUpperCase()} : ${a.old_date} → ${a.new_date}` };
    }
    case 'update_session_notes': {
      const a = args as { session_date?: string; notes: string };
      return { label: '📝 Modifier les notes', preview: `${a.session_date ? `Séance du ${a.session_date}\n` : ''}Notes : "${a.notes}"` };
    }
    case 'log_weight': {
      const a = args as { weight: number; date?: string };
      return { label: '⚖️ Logger le poids', preview: `${a.weight} kg${a.date ? ` — ${a.date}` : ' — aujourd\'hui'}` };
    }
    case 'add_calorie': {
      const a = args as { calories: number; label: string; type: string; meal?: string };
      return { label: `🍽 Ajouter ${a.type === 'in' ? 'calories mangées' : 'calories dépensées'}`, preview: `${a.label} — ${a.calories} kcal${a.meal ? ` (${a.meal})` : ''}` };
    }
    case 'add_cardio': {
      const a = args as { activity_type: string; distance: number; duration: number; date?: string };
      const unit = a.activity_type === 'run' ? 'km' : 'm';
      return { label: `${a.activity_type === 'run' ? '🏃 Enregistrer une course' : '🏊 Enregistrer une natation'}`, preview: `${a.distance}${unit} en ${a.duration}min${a.date ? ` — ${a.date}` : ''}` };
    }
    case 'save_injury': {
      const a = args as { description: string };
      return { label: '🩹 Mémoriser une blessure', preview: a.description };
    }
    case 'clear_injuries':
      return { label: '✅ Effacer les blessures', preview: 'Toutes les blessures enregistrées seront supprimées.' };
    case 'create_periodization_plan': {
      const a = args as { weeks: number; sessions: { date: string; type: string }[] };
      const byWeek = new Map<string, number>();
      a.sessions.forEach((s) => {
        const w = `Semaine du ${s.date.substring(0, 7)}`;
        byWeek.set(w, (byWeek.get(w) || 0) + 1);
      });
      const summary = Array.from(byWeek.entries()).slice(0, 4).map(([w, n]) => `${w}: ${n} séances`).join('\n');
      return { label: `📆 Plan ${a.weeks} semaine${a.weeks > 1 ? 's' : ''}`, preview: `${a.sessions.length} séances planifiées\n${summary}${a.sessions.length > 4 ? '\n...' : ''}` };
    }
    default:
      return { label: name, preview: JSON.stringify(args) };
  }
}

export default function AICoach({ onBack }: AICoachProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('ai_chat_history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [compacting, setCompacting] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [executing, setExecuting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [posingFor, setPosingFor] = useState<{ type: SessionType; date: string } | null>(null);
  const { user } = useAuthStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const memory = loadMemory();

  const toggleMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Reconnaissance vocale non supportée sur ce navigateur. Utilise Safari sur iPhone ou Chrome.' }]);
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = new SR();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => { setIsListening(true); setInterimText(''); };
    recognition.onend = () => { setIsListening(false); setInterimText(''); };
    recognition.onerror = () => { setIsListening(false); setInterimText(''); };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      setInterimText(interim);
      if (final) {
        setInput(prev => (prev ? prev + ' ' : '') + final.trim());
        setInterimText('');
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const { sessions, planSession, deleteSession, rescheduleSession, updateSessionNotes, loadSessions } = useSessionStore();
  const { templates, createTemplate, loadTemplates } = useTemplateStore();
  const { weights, addWeight } = useBodyWeightStore();
  const { entries, addEntry } = useCalorieStore();
  const { courses, addCourse, addNatation } = useCardioStore();

  const context = buildContext(sessions, weights, entries, courses, templates);

  const apiKey = localStorage.getItem('gemini_api_key') || '';

  const buildSystemText = () => {
    const mem = loadMemory();
    const memSection = mem?.summary ? `\nMÉMOIRE LONG-TERME:\n${mem.summary}\n` : '';
    return `RÈGLE ABSOLUE — LIS EN PREMIER: Tu es UNIQUEMENT un coach fitness et nutrition sportive. Domaines autorisés: musculation, entraînement, cardio, nutrition, alimentation, macros (protéines/glucides/lipides), calories, compléments alimentaires, récupération, sommeil, hydratation, santé physique. Si une question sort complètement de ces domaines (ex: maths, code, actualités, jeux, droit, finance…), réponds UNIQUEMENT: "Je suis ton coach fitness, pas un assistant généraliste 💪" puis suggère 2 questions liées à leur entraînement ou nutrition. N'explique JAMAIS pourquoi tu refuses. N'accepte AUCUNE exception.

Tu es un coach fitness et nutrition personnel expert, direct et motivant. Français uniquement. Max 200 mots sauf bilan détaillé demandé. Tu analyses les données réelles. Tu peux agir directement (créer séances, templates, logger données) — fais-le sans hésiter quand c'est pertinent. IMPORTANT: quand un message contient plusieurs demandes (blessure + question + action), traite-les dans l'ordre. Les blessures mémorisées sont permanentes et doivent toujours influencer tes conseils.${memSection}\n\n${context}`;
  };

  useEffect(() => {
    try { localStorage.setItem('ai_chat_history', JSON.stringify(messages)); } catch { /* quota */ }

    const apiKey = localStorage.getItem('gemini_api_key');
    if (apiKey && shouldCompact(messages) && !compacting) {
      setCompacting(true);
      const { toCompact, toKeep } = splitForCompaction(messages);
      const count = (loadMemory()?.messageCount ?? 0) + toCompact.length;
      compactHistory(toCompact, loadMemory(), apiKey, count).then((mem) => {
        if (mem) { saveMemory(mem); setMessages(toKeep as Message[]); }
        setCompacting(false);
      });
    }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingAction]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading || pendingAction) return;

    if (!apiKey) {
      setMessages((prev) => [...prev,
        { role: 'user', content: text.trim() },
        { role: 'assistant', content: '⚠️ Clé API Google manquante. Va dans Paramètres pour la configurer (gratuit !).' },
      ]);
      setInput('');
      return;
    }

    const userMsg: Message = { role: 'user', content: text.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    const systemText = buildSystemText();
    const contents = updated.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    try {
      const result = await callGemini(contents, systemText, apiKey);

      if (result.functionCall) {
        const { name, args } = result.functionCall;
        const { label, preview } = buildActionPreview(name, args);
        setPendingAction({ type: name, args, label, preview, contentsAtCall: contents });
        setLoading(false);
        return;
      }

      setMessages([...updated, { role: 'assistant', content: result.text || '❌ Réponse vide. Réessaie.' }]);
    } catch (e: any) {
      setMessages([...updated, { role: 'assistant', content: `⚠️ ${formatError(e.message || '')}` }]);
    }
    setLoading(false);
  };

  // After an action is executed, send result back to Gemini to handle the rest of the message
  const continueAfterAction = async (action: PendingAction, successMsg: string) => {
    if (!apiKey) return;
    const systemText = buildSystemText();

    const continuationContents = [
      ...action.contentsAtCall,
      { role: 'model', parts: [{ functionCall: { name: action.type, args: action.args } }] },
      {
        role: 'user', parts: [{ functionResponse: { name: action.type, response: {
          output: `Succès: ${successMsg}. IMPORTANT: s'il reste d'autres actions ou questions dans le message original de l'utilisateur, exécute-les maintenant directement sans attendre. Ne réponds pas par du texte si une action est encore à faire.`,
        } } }],
      },
    ];

    setLoading(true);
    try {
      const result = await callGemini(continuationContents, systemText, apiKey);

      const addSuccess = (prev: Message[]) => {
        const already = prev.slice(-5).some((m) => m.content === successMsg);
        return already ? prev : [...prev, { role: 'assistant' as const, content: successMsg }];
      };

      if (result.functionCall) {
        const { name, args } = result.functionCall;
        const { label, preview } = buildActionPreview(name, args);
        setMessages(addSuccess);
        setPendingAction({ type: name, args, label, preview, contentsAtCall: continuationContents });
      } else {
        let chained = false;
        try {
          const forced = await callGemini(continuationContents, systemText, apiKey, 0, true);
          if (forced.functionCall) {
            const { name, args } = forced.functionCall;
            const { label, preview } = buildActionPreview(name, args);
            setMessages(addSuccess);
            setPendingAction({ type: name, args, label, preview, contentsAtCall: continuationContents });
            chained = true;
          }
        } catch { /* ignore */ }

        if (!chained) {
          const text = result.text?.trim();
          setMessages((prev) => {
            const base = addSuccess(prev);
            if (text && text !== successMsg) return [...base, { role: 'assistant', content: text }];
            return base;
          });
        }
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: successMsg }]);
    }
    setLoading(false);
  };

  const confirmAction = async () => {
    if (!pendingAction || executing) return;
    setExecuting(true);
    const today = new Date().toISOString().split('T')[0];

    try {
      let successMsg = '✅ Fait !';

      switch (pendingAction.type) {
        case 'create_session': {
          const a = pendingAction.args as { date: string; type: SessionType; exercises?: { name: string; muscleGroup: string }[]; notes?: string };
          await planSession(a.date, a.type, a.exercises || [], a.notes);
          await loadSessions();
          successMsg = `✅ Séance ${SESSION_TYPE_LABELS[a.type]} planifiée pour le ${a.date} — visible dans le calendrier.`;
          // Offer posing photo if the session is for today/past and user is logged in
          const todayIso = new Date().toISOString().split('T')[0];
          if (user && a.date <= todayIso) {
            setPosingFor({ type: a.type, date: a.date });
          }
          break;
        }
        case 'create_template': {
          const a = pendingAction.args as { name: string; type: SessionType; exercises: { name: string; muscleGroup: string }[] };
          await createTemplate(a.name, a.type, a.exercises);
          await loadTemplates();
          successMsg = `✅ Template "${a.name}" créé — disponible dans Config → Templates.`;
          break;
        }
        case 'delete_session': {
          const a = pendingAction.args as { session_id: string; session_date: string };
          await deleteSession(a.session_id);
          await loadSessions();
          successMsg = `✅ Séance du ${a.session_date} supprimée.`;
          break;
        }
        case 'reschedule_session': {
          const a = pendingAction.args as { session_id: string; old_date: string; new_date: string };
          await rescheduleSession(a.session_id, a.new_date);
          await loadSessions();
          successMsg = `✅ Séance déplacée du ${a.old_date} au ${a.new_date}.`;
          break;
        }
        case 'update_session_notes': {
          const a = pendingAction.args as { session_id: string; notes: string; session_date?: string };
          await updateSessionNotes(a.session_id, a.notes);
          await loadSessions();
          successMsg = `✅ Notes mises à jour.`;
          break;
        }
        case 'log_weight': {
          const a = pendingAction.args as { weight: number; date?: string; notes?: string };
          await addWeight(a.weight, a.date || today, a.notes);
          successMsg = `✅ Poids enregistré : ${a.weight} kg.`;
          break;
        }
        case 'add_calorie': {
          const a = pendingAction.args as { calories: number; label: string; type: 'in' | 'out'; meal?: MealType; date?: string };
          await addEntry(a.calories, a.label, a.type, a.date || today, a.meal);
          successMsg = `✅ ${a.calories} kcal ${a.type === 'in' ? 'mangées' : 'dépensées'} (${a.label}) enregistrées.`;
          break;
        }
        case 'add_cardio': {
          const a = pendingAction.args as { activity_type: 'run' | 'swim'; distance: number; duration: number; date?: string; notes?: string };
          if (a.activity_type === 'run') {
            await addCourse(a.distance, a.duration, a.date || today, a.notes);
            successMsg = `✅ Course enregistrée : ${a.distance}km en ${a.duration}min.`;
          } else {
            await addNatation(a.distance, a.duration, a.date || today, 'Crawl', a.notes);
            successMsg = `✅ Natation enregistrée : ${a.distance}m en ${a.duration}min.`;
          }
          break;
        }
        case 'save_injury': {
          const a = pendingAction.args as { description: string };
          const profile = getProfile();
          profile.injuries.push(a.description);
          saveCoachProfile(profile);
          successMsg = `✅ Blessure mémorisée — je ferai attention dans mes futurs conseils.`;
          break;
        }
        case 'clear_injuries': {
          saveCoachProfile({ injuries: [], updatedAt: new Date().toISOString() });
          successMsg = `✅ Toutes les blessures ont été effacées.`;
          break;
        }
        case 'create_periodization_plan': {
          const a = pendingAction.args as { weeks: number; sessions: { date: string; type: SessionType; exercises?: { name: string; muscleGroup: string }[] }[] };
          for (const s of a.sessions) {
            await planSession(s.date, s.type, s.exercises || []);
          }
          await loadSessions();
          successMsg = `✅ Plan de ${a.weeks} semaine${a.weeks > 1 ? 's' : ''} créé — ${a.sessions.length} séances dans le calendrier.`;
          break;
        }
      }

      scheduleSync();

      const actionSnapshot = pendingAction;
      setPendingAction(null);
      setExecuting(false);

      // Re-ask Gemini with function result so it handles the rest of the message
      await continueAfterAction(actionSnapshot, successMsg);
      return;
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '❌ Erreur lors de l\'exécution. Réessaie.' }]);
    }

    setPendingAction(null);
    setExecuting(false);
  };

  const cancelAction = () => {
    setPendingAction(null);
    setMessages((prev) => [...prev, { role: 'assistant', content: 'Pas de problème, laisse tomber. Autre chose ?' }]);
  };

  const hasApiKey = !!localStorage.getItem('gemini_api_key');
  const profile = loadCoachProfile();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Posing prompt — triggered after AI saves a session for today/past */}
      {posingFor && (
        <PostSessionPhoto
          sessionType={posingFor.type}
          date={posingFor.date}
          onDone={() => setPosingFor(null)}
        />
      )}

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(5,5,5,0.9)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        padding: '14px 18px 12px',
        borderBottom: '1px solid var(--line)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} className="tap" style={{
            background: 'rgba(255,255,255,0.06)', border: 'none',
            borderRadius: 12, width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)',
          }}>
            <Icons.ChevronLeft size={18} />
          </button>
          <div style={{
            width: 38, height: 38, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icons.Bot size={20} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Coach IA</div>
            <div style={{ fontSize: 11, color: 'var(--text-mute)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {!hasApiKey ? '⚠️ Clé API requise' : profile.injuries.length > 0 ? `🩹 ${profile.injuries.length} limitation${profile.injuries.length > 1 ? 's' : ''} mémorisée${profile.injuries.length > 1 ? 's' : ''}` : 'Basé sur tes données · Actions directes'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {memory && (
              <div style={{
                fontSize: 10, color: 'var(--ok)', fontWeight: 600,
                background: 'rgba(74,222,128,0.1)', padding: '4px 8px', borderRadius: 8,
              }}>
                {compacting ? '⟳' : `${memory.messageCount} msg`}
              </div>
            )}
            <button onClick={() => { setMessages([]); clearMemory(); }} className="tap" style={{
              background: 'rgba(255,255,255,0.04)', border: 'none',
              borderRadius: 10, padding: '6px 10px', color: 'var(--text-mute)', fontSize: 12, fontWeight: 600,
            }}>
              Effacer
            </button>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        padding: '16px 16px 0',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        scrollbarWidth: 'none',
      }}>
        {/* No API key */}
        {!hasApiKey && (
          <div style={{ borderRadius: 18, padding: '16px', marginBottom: 16, background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.25)' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--primary)' }}>Gratuit — 2 minutes à configurer</div>
            <div style={{ fontSize: 12, color: 'var(--text-soft)', lineHeight: 1.7 }}>
              1. Va sur <strong style={{ color: 'var(--text)' }}>aistudio.google.com</strong><br />
              2. Connecte-toi → <strong style={{ color: 'var(--text)' }}>"Get API key"</strong> → Créer<br />
              3. Copie la clé → <strong style={{ color: 'var(--text)' }}>Paramètres → Clé API Coach IA</strong>
            </div>
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 && (
          <div>
            <div style={{ textAlign: 'center', padding: '20px 0 16px' }}>
              <div style={{ width: 64, height: 64, borderRadius: 22, margin: '0 auto 12px', background: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(196,30,58,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icons.Sparkle size={28} color="var(--primary)" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Pose-moi une question</div>
              <div style={{ fontSize: 12, color: 'var(--text-mute)', lineHeight: 1.5 }}>
                Tape ou appuie sur 🎤 pour dicter ta séance.<br />
                Je crée, loggue et planifie directement depuis le chat.
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {QUICK_PROMPTS.map((p) => (
                <button key={p} onClick={() => sendMessage(p)} className="tap" style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)',
                  borderRadius: 14, padding: '12px 14px',
                  textAlign: 'left', color: 'var(--text-soft)', fontSize: 13, fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <Icons.ChevronRight size={14} color="var(--primary)" />
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
            {msg.role === 'assistant' && (
              <div style={{ width: 28, height: 28, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8, marginTop: 2 }}>
                <Icons.Bot size={14} color="#fff" />
              </div>
            )}
            <div style={{
              maxWidth: '82%',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, var(--primary), var(--primary-deep))'
                : msg.content.startsWith('⚠️')
                  ? 'rgba(251,146,60,0.08)'
                  : 'rgba(255,255,255,0.06)',
              border: msg.content.startsWith('⚠️') ? '1px solid rgba(251,146,60,0.25)' : 'none',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              padding: '10px 14px', fontSize: 13.5, lineHeight: 1.55,
              color: msg.role === 'user' ? '#fff' : 'var(--text-soft)',
            }}>
              {msg.role === 'user' ? msg.content : renderMarkdown(msg.content)}
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 10, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.Bot size={14} color="#fff" />
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '18px 18px 18px 4px', padding: '12px 16px', display: 'flex', gap: 6, alignItems: 'center' }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', animation: `pulseGlow 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        {/* Confirmation card */}
        {pendingAction && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
              <Icons.Bot size={14} color="#fff" />
            </div>
            <div style={{ flex: 1, background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.3)', borderRadius: '18px 18px 18px 4px', padding: '14px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>
                {pendingAction.label}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-soft)', lineHeight: 1.6, marginBottom: 12, whiteSpace: 'pre-wrap' }}>
                {pendingAction.preview}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={confirmAction} disabled={executing} className="tap" style={{
                  flex: 1, border: 'none', borderRadius: 12, padding: '10px',
                  background: executing ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  color: '#fff', fontWeight: 700, fontSize: 13, opacity: executing ? 0.5 : 1,
                }}>
                  {executing ? '⟳ En cours...' : '✓ Confirmer'}
                </button>
                <button onClick={cancelAction} disabled={executing} className="tap" style={{
                  border: 'none', borderRadius: 12, padding: '10px 14px',
                  background: 'rgba(255,255,255,0.06)', color: 'var(--text-mute)', fontWeight: 700, fontSize: 13,
                }}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} style={{ height: 140 }} />
      </div>

      {/* Input */}
      <div style={{
        position: 'sticky', bottom: 0,
        padding: '12px 14px calc(12px + env(safe-area-inset-bottom, 0px))',
        background: 'rgba(5,5,5,0.95)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--line)',
      }}>
        {/* Listening indicator */}
        {isListening && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: 8, padding: '8px 12px',
            background: 'rgba(255,107,53,0.1)', borderRadius: 12,
            border: '1px solid rgba(255,107,53,0.3)',
          }}>
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 3, borderRadius: 2,
                  background: 'var(--primary)',
                  animation: `pulseGlow 0.8s ease-in-out ${i * 0.15}s infinite`,
                  height: [10, 16, 10][i],
                }} />
              ))}
            </div>
            <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
              {interimText || 'En écoute... Parle maintenant'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-mute)', marginLeft: 'auto' }}>Tap 🎤 pour arrêter</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder={
              pendingAction ? 'Confirme ou annule d\'abord l\'action ci-dessus'
              : isListening ? 'Parle — le texte apparaît ici...'
              : 'Message ou 🎤 pour dicter ta séance...'
            }
            rows={1}
            disabled={!!pendingAction}
            style={{
              flex: 1,
              background: isListening ? 'rgba(255,107,53,0.06)' : pendingAction ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${isListening ? 'rgba(255,107,53,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 16, color: 'var(--text)',
              padding: '12px 14px', fontSize: 14,
              resize: 'none', outline: 'none',
              fontFamily: 'var(--body)', lineHeight: 1.4,
              maxHeight: 120, overflowY: 'auto',
              opacity: pendingAction ? 0.5 : 1,
              transition: 'border-color 0.2s, background 0.2s',
            }}
          />
          {/* Mic button */}
          <button
            onClick={toggleMic}
            disabled={!!pendingAction || loading}
            className="tap"
            style={{
              width: 46, height: 46, borderRadius: 14, border: 'none', flexShrink: 0,
              background: isListening
                ? 'linear-gradient(135deg, var(--primary), var(--secondary))'
                : 'rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
              opacity: pendingAction || loading ? 0.3 : 1,
              animation: isListening ? 'pulseGlow 1.5s ease-in-out infinite' : 'none',
              transition: 'background 0.2s, opacity 0.2s',
            }}
          >
            {isListening ? <Icons.MicOff size={18} /> : <Icons.Mic size={18} />}
          </button>
          {/* Send button */}
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading || !!pendingAction}
            className="tap" style={{
              width: 46, height: 46, borderRadius: 14, border: 'none', flexShrink: 0,
              background: input.trim() && !loading && !pendingAction ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', opacity: input.trim() && !loading && !pendingAction ? 1 : 0.4,
              transition: 'opacity 0.2s, background 0.2s',
            }}>
            <Icons.Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
