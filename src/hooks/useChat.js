import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEY } from '../constants';

export function useChat(settings, setSettings, facts, addFact, spoonCount, poweredDown, setPoweredDown, startupPhrases) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [skipNextResponse, setSkipNextResponse] = useState(false);
  const [activeTimerId, setActiveTimerId] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
  const [moodMetrics, setMoodMetrics] = useState({
    shortMessageCount: 0,
    lastFrustrationCheck: Date.now(),
  });

  useEffect(() => {
    async function fetchChatHistory() {
      try {
        const userId = settings.userId || "defaultUser";
        const response = await fetch(`/api/chat-history?userId=${encodeURIComponent(userId)}`);
        const data = await response.json();
        if (response.ok) {
          setMessages(data);
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

  useEffect(() => {
    if (!activeTimerId) return;

    const timer = setInterval(() => {
      fetch(`/api/timer-status?timerId=${activeTimerId}`)
        .then(res => res.json())
        .then(data => {
          setRemainingTime(data.remaining);
          if (data.remaining <= 0) {
            setMessages(prev => [...prev, { text: "Timer finished!", isUser: false }]);
            setActiveTimerId(null);
            clearInterval(timer);
          }
        });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTimerId]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!input.trim() || isResponding) return;
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
          userInput: input,
          messageHistory: messages,
          context: {
            ...settings,
            spoonCount,
            userId: "defaultUser",
            facts
          },
        }),
      });

      const data = await response.json();
      console.log('[FULL API DATA]', data);

      const reply = data.replyText?.trim();
      const action = data.action;

      if (reply) {
        setMessages(prev => [...prev, { isUser: false, text: reply }]);

        // Attempt to extract timer action from reply text if action is null
        if (!action) {
          const timerMatch = reply.match(/(\d+)\s*[-]?\s*(minute|second)s?\s*timer/i);
          if (timerMatch) {
            const duration = parseInt(timerMatch[1]);
            const unit = timerMatch[2].toLowerCase();
            const timerId = `timer_${Date.now()}`;
            let finalDuration = duration;
            if (unit === 'minute') {
              finalDuration = duration * 60;
            }

            if (typeof finalDuration === 'number' && typeof timerId === 'string' && timerId.length > 0) {
              setActiveTimerId(timerId);
              fetch('/.netlify/functions/set-timer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ duration: finalDuration, timerId }),
              }).then(response => response.json())
                .then(data => console.log('Timer API Response (from text parsing):', data))
                .catch(error => console.error('Error setting timer (from text parsing):', error));
            } else {
              console.error('Invalid timer extracted from text:', { finalDuration, timerId });
            }
          }
        }

      } else {
        setMessages(prev => [...prev, { isUser: false, text: '♦cough♦ Technical difficulties, madam.' }]);
      }

      if (action?.type === 'switchMode' && typeof action.payload === 'string') {
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
            body: JSON.stringify({ duration, timerId }),
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

  return { messages, setMessages, input, setInput, isResponding, handleSubmit, poweredDown, setPoweredDown, remainingTime };
}
