import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildPromptWithContext } from '../prompts/buildPromptWithContext';
import { detectContextualMode } from '../utils/modeDetect.js';
import { parseSpoonCount } from '../utils/parseSpoonCount.js'; // adjust path if needed


const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_PRO_KEY);

export async function generateResponse(userInput, messageHistory, context) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  const detectedMode = detectContextualMode(userInput);
  const lastMode = context.mode !== 'chat' ? context.mode : null;

  let newContext = { ...context };


  // Update mode if needed
  if (detectedMode && detectedMode !== context.mode) {
    newContext = {
      ...newContext,
      lastMode,
      mode: detectedMode,
    };
  }

  const spoonCount = parseSpoonCount(userInput);
  if (newContext.mode === 'low_spoon' && spoonCount !== null) {
    const suggestions = getSpoonSuggestions(spoonCount);
    if (suggestions.length > 0) {
      const suggestionText = suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n');
      newContext = {
        ...newContext,
        spoonCount: spoonCount,
      };
    
      return `Understood. Setting today's spoon count to ${spoonCount}. I'll gently work with that.\n\nMight I suggest:\n${suggestionText}`;
    }
  }

  if (
    newContext.mode === 'low_spoon' &&
    (typeof newContext.spoonCount !== 'number' || isNaN(newContext.spoonCount))
  ) {
    return `We've shifted into Low Spoon Mode, ${newContext.nameCasual}. How many spoons are we working with today? (0 to 12)\nNo rush — we'll go at your pace.`;
  }
  

  // Save current userInput if we're still in chat mode
  if (newContext.mode === 'chat') {
    newContext = {
      ...newContext,
      chatMode: {
        ...(newContext.chatMode || {}),
        lastMessage: userInput,
      },
    };
  }

  const fullPrompt = await buildPromptWithContext([
    ...messageHistory,
    { text: userInput, isUser: true }
  ], newContext); // use updated context here

  try {
    const result = await model.generateContent(fullPrompt);
    let jamesonResponse = result.response.text().replace(/\*/g, '♦');

    // 🧠 Follow-up if returning to Chat Mode
    if (
      lastMode === 'chat' &&
      context.chatMode?.lastMessage &&
      newContext.mode === 'chat'
    ) {
      const followUpLines = [
        `We were discussing "${context.chatMode.lastMessage}", remember?`,
        `Before we switched gears, you said: "${context.chatMode.lastMessage}". Shall we circle back?`,
        `Not to pry, but you did mention "${context.chatMode.lastMessage}". Still relevant?`
      ];
      const followUp = followUpLines[Math.floor(Math.random() * followUpLines.length)];
      jamesonResponse += `\n\n${followUp}`;
    }

    return jamesonResponse;
  } catch (error) {
    console.error('[Jameson] API Error:', error);
    return "Apologies, the silver polish appears to be tarnished.";
  }
}

export default generateResponse;
