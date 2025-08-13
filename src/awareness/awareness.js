// src/awareness/awareness.js
// Tiny, local awareness snapshot (no network).
// Reads time context + last input and returns booleans AELI (or the server) can use.
// We don't generate phrases here; we just label what's true.

import { getTimeSnapshot } from '../state/timeContext.js';
import { normalizeInput } from '../utils/normalizeInput.js';

const LS_KEY = 'AELI_AWARE_FLAGS_v1';

// simple local cache to rate-limit repeating the same nudge
function loadFlags() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}
function saveFlags(obj) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch {}
}

function hoursLocal() {
  const d = new Date();
  return d.getHours(); // 0–23 in user’s locale
}

function longSessionMs(snap) {
  // consider "long" if session > 45 min
  return (snap?.uptimeMs || 0) >= 45 * 60 * 1000;
}

function parseIntent(text) {
  const norm = normalizeInput(text || '').normalized;
  return {
    saysNotSleepy: /\b(can'?t\s+sleep|not\s+sleepy|wired|mind\s+racing|too\s+awake)\b/.test(norm),
    asksWindDown:  /\b(wind\s*down|help\s+me\s+sleep|relax\s+me)\b/.test(norm),
    asksFocus:     /\b(start\s+focus|focus\s+(timer|mode)|deep\s+work)\b/.test(norm),
  };
}

/**
 * Build a lightweight awareness snapshot.
 * @param {object} opts
 * @param {string} opts.userId
 * @param {string} opts.lastInput
 * @returns {{
 *   clock: string,
 *   isLateNight: boolean,
 *   sessionLong: boolean,
 *   saysNotSleepy: boolean,
 *   asksWindDown: boolean,
 *   asksFocus: boolean,
 *   sinceLastUser: string|null,
 *   sinceLastAeli: string|null
 * }}
 */
export function getAwareness({ userId = 'defaultUser', lastInput = '' } = {}) {
  const snap = getTimeSnapshot(userId);
  const intents = parseIntent(lastInput);
  const h = hoursLocal();

  const isLateNight = (h >= 23 || h < 6);          // 11pm–6am
  const sessionLong = longSessionMs(snap);

  return {
    clock: snap?.human?.clock || '',
    isLateNight,
    sessionLong,
    saysNotSleepy: intents.saysNotSleepy,
    asksWindDown: intents.asksWindDown,
    asksFocus: intents.asksFocus,
    sinceLastUser: snap?.human?.sinceLastUser || null,
    sinceLastAeli: snap?.human?.sinceLastAeli || null,
  };
}

/**
 * Basic rate-limit so we don't repeat the same nudge too often.
 * Returns true if the key is allowed now, and records the time.
 */
export function allowNudge(key, minMinutes = 30) {
  const flags = loadFlags();
  const now = Date.now();
  const last = flags[key] || 0;
  if (now - last < minMinutes * 60 * 1000) return false;
  flags[key] = now;
  saveFlags(flags);
  return true;
}