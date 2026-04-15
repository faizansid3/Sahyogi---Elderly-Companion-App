import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Log the URL on module load to verify it's correct
console.log('API_URL:', API_URL);

const apiCall = async (method, endpoint, data = null, extraHeaders = {}) => {
    try {
        const config = {
            method,
            url: `${API_URL}${endpoint}`,
            timeout: 60000, // Increased to 60s for slow CPU voice processing
            headers: { ...extraHeaders },
        };
        if (data) config.data = data;

        const response = await axios(config);
        return response.data;
    } catch (error) {
        const errMsg = error.response?.data || error.message;
        console.error(`API Client Error [${endpoint}]:`, errMsg);
        throw error;
    }
};

// Clean API Layer
export const apiService = {
    auth: {
        register: (data) => apiCall('POST', '/auth/register', data),
        login: (data) => apiCall('POST', '/auth/login', data),
    },
    elder: {
        setup: (data) => apiCall('POST', '/elder/setup', data),
        getProfile: (managerId) => apiCall('GET', `/elder/profile/${managerId}`),
        getMedicines: (elderId) => apiCall('GET', `/medicines/${elderId}`),
    },
    medicine: {
        add: (data) => apiCall('POST', '/medicines', data),
        updateStatus: (mid, status) => apiCall('POST', `/medicines/${mid}/status?status=${status}`),
        processVoice: async (uri, mode, context = {}) => {
            const formData = new FormData();
            // React Native FormData expects object with uri/name/type
            formData.append('file', {
                uri,
                name: 'audio.m4a',
                type: 'audio/m4a',
            });
            formData.append('mode', mode);
            if (context.name) formData.append('med_name', context.name);
            if (context.dosage) formData.append('dosage', context.dosage);

            // CRITICAL: Must explicitly set multipart Content-Type so axios sends boundary
            return apiCall('POST', '/speech-to-text', formData, {
                'Content-Type': 'multipart/form-data',
            });
        },

        delete: (mid) => apiCall('DELETE', `/medicines/${mid}`),
    },
    alert: {
        triggerEmergency: (elderId) => apiCall('POST', '/emergency', { user_id: elderId, lat: 0.0, lng: 0.0 }),
        getDashboard: (managerId) => apiCall('GET', `/caregiver/dashboard/${managerId}`),
        delete: (aid) => apiCall('DELETE', `/alerts/${aid}`),
    }
};

