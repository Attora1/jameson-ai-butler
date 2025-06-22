import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildPromptWithContext } from '../prompts/buildPromptWithContext';
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_PRO_KEY);

export async function generateResponse(userInput, messageHistory, context) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  const fullPrompt = await buildPromptWithContext([
    ...messageHistory,
    { text: userInput, isUser: true }
  ], context);

  try {
    const result = await model.generateContent(fullPrompt);
    return result.response.text().replace(/\*/g, '♦');
  } catch (error) {
    console.error('[Jameson] API Error:', error);
    return "Apologies, the silver polish appears to be tarnished.";
  }
}
export default generateResponse;