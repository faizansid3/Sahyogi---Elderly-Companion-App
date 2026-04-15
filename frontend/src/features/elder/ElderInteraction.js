import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    SafeAreaView, ScrollView, ActivityIndicator, Animated
} from 'react-native';
import { apiService } from '../../services/apiService';
import { voiceService, requestMicPermission } from '../../services/voiceService';

// Status constants
const S = {
    IDLE: 'IDLE',
    REMINDING: 'REMINDING',
    RECORDING: 'RECORDING',
    PROCESSING: 'PROCESSING',
};

export default function ElderInteraction({ myElderId, onGoBack }) {
    const [status, setStatus] = useState(S.IDLE);
    const [messages, setMessages] = useState([
        { role: 'ai', text: "Namaste! I am Sahyogi. Tap the mic to talk to me anytime 🙏" }
    ]);
    const [activeMed, setActiveMed] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    // Use a ref to always have the CURRENT status in async callbacks (avoids stale closures)
    const statusRef = useRef(S.IDLE);
    const activeMedRef = useRef(null);
    const retryCountRef = useRef(0);
    const lastTriggered = useRef(new Set());
    const silenceTimer = useRef(null);

    // Keeps refs in sync with state
    const updateStatus = useCallback((s) => {
        statusRef.current = s;
        setStatus(s);
    }, []);

    const updateActiveMed = useCallback((m) => {
        activeMedRef.current = m;
        setActiveMed(m);
    }, []);

    const addMessage = useCallback((role, text) => {
        setMessages(prev => [...prev, { role, text }]);
    }, []);

    // Request mic permissions immediately on mount
    useEffect(() => {
        requestMicPermission().then(granted => {
            if (!granted) {
                addMessage('ai', '⚠️ Microphone permission was denied. Please enable it in Settings to use voice.');
            }
        });
    }, []);

    // ──────────────────────────────────────────
    // BACKGROUND ALARM MONITOR (every 30s)
    // ──────────────────────────────────────────
    useEffect(() => {
        const checkAlarms = async () => {
            if (!myElderId || statusRef.current !== S.IDLE) return;
            try {
                const res = await apiService.elder.getMedicines(myElderId);
                const meds = res.medicines || [];

                const now = new Date();
                const hh = String(now.getHours()).padStart(2, '0');
                const mm = String(now.getMinutes()).padStart(2, '0');
                const currentTime24 = `${hh}:${mm}`;

                for (const med of meds) {
                    if (med.status !== 'pending') continue;
                    if (lastTriggered.current.has(med.mid)) continue;

                    // Normalize stored time to 24h for comparison
                    const medTime = normalizeTo24h(med.time);
                    if (medTime === currentTime24) {
                        lastTriggered.current.add(med.mid);
                        triggerReminder(med);
                    }
                }
            } catch (e) {
                // Silent fail — alarm check is background
            }
        };

        const interval = setInterval(checkAlarms, 30000);
        checkAlarms();
        return () => clearInterval(interval);
    }, [myElderId]);

    // ──────────────────────────────────────────
    // ALARM → SPEAK → RECORD
    // ──────────────────────────────────────────
    const triggerReminder = useCallback((med) => {
        voiceService.stopSpeaking();
        updateActiveMed(med);
        retryCountRef.current = 0;
        setRetryCount(0);
        updateStatus(S.REMINDING);

        const text = `Reminder: It's time for your ${med.name}, ${med.dosage}. Have you taken it?`;
        addMessage('ai', text);

        voiceService.speak(text, () => {
            startRecording('reminder');
        });
    }, []);

    // ──────────────────────────────────────────
    // RECORDING
    // ──────────────────────────────────────────
    const startRecording = useCallback(async (mode = 'general') => {
        if (silenceTimer.current) clearTimeout(silenceTimer.current);
        updateStatus(S.RECORDING);

        const ok = await voiceService.startRecording();
        if (!ok) {
            addMessage('ai', '🎤 Could not access microphone. Please check app permissions in your phone Settings.');
            updateStatus(S.IDLE);
            return;
        }

        // Auto-stop after 5 seconds
        silenceTimer.current = setTimeout(() => {
            processRecording(mode);
        }, 5000);
    }, []);

    const handleManualStop = useCallback(() => {
        if (statusRef.current !== S.RECORDING) return;
        if (silenceTimer.current) clearTimeout(silenceTimer.current);
        const mode = activeMedRef.current ? 'reminder' : 'general';
        processRecording(mode);
    }, []);

    // ──────────────────────────────────────────
    // STOP → UPLOAD → AI RESPONSE
    // ──────────────────────────────────────────
    const processRecording = useCallback(async (mode) => {
        // Check via ref (not stale state)
        if (statusRef.current !== S.RECORDING) return;
        updateStatus(S.PROCESSING);

        const uri = await voiceService.stopRecording();

        if (!uri) {
            addMessage('ai', "I couldn't hear anything. Please tap 🎤 and try again.");
            updateStatus(S.IDLE);
            return;
        }

        try {
            const context = activeMedRef.current
                ? { name: activeMedRef.current.name, dosage: activeMedRef.current.dosage }
                : {};

            const result = await apiService.medicine.processVoice(uri, mode, context);

            // Show what user said
            if (result.user_text) {
                addMessage('user', result.user_text);
            }

            // Show + speak AI response
            const aiText = result.response || "I heard you!";
            addMessage('ai', aiText);

            voiceService.speak(aiText, () => {
                handleIntent(result.intent, mode);
            });

        } catch (e) {
            console.error("Voice pipeline error:", e.message);
            addMessage('ai', "Sorry, I had trouble processing that. Please try again.");
            updateStatus(S.IDLE);
        }
    }, []);

    // ──────────────────────────────────────────
    // INTENT DECISION ENGINE
    // ──────────────────────────────────────────
    const handleIntent = useCallback(async (intent, mode) => {
        const med = activeMedRef.current;

        if (intent === 'taken' && med) {
            try {
                await apiService.medicine.updateStatus(med.mid, 'taken');
                addMessage('ai', `✅ Medicine recorded as taken. Well done!`);
            } catch (_) { }
            updateActiveMed(null);
            updateStatus(S.IDLE);
        }
        else if (intent === 'not_taken') {
            updateStatus(S.IDLE);
        }
        else if (intent === 'unclear') {
            const nextRetry = retryCountRef.current + 1;
            retryCountRef.current = nextRetry;
            setRetryCount(nextRetry);

            if (nextRetry >= 2) {
                await triggerEmergency();
            } else {
                const retryText = "Sorry, I didn't catch that. Could you say it again?";
                addMessage('ai', retryText);
                voiceService.speak(retryText, () => {
                    startRecording(mode);
                });
            }
        }
        else {
            // 'normal' intent - just respond
            updateStatus(S.IDLE);
        }
    }, []);

    const triggerEmergency = useCallback(async () => {
        const sosText = "I couldn't confirm your response. Alerting your caregiver now!";
        addMessage('ai', sosText);
        voiceService.speak(sosText);
        try {
            await apiService.alert.triggerEmergency(myElderId);
        } catch (_) { }
        updateActiveMed(null);
        updateStatus(S.IDLE);
    }, [myElderId]);

    // ──────────────────────────────────────────
    // UI
    // ──────────────────────────────────────────
    const handleMicPress = useCallback(() => {
        if (status === S.IDLE) {
            startRecording('general');
        } else if (status === S.RECORDING) {
            handleManualStop();
        }
    }, [status]);

    const scrollRef = useRef();

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onGoBack} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>← Exit</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sahyogi Assistant</Text>
                <View style={[styles.statusDot, { backgroundColor: statusColors[status] }]} />
            </View>

            {/* Chat */}
            <ScrollView
                ref={scrollRef}
                style={styles.chat}
                contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
                onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
                {messages.map((msg, i) => (
                    <View key={i} style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                        <Text style={[styles.bubbleText, msg.role === 'user' ? styles.userText : styles.aiText]}>
                            {msg.text}
                        </Text>
                    </View>
                ))}
                {status === S.PROCESSING && (
                    <View style={styles.aiBubble}>
                        <ActivityIndicator size="small" color="#3498DB" />
                    </View>
                )}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.hint}>
                    {status === S.IDLE && "Tap mic to speak"}
                    {status === S.RECORDING && "🔴 Recording... Tap to send"}
                    {status === S.PROCESSING && "⏳ Thinking..."}
                    {status === S.REMINDING && "💊 Reminder active — auto-listening soon"}
                </Text>

                <TouchableOpacity
                    style={[
                        styles.micBtn,
                        status === S.RECORDING && styles.micActive,
                        (status === S.PROCESSING || status === S.REMINDING) && styles.micDisabled,
                    ]}
                    onPress={handleMicPress}
                    disabled={status === S.PROCESSING || status === S.REMINDING}
                >
                    <Text style={styles.micEmoji}>
                        {status === S.RECORDING ? "⏹" : "🎤"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.sosBtn} onPress={triggerEmergency}>
                    <Text style={styles.sosBtnText}>🚨 EMERGENCY SOS</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// ──────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────
function normalizeTo24h(timeStr) {
    // Converts "08:00 AM" / "3:15 PM" → "08:00" / "15:15"
    if (!timeStr) return '';
    const upper = timeStr.toUpperCase().trim();
    const isPM = upper.includes('PM');
    const isAM = upper.includes('AM');
    const clean = upper.replace('AM', '').replace('PM', '').trim();
    const [hStr, mStr] = clean.split(':');
    let h = parseInt(hStr, 10);
    const m = String(parseInt(mStr, 10)).padStart(2, '0');
    if (isPM && h !== 12) h += 12;
    if (isAM && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
}

const statusColors = {
    IDLE: '#2ECC71',
    RECORDING: '#E74C3C',
    PROCESSING: '#F39C12',
    REMINDING: '#9B59B6',
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F4F7F6' },
    header: {
        flexDirection: 'row', alignItems: 'center', padding: 15,
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E1E4E8'
    },
    backBtn: { padding: 8, backgroundColor: '#F0F3F4', borderRadius: 8, marginRight: 12 },
    backBtnText: { color: '#7F8C8D', fontWeight: 'bold', fontSize: 14 },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', color: '#2C3E50' },
    statusDot: { width: 12, height: 12, borderRadius: 6 },
    chat: { flex: 1 },
    bubble: {
        maxWidth: '85%', padding: 14, borderRadius: 20, marginBottom: 10,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    userBubble: { alignSelf: 'flex-end', backgroundColor: '#3498DB', borderBottomRightRadius: 4 },
    aiBubble: { alignSelf: 'flex-start', backgroundColor: '#FFF', borderBottomLeftRadius: 4 },
    bubbleText: { fontSize: 16, lineHeight: 22 },
    userText: { color: '#FFF' },
    aiText: { color: '#2C3E50' },
    footer: {
        padding: 20, backgroundColor: '#FFF',
        borderTopWidth: 1, borderTopColor: '#E1E4E8', alignItems: 'center'
    },
    hint: { fontSize: 13, color: '#7F8C8D', marginBottom: 14, fontStyle: 'italic' },
    micBtn: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: '#2C3E50', justifyContent: 'center', alignItems: 'center',
        marginBottom: 16, elevation: 6,
        shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6,
    },
    micActive: { backgroundColor: '#E74C3C', transform: [{ scale: 1.1 }] },
    micDisabled: { backgroundColor: '#95A5A6', opacity: 0.6 },
    micEmoji: { fontSize: 34 },
    sosBtn: {
        backgroundColor: '#E74C3C', paddingVertical: 14,
        borderRadius: 12, alignItems: 'center', width: '100%'
    },
    sosBtnText: { color: '#FFF', fontSize: 17, fontWeight: 'bold' }
});
