import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildPromptWithContext } from '../prompts/buildPromptWithContext';
import { detectContextualMode } from '../utils/modeDetect.js';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_PRO_KEY);

export async function generateResponse(userInput, messageHistory, context) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  const detectedMode = detectContextualMode(userInput);
  const lastMode = context.mode !== 'chat' ? context.mode : null;

  let newContext = { ...context };

  // Update mode if needed
  if (detectedMode && detectedMode !== context.mode) {
    newContext = {
      ...context,
      lastMode,
      mode: detectedMode,
    };
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
