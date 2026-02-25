import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, FlatList,
    TouchableOpacity, ActivityIndicator, Alert, Image,
} from 'react-native';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function ProviderDashboardScreen({ navigation }) {
    const { user, logout } = useAuthStore();
    const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, earned: 0 });
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/bookings/provider/list?limit=5'),
            api.get('/providers/earnings/summary'),
        ]).then(([b, e]) => {
            const bData = b.data;
            setBookings(bData.slice(0, 5));
            setStats({
                total: bData.length,
                pending: bData.filter((x) => x.status === 'pending').length,
                completed: bData.filter((x) => x.status === 'completed').length,
                earned: e.data.total_earned,
            });
        }).finally(() => setLoading(false));
    }, []);

    if (loading) return <ActivityIndicator size="large" color="#10B981" style={{ flex: 1, marginTop: 100 }} />;

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.hi}>Hi, {user?.name?.split(' ')[0]} 👷</Text>
                    <Text style={styles.sub}>Manage your bookings & earnings</Text>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Stat Cards */}
            <View style={styles.statsRow}>
                {[
                    { label: 'Total', value: stats.total, color: '#6C63FF' },
                    { label: 'Pending', value: stats.pending, color: '#F59E0B' },
                    { label: 'Done', value: stats.completed, color: '#10B981' },
                    { label: 'Earned', value: `₹${stats.earned.toFixed(0)}`, color: '#EF4444' },
                ].map((s) => (
                    <View key={s.label} style={[styles.statCard, { borderTopColor: s.color }]}>
                        <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
                        <Text style={styles.statLabel}>{s.label}</Text>
                    </View>
                ))}
            </View>

            {/* Recent Bookings */}
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            {bookings.map((b) => (
                <TouchableOpacity key={b.id} style={styles.bookingCard}
                    onPress={() => navigation.navigate('Bookings')}>
                    <View>
                        <Text style={styles.bookingService}>{b.service_type}</Text>
                        <Text style={styles.bookingCustomer}>{b.customer?.name}</Text>
                        <Text style={styles.bookingDate}>{new Date(b.scheduled_at).toLocaleDateString('en-IN')}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[b.status] + '20' }]}>
                        <Text style={[styles.statusText, { color: STATUS_COLOR[b.status] }]}>{b.status}</Text>
                    </View>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
}

const STATUS_COLOR = {
    pending: '#F59E0B',
    accepted: '#6C63FF',
    in_progress: '#3B82F6',
    completed: '#10B981',
    rejected: '#EF4444',
    cancelled: '#9CA3AF',
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { backgroundColor: '#10B981', padding: 20, paddingTop: 56, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    hi: { fontSize: 20, fontWeight: '700', color: '#fff' },
    sub: { color: '#D1FAE5', fontSize: 12, marginTop: 2 },
    logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
    logoutText: { color: '#fff', fontWeight: '600', fontSize: 13 },
    statsRow: { flexDirection: 'row', padding: 16, gap: 10 },
    statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', borderTopWidth: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
    statVal: { fontWeight: '800', fontSize: 18 },
    statLabel: { color: '#6B7280', fontSize: 11, marginTop: 4 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginHorizontal: 16, marginBottom: 10 },
    bookingCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, borderRadius: 12, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
    bookingService: { fontWeight: '700', color: '#1F2937', fontSize: 14 },
    bookingCustomer: { color: '#6B7280', fontSize: 12, marginTop: 2 },
    bookingDate: { color: '#9CA3AF', fontSize: 11, marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusText: { fontSize: 11, fontWeight: '700' },
});
