import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

let recording = null;
let permissionsGranted = false;

/**
 * Request mic permissions upfront.
 * Called once on component mount before any recording.
 */
export const requestMicPermission = async () => {
    try {
        const { status } = await Audio.requestPermissionsAsync();
        permissionsGranted = status === 'granted';
        console.log('[Voice] Mic permission:', status);
        return permissionsGranted;
    } catch (e) {
        console.error('[Voice] Permission request failed:', e);
        return false;
    }
};

export const voiceService = {
    /**
     * Text-to-Speech using Expo Speech.
     */
    speak: (text, onFinished) => {
        if (!text) return;
        Speech.speak(text, {
            language: 'en-IN',
            rate: 0.9,
            onDone: onFinished,
            onStopped: onFinished,
            onError: (err) => {
                console.error('[TTS] Error:', err);
                if (onFinished) onFinished();
            }
        });
    },

    /**
     * Starts audio recording.
     * Returns true if successful, false if permissions denied or error.
     */
    startRecording: async () => {
        try {
            // Safe cleanup of any stale recording
            if (recording) {
                try { await recording.stopAndUnloadAsync(); } catch (_) {}
                recording = null;
            }

            // Always re-request permissions (safe to call multiple times)
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                console.warn('[Voice] Microphone permission denied!');
                return false;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
            });

            const { recording: newRec } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            recording = newRec;
            console.log('[Voice] Recording started ✅');
            return true;
        } catch (err) {
            console.error('[Voice] startRecording failed:', err.message);
            recording = null;
            return false;
        }
    },

    /**
     * Stops recording and returns the file URI.
     * Returns null if nothing was recorded.
     */
    stopRecording: async () => {
        try {
            if (!recording) {
                console.warn('[Voice] stopRecording: no active recording');
                return null;
            }
            console.log('[Voice] Stopping recording...');
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            recording = null;

            await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

            console.log('[Voice] Recording saved:', uri);
            return uri;
        } catch (err) {
            console.error('[Voice] stopRecording failed:', err.message);
            recording = null;
            return null;
        }
    },

    stopSpeaking: () => {
        try { Speech.stop(); } catch (_) {}
    },

    isRecording: () => recording !== null,
};
