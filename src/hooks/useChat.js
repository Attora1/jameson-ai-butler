import { useState, useEffect, useCallback } from 'react';
import { cancelTimerIntent } from '../intents/cancelTimerIntent.js';
import { normalizeInput } from '../utils/normalizeInput.js';
import { styleGovernor } from '../persona/styleGovernor.js';
import { initTimeContext, markUserMessage, markAeliMessage, getTimeSnapshot } from '../state/timeContext.js';
import { noteUserInput, learnFromCorrection } from '../state/lexicon.js';
import { learnPrefsFromInput } from '../state/prefs.js';
import { getAwareness } from '../awareness/awareness.js';

export function useChat(
  settings,
  setSettings,
  facts,
  addFact,
  spoonCount,
  poweredDown,
  setPoweredDown,
  startupPhrasesParam
) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [skipNextResponse, setSkipNextResponse] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [moodMetrics, setMoodMetrics] = useState({
    shortMessageCount: 0,
    lastFrustrationCheck: Date.now(),
  });

  // ---- Load chat history (if function exists) ----
  useEffect(() => {
    async function fetchChatHistory() {
      try {
        const userId = settings?.userId || 'defaultUser';
        const response = await fetch(`/api/chat-history?userId=${encodeURIComponent(userId)}`);
        const data = await response.json().catch(() => ({}));
        const history = Array.isArray(data?.history)
          ? data.history
          : (Array.isArray(data) ? data : []);
        if (response.ok && history) setMessages(history);
      } catch (err) {
        console.warn('[chat-history] skip:', err?.message || err);
      }
    }
    fetchChatHistory();
  }, [settings?.userId]);

  // ---- Initialize time context ----
  useEffect(() => {
    initTimeContext(settings?.userId || 'defaultUser');
  }, [settings?.userId]);

  // ---- Persist locally (lightweight) ----
  useEffect(() => {
    try {
      localStorage.setItem('AELI_CHAT_HISTORY', JSON.stringify(messages));
    } catch { /* no-op */ }
  }, [messages]);

  // ---- Submit handler ----
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!input.trim() || isResponding) return;

    // learn style prefs silently from this message (e.g., "don't use my name", "no emoji")
    learnPrefsFromInput(input, settings?.name);

    markUserMessage(settings?.userId || 'defaultUser');

    // learn from correction messages like "*timer" or "tiemr -> timer"
    const learned = learnFromCorrection(input);
    if (learned) { setInput(''); return; } // silent; no hardcoded reply

    // remember this raw input so a following "*word" can reference it
    noteUserInput(input);

    // now normalize for intent matching
    const norm = normalizeInput(input).normalized;

    // 🛑 CANCEL TIMER (helper) — runs before anything goes to the model
    if (await cancelTimerIntent({ input, settings, setMessages, setInput })) return;

    //  VERSION / UPDATE INTENT (e.g., "version?", "update?", "what build am I on")
    {
      const asksVersion = /\b(version|build|release|update|out[-\s]?of[-\s]?date|what'?s\s+(the\s+)?version)\b/i.test(norm);
      if (asksVersion) {
        try {
          const [uiRes, fnRes] = await Promise.all([
            fetch('/build.json', { cache: 'no-store' }),
            fetch('/.netlify/functions/release-info', { cache: 'no-store' })
          ]);

          const ui = await uiRes.json().catch(() => ({}));
          const fn = await fnRes.json().catch(() => ({}));

          const uiVer    = ui.appVersion || 'n/a';
          const uiTime   = ui.buildTime || null;
          const uiCommit = ui.commit || null;

          const fnVer    = fn.build?.appVersion || 'n/a';
          const fnTime   = fn.build?.buildTime || fn.runtime?.now || null;
          const fnCommit = fn.netlify?.commit || null;

          const mismatch =
            (uiVer && fnVer && uiVer !== fnVer) ||
            (uiCommit && fnCommit && uiCommit !== fnCommit);

          const parts = [];
          parts.push(`UI v${uiVer}${uiTime ? ` · ${uiTime}` : ''}${uiCommit ? ` · ${uiCommit.slice(0,7)}` : ''}`);
          parts.push(`Functions v${fnVer}${fnTime ? ` · ${fnTime}` : ''}${fnCommit ? ` · ${fnCommit.slice(0,7)}` : ''}`);
          parts.push(mismatch ? '⚠️ UI and Functions differ' : '✅ UI and Functions appear in sync');

          setMessages(prev => [
            ...prev,
            { isUser: true, text: input.trim() },
            { isUser: false, text: parts.join(' · ') }
          ]);
        } catch (err) {
          console.error('[version/update intent] failed:', err);
          setMessages(prev => [
            ...prev,
            { isUser: true, text: input.trim() },
            { isUser: false, text: 'Update check failed.' }
          ]);
        }

        setInput('');
        return; // ✅ don’t send to the model
      }
    }

    //  SYSTEM STATUS INTENT (e.g., "status?", "systems?", "health check", "what's working")
    {
      const askStatus = /\b(system\s*status|systems?\??|status\??|health|diagnostics?|what'?s\s+(working|broken))\b/i.test(norm);
      if (askStatus) {
        try {
          const res = await fetch('/.netlify/functions/system-status');
          const data = await res.json();

          if (res.ok && data) {
            const lines = [];

            // Supabase reachability
            const sb = data.supabase;
            lines.push(`Supabase: ${sb?.reachable ? 'reachable' : 'unreachable'} (${sb?.using || 'unknown'} key)`);

            // Timers table summary
            const t = data.db?.timers;
            if (t) {
              const c = t.counts || {};
              lines.push(`Timers: ${t.columnsOk ? 'schema OK' : 'schema issue'} · active ${c.active ?? '—'} · expired ${c.expired ?? '—'} · cancelled ${c.cancelled ?? '—'}`);
            }

            // Wellness table summary
            const w = data.db?.wellness;
            if (w) {
              lines.push(`Wellness: ${w.columnsOk ? 'schema OK' : 'schema issue'} · rows ${w.count ?? '—'}`);
            }

            // Top suggestions (at most 2 to keep it short)
            const sugg = Array.isArray(data.suggestions) ? data.suggestions.slice(0, 2) : [];
            if (sugg.length) lines.push(`Suggestions: ${sugg.join(' | ')}`);

            setMessages(prev => [
              ...prev,
              { isUser: true, text: input.trim() },
              { isUser: false, text: lines.join(' · ') }
            ]);
          } else {
            setMessages(prev => [
              ...prev,
              { isUser: true, text: input.trim() },
              { isUser: false, text: `Status check failed (${res.status}).` }
            ]);
          }
        } catch (err) {
          console.error('[system-status intent] failed:', err);
          setMessages(prev => [
            ...prev,
            { isUser: true, text: input.trim() },
            { isUser: false, text: 'Couldn’t reach the status endpoint.' }
          ]);
        }

        setInput('');
        return; // ✅ don’t send to the model
      }
    }

    //  TIME AWARENESS INTENT (clock / uptime / last activity)
    {
      const askClock =
        /\b(what('?s)? the time|what time is it|current time|time now)\b/i.test(norm);
      const askUptime =
        /\b(how long (have we been|has it been)|how long have we been at (this|it))\b/i.test(norm);
      const askSinceUser =
        /\b(when did you last hear from me|when was my last message|since last user|last user message)\b/i.test(norm);
      const askSinceAeli =
        /\b(when was your last message|since last aeli|since you last spoke|your last reply)\b/i.test(norm);

      if (askClock || askUptime || askSinceUser || askSinceAeli) {
        const snap = getTimeSnapshot(settings?.userId || 'defaultUser');

        const lines = [];
        if (askClock) lines.push(`Time: ${snap.human.clock}`);
        if (askUptime) lines.push(`Session: ${snap.human.uptime || '—'}`);
        if (askSinceUser) lines.push(`Since you: ${snap.human.sinceLastUser || '—'}`);
        if (askSinceAeli) lines.push(`Since me: ${snap.human.sinceLastAeli || '—'}`);

        // If the ask was vague (e.g., “time?”), provide a compact summary.
        if (lines.length === 0) {
          lines.push(`Time: ${snap.human.clock}`);
          lines.push(`Session: ${snap.human.uptime || '—'}`);
          if (snap.human.sinceLastUser) lines.push(`Since you: ${snap.human.sinceLastUser}`);
        }

        setMessages(prev => [
          ...prev,
          { isUser: true, text: input.trim() },
          { isUser: false, text: lines.join(' · ') }
        ]);
        setInput('');
        markAeliMessage(settings?.userId || 'defaultUser');
        return;
      }
    }

    // ⏱️ SET TIMER INTENT (digits or words; typo-friendly via normalizeInput)
    {
      // Matches: "set/start/make ... <amount> <minutes/seconds> [timer]"
      // Supports 1m/30s via normalizeInput (we normalized 1m→1 minutes, 30s→30 seconds).
      const match = norm.match(
        /(?:^|\b)(?:can you|could you|would you|please|pls)?\s*(?:set|start|create|begin|make)\s+(?:a\s+)?(\d+)\s*(minutes?|m|seconds?|s)\s*(?:timer)?\b/
      );
      if (match) {
        const raw = input.trim();
        const amount = parseInt(match[1], 10);
        const unit = match[2];
        const seconds = /^m/.test(unit) ? amount * 60 : amount;

        try {
          const res = await fetch('/.netlify/functions/create-timer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: (settings?.userId || 'defaultUser'),
              seconds
            }),
          });
          const data = await res.json();

          if (res.ok && (data.ok || data.result)) {
            setMessages(prev => [
              ...prev,
              { isUser: true, text: raw },
              {
                isUser: false,
                text: styleGovernor(`⏱️ Timer set for ${amount} ${/^m/.test(unit) ? 'minute' : 'second'}${amount !== 1 ? 's' : ''}.`, { userName: settings?.name || 'Nessa', recentAiTexts: prev.filter(m => !m.isUser).map(m => m.text) })
              }
            ]);
            markAeliMessage(settings?.userId || 'defaultUser');
          } else {
            setMessages(prev => [
              ...prev,
              { isUser: true, text: raw },
              { isUser: false, text: styleGovernor(`Sorry, I couldn’t set that timer (${data?.error || res.status}).`, { userName: settings?.name || 'Nessa', recentAiTexts: prev.filter(m => !m.isUser).map(m => m.text) }) }
            ]);
            markAeliMessage(settings?.userId || 'defaultUser');
          }
        } catch (err) {
          console.error('[timer intent] create failed:', err);
          setMessages(prev => [
            ...prev,
            { isUser: true, text: raw },
            { isUser: false, text: styleGovernor('Timer hiccup—network error.', { userName: settings?.name || 'Nessa', recentAiTexts: prev.filter(m => !m.isUser).map(m => m.text) }) }
          ]);
          markAeliMessage(settings?.userId || 'defaultUser');
        }

        setInput('');
        return; // ✅ don’t send this prompt to the model
      }
    }

    // ⏱️ "TIME LEFT?" / "HOW LONG HAS IT BEEN?"
    {
      const askTimeLeft = /^(how (much )?time (is )?left( on (my|the) timer)?\??|time left\??|how long has it been\??)$/i;
      if (askTimeLeft.test(norm)) {
        try {
          const res = await fetch(`/.netlify/functions/time-left?userId=${encodeURIComponent(settings?.userId || 'defaultUser')}`);
          const data = await res.json();

          if (res.ok && data && (data.remainingSeconds != null)) {
            const remaining = data.humanRemaining || `${data.remainingSeconds}s`;
            const elapsed   = data.humanElapsed   || (data.elapsedSeconds != null ? `${data.elapsedSeconds}s` : null);
            const parts = [`⏱️ Time left: ${remaining}.`];
            if (elapsed != null) parts.push(`Elapsed: ${elapsed}.`);
            setMessages(prev => [
              ...prev,
              { isUser: true, text: input.trim() },
              { isUser: false, text: styleGovernor(parts.join(' '), { userName: settings?.name || 'Nessa', recentAiTexts: prev.filter(m => !m.isUser).map(m => m.text) }) }
            ]);
            markAeliMessage(settings?.userId || 'defaultUser');
          } else if (data?.error === 'NO_ACTIVE_TIMERS' || res.status === 404) {
            setMessages(prev => [
              ...prev,
              { isUser: true, text: input.trim() },
              { isUser: false, text: styleGovernor('No active timers at the moment.', { userName: settings?.name || 'Nessa', recentAiTexts: prev.filter(m => !m.isUser).map(m => m.text) }) }
            ]);
            markAeliMessage(settings?.userId || 'defaultUser');
          } else {
            setMessages(prev => [
              ...prev,
              { isUser: true, text: input.trim() },
              { isUser: false, text: styleGovernor(`Hmm—couldn’t fetch time left (${data?.error || res.status}).`, { userName: settings?.name || 'Nessa', recentAiTexts: prev.filter(m => !m.isUser).map(m => m.text) }) }
            ]);
            markAeliMessage(settings?.userId || 'defaultUser');
          }
        } catch (err) {
          console.error('[time-left intent] failed:', err);
          setMessages(prev => [
            ...prev,
            { isUser: true, text: input.trim() },
            { isUser: false, text: styleGovernor('Network blip. Try again in a sec.', { userName: settings?.name || 'Nessa', recentAiTexts: prev.filter(m => !m.isUser).map(m => m.text) }) }
          ]);
          markAeliMessage(settings?.userId || 'defaultUser');
        }

        setInput('');
        return; // ✅ don’t send to the model
      }
    }

    // ---- Power state phrases ----
    const defaultStartupPhrases = ["wake up", "power up", "turn on"];
    const startupPhrases = Array.isArray(startupPhrasesParam) && startupPhrasesParam.length
      ? startupPhrasesParam
      : defaultStartupPhrases;
    const shutdownPhrases = ["power down", "shut down", "go to sleep", "power off"];
    const lowerCaseInput = norm;

    if (poweredDown) {
      if (startupPhrases.includes(lowerCaseInput)) {
        setMessages(prev => [...prev, { text: styleGovernor("🟢 Power restored. AELI is back online.", { userName: settings?.name || 'Nessa', recentAiTexts: messages.filter(m => !m.isUser).map(m => m.text) }), isUser: false }]);
        markAeliMessage(settings?.userId || 'defaultUser');
        fetch('/.netlify/functions/power/wake', { method: 'POST' }).catch(() => {});
        setPoweredDown(false);
      } else {
        setMessages(prev => [...prev, { text: styleGovernor("🔇 AELI is currently powered down. Say 'wake up' to reactivate.", { userName: settings?.name || 'Nessa', recentAiTexts: messages.filter(m => !m.isUser).map(m => m.text) }), isUser: false }]);
        markAeliMessage(settings?.userId || 'defaultUser');
      }
      setInput('');
      return;
    }

    if (shutdownPhrases.includes(lowerCaseInput)) {
      setMessages(prev => [...prev, { text: styleGovernor("🔌 Powering down. AELI will go quiet now.", { userName: settings?.name || 'Nessa', recentAiTexts: messages.filter(m => !m.isUser).map(m => m.text) }), isUser: false }]);
      markAeliMessage(settings?.userId || 'defaultUser');
      fetch('/.netlify/functions/power/sleep', { method: 'POST' }).catch(() => {});
      setPoweredDown(true);
      setInput('');
      return;
    }

    // ---- Light memory hook ----
    const conversationEnders = [
      "ok", "okay", "perfect", "great", "thanks", "thank you", "got it", "understood",
      "alright", "cool", "yep", "yup", "done", "finished", "that's all", "nothing else",
      "carry on", "goodbye", "bye", "see ya", "later"
    ];

    const rememberMatch = input.match(/remember (that )?(.*)/i);
    if (rememberMatch && rememberMatch[2]) {
      addFact(rememberMatch[2]);
    }

    setMessages(prev => [...prev, { text: input, isUser: true }]);
    setInput('');

    if (conversationEnders.includes(lowerCaseInput)) {
      setSkipNextResponse(true);
      return;
    }
    if (skipNextResponse) {
      setSkipNextResponse(false);
      return;
    }

    // ---- Call the chat function ----
    setIsResponding(true);
    try {
      const awareness = getAwareness({
        userId: settings?.userId || 'defaultUser',
        lastInput: input
      });
      const response = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
          userId: settings?.userId || 'defaultUser',
          awareness,                                // ⬅️ add this
          settings: {
            tone: settings?.tone,
            humorLevel: settings?.humorLevel,
            voiceGender: settings?.voiceGender,
            voiceAccent: settings?.voiceAccent,
          }
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessages(prev => [...prev, { text: styleGovernor("♦cough♦ Technical difficulties, friend.", { userName: settings?.name || 'Nessa', recentAiTexts: prev.filter(m => !m.isUser).map(m => m.text) }), isUser: false }]);
        markAeliMessage(settings?.userId || 'defaultUser');
        return;
      }

      const aiText =
        (typeof data.reply === 'string' && data.reply.trim()) ||
        (typeof data.replyText === 'string' && data.replyText.trim()) ||
        (typeof data.message === 'string' && data.message.trim()) ||
        (typeof data.text === 'string' && data.text.trim()) ||
        (Array.isArray(data.choices) && data.choices[0]?.message?.content?.trim()) ||
        "";

      if (aiText) {
        setMessages(prev => [...prev, { text: styleGovernor(aiText, { userName: settings?.name || 'Nessa', recentAiTexts: prev.filter(m => !m.isUser).map(m => m.text) }), isUser: false }]);
      }
      markAeliMessage(settings?.userId || 'defaultUser');

      // Minimal action handling (mode switch only to avoid undefined imports)
      const action = data.action;
      if (action?.type === 'switchMode' && typeof action.payload === 'string') {
        setSettings(prev => ({ ...prev, mode: action.payload }));
      }

    } catch (error) {
      console.error('[AELI Chat Error]', error);
      setMessages(prev => [...prev, { text: styleGovernor("♦cough♦ Technical difficulties, madam.", { userName: settings?.name || 'Nessa', recentAiTexts: prev.filter(m => !m.isUser).map(m => m.text) }), isUser: false }]);
      markAeliMessage(settings?.userId || 'defaultUser');
    } finally {
      setIsResponding(false);
      setMoodMetrics({
        shortMessageCount: 0,
        lastFrustrationCheck: Date.now(),
      });
    }
  }, [
    input,
    isResponding,
    messages,
    settings,
    setSettings,
    addFact,
    skipNextResponse,
    poweredDown,
    setPoweredDown,
    startupPhrasesParam
  ]);

  return { messages, setMessages, input, setInput, isResponding, handleSubmit, poweredDown, setPoweredDown };
}
