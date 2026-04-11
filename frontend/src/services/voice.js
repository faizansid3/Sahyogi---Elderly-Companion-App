import * as Speech from 'expo-speech';

// Replace with a valid API key, loaded from .env
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export const generateGeminiResponse = async (prompt) => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "your_gemini_api_key_here") {
        console.warn("Gemini API Key missing, falling back to mock response");
        return "I am currently disconnected from my brain. Please configure the API key in the environment variables.";
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `You are Sahyogi, a friendly, supportive, and simple-language AI companion for an elderly person. Keep responses short and conversational. User prompt: ${prompt}` }]
                }]
            })
        });
        
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (e) {
        console.error("Gemini API Error:", e);
        return "I am having trouble thinking right now. Please try again later.";
    }
};

export const processVoiceCommand = async (textInput) => {
    const text = textInput.toLowerCase();
    
    // Check if the wake word is included 
    if (!text.includes("sahyogi")) {
      return "Wake word Sahyogi not detected.";
    }

    // Strip out wake word
    const command = text.replace("sahyogi", "").trim();

    console.log("Processing command:", command);

    let responseText = "";

    // Local Regex / Hybrid Rule Matching First
    if (command.includes("help") || command.includes("emergency")) {
        responseText = "I am calling the emergency contacts right now. Please stay calm.";
    } else {
        responseText = await generateGeminiResponse(command);
    }

    Speech.speak(responseText, { language: 'en-IN' }); 
    return responseText;
};

export const speak = (text) => {
    Speech.speak(text, { language: 'en-IN' });
};
