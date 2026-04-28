export interface CoachMemory {
  summary: string;       // résumé compacté des conversations passées
  lastUpdated: string;   // date ISO
  messageCount: number;  // nb total de messages traités
}

const MEMORY_KEY = 'ai_coach_memory';
const HISTORY_KEY = 'ai_chat_history';
const COMPACT_THRESHOLD = 30; // compact quand > N messages
const KEEP_RECENT = 20;       // garder les N derniers après compaction

export function loadMemory(): CoachMemory | null {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveMemory(memory: CoachMemory): void {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  } catch { /* quota */ }
}

export function clearMemory(): void {
  localStorage.removeItem(MEMORY_KEY);
  localStorage.removeItem(HISTORY_KEY);
}

export function shouldCompact(messages: { role: string; content: string }[]): boolean {
  return messages.length > COMPACT_THRESHOLD;
}

export function splitForCompaction(messages: { role: string; content: string }[]) {
  const toCompact = messages.slice(0, -KEEP_RECENT);
  const toKeep = messages.slice(-KEEP_RECENT);
  return { toCompact, toKeep };
}

export async function compactHistory(
  messagesToCompact: { role: string; content: string }[],
  existingMemory: CoachMemory | null,
  apiKey: string,
  currentMessageCount: number
): Promise<CoachMemory | null> {
  const previousSummary = existingMemory?.summary
    ? `Résumé précédent:\n${existingMemory.summary}\n\n`
    : '';

  const historyText = messagesToCompact
    .map((m) => `${m.role === 'user' ? 'Utilisateur' : 'Coach'}: ${m.content}`)
    .join('\n');

  const prompt = `${previousSummary}Nouvelle conversation à résumer:\n${historyText}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          systemInstruction: {
            parts: [{
              text: `Tu es un assistant qui résume des historiques de coaching sportif.
Génère un résumé compact et utile en français (max 400 mots) qui capture:
- Les objectifs et motivations mentionnés
- Les blessures, douleurs ou limitations notées
- Les conseils importants déjà donnés (évite de les répéter)
- La progression observée (technique, poids, endurance)
- Les préférences et habitudes de l'utilisateur
- Les points forts et axes d'amélioration identifiés
Ce résumé servira de mémoire long-terme pour le coach IA dans les futures sessions.`,
            }],
          },
          generationConfig: { maxOutputTokens: 600 },
        }),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!summary) return null;

    return {
      summary,
      lastUpdated: new Date().toISOString(),
      messageCount: currentMessageCount,
    };
  } catch { return null; }
}
