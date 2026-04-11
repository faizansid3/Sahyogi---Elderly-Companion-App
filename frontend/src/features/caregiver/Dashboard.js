import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, SafeAreaView, Dimensions, Alert } from 'react-native';
import { getCaregiverDashboard } from '../../services/api';
import MedicineManager from './MedicineManager';

const { width } = Dimensions.get('window');

export default function Dashboard({ managerId, onGoToElder }) {
    const [metrics, setMetrics] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [showMedicineManager, setShowMedicineManager] = useState(false);
    
    const loadData = async () => {
        if (!managerId) return;
        try {
            const data = await getCaregiverDashboard(managerId);
            setMetrics(data);
            setIsOffline(data?.isOffline || false);
        } catch (e) {
            console.error("Failed to load dashboard data");
            setIsOffline(true);
        }
    };

    useEffect(() => {
        loadData();
        // Polling every 5 seconds for real-time vibe
        const interval = setInterval(() => loadData(), 5000);
        return () => clearInterval(interval);
    }, [managerId]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    if (showMedicineManager) {
        // Full screen component for adding medicine
        return <MedicineManager elderId={metrics?.elder_id} onClose={() => { setShowMedicineManager(false); loadData(); }} />;
    }

    if (metrics?.no_elder) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{fontSize: 20, textAlign: 'center'}}>No Assisted User Found. Please restart and complete Elder Setup.</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Status can be derived from recent alerts, for now simple default based on falls
    const recentFall = metrics?.recent_alerts?.find(a => a.event_type === "fall" && (Date.now()/1000 - a.timestamp) < 300);
    const currentStatus = recentFall ? "Fall Detected!" : "Safe"; 

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView 
                style={styles.container}
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Sahyogi Dashboard</Text>
                    {isOffline && (
                        <TouchableOpacity style={styles.offlineBadge} onPress={loadData}>
                            <Text style={styles.offlineText}>OFFLINE - TAP TO RETRY</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Section 1: Live Feed */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Live Camera Feed</Text>
                    <View style={styles.cameraPlaceholder}>
                        <Text style={styles.cameraTitle}>Living Room Camera</Text>
                        <Text style={styles.cameraSubtext}>Status: <Text style={{ color: currentStatus === 'Safe' ? '#2ECC71' : '#E74C3C', fontWeight: 'bold' }}>{currentStatus}</Text></Text>
                    </View>
                </View>

                {/* Section 2: Daily Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Daily Summary</Text>
                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryCard}>
                            <Text style={styles.cardEmoji}>💧</Text>
                            <Text style={styles.cardValue}>{metrics?.daily_summary?.water_intake_ml || 0} ml</Text>
                            <Text style={styles.cardLabel}>Water Intake</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={styles.cardEmoji}>🏃‍♂️</Text>
                            <Text style={styles.cardValue}>{metrics?.daily_summary?.active_minutes || 0} min</Text>
                            <Text style={styles.cardLabel}>Activity</Text>
                        </View>
                        <View style={[styles.summaryCard, { width: width - 40, marginTop: 15 }]}>
                            <Text style={styles.cardEmoji}>💊</Text>
                            <Text style={styles.cardValue}>{metrics?.daily_summary?.medicine_taken || 0} Taken / {metrics?.daily_summary?.medicine_missed || 0} Missed</Text>
                            <Text style={styles.cardLabel}>Medicine Adherence</Text>
                        </View>
                    </View>
                </View>

                {/* New Section: Reminders */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Upcoming Medicines</Text>
                    {metrics?.medicines?.length > 0 ? (
                        metrics.medicines.map((med, index) => (
                            <View key={index} style={styles.alertItem}>
                                <Text style={[styles.alertTypeText, { color: '#3498DB' }]}>{med.name} ({med.dosage})</Text>
                                <Text style={styles.alertTimeText}>{med.time} - Status: {med.status.toUpperCase()}</Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.noAlertsItem}>
                            <Text style={[styles.noAlertsText, { color: '#7F8C8D' }]}>No medicines scheduled.</Text>
                        </View>
                    )}
                </View>

                {/* Section 3: Alerts */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Alerts</Text>
                    {metrics?.recent_alerts?.length > 0 ? (
                        metrics.recent_alerts.map((alert, index) => (
                            <View key={index} style={styles.alertItem}>
                                <Text style={styles.alertTypeText}>{alert.type || alert.event_type}</Text>
                                <Text style={styles.alertTimeText}>{new Date(alert.timestamp * 1000).toLocaleTimeString()}</Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.noAlertsItem}>
                            <Text style={styles.noAlertsText}>No alerts today. Everything is normal.</Text>
                        </View>
                    )}
                </View>

                {/* Section 4: Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.actionBtn}>
                            <Text style={styles.actionBtnText}>⏸ Pause Cam</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnAlt]} onPress={() => setShowMedicineManager(true)}>
                            <Text style={styles.actionBtnTextAlt}>+ Add Reminder</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.testElderBtn} onPress={onGoToElder}>
                        <Text style={styles.testElderBtnText}>View Elder Interface (Demo)</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
    container: { flex: 1, paddingHorizontal: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 25 },
    headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#2C3E50' },
    offlineBadge: { backgroundColor: '#E74C3C', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
    offlineText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
    section: { marginBottom: 25 },
    sectionTitle: { fontSize: 20, fontWeight: '700', color: '#34495E', marginBottom: 12 },
    cameraPlaceholder: { height: 180, backgroundColor: '#2C3E50', borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
    cameraTitle: { color: '#ECF0F1', fontSize: 18, fontWeight: '600' },
    cameraSubtext: { color: '#BDC3C7', fontSize: 14, marginTop: 5 },
    summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    summaryCard: { width: (width - 55) / 2, backgroundColor: '#FFF', borderRadius: 16, padding: 15, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    cardEmoji: { fontSize: 28, marginBottom: 8 },
    cardValue: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
    cardLabel: { fontSize: 12, color: '#7F8C8D', marginTop: 4 },
    alertItem: { backgroundColor: '#FFF', borderLeftWidth: 5, borderLeftColor: '#E74C3C', padding: 15, borderRadius: 10, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    alertTypeText: { fontWeight: 'bold', fontSize: 16, color: '#E74C3C' },
    alertTimeText: { fontSize: 12, color: '#95A5A6', marginTop: 4 },
    noAlertsItem: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E9ECEF' },
    noAlertsText: { color: '#27AE60', fontSize: 14, fontWeight: '500' },
    actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    actionBtn: { width: (width - 55) / 2, backgroundColor: '#BDC3C7', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
    actionBtnAlt: { backgroundColor: '#3498DB' },
    actionBtnText: { color: '#2C3E50', fontWeight: '600', fontSize: 14 },
    actionBtnTextAlt: { color: '#FFF', fontWeight: '600', fontSize: 14 },
    testElderBtn: { backgroundColor: '#9B59B6', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
    testElderBtnText: { color: '#FFF', fontWeight: 'bold' }
});
