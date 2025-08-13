export function parseTimerRequest(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const patterns = [
    /(?:set|start|create|add) a timer for (\d+)\s*(?:minutes?|mins?)/i,
    /timer (?:for )?(\d+)\s*(?:minutes?|mins?)/i,
    /(\d+)\s*(?:minute|min) timer/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const duration = parseInt(match[1], 10);
      if (!isNaN(duration) && duration > 0) {
        return { duration };
      }
    }
  }

  return null;
}
