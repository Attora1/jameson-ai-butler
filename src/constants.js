export const STORAGE_KEY = 'chatMessages';

export const DEFAULT_SETTINGS = {
  nameFormal: "Madam",
  nameCasual: "madam",
  tone: "formal",
  mode: "dashboard",
  partnerTitle: "",
  partnerCustomTitle: "",
  partnerPronouns: {
    subject: "they",
    object: "them",
    possessive: "their",
    reflexive: "themselves"
  },
  childrenName: "",
  zip: "",
  mood: "neutral",
  voiceEnabled: false,
  voiceID: "",
  voiceGender: "",
  voiceAccent: "",
  fontSize: 16,
  fontFamily: "sans-serif",
  memoryLimit: 5,
  enableWeather: true,
  chat: { // Added chat object
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    fontSize: '1rem',
    lineHeight: 1.5,
  },
};

export const HONORIFICS = [
  { value: "none", label: "None" },
  { value: "mr", label: "Mr." },
  { value: "ms", label: "Ms." },
  { value: "mx", label: "Mx." },
  { value: "dr", label: "Dr." },
  { value: "prof", label: "Prof." },
  { value: "sir", label: "Sir" },
  { value: "madam", label: "Madam" },
];

export const MOODS = [
  { value: 'sunny', label: '☀️ Sunny' },
  { value: 'partly_cloudy', label: '🌤️ Partly Cloudy' },
  { value: 'cloudy_with_sun', label: '⛅ Cloudy Sun' },
  { value: 'cloudy', label: '☁️ Cloudy' },
  { value: 'rainy', label: '🌧️ Rainy' },
];


export const FONT_SIZES = [
  { value: 12, label: "Small" },
  { value: 16, label: "Medium" },
  { value: 20, label: "Large" },
  { value: 24, label: "X-Large" },
];

export const FONT_FAMILIES = [
  { value: "sans-serif", label: "Sans-serif" },
  { value: "serif", label: "Serif" },
  { value: "monospace", label: "Monospace" },
  { value: "cursive", label: "Cursive" },
  { value: "fantasy", label: "Fantasy" },
];

export const VOICE_GENDERS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "nonbinary", label: "Non-binary" },
];

export const VOICE_ACCENTS = [
  { value: "american", label: "American" },
  { value: "british", label: "British" },
  { value: "indian", label: "Indian" },
  { value: "australian", label: "Australian" },
];

export const MEMORY_LIMITS = [
  { value: 3, label: "Short (3 messages)" },
  { value: 5, label: "Medium (5 messages)" },
  { value: 10, label: "Long (10 messages)" },
];

export const PRONOUN_SETS = {
  "they": { subject: "they", object: "them", possessive: "their", reflexive: "themselves" },
  "she": { subject: "she", object: "her", possessive: "her", reflexive: "herself" },
  "he": { subject: "he", object: "him", possessive: "his", reflexive: "himself" },
  "it": { subject: "it", object: "it", possessive: "its", reflexive: "itself" },
};