import { detectContextualMode } from '../utils/modeDetect.js';
import { parseSpoonCount } from '../utils/parseSpoonCount.js';

export async function handleAIResponse(userInput, messageHistory, context) {
  console.log('[AELI DEBUG] mode:', context.mode, '| input:', userInput);

  const detectedMode = detectContextualMode(userInput);
  const lastMode = context.mode !== 'chat' ? context.mode : null;
  let newContext = { ...context };

  if (detectedMode && detectedMode !== context.mode) {
    newContext = { ...newContext, lastMode, mode: detectedMode };
  }

  const spoonCount = parseSpoonCount(userInput);
  console.log('[AELI DEBUG] Parsed spoonCount:', spoonCount);

  if (newContext.mode === 'low_spoon' && spoonCount !== null) {
    newContext = { ...newContext, spoonCount };
    return {
      replyText: `Spoons logged: ${spoonCount} 🥄`,
      newContext,
      spoonCount
    };
  }

  if (newContext.mode === 'low_spoon' && (typeof newContext.spoonCount !== 'number' || isNaN(newContext.spoonCount))) {
    return {
      replyText: `We've shifted into Low Spoon Mode, ${newContext.nameCasual}. How many spoons are we working with today? (0 to 12)\nNo rush — we'll go at your pace.`,
      newContext,
      spoonCount: null
    };
  }

  if (newContext.mode === 'chat') {
    newContext = {
      ...newContext,
      chatMode: {
        ...(newContext.chatMode || {}),
        lastMessage: userInput,
      },
    };

    return {
      replyText: `Understood, ${newContext.nameCasual}. Let's chat.`,
      newContext,
      spoonCount: null
    };
  }

  console.log('[AELI RETURN FALLBACK]', { newContext, spoonCount: null });
  return { newContext, spoonCount: null };
  }
