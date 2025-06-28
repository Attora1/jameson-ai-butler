// utils/AELIRemarks.js

export function getModeSubtitle(mode, context = {}) {
    const name = context.nameCasual || "friend";
    const hour = new Date().getHours();
  
    const greetings = {
      morning: `A gentle start, ${name}.`,
      afternoon: `Let's take it slow, ${name}.`,
      evening: `You've made it this far, ${name}. Time to rest.`,
      night: `Late night stillness, ${name}. No rush now.`
    };
  
    if (mode === 'lowSpoon') {
      if (hour < 11) return greetings.morning;
      if (hour < 17) return greetings.afternoon;
      if (hour < 21) return greetings.evening;
      return greetings.night;
    }
  
    if (mode === 'focus') {
      return `Let’s channel what you’ve got, ${name}.`;
    }
  
    return `Take your time, ${name}.`;
  }
  
  export function getReturnFromZen() {
    const options = [
      "How’re we feeling after some serenity?",
      "Back from a breathing session— no rush now.",
      "That was peaceful. Shall we nudge forward?",
      "You returned with grace. Ready for a bite of that task?",
      "Mmm. The air is calmer now. Let’s check in.",
    ];
    return options[Math.floor(Math.random() * options.length)];
  }
  