import * as Speech from 'expo-speech';

// In a real app run on a physical device, you would use a Voice Recognition library like @react-native-voice/voice
// to actively listen in the background for the wake word "Sahyogi".
// Since we are creating a stub for the demo, we mock the Text Input.

export const processVoiceCommand = async (textInput) => {
    const text = textInput.toLowerCase();
    
    // Check if the wake word is included 
    // Usually, the wake word initiates the listening sequence, here we assume the text contains the full sentence
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
        // Would also invoke triggerEmergency() here
    } else if (command.includes("medicine")) {
        responseText = "It is time to take your blood pressure pill.";
    } else {
        // Fallback to LLM (e.g., Gemini)
        console.log("No local command matched. Forwarding to Gemini LLM...");
        responseText = "I am not sure about that, but let me check my knowledge base.";
        // TODO: Call Gemini API
    }

    // Speak it back to the Elder
    Speech.speak(responseText, { language: 'en-IN' }); // Indian English accent for Sahyogi theme
    
    return responseText;
};
