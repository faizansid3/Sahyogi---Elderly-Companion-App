import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, ScrollView } from 'react-native';
import { triggerEmergency } from '../../services/api';
import { processVoiceCommand } from '../../services/voice';

export default function ElderInteraction({ onGoBack }) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState([
        { role: 'ai', text: "Namaste! I am Sahyogi, your companion. How can I help you today?" }
    ]);

    const handleSOS = async () => {
        try {
            const res = await triggerEmergency("elder_device_1");
            if (res.status === 'offline') {
                 Alert.alert("Emergency (Offline Mode)", "Network unavailable. We are attempting to send a local SMS to your caregiver contacts immediately.");
                 setTranscript(prev => [...prev, { role: 'ai', text: "Emergency triggered in offline mode. Sending SMS to family." }]);
            } else {
                 Alert.alert("Emergency Triggered", "We are calling your family and emergency services now.");
                 setTranscript(prev => [...prev, { role: 'ai', text: "Emergency triggered. Calling family." }]);
            }
        } catch (e) {
            Alert.alert("Error", "Could not trigger emergency system.");
        }
    };

    const handleVoiceMock = async () => {
        setIsListening(true);
        // Simulate user asking a question
        setTimeout(async () => {
             const userText = "Sahyogi, I need my medicine";
             setTranscript(prev => [...prev, { role: 'user', text: userText }]);
             
             const response = await processVoiceCommand(userText);
             setTranscript(prev => [...prev, { role: 'ai', text: response }]);
             setIsListening(false);
        }, 1500);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onGoBack} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Exit Demo</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sahyogi Assistant</Text>
            </View>

            <ScrollView style={styles.transcriptContainer} contentContainerStyle={{ paddingBottom: 20 }}>
                {transcript.map((msg, index) => (
                    <View key={index} style={[
                        styles.messageBubble, 
                        msg.role === 'user' ? styles.userBubble : styles.aiBubble
                    ]}>
                        <Text style={styles.messageText}>{msg.text}</Text>
                    </View>
                ))}
                
                {/* Reminders can be hardcoded here to demonstrate UI */}
                 <View style={[styles.messageBubble, styles.aiBubble, styles.reminderBubble]}>
                     <Text style={styles.reminderTitle}>⏰ Reminder</Text>
                     <Text style={styles.messageText}>Don't forget to drink a glass of water.</Text>
                 </View>
            </ScrollView>

            <View style={styles.actionsContainer}>
                <TouchableOpacity 
                    style={[styles.voiceButton, { opacity: isListening ? 0.6 : 1 }]} 
                    onPress={handleVoiceMock}
                    disabled={isListening}
                >
                    <Text style={styles.voiceIcon}>🎤</Text>
                    <Text style={styles.voiceText}>
                        {isListening ? "Listening..." : "Tap & Speak"}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
                    <Text style={styles.sosText}>HELP</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ECF0F1',
    },
    backBtn: {
        padding: 8,
        backgroundColor: '#ECF0F1',
        borderRadius: 8,
        marginRight: 15,
    },
    backBtnText: {
        color: '#7F8C8D',
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2C3E50',
    },
    transcriptContainer: {
        flex: 1,
        padding: 20,
    },
    messageBubble: {
        maxWidth: '85%',
        padding: 15,
        borderRadius: 16,
        marginBottom: 15,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#3498DB',
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#F0F3F4',
        borderBottomLeftRadius: 4,
    },
    reminderBubble: {
        backgroundColor: '#FCF3CF', // subtle yellow
        borderWidth: 1,
        borderColor: '#F1C40F',
    },
    reminderTitle: {
        fontWeight: 'bold',
        color: '#D4AC0D',
        marginBottom: 4,
    },
    messageText: {
        fontSize: 18,
        color: '#2C3E50',
        lineHeight: 26,
    },
    actionsContainer: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#ECF0F1',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    voiceButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#2C3E50',
        paddingVertical: 20,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    voiceIcon: {
        fontSize: 24,
        marginRight: 10,
    },
    voiceText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '600',
    },
    sosButton: {
        width: 100,
        backgroundColor: '#E74C3C',
        paddingVertical: 20,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#E74C3C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
    },
    sosText: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: 'bold',
    }
});
