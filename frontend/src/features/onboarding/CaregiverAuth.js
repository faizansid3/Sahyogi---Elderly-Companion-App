import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { loginCaregiver, registerCaregiver } from '../../services/api';

export default function CaregiverAuth({ onAuthSuccess, onGoBack }) {
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });

    const toggleMode = () => setIsLogin(!isLogin);

    const handleSubmit = async () => {
        if (!formData.email || !formData.password) {
            Alert.alert("Error", "Please fill in email and password");
            return;
        }

        setIsLoading(true);
        try {
            if (isLogin) {
                const res = await loginCaregiver({ email: formData.email, password: formData.password });
                onAuthSuccess(res.user);
            } else {
                if (!formData.name || !formData.phone) {
                    Alert.alert("Error", "Please fill in all fields for registration");
                    setIsLoading(false);
                    return;
                }
                const res = await registerCaregiver(formData);
                onAuthSuccess(res.user);
            }
        } catch (error) {
            Alert.alert(
                isLogin ? "Login Failed" : "Registration Failed",
                "Please check your network connection and credentials. (Is the backend running?)"
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={onGoBack} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>← Back</Text>
                </TouchableOpacity>
            </View>
            <ScrollView style={styles.container}>
                <Text style={styles.headerTitle}>{isLogin ? "Welcome Back" : "Create Account"}</Text>
                <Text style={styles.subtitle}>
                    {isLogin ? "Log in to manage your assisted profiles." : "Sign up as a Primary Care Manager."}
                </Text>

                {!isLogin && (
                    <>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput 
                                style={styles.input} 
                                value={formData.name}
                                onChangeText={(text) => setFormData({...formData, name: text})}
                                placeholder="John Doe" 
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput 
                                style={styles.input} 
                                value={formData.phone}
                                keyboardType="phone-pad"
                                onChangeText={(text) => setFormData({...formData, phone: text})}
                                placeholder="+1 234 567 8900" 
                            />
                        </View>
                    </>
                )}

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput 
                        style={styles.input} 
                        value={formData.email}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        onChangeText={(text) => setFormData({...formData, email: text})}
                        placeholder="john@example.com" 
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput 
                        style={styles.input} 
                        value={formData.password}
                        secureTextEntry
                        onChangeText={(text) => setFormData({...formData, password: text})}
                        placeholder="********" 
                    />
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isLoading}>
                    {isLoading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.submitBtnText}>{isLogin ? "Log In" : "Sign Up"}</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.toggleBtn} onPress={toggleMode}>
                    <Text style={styles.toggleBtnText}>
                        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
    container: { flex: 1, paddingHorizontal: 25, paddingTop: 40 },
    headerTitle: { fontSize: 32, fontWeight: '800', color: '#2C3E50', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#7F8C8D', marginBottom: 35 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#34495E', marginBottom: 8 },
    input: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E9ECEF', borderRadius: 10, padding: 15, fontSize: 16, color: '#2C3E50' },
    submitBtn: { backgroundColor: '#2C3E50', paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    submitBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    toggleBtn: { marginTop: 20, alignItems: 'center' },
    toggleBtnText: { color: '#3498DB', fontSize: 16, fontWeight: '600' },
    headerBar: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 5 },
    backBtn: { paddingVertical: 10 },
    backBtnText: { color: '#7F8C8D', fontSize: 16, fontWeight: '600' }
});
