/**
 * voice.js — TTS-only helper (legacy compatibility shim)
 * 
 * ⚠️  generateGeminiResponse() and processVoiceCommand() have been REMOVED.
 *     All AI processing is handled server-side via POST /speech-to-text.
 *     Use voiceService.js for recording and TTS.
 *     Use apiService.js → medicine.processVoice() for the full pipeline.
 */
import * as Speech from 'expo-speech';

export const speak = (text) => {
    if (!text) return;
    Speech.speak(text, { language: 'en-IN', rate: 0.9 });
};
