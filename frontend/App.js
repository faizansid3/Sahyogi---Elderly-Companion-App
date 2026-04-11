import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import SplashScreen from './src/features/onboarding/SplashScreen';
import RoleSelection from './src/features/onboarding/RoleSelection';
import CaregiverAuth from './src/features/onboarding/CaregiverAuth';
import ElderSetup from './src/features/onboarding/ElderSetup';
import Dashboard from './src/features/caregiver/Dashboard';
import ElderInteraction from './src/features/elder/ElderInteraction';
import { setupElderProfile } from './src/services/api';

const APP_STATE = {
    SPLASH: 0,
    ROLE_SELECTION: 1,
    CAREGIVER_AUTH: 2,
    ELDER_SETUP: 3,
    CAREGIVER_DASHBOARD: 4,
    ELDER_DEMO: 5
};

export default function App() {
    const [appState, setAppState] = useState(APP_STATE.SPLASH);
    const [user, setUser] = useState(null); // Caregiver user from backend
    const [elder, setElder] = useState(null); // Managed elder profile

    const handleSplashFinish = () => setAppState(APP_STATE.ROLE_SELECTION);
    
    const handleRoleSelect = (role) => {
        if (role === 'CAREGIVER') {
            setAppState(APP_STATE.CAREGIVER_AUTH);
        } else {
            // For demo, jump directly to elder interaction if they choose elder.
            // Normally you would have an elder login via QR or link code.
            setAppState(APP_STATE.ELDER_DEMO);
        }
    };

    const handleAuthSuccess = (userData) => {
        setUser(userData);
        // If user already has an elder, jump to dashboard
        if (userData.managed_elder_id) {
            setAppState(APP_STATE.CAREGIVER_DASHBOARD);
        } else {
            setAppState(APP_STATE.ELDER_SETUP);
        }
    };

    const handleElderSetupComplete = async (elderData) => {
        try {
            const dataToSave = { ...elderData, primary_manager_id: user.uid };
            const res = await setupElderProfile(dataToSave);
            setElder(res.elder);
            setAppState(APP_STATE.CAREGIVER_DASHBOARD);
        } catch (e) {
            console.error("Failed to setup elder profile:", e);
        }
    };

    const navigateToElderDemo = () => setAppState(APP_STATE.ELDER_DEMO);
    const navigateToDashboard = () => setAppState(APP_STATE.CAREGIVER_DASHBOARD);

    const renderScreen = () => {
        switch (appState) {
            case APP_STATE.SPLASH:
                return <SplashScreen onFinish={handleSplashFinish} />;
            case APP_STATE.ROLE_SELECTION:
                return <RoleSelection onSelectRole={handleRoleSelect} />;
            case APP_STATE.CAREGIVER_AUTH:
                return <CaregiverAuth onAuthSuccess={handleAuthSuccess} onGoBack={handleSplashFinish} />;
            case APP_STATE.ELDER_SETUP:
                return <ElderSetup onComplete={handleElderSetupComplete} />;
            case APP_STATE.CAREGIVER_DASHBOARD:
                return <Dashboard managerId={user?.uid} onGoToElder={navigateToElderDemo} />;
            case APP_STATE.ELDER_DEMO:
                return <ElderInteraction myElderId={user?.managed_elder_id || "demo_elder_1"} onGoBack={navigateToDashboard} />;
            default:
                return <SplashScreen onFinish={handleSplashFinish} />;
        }
    };

    return (
        <SafeAreaView style={styles.appContainer}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            {renderScreen()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    appContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF'
    }
});
