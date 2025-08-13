// AELILanguageFilter.js
// Personalizes and adapts LLM or fallback responses with wit, mode, mood, and user settings

import { getWit } from '../prompts/AELIEngine.js';

/**
 * Adds local wit, personality, energy/mood awareness to LLM replies
 * @param {string} rawReply          Main response text from LLM (or fallback)
 * @param {object} settings          User and context settings (mood, tone, humor, mode, name, etc)
 * @param {object} options           { spoonCount, timeOfDay, failMode }
 * @returns {string}                 Enriched, context-aware reply
 */
export function applyAELIPersonality(rawReply, settings = {}) {
    let result = rawReply ? rawReply.trim() : '';
    const {
      humorLevel = 'dry',
      tone = 'casual',
      mood = 'neutral',
      mode = 'dashboard',
      nameFormal = '',
      spoonCount = 12,
    } = settings;
  
    // Add time-of-day or mood/capacity-based opener (if not already greeting)
    if (result && !/^good (morning|afternoon|night)/i.test(result)) {
      if (spoonCount === 0) {
        result = `All spoons spent, Miss. No heroics today.\n${result}`;
      } else if (mode === 'low_spoon' && humorLevel !== 'none') {
        result = `We're in low spoon mode—a gentle day.\n${result}`;
      }
    }

    // Wit and encouragement
    if (humorLevel !== 'none') {
      if (Math.random() < 0.3) {
        result += `\n\n${getWit()}`;
      }
    }

    // Tone filter (expandable)
    if (tone === 'formal') {
      result = result.replace(/\b(you)\b/gi, nameFormal || 'madam');
    }
    if (tone === 'casual') {
      result = result.replace(/\b(madam|sir|miss|lord)\b/gi, settings.nameCasual || 'friend');
    }

    // Mood: encourage, and suggest gentle actions
    if (/tired|low energy|overwhelm|drained/i.test(mood) && Math.random() < 0.4) {
      result += '\n\nHow about a little music or a stretch?';
    }
  
    // TODO: Add proactive nudge, or escalation if user is up too late
  
    return result;
}

