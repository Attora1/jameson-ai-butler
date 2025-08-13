// src/state/prefs.js
// Learns simple style prefs from your messages (local, per device).
// Examples it understands:
//   "don't use my name", "use my name"
//   "keep replies short", "normal replies", "longer replies"
//   "no emoji", "emoji ok", "more emoji"

import { normalizeInput } from '../utils/normalizeInput.js';

const LS_KEY = 'AELI_PREFS_v1';

const DEFAULTS = {
  useName: false,        // false = avoid using user's name unless necessary
  brevity: 'normal',     // 'short' | 'normal' | 'long'
  emoji: 'sparingly',    // 'none' | 'sparingly' | 'free'
};

function load() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
  catch { return {}; }
}
function save(obj) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch {}
}

export function getPrefs() {
  return { ...DEFAULTS, ...load() };
}

export function setPrefs(partial) {
  const next = { ...getPrefs(), ...partial };
  save(next);
  return next;
}

/**
 * Parse a single user input for preference instructions and persist them.
 * Returns { updated: boolean, prefs, changed }.
 */
export function learnPrefsFromInput(input, userName) {
  const { normalized: s } = normalizeInput(input || '');
  let changed = {};

  // Name usage
  if (/(don't|do not|stop)\s+(using|say(ing)?)?\s+(my\s+)?name\b/.test(s) ||
      /(no\s+names?|use\s+less\s+names?)\b/.test(s)) {
    changed.useName = false;
  }
  if (/(use|say)\s+(my\s+)?name\b/.test(s)) {
    changed.useName = true;
  }
  if (userName) {
    const re = new RegExp(`\b(don't|do not|stop)\s+(call|address)\s+me\s+${userName}\b`, 'i');
    if (re.test(input)) changed.useName = false;
  }

  // Brevity
  if (/(keep|be)\s+(it\s+)?(short|brief|concise)\b/.test(s) || /\bshort(er)?\s+repl(ies|y)\b/.test(s)) {
    changed.brevity = 'short';
  }
  if (/(normal|default)\s+(length|repl(ies|y))\b/.test(s) || /\bbe\s+normal\b/.test(s)) {
    changed.brevity = 'normal';
  }
  if (/(long(er)?|more\s+detail)\b/.test(s) && /\brepl(ies|y)\b/.test(s)) {
    changed.brevity = 'long';
  }

  // Emoji
  if (/(no|avoid|stop)\s+emoji\b/.test(s) || /emoji\s*(off|none)\b/.test(s)) {
    changed.emoji = 'none';
  }
  if (/(use|allow)\s+emoji\b/.test(s) || /emoji\s*(ok|okay|on|sparingly)\b/.test(s)) {
    changed.emoji = 'sparingly';
  }
  if (/more\s+emoji\b/.test(s) || /emoji\s*free\b/.test(s)) {
    changed.emoji = 'free';
  }

  if (Object.keys(changed).length) {
    return { updated: true, prefs: setPrefs(changed), changed };
  }
  return { updated: false, prefs: getPrefs(), changed: {} };
}
