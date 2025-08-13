import { useState, useEffect, useCallback } from 'react';
import { useCreateTimer } from './useTimer.js';
import { STORAGE_KEY } from '../constants';
import { cancelTimerIntent } from '../intents/cancelTimerIntent.js'; // ⬅️ NEW

export function useChat(settings, setSettings, facts, addFact, spoonCount, poweredDown, setPoweredDown, startupPhrases) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [skipNextResponse, setSkipNextResponse] = useState(false);
  const [moodMetrics, setMoodMetrics] = useState({
    shortMessageCount: 0,
    lastFrustrationCheck: Date.now(),
  });
  const { createTimer } = useCreateTimer();

  useEffect(() => {
    async function fetchChatHistory() {
      try {
        const userId = settings.userId || "defaultUser";
        const response = await fetch(`/api/chat-history?userId=${encodeURIComponent(userId)}`);
        const data = await response.json().catch(() => ({}));

        // normalize
        const history = Array.isArray(data?.history) 
          ? data.history 
          : (Array.isArray(data) ? data : []);

        if (response.ok) {
          setMessages(history);
        } else {
          console.error("Failed to fetch chat history:", data.error);
        }
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
      }
    }
    fetchChatHistory();
  }, [settings.userId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!input.trim() || isResponding) return;

    // 🛑 cancel timer (helper) — runs before anything goes to the model
    if (await cancelTimerIntent({ input, settings, setMessages, setInput })) return; // ⬅️ NEW

    // ⏱️ TIMER INTENT (intercepts "set a 1 minute/second timer")
    // Examples it catches: "set a 10 second timer", "can you set a 1 minute timer", "start 5m timer"
    {
      const raw = input.trim();
      const lower = raw.toLowerCase();

      const match = lower.match(
        /(?:^|\b)(?:can you|could you|would you|please|pls)?\s*(?:set|start|create|begin|make)\s+(?:a\s+)?(\d+)\s*(seconds?|secs?|s|minutes?|mins?|m)\s*(?:timer)?\b/
      );

      if (match) {
        const amount = parseInt(match[1], 10);
        const unit = match[2];
        const seconds = /(min|m)/.test(unit) ? amount * 60 : amount;

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
                text: `⏱️ Timer set for ${amount} ${/(min|m)/.test(unit) ? 'minute' : 'second'}${amount !== 1 ? 's' : ''}.`
              }
            ]);
            // Optional: track server timer id if your UI needs it:
            // const newId = data.result?.timerId || data.timerId;
            // setActiveTimerId?.(newId);
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

    // ⏱️ "How much time is left?" / "How long has it been?"
    const timeLeftIntent = /^(how (much )?time (is )?left( on (my|the) timer)?\??|time left\??|how long has it been\??)$/i;
    if (timeLeftIntent.test(input.trim())) {
      try {
        const res = await fetch(`/.netlify/functions/time-left?userId=${encodeURIComponent(settings.userId || 'defaultUser')}`);
        const data = await res.json();

        if (res.ok && data && (data.remainingSeconds != null)) {
          // Prefer the human-friendly fields if present
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
            { isUser: false, text: "No active timers at the moment." }
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
          { isUser: false, text: "Network blip. Try again in a sec." }
        ]);
      }

      setInput('');
      return; // don't pass this to the model
    }

    const shutdownPhrases = ["power down", "shut down", "go to sleep", "power off"];
    const startupPhrases = ["wake up", "power up", "turn on"];
    const lowerCaseInput = input.toLowerCase().trim();

    if (poweredDown) {
      if (startupPhrases.includes(lowerCaseInput)) {
        setMessages(prev => [...prev, { text: "🟢 Power restored. AELI is back online.", isUser: false }]);
        fetch('/.netlify/functions/power/wake', { method: 'POST' }).catch(() => {});
        setPoweredDown(false);
      } else {
        setMessages(prev => [...prev, { text: "🔇 AELI is currently powered down. Say 'wake up' to reactivate.", isUser: false }]);
        return;
      }
    }
    
    if (shutdownPhrases.includes(lowerCaseInput)) {
      setMessages(prev => [...prev, { text: "🔌 Powering down. AELI will go quiet now.", isUser: false }]);
      fetch('/.netlify/functions/power/sleep', { method: 'POST' }).catch(() => {});
      setPoweredDown(true);
      return;
    }

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

    setIsResponding(true);
    try {
      const response = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
          userId: "defaultUser",
          // threadId: null, // if your function uses it
          // mode: settings.mode // if you route by mode
          settings: {
            tone: settings.tone,
            humorLevel: settings.humorLevel,
            voiceGender: settings.voiceGender,
            voiceAccent: settings.voiceAccent,
          }
        }),
      });

      const data = await response.json().catch(() => ({}));
      console.log("[CHAT] response:", response.status, data);

      if (!response.ok) {
        // only show the cough on non-2xx
        setMessages(prev => [...prev, { text: "♦cough♦ Technical difficulties, friend.", isUser: false }]);
        return;
      }

      // prefer `reply`, but accept other shapes too
      const aiText =
        (typeof data.reply === 'string' && data.reply.trim()) ||
        (typeof data.replyText === 'string' && data.replyText.trim()) ||
        (typeof data.message === 'string' && data.message.trim()) ||
        (typeof data.text === 'string' && data.text.trim()) ||
        (Array.isArray(data.choices) && data.choices[0]?.message?.content?.trim()) ||
        "";

      // if nothing usable came back, don’t inject a ghost bubble
      if (!aiText) {
        console.warn("[CHAT] No AI text found in response:", data);
        return;
      }

      setMessages(prev => [...prev, { text: aiText, isUser: false }]);

      const action = data.action;

      if (action?.type === 'createTimer' && typeof action.payload === 'object') {
        const { duration } = action.payload;
        if (typeof duration === 'number') {
          const timerId = Date.now().toString();
          createTimer(duration, settings.userId || 'defaultUser', timerId);
        }
      } else if (action?.type === 'switchMode' && typeof action.payload === 'string') {
        console.log('[AELI Action]', action);
        setSettings(prev => ({ ...prev, mode: action.payload }));
      } else if (action?.type === 'setTimer' && typeof action.payload === 'object') {
        console.log('[AELI Action] Set Timer:', action.payload);
        const { duration, timerId } = action.payload;
        if (typeof duration === 'number' && typeof timerId === 'string' && timerId.length > 0) {
          setActiveTimerId(timerId);
          fetch('/.netlify/functions/set-timer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ duration, timerId, userId: settings.userId }),
          }).then(response => response.json())
            .then(data => console.log('Timer API Response:', data))
            .catch(error => console.error('Error setting timer:', error));
        } else {
          console.error('Invalid setTimer action payload:', action.payload);
        }
      }

    } catch (error) {
      console.error('[AELI Chat Error]', error);
      setMessages(prev => [...prev, {
        text: "♦cough♦ Technical difficulties, madam.",
        isUser: false
      }]);
    } finally {
      setIsResponding(false);
      setMoodMetrics({
        shortMessageCount: 0,
        lastFrustrationCheck: Date.now(),
      });
    }
    
    if (startupPhrases.includes(lowerCaseInput)) {
      setMessages(prev => [...prev, { text: "🟢 Power restored. AELI is back online.", isUser: false }]);
      setPoweredDown(false);
      return;
    }

  }, [input, isResponding, messages, settings, facts, addFact, setSettings, skipNextResponse, spoonCount, setMessages, setIsResponding]);

  return { messages, setMessages, input, setInput, isResponding, handleSubmit, poweredDown, setPoweredDown };
}
