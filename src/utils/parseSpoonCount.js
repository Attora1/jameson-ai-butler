export function parseSpoonCount(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  const wordMap = {
    'none': 0,
    'zero': 0,
    'one': 1,
    'a couple': 2,
    'couple': 2,
    'two': 2,
    'few': 3,
    'three': 3,
    'four': 4,
    'five': 5,
    'six': 6,
    'seven': 7,
    'eight': 8,
    'nine': 9,
    'ten': 10,
    'eleven': 11,
    'twelve': 12,
    'full': 12,
    'many': 10,
    'several': 8,
  };

  const phrases = Object.keys(wordMap).sort((a,b) => b.length - a.length);

  for (const phrase of phrases) {
    const regex = new RegExp(`\\b${phrase}\\b`);
    if (regex.test(lower)) {
      return wordMap[phrase];
    }
  }

  const digitMatch = lower.match(/\b(\d{1,2})\b/);
  if (digitMatch) {
    const num = parseInt(digitMatch[1], 10);
    if (num >= 0 && num <= 12) return num;
  }

  return null;
}
