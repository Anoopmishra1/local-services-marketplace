import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Tab Navigators
import CustomerTabs from './CustomerTabs';
import ProviderTabs from './ProviderTabs';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const { user } = useAuthStore();

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!user ? (
                <>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="OTP" component={OTPScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                </>
            ) : user.role === 'provider' ? (
                <Stack.Screen name="ProviderApp" component={ProviderTabs} />
            ) : (
                <Stack.Screen name="CustomerApp" component={CustomerTabs} />
            )}
        </Stack.Navigator>
    );
}
