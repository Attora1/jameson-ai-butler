import { useState, useEffect } from 'react';
import { DEFAULT_SETTINGS } from '../constants';

const SETTINGS_KEY = 'AELI_SETTINGS';

// New normalizeSettings function
function normalizeSettings(s) {
  const src = s || {};
  const chat = src.chat && typeof src.chat === 'object' ? src.chat : {};
  return {
    ...DEFAULT_SETTINGS, // Use the imported DEFAULT_SETTINGS
    ...src,
    chat: {
      ...DEFAULT_SETTINGS.chat, // Assuming DEFAULT_SETTINGS also has a chat object
      ...chat,
    },
  };
}

function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    const parsed = saved ? JSON.parse(saved) : {};
    return normalizeSettings(parsed); // Use normalizeSettings here
  } catch (e) {
    console.error("Failed to load settings from localStorage", e);
    return normalizeSettings({}); // Use normalizeSettings here
  }
}

export function useSettings() {
  const [settings, setSettingsState] = useState(() => normalizeSettings(loadSettings())); // Modified useState init

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save settings to localStorage", e);
    }
  }, [settings]);

  // Modified setSettings updater
  const setSettings = (patch) => {
    setSettingsState(prev => normalizeSettings({ ...prev, ...patch }));
  };

  return { settings, setSettings };
}
