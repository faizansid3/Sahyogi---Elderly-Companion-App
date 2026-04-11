import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { triggerEmergency } from '../../services/api';
import { processVoiceCommand } from '../../services/voice';

export default function ElderHome() {
    const [isListening, setIsListening] = useState(false);

    const handleSOS = async () => {
        try {
            await triggerEmergency("user_elder_1");
            Alert.alert("Emergency Triggered", "We are calling your family and emergency services now.");
        } catch (e) {
            Alert.alert("Error", "Could not trigger emergency system.");
        }
    };

    const handleVoiceMock = async () => {
        setIsListening(true);
        // Simulate listening for 2 seconds then trigger a mock Sahyogi wake word
        setTimeout(async () => {
            const response = await processVoiceCommand("sahyogi, I need my medicine");
            Alert.alert("Sahyogi Response", response);
            setIsListening(false);
        }, 2000);
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
                onPress={handleVoiceMock}
                disabled={isListening}
            >
                <Text style={styles.voiceText}>
                    {isListening ? "Listening for 'Sahyogi'..." : "Tap to Speak (or say Sahyogi)"}
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
