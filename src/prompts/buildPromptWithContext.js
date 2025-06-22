import jamesonPersona from './jamesonPersona.js';
import { getWeather } from '../utils/getWeather.js';
import { DEFAULT_SETTINGS } from '../constants.js';

const DEFAULT_ZIP = '48203'; // Detroit, as a general fallback

export async function buildPromptWithContext(messages, context = {}) {
  const recentExchanges = messages
    .slice(-5)
    .map(msg => `${msg.isUser ? '[User]' : '[Jameson]'} ${msg.text}`)
    .join('\n');

  const userInput = messages[messages.length - 1]?.text || '';

  const mergedSettings = { ...DEFAULT_SETTINGS, ...context };

  const {
    mode,
    nameFormal,
    nameCasual,
    partnerName,
    childrenName,
    userPronouns,
    partnerPronouns,
    zip,
    enableWeather = true, // Weather on by default
  } = mergedSettings;

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

  const systemPrompt = jamesonPersona(userInput, {
    temperature,
    hatesCold,
    mode,
    nameFormal,
    nameCasual,
    partnerName,
    childrenName,
    userPronouns,
    partnerPronouns,
  });

  return `${systemPrompt}\n\n${recentExchanges}`;
}

export default buildPromptWithContext;
