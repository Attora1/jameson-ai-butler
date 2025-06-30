import { buildPromptWithContext } from '../prompts/buildPromptWithContext';
import { detectContextualMode } from '../utils/modeDetect.js';
import { parseSpoonCount } from '../utils/parseSpoonCount.js';
import getSpoonSuggestionDynamic from '../utils/spoonReplies.js';

export async function generateResponse(userInput, messageHistory, context) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  const apiUrl = "https://api.groq.com/openai/v1/chat/completions";


  const detectedMode = detectContextualMode(userInput);
  const lastMode = context.mode !== 'chat' ? context.mode : null;
  let newContext = { ...context };

  if (detectedMode && detectedMode !== context.mode) {
    newContext = { ...newContext, lastMode, mode: detectedMode };
  }

  const spoonCount = parseSpoonCount(userInput);
  console.log('[AELI DEBUG] Parsed spoonCount:', spoonCount);

  if (newContext.mode === 'low_spoon' && spoonCount !== null) {
    const suggestion = await getSpoonSuggestionDynamic("low_spoon", context);
    newContext = { ...newContext, spoonCount };
    return {
      replyText: `Spoons logged: ${spoonCount} 🥄\nHere is a gentle suggestion:\n${suggestion}`,
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
  }

  const fullPrompt = await buildPromptWithContext(
    [...messageHistory, { text: userInput, isUser: true }],
    newContext
  );

  const body = {
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: fullPrompt },
      { role: "user", content: userInput }
    ]
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    let replyText = data.choices?.[0]?.message?.content || "AELI couldn't generate a response right now.";

    if (lastMode === 'chat' && context.chatMode?.lastMessage && newContext.mode === 'chat') {
      const followUpLines = [
        `We were discussing "${context.chatMode.lastMessage}", remember?`,
        `Before we switched gears, you said: "${context.chatMode.lastMessage}". Shall we circle back?`,
        `Not to pry, but you did mention "${context.chatMode.lastMessage}". Still relevant?`,
      ];
      const followUp = followUpLines[Math.floor(Math.random() * followUpLines.length)];
      replyText += `\n\n${followUp}`;
    }

    return { replyText, newContext, spoonCount: null };
  } catch (error) {
    console.error('[AELI] API Error:', error);
    return { replyText: "Apologies, the silver polish appears to be tarnished.", newContext, spoonCount: null };
  }
}

export default generateResponse;
