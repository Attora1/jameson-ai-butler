import { getDynamicSuggestion } from './dynamicPhrasing.js';

// Wrapper to get a dynamic suggestion from Gemini for Low Spoon or other modes
export async function getSpoonSuggestionDynamic(mode = "low_spoon", settings = {}, context = "") {
    try {
        const suggestion = await getDynamicSuggestion(mode, settings, context);
        return suggestion || "Take a gentle moment to breathe and rest.";
    } catch (error) {
        console.error("Error fetching dynamic spoon suggestion:", error);
        return "Take a gentle moment to breathe and rest.";
    }
}

export default getSpoonSuggestionDynamic;
