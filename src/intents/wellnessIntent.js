// src/intents/wellnessIntent.js
// Lets AELI understand: "spoons 4", "set spoons to 7", "energy is 3",
// and "how are my spoons?" / "spoons?" to query current value.

import { normalizeInput } from '../utils/normalizeInput.js';

function wordsToNumber(s) {
  if (!s) return NaN;
  const text = s.replace(/-/g, ' ').trim().toLowerCase();
  if (/^\d+$/.test(text)) return parseInt(text, 10);
  const small = {
    zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9,
    ten:10, eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15, sixteen:16,
    seventeen:17, eighteen:18, nineteen:19
  };
  const tens = { twenty:20, thirty:30, forty:40, fifty:50 };
  if (small[text] != null) return small[text];
  if (tens[text] != null) return tens[text];
  // allow "twenty five"
  const parts = text.split(/\s+/);
  if (tens[parts[0]] != null && small[parts[1]] != null) return tens[parts[0]] + small[parts[1]];
  return NaN;
}

export async function wellnessIntent({ input, settings, setMessages, setInput }) {
  const raw = (input || '').trim();
  if (!raw) return false;

  const { normalized: norm } = normalizeInput(raw);

  // SET: "spoons 4", "set spoons to 4", "energy is 3", "spoons = 6"
  const setMatch =
    norm.match(/\b(?:set\s+)?(?:my\s+)?(?:spoons|energy)\s*(?:is|are|to|=)?\s*([a-z0-9\- ]{1,20})\b/);

  // ASK: "spoons?", "energy?", "how are my spoons", "what's my energy"
  const askMatch =
    /\b(?:spoons|energy)\b\??$|\bhow (?:are|r)\s+(?:my\s+)?(?:spoons|energy)\b|\bwhat'?s\s+my\s+(?:spoons|energy)\b/.test(norm);

  const userId = settings?.userId || 'defaultUser';

  if (setMatch) {
    const amtStr = setMatch[1].trim();
    let spoons = wordsToNumber(amtStr);
    if (!Number.isFinite(spoons)) return false; // not our intent after all
    spoons = Math.max(0, Math.min(10, Math.round(spoons)));

    try {
      const res = await fetch('/.netlify/functions/wellness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, spoons })
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        try {
          localStorage.setItem('AELI_SPOONS', String(spoons));
          window.dispatchEvent(new CustomEvent('aeli:spoons', { detail: { spoons } }));
        } catch {}
        setMessages(prev => [
          ...prev,
          { isUser: true, text: raw },
          { isUser: false, text: `Spoons set to ${spoons}/10.` }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { isUser: true, text: raw },
          { isUser: false, text: `Couldn't update spoons (${data?.error || res.status}).` }
        ]);
      }
    } catch (err) {
      console.error('[wellness set] failed:', err);
      setMessages(prev => [
        ...prev,
        { isUser: true, text: raw },
        { isUser: false, text: 'Network hiccup updating spoons.' }
      ]);
    }

    setInput('');
    return true;
  }

  if (askMatch) {
    try {
      const res = await fetch(`/.netlify/functions/wellness?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (res.ok && data?.ok) {
        const s = data.state?.spoons;
        const mood = data.state?.mood;
        if (Number.isFinite(s)) {
          try {
            localStorage.setItem('AELI_SPOONS', String(s));
            window.dispatchEvent(new CustomEvent('aeli:spoons', { detail: { spoons: s } }));
          } catch {}
        }
        const parts = [];
        parts.push(`Spoons: ${Number.isFinite(s) ? `${s}/10` : '—'}.`);
        if (mood) parts.push(`Mood: ${mood}.`);
        setMessages(prev => [
          ...prev,
          { isUser: true, text: raw },
          { isUser: false, text: parts.join(' ') }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { isUser: true, text: raw },
          { isUser: false, text: `Couldn't read wellness (${data?.error || res.status}).` }
        ]);
      }
    } catch (err) {
      console.error('[wellness read] failed:', err);
      setMessages(prev => [
        ...prev,
        { isUser: true, text: raw },
        { isUser: false, text: 'Network hiccup reading wellness.' }
      ]);
    }

    setInput('');
    return true;
  }

  return false; // not handled
}