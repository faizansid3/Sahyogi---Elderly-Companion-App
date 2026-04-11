import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';

export default function RoleSelection({ onSelectRole }) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Welcome back.</Text>
                <Text style={styles.subtitle}>Please select your role to continue.</Text>
            </View>

            <View style={styles.cardsContainer}>
                <TouchableOpacity 
                    style={styles.card}
                    onPress={() => onSelectRole('CAREGIVER')}
                >
                    <View style={[styles.iconContainer, { backgroundColor: '#E8F8F5' }]}>
                        <Text style={styles.icon}>🩺</Text>
                    </View>
                    <View style={styles.cardTextContent}>
                        <Text style={styles.cardTitle}>Primary Care Manager</Text>
                        <Text style={styles.cardDescription}>Monitor and manage health profiles, alerts, and routines.</Text>
                    </View>
                    <Text style={styles.arrowIcon}>→</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.card}
                    onPress={() => onSelectRole('ELDER')}
                >
                    <View style={[styles.iconContainer, { backgroundColor: '#FEF9E7' }]}>
                        <Text style={styles.icon}>🛋️</Text>
                    </View>
                    <View style={styles.cardTextContent}>
                        <Text style={styles.cardTitle}>Assisted User</Text>
                        <Text style={styles.cardDescription}>Easily access your AI companion, reminders, and help.</Text>
                    </View>
                    <Text style={styles.arrowIcon}>→</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        paddingHorizontal: 25,
        paddingTop: 60,
        marginBottom: 40,
    },
    title: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#7F8C8D',
    },
    cardsContainer: {
        paddingHorizontal: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    icon: {
        fontSize: 28,
    },
    cardTextContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#34495E',
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 14,
        color: '#95A5A6',
        lineHeight: 20,
    },
    arrowIcon: {
        fontSize: 24,
        color: '#BDC3C7',
        marginLeft: 10,
    }
});
