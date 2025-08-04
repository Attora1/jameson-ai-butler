import { AELIPersona } from './AELIPersona.js';
import { getWeather } from './getWeather.js';
import { DEFAULT_SETTINGS } from '../src/constants.js';
import db from './db.js'; // Re-import the database

const DEFAULT_ZIP = '48203'; // Detroit fallback

export async function buildPromptWithContext(messages, context = {}) {
  const recentExchanges = messages
    .slice(-5)
    .map(msg => `${msg.isUser ? '[User]' : '[AELI]'} ${msg.text}`)
    .join('\n');

  const userInput = messages[messages.length - 1]?.text || '';

  const mergedSettings = { ...DEFAULT_SETTINGS, ...context };

  const {
    mode,
    tone,
    nameFormal,
    nameCasual,
    partnerTitle,
    partnerCustomTitle,
    partnerPronouns,
    childrenName,
    zip,
    mood,
    voiceGender,
    voiceAccent,
    fontSize,
    fontFamily,
    memoryLimit,
    enableWeather = true,
    facts: shortTermFacts = [], // Facts from localStorage
  } = mergedSettings;

  // Resolve partnerName based on partnerTitle & custom title
  const partnerName = partnerTitle === 'other'
    ? partnerCustomTitle?.trim() || 'partner'
    : partnerTitle || 'partner';

  // Defaults if weather fetch fails or disabled
  let temperature = 66;
  let hatesCold = false;

  if (enableWeather) {
    const zipToUse = zip || DEFAULT_ZIP;
    try {
      const weather = await getWeather(zipToUse);
      if (weather) {
        temperature = weather.temperature;
        hatesCold = temperature < 50;
      }
    } catch (error) {
      console.warn('Failed to fetch weather:', error);
    }
  }

  // Fetch long-term facts from the database
  const longTermFacts = await new Promise((resolve, reject) => {
    db.facts.find({}, (err, docs) => {
      if (err) return reject(err);
      resolve(docs.map(d => d.fact));
    });
  });

  // Combine short-term and long-term facts
  const allFacts = [...shortTermFacts, ...longTermFacts];

  console.log('[DEBUG] AELI context being passed:', {
    tone,
    nameFormal,
    nameCasual,
    partnerName,
    partnerPronouns,
    mood,
  });

  const systemPrompt = AELIPersona({
    userInput,
    temperature,
    mode,
    tone,
    nameFormal,
    nameCasual,
    partnerName,
    partnerPronouns,
    childrenName,
    mood,
    facts: allFacts, // Pass all facts to the persona
  });

  return `${systemPrompt}\n\n${recentExchanges}`;
}

export default buildPromptWithContext;


