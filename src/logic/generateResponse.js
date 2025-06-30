const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export async function generateResponse(prompt, mode = 'default', settings = {}, additionalContext = '') {
    const apiUrl = "https://api.groq.com/openai/v1/chat/completions";

    const systemPrompt = `You are AELI, (ay-lee) an Adaptive Executive-Life Interface with the warm, dry wit of a British butler like Alfred or Jarvis. You speak calmly, with warmth, gentle humor, and a touch of cheekiness. Keep responses short, clear, and comforting, suitable for a neurodivergent user seeking gentle support and companionship. Mode: ${mode}. ${additionalContext}`;

    const body = {
        model: "llama3-70b-8192",  // Stable Groq-supported model
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
        ]
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        const replyText = data.choices?.[0]?.message?.content || "AELI couldn't generate a response right now.";

        let newContext = {};

        if (replyText.toLowerCase().includes('focus mode')) {
            newContext.mode = 'focus';
        } else if (replyText.toLowerCase().includes('low spoon mode')) {
            newContext.mode = 'low_spoon';
        } else if (replyText.toLowerCase().includes('partner mode')) {
            newContext.mode = 'partner_support';
        } else if (replyText.toLowerCase().includes('crisis mode')) {
            newContext.mode = 'crisis';
        }

        return { replyText, newContext };

    } catch (error) {
        console.error('AELI generateResponse (Groq) error:', error);
        return { replyText: "AELI is having trouble formulating a response (Groq).", newContext: {} };
    }
}

export default generateResponse;
