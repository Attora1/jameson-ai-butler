import { useState, useEffect, useCallback } from 'react';
import { cancelTimerIntent } from '../intents/cancelTimerIntent.js';
import { normalizeInput } from '../utils/normalizeInput.js';

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

  // ---- Persist locally (lightweight) ----
  useEffect(() => {
    try {
      localStorage.setItem('AELI_CHAT_HISTORY', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // ---- Submit handler ----
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!input.trim() || isResponding) return;

    // Normalized, typo-forgiving copy for intent matching
    const norm = normalizeInput(input).normalized;

    // 🛑 CANCEL TIMER (helper) — runs before anything goes to the model
    if (await cancelTimerIntent({ input, settings, setMessages, setInput })) return;

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
                text: `⏱️ Timer set for ${amount} ${/^m/.test(unit) ? 'minute' : 'second'}${amount !== 1 ? 's' : ''}.`
              }
            ]);
          } else {
            setMessages(prev => [
              ...prev,
              { isUser: true, text: raw },
              { isUser: false, text: `Sorry, I couldn’t set that timer (${data?.error || res.status}).` }
            ]);
          }
        } catch (err) {
          console.error('[timer intent] create failed:', err);
          setMessages(prev => [
            ...prev,
            { isUser: true, text: raw },
            { isUser: false, text: 'Timer hiccup—network error.' }
          ]);
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
              { isUser: false, text: parts.join(' ') }
            ]);
          } else if (data?.error === 'NO_ACTIVE_TIMERS' || res.status === 404) {
            setMessages(prev => [
              ...prev,
              { isUser: true, text: input.trim() },
              { isUser: false, text: 'No active timers at the moment.' }
            ]);
          } else {
            setMessages(prev => [
              ...prev,
              { isUser: true, text: input.trim() },
              { isUser: false, text: `Hmm—couldn’t fetch time left (${data?.error || res.status}).` }
            ]);
          }
        } catch (err) {
          console.error('[time-left intent] failed:', err);
          setMessages(prev => [
            ...prev,
            { isUser: true, text: input.trim() },
            { isUser: false, text: 'Network blip. Try again in a sec.' }
          ]);
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
        setMessages(prev => [...prev, { text: "🟢 Power restored. AELI is back online.", isUser: false }]);
        fetch('/.netlify/functions/power/wake', { method: 'POST' }).catch(() => {});
        setPoweredDown(false);
      } else {
        setMessages(prev => [...prev, { text: "🔇 AELI is currently powered down. Say 'wake up' to reactivate.", isUser: false }]);
      }
      setInput('');
      return;
    }

    if (shutdownPhrases.includes(lowerCaseInput)) {
      setMessages(prev => [...prev, { text: "🔌 Powering down. AELI will go quiet now.", isUser: false }]);
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
      const response = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
          userId: settings?.userId || 'defaultUser',
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
        setMessages(prev => [...prev, { text: "♦cough♦ Technical difficulties, friend.", isUser: false }]);
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
        setMessages(prev => [...prev, { text: aiText, isUser: false }]);
      }

      // Minimal action handling (mode switch only to avoid undefined imports)
      const action = data.action;
      if (action?.type === 'switchMode' && typeof action.payload === 'string') {
        setSettings(prev => ({ ...prev, mode: action.payload }));
      }

    } catch (error) {
      console.error('[AELI Chat Error]', error);
      setMessages(prev => [...prev, { text: "♦cough♦ Technical difficulties, madam.", isUser: false }]);
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
    facts,
    addFact,
    setSettings,
    skipNextResponse,
    spoonCount,
    poweredDown,
    setPoweredDown
  ]);

  return { messages, setMessages, input, setInput, isResponding, handleSubmit, poweredDown, setPoweredDown };
}
