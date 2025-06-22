import jamesonPersona from './jamesonPersona.js';
import { getWeather } from '../utils/getWeather.js';
import { DEFAULT_SETTINGS } from '../constants.js';

const DEFAULT_ZIP = '48203'; // Detroit fallback

export async function buildPromptWithContext(messages, context = {}) {
  const recentExchanges = messages
    .slice(-5)
    .map(msg => `${msg.isUser ? '[User]' : '[Jameson]'} ${msg.text}`)
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

  console.log('[DEBUG] Jameson context being passed:', {
    tone,
    nameFormal,
    nameCasual,
    partnerName,
    partnerPronouns,
    mood,
  });

  const systemPrompt = jamesonPersona({
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
  });

  return `${systemPrompt}\n\n${recentExchanges}`;
}

export default buildPromptWithContext;
