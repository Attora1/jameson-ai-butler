// constants.js

// Storage Key
export const STORAGE_KEY = 'jameson_messages';

// Time thresholds (in milliseconds)
export const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;         // 5 minutes
export const INACTIVITY_CHECK_INTERVAL_MS = 60 * 1000;      // Check every 1 minute
export const TEA_COOLDOWN_MS = 60 * 1000;                   // 1 minute cooldown

// Mood detection thresholds
export const SHORT_MESSAGE_LENGTH_THRESHOLD = 20;
export const MOOD_TRIGGER_SHORT_MESSAGE_COUNT = 3;
export const MOOD_TRIGGER_DELAY_MS = 90 * 1000;             // 90 seconds

// Placation phrases
export const PLACATION_PHRASES = [
  "Shall we adjourn to the veranda? I hear the air outside is not yet filled with your current anguish.",
  "Perhaps a brownie would steady the course? A bit of sugar must surely help.",
  "The lower lounge beckons, miss. I'll ready the throw blanket.",
  "Might I suggest pausing for a stroll? I'm sure the kittens would appreciate your company.",
  "The courtyard awaits, miss. A bit of fresh air might do wonders for your mood.",
  "Shall we pause for tea? A moment of calm amidst the storm."
];
