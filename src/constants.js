export const DEFAULT_SETTINGS = {
  mode: "focus",
  zip: "",               // Blank by default; uses fallback in code
  enableWeather: true,   // Weather enabled by default
  nameFormal: "",
  nameCasual: "",
  title: "Mx.",
  mood: "partly_cloudy",
  voiceGender: "man",
  voiceAccent: "british",
  memoryLimit: 25,
  fontFamily: "default",
  fontSize: "medium"
};

// 🏷️ Dropdown option lists

export const HONORIFICS = [
  { value: "Mx.", label: "Mx." },
  { value: "Msr.", label: "Msr." },
  { value: "Mr.", label: "Mr." },
  { value: "Ms.", label: "Ms." },
  { value: "Dr.", label: "Dr." },
  { value: "", label: "Other / None" }
];

export const MOODS = [
  { value: "dark_clouds", label: "Dark Clouds 🌧️" },
  { value: "cloudy", label: "Cloudy ☁️" },
  { value: "little_sun", label: "Little Bit of Sun 🌥️" },
  { value: "partly_cloudy", label: "Partly Cloudy ⛅" },
  { value: "sunny", label: "Sunny ☀️" }
];

export const VOICE_GENDERS = [
  { value: "woman", label: "Woman's Voice" },
  { value: "man", label: "Man's Voice" }
];

export const VOICE_ACCENTS = [
  { value: "default", label: "Default Accent" },
  { value: "british", label: "British Accent" },
  { value: "american", label: "American Accent" },
  { value: "australian", label: "Australian Accent" },
  { value: "indian", label: "Indian Accent" },
  { value: "french", label: "French Accent" },
  { value: "spanish", label: "Spanish Accent" },
  { value: "german", label: "German Accent" },
  { value: "italian", label: "Italian Accent" } 
  // Future: Add regional/ethnic accents here
];

export const MEMORY_LIMITS = [
  { value: 10, label: "10 Messages" },
  { value: 25, label: "25 Messages" },
  { value: 50, label: "50 Messages" },
  { value: 100, label: "100 Messages" }
];

export const FONT_FAMILIES = [
  { value: "default", label: "Default" },
  { value: "open_dyslexic", label: "Open Dyslexic" },
  { value: "atkinson_hyperlegible", label: "Atkinson Hyperlegible" },
  { value: "sans_serif", label: "Sans Serif" }
];

export const FONT_SIZES = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" }
];

export const PRONOUN_SETS = {
  she: {
    subject: "she",
    object: "her",
    possessive: "her",
    reflexive: "herself",
    label: "She/Her",
  },
  he: {
    subject: "he",
    object: "him",
    possessive: "his",
    reflexive: "himself",
    label: "He/Him",
  },
  they: {
    subject: "they",
    object: "them",
    possessive: "their",
    reflexive: "themself",
    label: "They/Them",
  },
  ze: {
    subject: "ze",
    object: "zir",
    possessive: "zir",
    reflexive: "zirself",
    label: "Ze/Zir",
  },
  xe: {
    subject: "xe",
    object: "xem",
    possessive: "xyr",
    reflexive: "xemself",
    label: "Xe/Xem",
  },
  // Add more if you want
};


export const STORAGE_KEY = "JAMESON_MEMORY";
