import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { apiService } from '../../services/apiService';
import { voiceService } from '../../services/voiceService';

export default function ElderHome() {
    const [isListening, setIsListening] = useState(false);

    const handleSOS = async () => {
        try {
            await apiService.alert.triggerEmergency("user_elder_1");
            Alert.alert("Emergency Triggered", "We are calling your family and emergency services now.");
        } catch (e) {
            Alert.alert("Error", "Could not trigger emergency system.");
        }
    };

    const handleVoiceTap = async () => {
        if (isListening) return;
        setIsListening(true);
        try {
            const ok = await voiceService.startRecording();
            if (!ok) {
                Alert.alert("Permission Required", "Please allow microphone access in Settings.");
                return;
            }

            // Record for 4 seconds then process
            setTimeout(async () => {
                const uri = await voiceService.stopRecording();
                if (uri) {
                    const result = await apiService.medicine.processVoice(uri, 'general', {});
                    voiceService.speak(result.response || "I hear you!");
                    if (result.response) {
                        Alert.alert("Sahyogi says:", result.response);
                    }
                }
                setIsListening(false);
            }, 4000);

        } catch (e) {
            Alert.alert("Error", "Voice pipeline failed. Please try again.");
            setIsListening(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.greeting}>Namaste!</Text>
            <Text style={styles.subtext}>I am Sahyogi, your companion.</Text>

            <TouchableOpacity
                style={[styles.sosButton, { opacity: isListening ? 0.5 : 1 }]}
                onPress={handleSOS}
            >
                <Text style={styles.sosText}>HELP (SOS)</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.voiceButton}
                onPress={handleVoiceTap}
                disabled={isListening}
            >
                <Text style={styles.voiceText}>
                    {isListening ? "🔴 Listening... (4s)" : "🎤 Tap to Speak to Sahyogi"}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    greeting: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#2C3E50',
    },
    subtext: {
        fontSize: 24,
        color: '#7F8C8D',
        marginBottom: 60,
    },
    sosButton: {
        backgroundColor: '#E74C3C',
        width: 250,
        height: 250,
        borderRadius: 125,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#E74C3C',
        shadowOpacity: 0.5,
        shadowRadius: 15,
        marginBottom: 40,
    },
    sosText: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: 'bold',
    },
    voiceButton: {
        backgroundColor: '#3498DB',
        paddingVertical: 20,
        paddingHorizontal: 40,
        borderRadius: 30,
    },
    voiceText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '600',
    }
});
