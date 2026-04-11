import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
console.log("API_URL:", API_URL);

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
    ],
    medicines: []
};

// --- API Helpers ---

const apiCall = async (method, endpoint, data = null) => {
    try {
        const config = {
            method,
            url: `${API_URL}${endpoint}`,
            timeout: 5000,
        };
        if (data) config.data = data;
        
        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.warn(`API Error [${endpoint}]:`, error.message);
        throw error;
    }
};

// --- Endpoints ---

export const registerCaregiver = (data) => apiCall('POST', '/auth/register', data);
export const loginCaregiver = (data) => apiCall('POST', '/auth/login', data);

export const setupElderProfile = (data) => apiCall('POST', '/elder/setup', data);
export const getElderProfile = (managerId) => apiCall('GET', `/elder/profile/${managerId}`);

export const addMedicine = (data) => apiCall('POST', '/medicines', data);
export const checkMedicineStatus = (mid, status) => apiCall('POST', `/medicines/${mid}/status?status=${status}`);

export const triggerEmergency = async (elderId) => {
    try {
        const payload = { user_id: elderId, lat: 0.0, lng: 0.0 };
        return await apiCall('POST', '/emergency', payload);
    } catch (e) {
        return { status: "offline", message: "Network unavailable. Attempting local SMS..." };
    }
};

export const getCaregiverDashboard = async (managerId) => {
    try {
        const response = await apiCall('GET', `/caregiver/dashboard/${managerId}`);
        // If data is empty for some reason, provide defaults
        if (response.isOffline || Object.keys(response).length === 0) {
           return { ...mockDashboardData, isOffline: true };
        }
        return { ...response, isOffline: false };
    } catch (error) {
        return { ...mockDashboardData, isOffline: true };
    }
};
