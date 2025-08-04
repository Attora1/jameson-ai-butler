import axios from 'axios';
import db from './db.js';

async function analyzeAndSaveFacts(userInput, replyText) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    const apiUrl = "https://api.groq.com/openai/v1/chat/completions";

    if (!apiKey) {
      console.error('[autoSaveFacts] Groq API key is not configured.');
      return;
    }

    const analysisPrompt = `
      Analyze the following conversation and identify any new facts about the user that should be saved for future reference.
      Your response MUST be a JSON object with a single key, "facts", which is an array of strings. Each string should be a new fact.
      If no new facts are found, respond with an empty array: {"facts": []}.
      DO NOT include any conversational text or markdown outside the JSON object.

      Conversation:
      [User] ${userInput}
      [AELI] ${replyText}
    `;

    const body = {
      model: "llama3-8b-8192",
      messages: [
        { role: "system", content: analysisPrompt },
      ],
      temperature: 0.2,
    };

    const response = await axios.post(apiUrl, body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      timeout: 10000 // 10 seconds
    });

    const result = JSON.parse(response.data.choices?.[0]?.message?.content);

    if (result && result.facts && result.facts.length > 0) {
      result.facts.forEach(fact => {
        db.facts.insert({ fact, timestamp: new Date() });
      });
      console.log(`[autoSaveFacts] Saved ${result.facts.length} new fact(s).`);
    }

  } catch (error) {
    console.error('[autoSaveFacts] Error analyzing conversation:', error.response?.data || error.message);
  }
}

export { analyzeAndSaveFacts };
