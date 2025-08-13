// src/persona/styleGovernor.js
// Minimizes name overuse and applies user style prefs.
// It only edits/removes; it never invents new phrasing.

import { getPrefs } from '../state/prefs.js';

function cleanSpaces(s) {
  return String(s || '')
    .replace(/\s+([,!?;:.])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[,;:\-\s]+/, '')
    .trim();
}

function clipByBrevity(s, brevity = 'normal') {
  const limits = { short: 220, normal: 480, long: 900 };
  const max = limits[brevity] ?? limits.normal;
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}

// Very broad emoji matcher (works in modern browsers)
// Fallback-safe: if Unicode props unsupported, we also match surrogate pairs.
let EMOJI_RE;
try {
  EMOJI_RE = new RegExp('\\p{Extended_Pictographic}', 'gu');
} catch {
  EMOJI_RE = /[\u231A-\u231B\u23E9-\u23EC\u23F0\u23F3\u2600-\u27BF\u2B50\u2934-\u2935\u3030\u3297\u3299\uD83C-\uDBFF][\uDC00-\uDFFF]?/g;
}

function controlEmoji(s, level = 'sparingly') {
  if (level === 'free') return s;
  if (level === 'none') return s.replace(EMOJI_RE, '');
  // sparingly: keep up to two emojis, drop the rest
  let count = 0;
  return s.replace(EMOJI_RE, (m) => (++count <= 2 ? m : ''));
}

function stripOrLimitName(s, name, useName, recentAiTexts = []) {
  if (!name) return s;

  let out = s;

  // Strip greeting forms like "Nessa," at the start
  const startName = new RegExp(
    `^\\s*(?:hey|hi|hello|alright|okay|ok|right)?[,\\s-]*\\b${name}\\b[:,\\s-]*`,
    'i'
  );
  out = out.replace(startName, (m) =>
    m.replace(new RegExp(`\\b${name}\\b[:,]?\\s*`, 'i'), '')
  );

  const nameRe = new RegExp(`\\b${name}\\b[:,]?`, 'gi');

  // If prefs say "don't use my name", remove all mentions.
  if (useName === false) {
    out = out.replace(nameRe, '');
    return out;
  }

  // If prefs allow name, still avoid spam: at most once, and not if recently used.
  const recent = (recentAiTexts || []).slice(-5).join(' ').toLowerCase();
  const usedRecently = recent.includes(String(name).toLowerCase());
  if (usedRecently) {
    out = out.replace(nameRe, '');
    return out;
  }

  // Keep at most one mention; drop extras
  let seen = 0;
  out = out.replace(nameRe, () => (++seen > 1 ? '' : ''));
  return out;
}

export function styleGovernor(text, ctx = {}) {
  if (typeof text !== 'string' || !text.trim()) return text;

  const prefs = { ...getPrefs(), ...(ctx.prefs || {}) };
  const name = (ctx.userName || '').trim();

  let out = cleanSpaces(text);

  // Name handling (guided by prefs.useName)
  out = stripOrLimitName(out, name, prefs.useName, ctx.recentAiTexts);

  // Emoji handling (prefs.emoji: 'none' | 'sparingly' | 'free')
  out = controlEmoji(out, prefs.emoji);

  // Brevity handling (prefs.brevity: 'short' | 'normal' | 'long')
  out = clipByBrevity(out, prefs.brevity);

  return cleanSpaces(out);
}