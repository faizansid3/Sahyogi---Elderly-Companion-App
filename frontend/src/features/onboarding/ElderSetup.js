import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';

export default function ElderSetup({ onComplete }) {
    const [formData, setFormData] = useState({
        elderName: '',
        elderAge: ''
    });

    const handleSave = () => {
        onComplete(formData);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                <Text style={styles.headerTitle}>Elder Details</Text>
                <Text style={styles.subtitle}>Who will you be caring for?</Text>

                <View style={styles.photoUploadPlaceholder}>
                    <Text style={styles.photoPlaceholderText}>📷 Tap to Add Face Data (Optional)</Text>
                </View>
                <Text style={styles.photoHintText}>Face data is used to differentiate the elder from other people in the camera feed.</Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Elder's Name</Text>
                    <TextInput 
                        style={styles.input} 
                        value={formData.elderName}
                        onChangeText={(text) => setFormData({...formData, elderName: text})}
                        placeholder="Jane Doe" 
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Age</Text>
                    <TextInput 
                        style={styles.input} 
                        value={formData.elderAge}
                        keyboardType="numeric"
                        onChangeText={(text) => setFormData({...formData, elderAge: text})}
                        placeholder="78" 
                    />
                </View>

                <TouchableOpacity style={styles.continueBtn} onPress={handleSave}>
                    <Text style={styles.continueBtnText}>Save & Start Monitoring</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        flex: 1,
        paddingHorizontal: 25,
        paddingTop: 30,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#2C3E50',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#7F8C8D',
        marginBottom: 35,
    },
    photoUploadPlaceholder: {
        height: 150,
        backgroundColor: '#F8F9FA',
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#E9ECEF',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    photoPlaceholderText: {
        color: '#95A5A6',
        fontSize: 16,
        fontWeight: '500',
    },
    photoHintText: {
        fontSize: 12,
        color: '#BDC3C7',
        marginBottom: 30,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#34495E',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F8F9FA',
        borderWidth: 1,
        borderColor: '#E9ECEF',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        color: '#2C3E50',
    },
    continueBtn: {
        backgroundColor: '#27AE60',
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#27AE60',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    continueBtnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    }
});
