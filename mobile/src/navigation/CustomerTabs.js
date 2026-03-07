import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import HomeScreen from '../screens/customer/HomeScreen';
import BrowseScreen from '../screens/customer/BrowseScreen';
import BookServiceScreen from '../screens/customer/BookServiceScreen';
import PaymentScreen from '../screens/customer/PaymentScreen';
import ChatScreen from '../screens/customer/ChatScreen';
import ReviewScreen from '../screens/customer/ReviewScreen';
import ProviderDetailScreen from '../screens/customer/ProviderDetailScreen';
import BookingHistoryScreen from '../screens/customer/BookingHistoryScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Browse" component={BrowseScreen} options={{ title: 'Find Providers' }} />
            <Stack.Screen name="ProviderDetail" component={ProviderDetailScreen} options={{ title: 'Provider' }} />
            <Stack.Screen name="BookService" component={BookServiceScreen} options={{ title: 'Book Service' }} />
            <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment' }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
            <Stack.Screen name="Review" component={ReviewScreen} options={{ title: 'Leave a Review' }} />
        </Stack.Navigator>
    );
}

export default function CustomerTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#6C63FF',
                tabBarInactiveTintColor: '#9CA3AF',
                tabBarStyle: { paddingBottom: 6, height: 60 },
            }}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeStack}
                options={{
                    headerShown: false,
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => <Icon name="home" color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Bookings"
                component={BookingHistoryScreen}
                options={{
                    title: 'My Bookings',
                    tabBarIcon: ({ color, size }) => <Icon name="calendar-check" color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Icon name="account" color={color} size={size} />,
                }}
            />
        </Tab.Navigator>
    );
}
