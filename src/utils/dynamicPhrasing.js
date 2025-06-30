import generateResponse from '../logic/generateResponse.js';

export async function getDynamicSuggestion(mode = "low_spoon", settings = {}, context = "") {
    let prompt = "";

    prompt = `Give a short, clear, actionable suggestion for ${mode.replace("_", " ")} mode using modern dry wit. 
    Keep it under 15 words. Do not mention anime, shows, or music unless explicitly relevant in the context. No affectionate nicknames, no fluff.`;
    
    
    
    
    
    const { replyText } = await generateResponse(prompt, mode, settings, context);

    return replyText;
}

export async function getDynamicReflection(mode = "partner_support", settings = {}, context = "") {
    const prompt = "Please provide a short, reflective prompt for the user in " + mode.replace("_", " ") + " mode, helping them consider their needs, emotions, or connection with their partner today.";

    const { replyText } = await generateResponse(prompt, mode, settings, context);

    return replyText;
}

export async function getDynamicPhrase(type = "encouragement", mode = "default", settings = {}, context = "") {
    const prompt = `Please generate a ${type} phrase for the user in ${mode.replace("_", " ")} mode to help them feel supported without pressure.`;

    const { replyText } = await generateResponse(prompt, mode, settings, context);

    return replyText;
}
