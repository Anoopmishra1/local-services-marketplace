import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import ProviderDashboardScreen from '../screens/provider/ProviderDashboardScreen';
import ManageBookingsScreen from '../screens/provider/ManageBookingsScreen';
import AvailabilityScreen from '../screens/provider/AvailabilityScreen';
import EarningsScreen from '../screens/provider/EarningsScreen';
import ProviderProfileScreen from '../screens/provider/ProviderProfileScreen';

const Tab = createBottomTabNavigator();

export default function ProviderTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#10B981',
                tabBarInactiveTintColor: '#9CA3AF',
                tabBarStyle: { paddingBottom: 6, height: 60 },
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={ProviderDashboardScreen}
                options={{ tabBarIcon: ({ color, size }) => <Icon name="view-dashboard" color={color} size={size} /> }}
            />
            <Tab.Screen
                name="Bookings"
                component={ManageBookingsScreen}
                options={{ title: 'Bookings', tabBarIcon: ({ color, size }) => <Icon name="calendar-clock" color={color} size={size} /> }}
            />
            <Tab.Screen
                name="Availability"
                component={AvailabilityScreen}
                options={{ tabBarIcon: ({ color, size }) => <Icon name="clock-outline" color={color} size={size} /> }}
            />
            <Tab.Screen
                name="Earnings"
                component={EarningsScreen}
                options={{ tabBarIcon: ({ color, size }) => <Icon name="currency-inr" color={color} size={size} /> }}
            />
            <Tab.Screen
                name="Profile"
                component={ProviderProfileScreen}
                options={{ tabBarIcon: ({ color, size }) => <Icon name="account" color={color} size={size} /> }}
            />
        </Tab.Navigator>
    );
}
