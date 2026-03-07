import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Animated } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen() {
    const { user, logout } = useAuthStore();

    // Animation values
    const headerFade = useRef(new Animated.Value(0)).current;
    const headerScale = useRef(new Animated.Value(0.9)).current;
    const menuAnims = useRef([0, 1, 2, 3, 4, 5, 6].map(() => new Animated.Value(0))).current;
    const menuSlides = useRef([0, 1, 2, 3, 4, 5, 6].map(() => new Animated.Value(30))).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.spring(headerScale, { toValue: 1, friction: 6, useNativeDriver: true }),
        ]).start();

        Animated.stagger(60, menuAnims.map((anim, i) =>
            Animated.parallel([
                Animated.timing(anim, { toValue: 1, duration: 350, delay: 200, useNativeDriver: true }),
                Animated.timing(menuSlides[i], { toValue: 0, duration: 300, delay: 200, useNativeDriver: true }),
            ])
        )).start();
    }, []);

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout },
        ]);
    };

    const MenuButton = ({ icon, label, onPress, color = '#1F2937', animIndex }) => {
        const scaleAnim = useRef(new Animated.Value(1)).current;
        return (
            <Animated.View style={{ opacity: menuAnims[animIndex], transform: [{ translateX: menuSlides[animIndex] }, { scale: scaleAnim }] }}>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={onPress}
                    onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()}
                    onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start()}
                >
                    <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
                        <Icon name={icon} size={20} color={color} />
                    </View>
                    <Text style={styles.menuLabel}>{label}</Text>
                    <Icon name="chevron-right" size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <ScrollView style={styles.container}>
            {/* Animated Header */}
            <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ scale: headerScale }] }]}>
                <Image source={{ uri: user?.avatar_url || 'https://i.pravatar.cc/100' }} style={styles.avatar} />
                <Text style={styles.name}>{user?.name}</Text>
                <Text style={styles.email}>{user?.email || user?.phone}</Text>
                <TouchableOpacity style={styles.editBtn}>
                    <Text style={styles.editBtnText}>Edit Profile</Text>
                </TouchableOpacity>
            </Animated.View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account Settings</Text>
                <MenuButton animIndex={0} icon="bell-outline" label="Notifications" onPress={() => { }} />
                <MenuButton animIndex={1} icon="shield-check-outline" label="Privacy & Security" onPress={() => { }} />
                <MenuButton animIndex={2} icon="map-marker-outline" label="Saved Addresses" onPress={() => { }} />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Support</Text>
                <MenuButton animIndex={3} icon="help-circle-outline" label="Help Center" onPress={() => { }} />
                <MenuButton animIndex={4} icon="file-document-outline" label="Terms of Service" onPress={() => { }} />
                <MenuButton animIndex={5} icon="star-outline" label="Rate the App" onPress={() => { }} />
            </View>

            <Animated.View style={{ opacity: menuAnims[6], transform: [{ translateY: menuSlides[6] }] }}>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Icon name="logout" size={20} color="#EF4444" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </Animated.View>

            <Text style={styles.versionText}>Version 1.0.0</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { alignItems: 'center', padding: 30, backgroundColor: '#fff' },
    avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 16 },
    name: { fontSize: 22, fontWeight: '800', color: '#1F2937' },
    email: { fontSize: 14, color: '#6B7280', marginTop: 4 },
    editBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#6C63FF' },
    editBtnText: { color: '#6C63FF', fontWeight: '600', fontSize: 13 },
    section: { marginTop: 20, backgroundColor: '#fff', paddingVertical: 8 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', marginHorizontal: 20, marginVertical: 10 },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingHorizontal: 20 },
    iconContainer: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#374151' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30, padding: 16, backgroundColor: '#fff' },
    logoutText: { marginLeft: 8, color: '#EF4444', fontWeight: '700', fontSize: 16 },
    versionText: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginVertical: 30 },
});
