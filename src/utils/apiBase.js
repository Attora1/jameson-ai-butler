// Always use Netlify Functions for API calls (dev + prod).
export const FN_BASE = "/api";

export const endpoints = {
  wellness: `${FN_BASE}/wellness`,
  chatHistory: `${FN_BASE}/chat-history`,
  weather: `${FN_BASE}/weather`,
  chat: `${FN_BASE}/chat`,
  speak: `${FN_BASE}/speak`,
  timers: {
    create: `${FN_BASE}/create-timer`,
    left: `${FN_BASE}/time-left`,
    cancel: `${FN_BASE}/cancel-timer`,
    check: `${FN_BASE}/check-timers`,
  },
  systemStatus: `${FN_BASE}/system-status`,
  releaseInfo: `${FN_BASE}/release-info`,
};