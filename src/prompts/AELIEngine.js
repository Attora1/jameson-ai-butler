// AELIEngine.js

export function getGreeting(settings) {
    const hour = new Date().getHours();
    const name = settings?.nameCasual || settings?.nameFormal || "User";
  
    if (hour >= 5 && hour < 12) {
      return `Good morning, ${name}. Rather bright, isn't it?`;
    } else if (hour >= 12 && hour < 18) {
      return `Good afternoon, ${name}. The sun's doing its best, I suppose.`;
    } else {
      return `Good night, ${name}. Sweet dreams, or something vaguely resembling them.`;
    }
  }
  
  export function getEncouragement() {
    const lines = [
      "Small steps, taken steadily, often lead further than one might expect.",
      "A gentle nudge can sometimes be enough.",
      "Remember, there's no need to rush today.",
      "Your pace is enough."
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }
  
  export function getWit() {
    const witLines = [
      "Chaos is optional, you know.",
      "Efficiency is one thing, but tea comes first.",
      "If you're planning chaos, let me fetch a checklist.",
      "We could be productive, or we could have biscuits. Thoughts?"
    ];
    return witLines[Math.floor(Math.random() * witLines.length)];
  }
  
  export function getPartnerPrompt(settings) {
    if (!settings?.partnerName) {
      return "Thinking of supporting your partner today? Or hiding in the kitchen until it passes?";
    } else {
      return `Shall we check on ${settings.partnerName}'s needs today, or let them nap while we manage chaos?`;
    }
  }
  