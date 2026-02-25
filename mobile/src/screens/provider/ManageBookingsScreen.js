import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import api from '../../services/api';

const STATUS_COLOR = {
    pending: '#F59E0B',
    accepted: '#6C63FF',
    in_progress: '#3B82F6',
    completed: '#10B981',
    rejected: '#EF4444',
    cancelled: '#9CA3AF',
};

const TABS = ['pending', 'accepted', 'completed', 'rejected'];

export default function ManageBookingsScreen({ navigation }) {
    const [tab, setTab] = useState('pending');
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchBookings = (status) => {
        setLoading(true);
        api.get(`/bookings/provider/list?status=${status}&limit=30`)
            .then(({ data }) => setBookings(data))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchBookings(tab); }, [tab]);

    const updateStatus = (bookingId, status) => {
        Alert.alert(
            `${status.charAt(0).toUpperCase() + status.slice(1)} Booking?`,
            'This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            await api.put(`/bookings/${bookingId}/status`, { status });
                            fetchBookings(tab);
                        } catch (err) {
                            Alert.alert('Error', err.response?.data?.error || err.message);
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item: b }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.service}>{b.service_type}</Text>
                <View style={[styles.badge, { backgroundColor: STATUS_COLOR[b.status] + '20' }]}>
                    <Text style={[styles.badgeText, { color: STATUS_COLOR[b.status] }]}>{b.status}</Text>
                </View>
            </View>

            <Text style={styles.customer}>👤 {b.customer?.name} · 📞 {b.customer?.phone}</Text>
            <Text style={styles.meta}>📅 {new Date(b.scheduled_at).toLocaleString('en-IN')}</Text>
            <Text style={styles.meta}>📍 {b.address}</Text>
            <Text style={styles.amount}>₹{b.total_amount}</Text>

            {b.status === 'pending' && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                        onPress={() => updateStatus(b.id, 'accepted')}
                    >
                        <Text style={styles.actionText}>✓ Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
                        onPress={() => updateStatus(b.id, 'rejected')}
                    >
                        <Text style={styles.actionText}>✕ Reject</Text>
                    </TouchableOpacity>
                </View>
            )}

            {b.status === 'accepted' && (
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#6C63FF', marginTop: 10 }]}
                    onPress={() => updateStatus(b.id, 'completed')}
                >
                    <Text style={styles.actionText}>Mark Completed</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Tab Bar */}
            <View style={styles.tabRow}>
                {TABS.map((t) => (
                    <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.activeTab]} onPress={() => setTab(t)}>
                        <Text style={[styles.tabText, tab === t && styles.activeTabText]}>{t}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 60 }} />
            ) : (
                <FlatList
                    data={bookings}
                    keyExtractor={(i) => i.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16 }}
                    ListEmptyComponent={<Text style={styles.empty}>No {tab} bookings</Text>}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    tabRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#E5E7EB' },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
    activeTab: { borderBottomWidth: 2, borderBottomColor: '#10B981' },
    tabText: { color: '#6B7280', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
    activeTabText: { color: '#10B981' },
    card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    service: { fontWeight: '700', fontSize: 15, color: '#1F2937', flex: 1 },
    badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    customer: { color: '#374151', fontSize: 13, marginBottom: 4 },
    meta: { color: '#6B7280', fontSize: 12, marginBottom: 2 },
    amount: { color: '#6C63FF', fontWeight: '800', fontSize: 16, marginTop: 8 },
    actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
    actionBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
    actionText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 60, fontSize: 14 },
});
