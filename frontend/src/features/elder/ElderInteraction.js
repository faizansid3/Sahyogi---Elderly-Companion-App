import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, ScrollView } from 'react-native';
import { triggerEmergency, checkMedicineStatus } from '../../services/api';
import { processVoiceCommand, speak, generateGeminiResponse } from '../../services/voice';

// In a real app, this would poll the backend or use Firebase listeners.
export default function ElderInteraction({ myElderId, onGoBack }) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState([
        { role: 'ai', text: "Namaste! I am Sahyogi. How can I help you today?" }
    ]);
    const [activeMedicineContext, setActiveMedicineContext] = useState(null);

    // Mock an alarm trigger logic for the demo (Instead of heavy background timers)
    const triggerSimulatedAlarm = (medName, dosage, mid) => {
        const msgText = `It is time to take ${medName} with ${dosage}.`;
        setTranscript(prev => [...prev, { role: 'ai', text: msgText, isReminder: true }]);
        speak(msgText);
        
        setTimeout(() => {
            const followUpText = "Have you taken your medicine?";
            setTranscript(prev => [...prev, { role: 'ai', text: followUpText }]);
            speak(followUpText);
            setActiveMedicineContext({ mid });
        }, 15000); // Wait 15 seconds instead of 30 for pacing in the demo
    };

    const handleSOS = async () => {
        try {
            const res = await triggerEmergency(myElderId);
            if (res.status === 'offline') {
                 setTranscript(prev => [...prev, { role: 'ai', text: "Emergency triggered in offline mode. Sending SMS to family." }]);
            } else {
                 setTranscript(prev => [...prev, { role: 'ai', text: "Emergency triggered. Calling family." }]);
            }
            speak("Calling for help immediately.");
        } catch (e) {
            console.error("SOS Failed", e);
        }
    };

    const handleVoiceMock = async () => {
        setIsListening(true);
        // Simulate user speaking
        setTimeout(async () => {
             let userText = "";
             
             // Branch logic if we are specifically waiting for a medicine answer
             if (activeMedicineContext) {
                 userText = "Yes, I have taken it."; // Simulate answering YES
                 setTranscript(prev => [...prev, { role: 'user', text: userText }]);
                 
                 // Update adherence to backend
                 await checkMedicineStatus(activeMedicineContext.mid, "taken");
                 setActiveMedicineContext(null);
                 
                 const aiResp = "Excellent, I have updated your daily summary for your Care Manager.";
                 setTranscript(prev => [...prev, { role: 'ai', text: aiResp }]);
                 speak(aiResp);
             } else {
                 userText = "Sahyogi, what is a good recipe for soup?";
                 setTranscript(prev => [...prev, { role: 'user', text: userText }]);
                 
                 // Process conversational LLM command
                 const response = await processVoiceCommand(userText);
                 setTranscript(prev => [...prev, { role: 'ai', text: response }]);
             }
             
             setIsListening(false);
        }, 2000);
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
                        msg.role === 'user' ? styles.userBubble : styles.aiBubble,
                        msg.isReminder && styles.reminderBubble
                    ]}>
                        {msg.isReminder && <Text style={styles.reminderTitle}>⏰ Reminder</Text>}
                        <Text style={styles.messageText}>{msg.text}</Text>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.actionsContainer}>
                {/* Developer Demo button to simulate a clock triggering */}
                <TouchableOpacity onPress={() => triggerSimulatedAlarm("Aspirin", "1 PILL", "mock-med-123")} style={{position: 'absolute', top: -40, alignSelf:'center', padding: 5, backgroundColor: '#ECF0F1', borderRadius: 8}}>
                    <Text style={{fontSize: 10, color: '#7F8C8D'}}>🛠 Demo: Trigger Medicine Alarm</Text>
                </TouchableOpacity>

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
    safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#ECF0F1' },
    backBtn: { padding: 8, backgroundColor: '#ECF0F1', borderRadius: 8, marginRight: 15 },
    backBtnText: { color: '#7F8C8D', fontWeight: 'bold' },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#2C3E50' },
    transcriptContainer: { flex: 1, padding: 20 },
    messageBubble: { maxWidth: '85%', padding: 15, borderRadius: 16, marginBottom: 15 },
    userBubble: { alignSelf: 'flex-end', backgroundColor: '#3498DB', borderBottomRightRadius: 4 },
    aiBubble: { alignSelf: 'flex-start', backgroundColor: '#F0F3F4', borderBottomLeftRadius: 4 },
    reminderBubble: { backgroundColor: '#FCF3CF', borderWidth: 1, borderColor: '#F1C40F' },
    reminderTitle: { fontWeight: 'bold', color: '#D4AC0D', marginBottom: 4 },
    messageText: { fontSize: 16, color: '#2C3E50', lineHeight: 24 },
    actionsContainer: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#ECF0F1', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF' },
    voiceButton: { flex: 1, flexDirection: 'row', backgroundColor: '#2C3E50', paddingVertical: 20, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    voiceIcon: { fontSize: 24, marginRight: 10 },
    voiceText: { color: '#FFF', fontSize: 20, fontWeight: '600' },
    sosButton: { width: 100, backgroundColor: '#E74C3C', paddingVertical: 20, borderRadius: 15, justifyContent: 'center', alignItems: 'center', shadowColor: '#E74C3C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 6 },
    sosText: { color: '#FFF', fontSize: 22, fontWeight: 'bold' }
});
