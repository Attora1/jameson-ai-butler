// src/intents/mealMedIntent.js
// Logs "I ate" / "had dinner" / "took meds" into /wellness (sets timestamps to now).
// Returns true if handled so caller can `return;`.

import { normalizeInput } from '../utils/normalizeInput.js';

export async function mealMedIntent({ input, settings, setMessages, setInput }) {
  const raw = (input || '').trim();
  if (!raw) return false;

  const { normalized: s } = normalizeInput(raw);
  const userId = settings?.userId || 'defaultUser';

  // Very forgiving meal phrases
  const mealHit =
    /\b(i\s+)?(just\s+)?(ate|had\s+(breakfast|lunch|dinner|a\s+snack|food)|grabbed\s+(food|a\s+bite))\b/.test(s);

  // Very forgiving medication phrases
  const medHit =
    /\b(i\s+)?(just\s+)?(took|had)\s+(my\s+)?(meds?|medicine|medication|pill[s]?|dose)\b/.test(s);

  if (!mealHit && !medHit) return false;

  // Build one payload; if both match, we log both in a single call.
  const payload = { userId };
  if (mealHit) payload.last_meal = true;
  if (medHit)  payload.last_med  = true;

  try {
    const res = await fetch('/.netlify/functions/wellness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (res.ok && data?.ok) {
      const parts = [];
      if (mealHit) parts.push('meal');
      if (medHit)  parts.push('meds');
      const what = parts.length === 2 ? 'meal + meds' : parts[0];

      setMessages(prev => [
        ...prev,
        { isUser: true, text: raw },
        { isUser: false, text: `Logged ${what} just now.` }
      ]);
    } else {
      setMessages(prev => [
        ...prev,
        { isUser: true, text: raw },
        { isUser: false, text: `Couldn't update wellness (${data?.error || res.status}).` }
      ]);
    }
  } catch (err) {
    console.error('[mealMedIntent] failed:', err);
    setMessages(prev => [
      ...prev,
      { isUser: true, text: raw },
      { isUser: false, text: 'Network hiccup updating wellness.' }
    ]);
  }

  setInput('');
  return true;
}