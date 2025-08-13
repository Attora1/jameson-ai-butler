// src/utils/normalizeInput.js
// Lightweight, app-wide input normalizer with learned typo forgiveness.

import { applyLexicon } from '../state/lexicon.js';

export function normalizeInput(text) {
  if (typeof text !== 'string') return { raw: '', normalized: '' };

  const raw = text;

  // Unicode + whitespace cleanup
  let s = text.normalize('NFKC')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  // Apply learned replacements first
  s = applyLexicon(s);

  // Lowercase working copy for intent matching
  let lower = s.toLowerCase();

  // Common typo/alias fixes (static baseline)
  const fixes = [
    [/\btiemr\b/g, 'timer'],
    [/\btimr\b/g, 'timer'],
    [/\bcancle\b/g, 'cancel'],
    [/\bcancl\b/g, 'cancel'],
    [/\bmin(?:ute)?s?\b/g, 'minutes'],
    [/\bsec(?:ond)?s?\b/g, 'seconds'],
    [/\bteh\b/g, 'the'],
    [/\badn\b/g, 'and'],
  ];
  for (const [re, to] of fixes) lower = lower.replace(re, to);

  // Normalize shorthand units like "1m" / "30s"
  lower = lower
    .replace(/\b(\d+)\s*m\b/g, '$1 minutes')
    .replace(/\b(\d+)\s*s\b/g, '$1 seconds');

  return { raw, normalized: lower };
}