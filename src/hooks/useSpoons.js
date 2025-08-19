import { useState, useEffect, useCallback } from 'react';

const LS_KEY = 'AELI_SPOONS';

// Keeps spoons in sync across chat, widgets, and tabs via localStorage + a custom event.
export function useSpoons(defaultValue = null) {
  const [spoons, setSpoons] = useState(() => {
    try {
      const v = localStorage.getItem(LS_KEY);
      return v != null ? Number(v) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  // Write locally and broadcast to other listeners (no network here).
  const setSpoonsLocal = useCallback((val, { broadcast = true } = {}) => {
    const n = Math.max(0, Math.min(10, Math.round(Number(val))));
    try { localStorage.setItem(LS_KEY, String(n)); } catch { /* ignore */ }
    setSpoons(n);
    if (broadcast && typeof window !== 'undefined') {
      try { window.dispatchEvent(new CustomEvent('aeli:spoons', { detail: { spoons: n } })); } catch { /* ignore */ }
    }
    return n;
  }, []);

  useEffect(() => {
    function onCustom(e) {
      const v = e?.detail?.spoons;
      if (typeof v === 'number') setSpoons(v);
    }
    function onStorage(e) {
      if (e.key === LS_KEY && e.newValue != null) {
        const n = Number(e.newValue);
        if (!Number.isNaN(n)) setSpoons(n);
      }
    }
    window.addEventListener('aeli:spoons', onCustom);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('aeli:spoons', onCustom);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return { spoons, setSpoonsLocal };
}