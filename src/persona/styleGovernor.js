// src/persona/styleGovernor.js
// Minimizes name overuse without adding canned text.
// It only *removes/cleans* text; never invents phrasing.

function cleanSpaces(s) {
  return s
    .replace(/\s+([,!?;:.])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[;,:\-\s]+/, '')
    .trim();
}

export function styleGovernor(text, ctx = {}) {
  if (typeof text !== 'string' || !text.trim()) return text;

  const name = (ctx.userName || '').trim();
  if (!name) return cleanSpaces(text);

  let out = text;

  // 1) Strip greeting forms like "Nessa," at the start.
  const startName = new RegExp(`^\s*(?:hey|hi|hello|alright|okay|ok|right)?[,\s-]*\b${name}\b[:,\s-]*`, 'i');
  out = out.replace(startName, (m) => m.replace(new RegExp(`\b${name}\b[:,]?\s*`, 'i'), ''));

  // 2) Limit to at most one name mention if it’s essential; otherwise remove.
  const nameRe = new RegExp(`\b${name}\b[:,]?`, 'gi');
  let count = 0;
  out = out.replace(nameRe, () => (++count > 1 ? '' : '')); // usually zero is best for chat cadence

  // 3) If the last few AI messages already used the name, remove this one too.
  const recent = (ctx.recentAiTexts || []).slice(-5).join(' ').toLowerCase();
  if (recent.includes(name.toLowerCase())) {
    out = out.replace(nameRe, '');
  }

  return cleanSpaces(out);
}
