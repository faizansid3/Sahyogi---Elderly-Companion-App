import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import CaregiverRegistration from './src/features/onboarding/CaregiverRegistration';
import ElderSetup from './src/features/onboarding/ElderSetup';
import Dashboard from './src/features/caregiver/Dashboard';
import ElderInteraction from './src/features/elder/ElderInteraction';

// Simple Router State Enum
const APP_STATE = {
    CAREGIVER_REGISTRATION: 0,
    ELDER_SETUP: 1,
    MAIN_DASHBOARD: 2,
    ELDER_DEMO: 3
};

export default function App() {
    const [appState, setAppState] = useState(APP_STATE.CAREGIVER_REGISTRATION);
    
    // Store user data in memory for this demo (in production, use Context or Redux/AsyncStorage)
    const [userData, setUserData] = useState({});

    const handleCaregiverComplete = (caregiverData) => {
        setUserData({ ...userData, caregiver: caregiverData });
        setAppState(APP_STATE.ELDER_SETUP);
    };

    const handleElderComplete = (elderData) => {
        setUserData({ ...userData, elder: elderData });
        setAppState(APP_STATE.MAIN_DASHBOARD);
    };

    const navigateToElderDemo = () => {
        setAppState(APP_STATE.ELDER_DEMO);
    };

    const navigateToDashboard = () => {
        setAppState(APP_STATE.MAIN_DASHBOARD);
    };

    const renderScreen = () => {
        switch (appState) {
            case APP_STATE.CAREGIVER_REGISTRATION:
                return <CaregiverRegistration onComplete={handleCaregiverComplete} />;
            case APP_STATE.ELDER_SETUP:
                return <ElderSetup onComplete={handleElderComplete} />;
            case APP_STATE.MAIN_DASHBOARD:
                return <Dashboard onGoToElder={navigateToElderDemo} />;
            case APP_STATE.ELDER_DEMO:
                return <ElderInteraction onGoBack={navigateToDashboard} />;
            default:
                return <CaregiverRegistration onComplete={handleCaregiverComplete} />;
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
