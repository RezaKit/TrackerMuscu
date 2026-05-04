// On-demand translation of exercise instructions through the user's own Gemini
// API key. Results are cached in localStorage forever (per exercise + lang)
// so the same exo never costs more than one round-trip.

import { getLang, type Lang } from './i18n';

const CACHE_PREFIX = 'rzk_xtr_'; // exercise translation cache

interface CachedTranslation {
  v: 1;
  steps: string[];
}

function cacheKey(fxId: string, lang: Lang): string {
  return `${CACHE_PREFIX}${lang}_${fxId}`;
}

function readCache(fxId: string, lang: Lang): string[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(fxId, lang));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedTranslation;
    return parsed.steps;
  } catch { return null; }
}

function writeCache(fxId: string, lang: Lang, steps: string[]) {
  try {
    localStorage.setItem(cacheKey(fxId, lang), JSON.stringify({ v: 1, steps }));
  } catch { /* quota — silent */ }
}

const inFlight = new Map<string, Promise<string[] | null>>();

const LANG_NAMES: Record<Lang, string> = {
  fr: 'French',
  en: 'English',
  es: 'Spanish',
};

async function callGeminiTranslate(steps: string[], lang: Lang, apiKey: string): Promise<string[] | null> {
  const target = LANG_NAMES[lang];
  const prompt = `Translate these gym exercise instructions to ${target}. Keep the SAME number of steps. Output ONLY a JSON array of strings, nothing else, no markdown fences. Each translated step should be natural, concise, and use proper fitness terminology.

Steps to translate:
${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 800, responseMimeType: 'application/json' },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  );
  if (!res.ok) return null;

  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return null;
    const out = parsed.filter((s) => typeof s === 'string').map((s) => s.trim());
    if (out.length === 0) return null;
    return out;
  } catch {
    // Sometimes the model wraps in markdown despite responseMimeType
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) return parsed.filter((s) => typeof s === 'string').map((s) => s.trim());
    } catch {}
    return null;
  }
}

/**
 * Main entry point. If the requested language is English, returns the steps
 * unchanged (the source language is English).
 *
 * Otherwise: cache → return; cache miss + apiKey present → call Gemini, cache
 * the result, return; cache miss + no apiKey → return null so the caller can
 * fall back to its own dictionary-based translator.
 */
export async function translateExerciseSteps(
  fxId: string,
  steps: string[],
  apiKey: string | null,
): Promise<string[] | null> {
  const lang = getLang();
  if (lang === 'en') return steps;
  if (!steps.length) return steps;

  const cached = readCache(fxId, lang);
  if (cached && cached.length === steps.length) return cached;

  if (!apiKey) return null;

  const inflightKey = cacheKey(fxId, lang);
  const existing = inFlight.get(inflightKey);
  if (existing) return existing;

  const promise = callGeminiTranslate(steps, lang, apiKey)
    .then((translated) => {
      if (translated && translated.length) {
        writeCache(fxId, lang, translated);
        return translated;
      }
      return null;
    })
    .catch(() => null)
    .finally(() => { inFlight.delete(inflightKey); });

  inFlight.set(inflightKey, promise);
  return promise;
}
