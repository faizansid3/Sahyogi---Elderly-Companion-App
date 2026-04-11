import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, SafeAreaView } from 'react-native';

export default function SplashScreen({ onFinish }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1500, // 1.5 second fade
            useNativeDriver: true,
        }).start();

        // Navigate away after 3 seconds total
        const timer = setTimeout(() => {
            onFinish();
        }, 3000);
        return () => clearTimeout(timer);
    }, [fadeAnim, onFinish]);

    return (
        <SafeAreaView style={styles.container}>
            <Animated.View style={{ ...styles.content, opacity: fadeAnim }}>
                <View style={styles.logoPlaceholder}>
                    <Text style={styles.logoIcon}>S</Text>
                </View>
                <Text style={styles.title}>Sahyogi</Text>
                <Text style={styles.tagline}>Your AI Companion for Care</Text>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    logoPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#2C3E50',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#2C3E50',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    logoIcon: {
        fontSize: 60,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    title: {
        fontSize: 40,
        fontWeight: '900',
        color: '#2C3E50',
        letterSpacing: 2,
    },
    tagline: {
        fontSize: 18,
        color: '#7F8C8D',
        marginTop: 10,
        fontWeight: '500',
    }
});
