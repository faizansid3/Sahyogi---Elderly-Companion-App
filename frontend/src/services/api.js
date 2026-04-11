import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000/api";

const mockDashboardData = {
    daily_summary: {
        falls: 0,
        active_minutes: 45,
        water_intake_ml: 1200,
        medicine_taken: 2,
        medicine_missed: 1
    },
    recent_alerts: [
        { type: "Offline Mode: Using Mock Data", time: Date.now() / 1000, confidence: 1.0 },
        { type: "Medicine Missed: Aspirin", time: (Date.now() / 1000) - 3600, confidence: 1.0 }
    ]
};

export const triggerEmergency = async (userId) => {
    try {
        const payload = { user_id: userId, lat: 0.0, lng: 0.0 };
        const response = await axios.post(`${API_URL}/emergency`, payload, { timeout: 3000 });
        return response.data;
    } catch (error) {
        console.warn("API Offline: triggerEmergency failed. Using offline handling.", error.message);
        return { status: "offline", message: "Network unavailable. Attempting local SMS..." };
    }
};

export const getCaregiverDashboard = async () => {
    try {
        const response = await axios.get(`${API_URL}/caregiver/dashboard`, { timeout: 4000 });
        // If data is empty for some reason, provide defaults
        if (!response.data || Object.keys(response.data).length === 0) {
           return { ...mockDashboardData, isOffline: true };
        }
        return { ...response.data, isOffline: false };
    } catch (error) {
        console.warn("API Offline: getCaregiverDashboard failed. using mock offline data.", error.message);
        return { ...mockDashboardData, isOffline: true };
    }
};
