import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

export const useAuthStore = create((set) => ({
    user: null,
    token: null,

    loadUser: async () => {
        const token = await SecureStore.getItemAsync('token');
        const user = await SecureStore.getItemAsync('user');
        if (token && user) set({ token, user: JSON.parse(user) });
    },

    loginWithEmail: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        await SecureStore.setItemAsync('token', data.token);
        await SecureStore.setItemAsync('user', JSON.stringify(data.user));
        set({ user: data.user, token: data.token });
        return data;
    },

    verifyOTP: async (phone, otp) => {
        const { data } = await api.post('/auth/verify-otp', { phone, token: otp });
        await SecureStore.setItemAsync('token', data.token);
        await SecureStore.setItemAsync('user', JSON.stringify(data.user));
        set({ user: data.user, token: data.token });
        return data;
    },

    register: async (payload) => {
        const { data } = await api.post('/auth/signup', payload);
        await SecureStore.setItemAsync('token', data.token);
        await SecureStore.setItemAsync('user', JSON.stringify(data.user));
        set({ user: data.user, token: data.token });
        return data;
    },

    logout: async () => {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
        set({ user: null, token: null });
    },
}));
