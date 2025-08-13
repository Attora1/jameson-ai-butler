// src/state/lexicon.js
// App-wide typo learning stored locally (per device).
// Learns from corrections like: "*timer", "typo: tiemr -> timer", "tiemr -> timer".

const LS_KEY = 'AELI_LEXICON_v1';

function load() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { /* no-op */ return {}; }
}
function save(obj) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch { /* no-op */ }
}

function normWord(w) {
  return String(w || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Very small Levenshtein for 1–2 edit checks
function lev(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i-1][j] + 1,
        dp[i][j-1] + 1,
        dp[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

// ---------- Public API ----------

// Return a plain object of { misspelling: correction }
export function getLexicon() {
  const data = load();
  return data.map || {};
}

// Apply learned replacements to a string (word-by-word)
export function applyLexicon(text) {
  const map = getLexicon();
  if (!text || !Object.keys(map).length) return text;

  return text.replace(/\b([\p{L}\p{N}\-']{2,})\b/gu, (m, w) => {
    const key = normWord(w);
    const rep = map[key];
    if (!rep) return m;
    // Keep original casing a little: capitalize if original was Capitalized
    if (/^[A-Z]/.test(w)) {
      return rep.charAt(0).toUpperCase() + rep.slice(1);
    }
    return rep;
  });
}

// Remember the last raw user input (to infer corrections like "*timer")
export function noteUserInput(raw) {
  const data = load();
  data.lastRaw = String(raw || '');
  save(data);
}

// Learn from a correction message. Returns { learned:true, from, to } or null.
// Patterns:
//   *timer
//   typo: tiemr -> timer
//   tiemr -> timer
export function learnFromCorrection(raw) {
  const data = load();
  const msg = String(raw || '').trim();

  // Pattern A: "*timer"
  const star = msg.match(/^\*\s*([A-Za-z0-9\-']{2,})\s*$/);
  if (star) {
    const to = normWord(star[1]);
    const from = inferClosestToken(data.lastRaw || '', to);
    if (from && from !== to) {
      addMapping(from, to);
      return { learned: true, from, to };
    }
    return null;
  }

  // Pattern B: "typo: tiemr -> timer"  OR  "tiemr -> timer"
  const arrow = msg.match(/^(?:typo:\s*)?([A-Za-z0-9\-']{2,})\s*->\s*([A-Za-z0-9\-']{2,})$/i);
  if (arrow) {
    const from = normWord(arrow[1]);
    const to = normWord(arrow[2]);
    if (from && to && from !== to) {
      addMapping(from, to);
      return { learned: true, from, to };
    }
  }

  return null;
}

// ---------- internals ----------

function addMapping(fromWord, toWord) {
  const data = load();
  data.map = data.map || {};
  data.map[normWord(fromWord)] = normWord(toWord);
  save(data);
}

function inferClosestToken(prevRaw, target) {
  const tokens = String(prevRaw || '')
    .normalize('NFKC')
    .toLowerCase()
    .match(/\b([a-z0-9\-']{2,})\b/g) || [];
  let best = null, bestD = Infinity;
  for (const t of tokens) {
    const d = lev(normWord(t), normWord(target));
    if (d < bestD) { best = t; bestD = d; }
  }
  return bestD <= 2 ? normWord(best) : null;
}