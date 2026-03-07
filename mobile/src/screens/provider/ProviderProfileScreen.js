import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

export default function ProviderProfileScreen() {
    const { user, logout } = useAuthStore();
    const [provider, setProvider] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editingUPI, setEditingUPI] = useState(false);
    const [upiId, setUpiId] = useState('');
    const [savingUPI, setSavingUPI] = useState(false);

    useEffect(() => {
        api.get('/providers/profile').then(({ data }) => {
            setProvider(data);
            setUpiId(data?.upi_id || '');
        }).catch((err) => {
            console.error('Error fetching provider profile:', err);
        }).finally(() => setLoading(false));
    }, []);

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout },
        ]);
    };

    const handleSaveUPI = async () => {
        if (!upiId.trim()) return Alert.alert('Error', 'Enter a valid UPI ID (e.g. yourname@paytm)');
        // Basic UPI ID validation
        if (!upiId.includes('@')) return Alert.alert('Invalid UPI ID', 'UPI ID must contain @ (e.g. 9876543210@ybl)');
        setSavingUPI(true);
        try {
            await api.put('/providers/profile', { upi_id: upiId.trim() });
            setProvider((p) => ({ ...p, upi_id: upiId.trim() }));
            setEditingUPI(false);
            Alert.alert('Saved ✅', 'Your UPI ID has been updated. Customers can now pay you online.');
        } catch (err) {
            Alert.alert('Error', err.response?.data?.error || err.message);
        } finally {
            setSavingUPI(false);
        }
    };

    const MenuButton = ({ icon, label, onPress, color = '#1F2937', badge }) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
                <Icon name={icon} size={20} color={color} />
            </View>
            <Text style={styles.menuLabel}>{label}</Text>
            {badge ? <Text style={styles.badge}>{badge}</Text> : <Icon name="chevron-right" size={20} color="#9CA3AF" />}
        </TouchableOpacity>
    );

    if (loading) return <ActivityIndicator size="large" color="#10B981" style={{ flex: 1 }} />;

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
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
                <Text style={styles.businessTitle}>
                    {provider?.categories?.name || 'Provider'} · {provider?.experience_yrs || 0} yrs exp
                </Text>

                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{provider?.rating?.toFixed(1) || '0.0'}</Text>
                        <Text style={styles.statLabel}>Rating</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>₹{provider?.hourly_rate || 0}</Text>
                        <Text style={styles.statLabel}>Rate/hr</Text>
                    </View>
                </View>
            </View>

            {/* UPI ID Section — Key for receiving payments */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment Setup</Text>
                <View style={styles.upiBox}>
                    <View style={styles.upiHeader}>
                        <Text style={styles.upiIcon}>📱</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.upiTitle}>Your UPI ID</Text>
                            <Text style={styles.upiSub}>Customers will pay you directly via UPI (free)</Text>
                        </View>
                    </View>

                    {editingUPI ? (
                        <View style={styles.upiEditRow}>
                            <TextInput
                                style={styles.upiInput}
                                placeholder="e.g. 9876543210@ybl or name@paytm"
                                value={upiId}
                                onChangeText={setUpiId}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                            <View style={styles.upiActions}>
                                <TouchableOpacity style={styles.saveBtnSmall} onPress={handleSaveUPI} disabled={savingUPI}>
                                    {savingUPI ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.cancelBtnSmall} onPress={() => { setEditingUPI(false); setUpiId(provider?.upi_id || ''); }}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.upiValueRow} onPress={() => setEditingUPI(true)}>
                            {provider?.upi_id ? (
                                <>
                                    <Text style={styles.upiValue}>{provider.upi_id}</Text>
                                    <View style={styles.upiSet}><Text style={styles.upiSetText}>✓ Set</Text></View>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.upiEmpty}>Tap to add UPI ID</Text>
                                    <View style={styles.upiNotSet}><Text style={styles.upiNotSetText}>! Not set</Text></View>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Business Settings */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Business Settings</Text>
                <MenuButton icon="briefcase-outline" label="Professional Bio" onPress={() => { }} color="#10B981" />
                <MenuButton icon="calendar-clock" label="Working Hours" onPress={() => { }} color="#10B981" />
                <MenuButton icon="account-cog-outline" label="Account Details" onPress={() => { }} color="#10B981" />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Support</Text>
                <MenuButton icon="help-circle-outline" label="Help & Support" onPress={() => { }} color="#1F2937" />
                <MenuButton icon="star-outline" label="My Reviews" onPress={() => { }} color="#1F2937" />
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Icon name="logout" size={20} color="#EF4444" />
                <Text style={styles.logoutText}>Logout</Text>
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
    divider: { width: 1, height: 40, backgroundColor: '#E5E7EB' },
    section: { marginTop: 20, backgroundColor: '#fff', paddingVertical: 8 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', marginHorizontal: 20, marginVertical: 10 },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingHorizontal: 20 },
    iconContainer: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#374151' },
    badge: { backgroundColor: '#EDE9FE', color: '#6C63FF', fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    // UPI section
    upiBox: { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#F0FDF4', borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: '#10B981' },
    upiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    upiIcon: { fontSize: 28, marginRight: 12 },
    upiTitle: { fontWeight: '700', fontSize: 15, color: '#064E3B' },
    upiSub: { fontSize: 12, color: '#065F46', marginTop: 2 },
    upiValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    upiValue: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
    upiEmpty: { fontSize: 14, color: '#9CA3AF', fontStyle: 'italic' },
    upiSet: { backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    upiSetText: { color: '#065F46', fontWeight: '700', fontSize: 12 },
    upiNotSet: { backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    upiNotSetText: { color: '#991B1B', fontWeight: '700', fontSize: 12 },
    upiEditRow: { marginTop: 4 },
    upiInput: { borderWidth: 1, borderColor: '#10B981', borderRadius: 10, padding: 12, fontSize: 14, backgroundColor: '#fff', marginBottom: 10 },
    upiActions: { flexDirection: 'row', gap: 10 },
    saveBtnSmall: { flex: 1, backgroundColor: '#10B981', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontWeight: '700' },
    cancelBtnSmall: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
    cancelBtnText: { color: '#374151', fontWeight: '600' },
    // Footer
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30, padding: 16, backgroundColor: '#fff' },
    logoutText: { marginLeft: 8, color: '#EF4444', fontWeight: '700', fontSize: 16 },
    versionText: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginVertical: 30 },
});
