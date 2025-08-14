import React, { createContext, useState, useRef, useEffect } from 'react';

const LS_KEY = 'AELI_SPOONS';
const clamp = (n, lo = 0, hi = 12) => Math.max(lo, Math.min(hi, Math.round(Number(n))));

export const SpoonContext = createContext({
  spoonCount: 12,
  setSpoonCount: () => {},
  prevSpoonRef: { current: 12 },
  setMessages: () => {},
});

export const SpoonProvider = ({ children, setMessages }) => {
  const [spoonCount, setSpoonCountRaw] = useState(12);
  const prevSpoonRef = useRef(12);
  const debounceRef = useRef(null);

  useEffect(() => {
    // initial load from localStorage (if chat set a value earlier)
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw != null) setSpoonCountRaw(clamp(raw));
    } catch {}

    function onCustom(e) {
      const v = e?.detail?.spoons;
      if (typeof v === 'number') setSpoonCountRaw(clamp(v));
    }
    function onStorage(e) {
      if (e.key === LS_KEY && e.newValue != null) {
        const v = Number(e.newValue);
        if (!Number.isNaN(v)) setSpoonCountRaw(clamp(v));
      }
    }

    window.addEventListener('aeli:spoons', onCustom);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('aeli:spoons', onCustom);
      window.removeEventListener('storage', onStorage);
    };
  }, []);


  const setSpoonCount = (newCount) => {
    const n = clamp(newCount);
    setSpoonCountRaw(n);

    try {
      localStorage.setItem(LS_KEY, String(n));
      window.dispatchEvent(new CustomEvent('aeli:spoons', { detail: { spoons: n } }));
    } catch {}
  
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const prev = prevSpoonRef.current;
  
      if (prev !== newCount && typeof newCount === 'number') {
        if (setMessages) {
          setMessages(prevMsgs => [
            ...prevMsgs,
            {
              isUser: false,
              text: `[AELI] Spoons adjusted from ${prev} to ${newCount}. Let’s take it ${newCount < prev ? 'slow' : 'up a notch'}.`,
            },
          ]);
        }
        prevSpoonRef.current = newCount;
      }
    }, 1500);
  };
  
  

  return (
    <SpoonContext.Provider value={{ spoonCount, setSpoonCount, prevSpoonRef, setMessages }}>
      {children}
    </SpoonContext.Provider>
  );
};
