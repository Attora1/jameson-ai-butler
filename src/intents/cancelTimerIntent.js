// src/intents/cancelTimerIntent.js
// Returns true if it handled the message (so caller can `return;`), else false.

export async function cancelTimerIntent({ input, settings, setMessages, setInput }) {
  const raw = (input || '').trim();
  if (!raw) return false;

  const lower = raw.toLowerCase();

  // typo forgiveness
  const cleaned = lower
    .replace(/\btiemr\b/g, 'timer')
    .replace(/\btimr\b/g, 'timer')
    .replace(/\bcancle\b/g, 'cancel')
    .replace(/\bcancl\b/g, 'cancel');

  // "cancel/stop/kill/clear all timers"
  const cancelAll = /\b(cancel|stop|end|kill|clear)\b.*\b(all|every)\b.*\btimers?\b/.test(cleaned);

  // "cancel/stop my/the timer" (no specific ID → cancel all active)
  const cancelOneish = /\b(cancel|stop|end|kill|clear)\b.*\b(timer|alarm)\b/.test(cleaned);

  if (!(cancelAll || cancelOneish)) return false;

  try {
    const res = await fetch('/.netlify/functions/cancel-timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: (settings?.userId || 'defaultUser') }),
    });
    const data = await res.json();

    if (res.ok && data.ok) {
      const count = data.count ?? (data.cancelled?.length || 0);
      setMessages(prev => [
        ...prev,
        { isUser: true, text: raw },
        {
          isUser: false,
          text:
            count > 1 ? ` Cancelled ${count} timers.` :
            count === 1 ? ` Timer cancelled.` :
            `No active timers to cancel.`
        }
      ]);
    } else {
      setMessages(prev => [
        ...prev,
        { isUser: true, text: raw },
        { isUser: false, text: `Couldn't cancel the timer (${data?.error || res.status}).` }
      ]);
    }
  } catch (err) {
    console.error('[cancel timer intent] failed:', err);
    setMessages(prev => [
      ...prev,
      { isUser: true, text: raw },
      { isUser: false, text: 'Network hiccup while cancelling.' }
    ]);
  }

  setInput('');
  return true; // handled
}
