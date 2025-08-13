import { useState, useEffect, useRef, useCallback } from 'react';
import { say } from './useAELIVoice.js';

const notifiedTimers = new Set();

// A generic countdown timer hook
export function useCountdown({ onComplete }) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  const startCountdown = useCallback((minutes) => {
    setSecondsLeft(minutes * 60);
    setIsRunning(true);
  }, []);

  const togglePause = useCallback(() => {
    if (secondsLeft > 0) {
      setIsRunning(prev => !prev);
    }
  }, [secondsLeft]);

  const stopCountdown = useCallback(() => {
    setIsRunning(false);
    setSecondsLeft(0);
  }, []);

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prevSeconds => prevSeconds - 1);
      }, 1000);
    } else if (isRunning && secondsLeft === 0) {
      setIsRunning(false);
      onComplete?.();
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, secondsLeft, onComplete]);

  return {
    secondsLeft,
    isRunning,
    startCountdown,
    togglePause,
    stopCountdown,
  };
}

// Hook for polling persistent timers from the server
export function usePersistentTimerPolling(setMessages, poweredDown, settings) {
  const setMessagesRef = useRef(setMessages);
  const alertSound = useRef(new Audio('/sounds/level-passed.mp3'));

  const playSound = useCallback(() => {
    if (alertSound.current) {
      alertSound.current.load();
      alertSound.current.play().catch(error => {
        console.error('Error playing sound:', error);
      });
    }
  }, []);

  // One-time audio unlock so Chrome/Safari don't block the chime
  const unlockedRef = useRef(false);

  useEffect(() => {
    const unlock = () => {
      if (unlockedRef.current || !alertSound.current) return;
      const a = alertSound.current;
      const prevVol = a.volume;

      a.volume = 0;           // play silently to satisfy gesture requirement
      a.play().then(() => {
        a.pause();
        a.currentTime = 0;
        a.volume = prevVol;
        unlockedRef.current = true;
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      }).catch(() => {
        // ignore; we'll try again on next gesture
      });
    };

    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  useEffect(() => {
    setMessagesRef.current = setMessages;
  }, [setMessages]);

  useEffect(() => {
    let pollingInterval;

    if (!poweredDown) {
      pollingInterval = setInterval(async () => {
        try {
          const response = await fetch(`/.netlify/functions/check-timers?userId=${encodeURIComponent(settings.userId || 'defaultUser')}`);

          if (response.status === 503) {
            console.warn("AELI server is asleep. Stopping timer polling.");
            clearInterval(pollingInterval);
            return;
          }

          const data = await response.json();

          if (data.expiredTimers && data.expiredTimers.length > 0) {
            data.expiredTimers.forEach((id) => {
              if (!notifiedTimers.has(id)) {
                notifiedTimers.add(id);
                playSound?.();
                say('Your timer is complete.', settings);
                if (typeof setMessagesRef.current === 'function') {
                  setMessagesRef.current(prev => [...prev, { text: '⏰ Your timer just finished.', isUser: false }]);
                }
              }
            });
          }
        } catch (error) {
          console.error('Error checking timers:', error);
        }
      }, 5000);
    }

    return () => {
      clearInterval(pollingInterval);
    };
  }, [poweredDown, playSound, settings]);
}


// Hook for creating a new timer
export function useCreateTimer() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  const createTimer = async (durationMinutes, userId, timerId) => {
    setIsCreating(true);
    setError(null);
    try {
      const response = await fetch('/.netlify/functions/create-timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: durationMinutes, userId, timerId }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create timer');
      }
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return { createTimer, isCreating, error };
}