import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { apiService } from '../../services/apiService';

export default function MedicineManager({ elderId, onClose }) {
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    
    // Custom TimePicker State
    const [hour, setHour] = useState(8);
    const [min, setMin] = useState(0);
    const [period, setPeriod] = useState('AM');

    const handleTimeChange = (type, delta) => {
        if (type === 'h') {
            let nextH = hour + delta;
            if (nextH > 12) nextH = 1;
            if (nextH < 1) nextH = 12;
            setHour(nextH);
        } else {
            let nextM = min + delta;
            if (nextM >= 60) nextM = 0;
            if (nextM < 0) nextM = 59;
            setMin(nextM);
        }
    };

    const togglePeriod = () => setPeriod(period === 'AM' ? 'PM' : 'AM');

    const handleSave = async () => {
        if (!name || !dosage) {
            Alert.alert("Missing Fields", "Please complete all medicine details.");
            return;
        }

        const formattedTime = `${hour < 10 ? `0${hour}` : hour}:${min < 10 ? `0${min}` : min} ${period}`;
        
        try {
            await apiService.medicine.add({ elder_id: elderId, name, dosage, time: formattedTime });
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

                <View style={[styles.inputGroup, { marginBottom: 30 }]}>
                    <Text style={styles.label}>Alarm Time (Adjust with Arrows)</Text>
                    <View style={styles.timePickerRow}>
                        {/* Hours */}
                        <View style={styles.timeCol}>
                            <TouchableOpacity onPress={() => handleTimeChange('h', 1)}><Text style={styles.arrowText}>▲</Text></TouchableOpacity>
                            <Text style={styles.digitText}>{hour < 10 ? `0${hour}` : hour}</Text>
                            <TouchableOpacity onPress={() => handleTimeChange('h', -1)}><Text style={styles.arrowText}>▼</Text></TouchableOpacity>
                            <Text style={styles.timeLabel}>Hour</Text>
                        </View>
                        
                        <Text style={styles.separator}>:</Text>

                        {/* Minutes */}
                        <View style={styles.timeCol}>
                            <TouchableOpacity onPress={() => handleTimeChange('m', 1)}><Text style={styles.arrowText}>▲</Text></TouchableOpacity>
                            <Text style={styles.digitText}>{min < 10 ? `0${min}` : min}</Text>
                            <TouchableOpacity onPress={() => handleTimeChange('m', -1)}><Text style={styles.arrowText}>▼</Text></TouchableOpacity>
                            <Text style={styles.timeLabel}>Min</Text>
                        </View>

                        {/* AM/PM */}
                        <View style={[styles.timeCol, { marginLeft: 20 }]}>
                            <TouchableOpacity onPress={togglePeriod}><Text style={styles.arrowText}>▲</Text></TouchableOpacity>
                            <Text style={styles.digitText}>{period}</Text>
                            <TouchableOpacity onPress={togglePeriod}><Text style={styles.arrowText}>▼</Text></TouchableOpacity>
                            <Text style={styles.timeLabel}>Period</Text>
                        </View>
                    </View>
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
    saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    
    // TimePicker Styles
    timePickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FA', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#E9ECEF' },
    timeCol: { alignItems: 'center', width: 60 },
    digitText: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginVertical: 10 },
    arrowText: { fontSize: 24, color: '#3498DB', fontWeight: 'bold', padding: 10 },
    separator: { fontSize: 24, fontWeight: 'bold', color: '#BDC3C7', marginHorizontal: 10, marginTop: -25 },
    timeLabel: { fontSize: 10, color: '#95A5A6', fontWeight: '600', textTransform: 'uppercase' }
});
