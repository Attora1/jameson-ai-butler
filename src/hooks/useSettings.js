import { useState, useEffect } from 'react';
import { DEFAULT_SETTINGS } from '../constants';

const SETTINGS_KEY = 'AELI_SETTINGS';

function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    const parsed = saved ? JSON.parse(saved) : {};
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    console.error("Failed to load settings from localStorage", e);
    return { ...DEFAULT_SETTINGS };
  }
}

export function useSettings() {
  const [settings, setSettings] = useState(loadSettings());

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save settings to localStorage", e);
    }
  }, [settings]);

  return { settings, setSettings };
}
