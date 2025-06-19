import jamesonPersona from './jamesonPersona.js';
import { getWeather } from '../utils/getWeather.js';


export async function buildPromptWithContext(messages, context = {}) {
  // Get last 6 lines of convo
  const recentExchanges = messages
    .slice(-5)
    .map(msg => `${msg.isUser ? '[User]' : '[Jameson]'} ${msg.text}`)
    .join('\n');



  // Apply user input from latest message
  const userInput = messages[messages.length - 1]?.text || '';
  const mode = context.mode ?? "formal";

  const finalContext = {
    temperature: context?.temperature ?? 66,
    hatesCold: context?.hatesCold ?? true,
    mode: context?.mode ?? messages[messages.length - 1]?.mode ?? "formal"
  };
  
  // 🌦 Pull from context or fallback to live weather
  const { temperature, hatesCold } = context.temperature !== undefined && context.hatesCold !== undefined
    ? context
    : await getWeather(context.zip); // optional zip in context

  const systemPrompt = jamesonPersona(userInput, { temperature, hatesCold, mode });

  return `${systemPrompt}\n\n${recentExchanges}`;
} // This function builds the full prompt for the AI model by combining the Jameson persona,
// recent conversation history, and any relevant context. 

export default buildPromptWithContext;