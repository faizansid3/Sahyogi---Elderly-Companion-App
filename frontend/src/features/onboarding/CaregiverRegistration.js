import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';

export default function CaregiverRegistration({ onComplete }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [emergencyContacts, setEmergencyContacts] = useState(['']);

    const addContactField = () => {
        setEmergencyContacts([...emergencyContacts, '']);
    };

    const updateContact = (index, value) => {
        const newContacts = [...emergencyContacts];
        newContacts[index] = value;
        setEmergencyContacts(newContacts);
    };

    const handleContinue = () => {
        // Validate and save in a real application
        onComplete({ ...formData, emergencyContacts });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                <Text style={styles.headerTitle}>Welcome to Sahyogi</Text>
                <Text style={styles.subtitle}>Let's set up your Caregiver Profile</Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Your Name</Text>
                    <TextInput 
                        style={styles.input} 
                        value={formData.name}
                        onChangeText={(text) => setFormData({...formData, name: text})}
                        placeholder="John Doe" 
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput 
                        style={styles.input} 
                        value={formData.email}
                        keyboardType="email-address"
                        onChangeText={(text) => setFormData({...formData, email: text})}
                        placeholder="john@example.com" 
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput 
                        style={styles.input} 
                        value={formData.phone}
                        keyboardType="phone-pad"
                        onChangeText={(text) => setFormData({...formData, phone: text})}
                        placeholder="+91 9876543210" 
                    />
                </View>

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>Emergency Contacts (Optional)</Text>
                {emergencyContacts.map((contact, index) => (
                    <View key={index} style={styles.inputGroup}>
                        <TextInput 
                            style={styles.input} 
                            value={contact}
                            keyboardType="phone-pad"
                            onChangeText={(text) => updateContact(index, text)}
                            placeholder={`Contact ${index + 1} Number`} 
                        />
                    </View>
                ))}

                <TouchableOpacity style={styles.addBtn} onPress={addContactField}>
                    <Text style={styles.addBtnText}>+ Add another contact</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
                    <Text style={styles.continueBtnText}>Continue</Text>
                </TouchableOpacity>
                <View style={{height: 40}}/>
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
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2C3E50',
        marginBottom: 15,
    },
    divider: {
        height: 1,
        backgroundColor: '#ECF0F1',
        marginVertical: 25,
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
    addBtn: {
        paddingVertical: 10,
        alignItems: 'flex-start',
        marginBottom: 30,
    },
    addBtnText: {
        color: '#3498DB',
        fontSize: 14,
        fontWeight: '600',
    },
    continueBtn: {
        backgroundColor: '#2C3E50',
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#2C3E50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    continueBtnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    }
});
