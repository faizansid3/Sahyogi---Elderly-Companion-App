import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
console.log("API_URL Connected:", API_URL);

// --- API Helpers ---

const apiCall = async (method, endpoint, data = null) => {
    try {
        const config = {
            method,
            url: `${API_URL}${endpoint}`,
            timeout: 8000,
        };
        if (data) config.data = data;
        
        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error(`API Client Error [${endpoint}]:`, error.response?.data || error.message);
        throw error; // Let the caller handle the error UI
    }
};

// --- Endpoints ---

export const registerCaregiver = (data) => apiCall('POST', '/auth/register', data);
export const loginCaregiver = (data) => apiCall('POST', '/auth/login', data);

export const setupElderProfile = (data) => apiCall('POST', '/elder/setup', data);
export const getElderProfile = (managerId) => apiCall('GET', `/elder/profile/${managerId}`);

export const addMedicine = (data) => apiCall('POST', '/medicines', data);
export const getMedicines = (elderId) => apiCall('GET', `/medicines/${elderId}`);
export const checkMedicineStatus = (mid, status) => apiCall('POST', `/medicines/${mid}/status?status=${status}`);

export const triggerEmergency = async (elderId) => {
    const payload = { user_id: elderId, lat: 0.0, lng: 0.0 };
    return apiCall('POST', '/emergency', payload);
};

export const getCaregiverDashboard = (managerId) => apiCall('GET', `/caregiver/dashboard/${managerId}`);
