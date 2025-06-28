import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildPromptWithContext } from '../prompts/buildPromptWithContext';
import { detectContextualMode } from '../utils/modeDetect.js';
import { parseSpoonCount } from '../utils/parseSpoonCount.js';
import { getSpoonSuggestions } from '../utils/getSpoonSuggestions.js';
import { getRandomSpoonReply } from '../utils/spoonReplies.js';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_PRO_KEY);

export async function generateResponse(userInput, messageHistory, context) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  const detectedMode = detectContextualMode(userInput);
  const lastMode = context.mode !== 'chat' ? context.mode : null;

  let newContext = { ...context };

  // Update mode if detected different
  if (detectedMode && detectedMode !== context.mode) {
    newContext = {
      ...newContext,
      lastMode,
      mode: detectedMode,
    };
  }

  // Check for spoonCount in input
  const spoonCount = parseSpoonCount(userInput);
  console.log('[AELI DEBUG] Parsed spoonCount:', spoonCount);
  // ...
  
  if (newContext.mode === 'low_spoon' && spoonCount !== null) {
    const suggestions = getSpoonSuggestions(spoonCount);
    const suggestionText = suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n');
  
    newContext = {
      ...newContext,
      spoonCount,
    };
  
    return {
      replyText: `${getRandomSpoonReply(spoonCount)}\n\nMight I suggest:\n${suggestionText}`,
      newContext,
      spoonCount,
    };
  }
  

  if (
    newContext.mode === 'low_spoon' &&
    (typeof newContext.spoonCount !== 'number' || isNaN(newContext.spoonCount))
  ) {
    return {
      replyText: `We've shifted into Low Spoon Mode, ${newContext.nameCasual}. How many spoons are we working with today? (0 to 12)\nNo rush — we'll go at your pace.`,
      newContext,
      spoonCount: null,
    };
  }

  // Save current userInput if in chat mode
  if (newContext.mode === 'chat') {
    newContext = {
      ...newContext,
      chatMode: {
        ...(newContext.chatMode || {}),
        lastMessage: userInput,
      },
    };
  }

  const fullPrompt = await buildPromptWithContext(
    [...messageHistory, { text: userInput, isUser: true }],
    newContext
  );

  try {
    const result = await model.generateContent(fullPrompt);
    let AELIResponse = result.response.text().replace(/\*/g, '♦');

    // Follow-up if returning to Chat Mode
    if (
      lastMode === 'chat' &&
      context.chatMode?.lastMessage &&
      newContext.mode === 'chat'
    ) {
      const followUpLines = [
        `We were discussing "${context.chatMode.lastMessage}", remember?`,
        `Before we switched gears, you said: "${context.chatMode.lastMessage}". Shall we circle back?`,
        `Not to pry, but you did mention "${context.chatMode.lastMessage}". Still relevant?`,
      ];
      const followUp =
        followUpLines[Math.floor(Math.random() * followUpLines.length)];
      AELIResponse += `\n\n${followUp}`;
    }

    return {
      replyText: AELIResponse,
      newContext,
      spoonCount: null,
    };
  } catch (error) {
    console.error('[AELI] API Error:', error);
    return {
      replyText: "Apologies, the silver polish appears to be tarnished.",
      newContext,
      spoonCount: null,
    };
  }
}

export default generateResponse;
