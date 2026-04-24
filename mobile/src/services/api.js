import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Get the Expo dev server host IP dynamically — works for LAN & tunnel
const getBaseURL = () => {
    // 1. Use explicit env var if set
    if (process.env.EXPO_PUBLIC_API_URL) {
        console.log('[API] Using env URL:', process.env.EXPO_PUBLIC_API_URL);
        return process.env.EXPO_PUBLIC_API_URL;
    }

    // 2. Auto-detect from Expo's debuggerHost (e.g. "10.168.114.6:8081")
    const debuggerHost = Constants.expoConfig?.hostUri
        || Constants.manifest?.debuggerHost
        || Constants.manifest2?.extra?.expoGo?.debuggerHost;

    if (debuggerHost) {
        const host = debuggerHost.split(':')[0]; // strip the metro port
        const url = `http://${host}:5000/api`;
        console.log('[API] Auto-detected URL:', url);
        return url;
    }

    // 3. Fallback
    console.log('[API] Falling back to localhost');
    return 'http://localhost:5000/api';
};

const BASE_URL = getBaseURL();

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
});

// Log every request for debugging
api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
});

// Handle 401 globally + log errors
api.interceptors.response.use(
    (res) => res,
    async (err) => {
        if (err.response?.status === 401) {
            await SecureStore.deleteItemAsync('token');
            await SecureStore.deleteItemAsync('user');
        }
        // Detailed error logging
        if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
            console.error('[API] NETWORK ERROR — Cannot reach server at:', BASE_URL);
            console.error('[API] Make sure your phone and computer are on the SAME WiFi network');
        } else {
            console.error('[API] Error:', err.response?.status, err.response?.data || err.message);
        }
        return Promise.reject(err);
    }
);

export default api;
