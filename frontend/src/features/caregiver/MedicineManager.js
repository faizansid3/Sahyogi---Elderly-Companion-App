import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { addMedicine } from '../../services/api';

export default function MedicineManager({ elderId, onClose }) {
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [time, setTime] = useState(''); // e.g. "08:00 AM"

    const handleSave = async () => {
        if (!name || !dosage || !time) {
            Alert.alert("Missing Fields", "Please complete all medicine details.");
            return;
        }
        try {
            await addMedicine({ elder_id: elderId, name, dosage, time });
            Alert.alert("Success", "Medicine reminder added successfully!");
            onClose(); // go back to dashboard
        } catch (e) {
            Alert.alert("Error", "Could not add medicine reminder. Check network.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Add Medicine Alarm</Text>
            </View>

            <ScrollView style={styles.formContainer}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Medicine Name</Text>
                    <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Aspirin" />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Dosage</Text>
                    <TextInput style={styles.input} value={dosage} onChangeText={setDosage} placeholder="e.g. 1 Pill" />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Time (Format: HH:MM AM/PM)</Text>
                    <TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="e.g. 08:00 AM" />
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Text style={styles.saveBtnText}>Save Alarm</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#ECF0F1' },
    backBtn: { marginRight: 15 },
    backBtnText: { color: '#3498DB', fontSize: 16, fontWeight: 'bold' },
    title: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50' },
    formContainer: { padding: 20 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#34495E', marginBottom: 8 },
    input: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E9ECEF', borderRadius: 10, padding: 15, fontSize: 16 },
    saveBtn: { backgroundColor: '#2C3E50', paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginTop: 20 },
    saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});
