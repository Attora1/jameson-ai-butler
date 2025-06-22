// utils/modeDetection.js

const crisisKeywords = [
    "want to die", "kill myself", "can't go on", "ending it",
    "suicidal", "no reason to live", "hurts too much", 
    "have a plan to end it all",
];
  
  const lowSpoonKeywords = [
    "so tired", "no energy", "burnt out", "exhausted",
    "can't get up", "done for the day", "overwhelmed"
  ];
  
  export function detectContextualMode(messageText) {
    const lower = messageText.toLowerCase();
  
    if (crisisKeywords.some(kw => lower.includes(kw))) {
      return 'crisis';
    }
  
    if (lowSpoonKeywords.some(kw => lower.includes(kw))) {
      return 'low_spoon';
    }
  
    return null;
  }
  