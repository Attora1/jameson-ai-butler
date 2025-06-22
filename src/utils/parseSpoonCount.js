export function parseSpoonCount(input) {
    const match = input.match(/(\d+)\s+spoons?/i);
    if (!match) return null;
  
    const count = parseInt(match[1], 10);
    if (isNaN(count)) return null;
  
    return Math.max(0, Math.min(count, 12)); // clamp between 0 and 12
  }
  