// Template sharing via URL — encodes a workout template into a self-contained
// share link that can be opened on any device. No server round-trip, no DB row.
//
// Format: https://resakit.fr/?share=<base64url(JSON)>
// The decoded JSON is { v: 1, name, type, exerciseNames, from? }.
// `from` is the optional sender display name.

import type { SessionType } from '../types';

export interface SharedTemplate {
  v: 1;
  name: string;
  type: SessionType;
  exerciseNames: Array<{ name: string; muscleGroup: string }>;
  from?: string;
}

function b64urlEncode(s: string): string {
  // btoa needs binary string. encodeURIComponent → percent-escape unicode → unescape to bytes.
  const bytes = unescape(encodeURIComponent(s));
  return btoa(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): string {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  return decodeURIComponent(escape(atob(padded)));
}

export function encodeShareLink(template: { name: string; type: SessionType; exerciseNames: Array<{ name: string; muscleGroup: string }> }, from?: string): string {
  const payload: SharedTemplate = {
    v: 1,
    name: template.name,
    type: template.type,
    exerciseNames: template.exerciseNames,
    from,
  };
  const enc = b64urlEncode(JSON.stringify(payload));
  return `${window.location.origin}/?share=${enc}`;
}

export function decodeShareParam(raw: string): SharedTemplate | null {
  try {
    const obj = JSON.parse(b64urlDecode(raw));
    if (!obj || obj.v !== 1) return null;
    if (typeof obj.name !== 'string') return null;
    if (typeof obj.type !== 'string') return null;
    if (!Array.isArray(obj.exerciseNames)) return null;
    return obj as SharedTemplate;
  } catch {
    return null;
  }
}

/**
 * Read `?share=...` from the current URL and return the decoded template, or null.
 * Does not mutate the URL — call clearShareParam() once the user has resolved
 * the import flow.
 */
export function readShareFromURL(): SharedTemplate | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('share');
    if (!raw) return null;
    return decodeShareParam(raw);
  } catch {
    return null;
  }
}

export function clearShareParam(): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('share');
    window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
  } catch { /* noop */ }
}
