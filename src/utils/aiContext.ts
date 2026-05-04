// Cross-page hand-off: when a user taps "Modify with AI" on a template or
// "Analyze with AI" on a completed session, we stash a small context blob in
// localStorage and navigate to AICoach. The coach reads it on mount and
// pre-composes the conversation.

export interface PendingAIContext {
  kind: 'template' | 'session-analysis' | 'free';
  /** Pre-filled message that AICoach will auto-send on mount */
  initialMessage: string;
  /** Optional payload echoed back into the system prompt for richer context */
  payload?: Record<string, unknown>;
  ts: number;
}

const KEY = 'rezakit_pending_ai_context';

export function setPendingAI(ctx: Omit<PendingAIContext, 'ts'>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...ctx, ts: Date.now() }));
  } catch { /* quota */ }
}

export function consumePendingAI(): PendingAIContext | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    localStorage.removeItem(KEY);
    const parsed = JSON.parse(raw) as PendingAIContext;
    // Older than 2 minutes? Discard — user probably navigated elsewhere first.
    if (Date.now() - parsed.ts > 120_000) return null;
    return parsed;
  } catch {
    return null;
  }
}
