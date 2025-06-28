// utils/spoonReplies.js
const spoonReplies = [
    (count) => `Gotcha, you’ve got ${count} spoon${count !== 1 ? 's' : ''} today. Let’s keep it gentle.`,
    (count) => `I see we’re at ${count} spoon${count !== 1 ? 's' : ''}—perfect for a calm day.`,
    (count) => `${count} spoons noted. Let’s take it slow and steady.`,
    (count) => `Alright, ${count} spoon${count !== 1 ? 's' : ''} — careful steps, no rush.`,
    (count) => `Counting ${count} spoons for today. Let’s treat this day like fine china.`,
  ];
  
  export function getRandomSpoonReply(count) {
    const idx = Math.floor(Math.random() * spoonReplies.length);
    return spoonReplies[idx](count);
  }
  