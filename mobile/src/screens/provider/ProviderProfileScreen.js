import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

export default function ProviderProfileScreen() {
    const { user, logout } = useAuthStore();
    const [provider, setProvider] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProviderData = async () => {
            try {
                const { data } = await api.get('/providers/profile');
                setProvider(data);
            } catch (err) {
                console.error('Error fetching provider profile:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProviderData();
    }, []);

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout },
        ]);
    };

    const MenuButton = ({ icon, label, onPress, color = '#1F2937' }) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
                <Icon name={icon} size={20} color={color} />
            </View>
            <Text style={styles.menuLabel}>{label}</Text>
            <Icon name="chevron-right" size={20} color="#9CA3AF" />
        </TouchableOpacity>
    );

    if (loading) return <ActivityIndicator size="large" color="#10B981" style={{ flex: 1 }} />;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={{ uri: user?.avatar_url || 'https://i.pravatar.cc/120' }}
                        style={styles.avatar}
                    />
                    {provider?.is_approved && (
                        <View style={styles.onlineBadge}>
                            <Icon name="check-decagram" size={20} color="#fff" />
                        </View>
                    )}
                </View>
                <Text style={styles.name}>{user?.name}</Text>
                <Text style={styles.businessTitle}>{provider?.categories?.name} · {provider?.experience_yrs} yrs exp</Text>

                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{provider?.rating?.toFixed(1) || '0.0'}</Text>
                        <Text style={styles.statLabel}>Rating</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>₹{provider?.hourly_rate}</Text>
                        <Text style={styles.statLabel}>Rate/hr</Text>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Business Settings</Text>
                <MenuButton icon="briefcase-outline" label="Professional Bio" onPress={() => { }} color="#10B981" />
                <MenuButton icon="calendar-clock" label="Working Hours" onPress={() => { }} color="#10B981" />
                <MenuButton icon="account-cog-outline" label="Account Details" onPress={() => { }} color="#10B981" />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment & Invoices</Text>
                <MenuButton icon="bank-outline" label="Payout Settings" onPress={() => { }} color="#6C63FF" />
                <MenuButton icon="receipt" label="Invoice History" onPress={() => { }} color="#6C63FF" />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Support</Text>
                <MenuButton icon="help-circle-outline" label="Help & Support" onPress={() => { }} color="#1F2937" />
                <MenuButton icon="star-outline" label="Review Ratings" onPress={() => { }} color="#1F2937" />
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Icon name="logout" size={20} color="#EF4444" />
                <Text style={styles.logoutText}>Logout from Business</Text>
            </TouchableOpacity>

            <Text style={styles.versionText}>LocalPro Provider v1.0.0</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { alignItems: 'center', padding: 30, backgroundColor: '#fff' },
    avatarContainer: { position: 'relative', marginBottom: 16 },
    avatar: { width: 100, height: 100, borderRadius: 50 },
    onlineBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#10B981', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
    name: { fontSize: 22, fontWeight: '800', color: '#1F2937' },
    businessTitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
    statsRow: { flexDirection: 'row', marginTop: 24, backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, width: '100%', alignItems: 'center' },
    statBox: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
    statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    divider: { width: 1, height: '60%', backgroundColor: '#E5E7EB' },
    section: { marginTop: 20, backgroundColor: '#fff', paddingVertical: 8 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', marginHorizontal: 20, marginVertical: 10 },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingHorizontal: 20 },
    iconContainer: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#374151' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30, padding: 16, backgroundColor: '#fff' },
    logoutText: { marginLeft: 8, color: '#EF4444', fontWeight: '700', fontSize: 16 },
    versionText: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginVertical: 30 },
});
