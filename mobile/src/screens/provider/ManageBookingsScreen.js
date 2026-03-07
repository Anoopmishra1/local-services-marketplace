import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert, Animated,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
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

const BookingCard = ({ item: b, index, onUpdateStatus }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 70, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 360, delay: index * 70, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.cardHeader}>
                <Text style={styles.service}>{b.service_type}</Text>
                <View style={[styles.badge, { backgroundColor: STATUS_COLOR[b.status] + '20' }]}>
                    <Text style={[styles.badgeText, { color: STATUS_COLOR[b.status] }]}>{b.status}</Text>
                </View>
            </View>

            <View style={styles.infoRow}>
                <Icon name="account" size={16} color="#4B5563" />
                <Text style={styles.infoText}>{b.customer?.name} · {b.customer?.phone}</Text>
            </View>
            <View style={styles.infoRow}>
                <Icon name="calendar" size={16} color="#6B7280" />
                <Text style={styles.meta}>{new Date(b.scheduled_at).toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.infoRow}>
                <Icon name="map-marker" size={16} color="#6B7280" />
                <Text style={styles.meta}>{b.address}</Text>
            </View>
            <Text style={styles.amount}>₹{b.total_amount}</Text>

            {b.status === 'pending' && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                        onPress={() => onUpdateStatus(b.id, 'accepted')}
                    >
                        <View style={styles.actionBtnContent}>
                            <Icon name="check" size={16} color="#fff" />
                            <Text style={styles.actionText}>Accept</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
                        onPress={() => onUpdateStatus(b.id, 'rejected')}
                    >
                        <View style={styles.actionBtnContent}>
                            <Icon name="close" size={16} color="#fff" />
                            <Text style={styles.actionText}>Reject</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            )}

            {b.status === 'accepted' && (
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#6C63FF', marginTop: 10 }]}
                    onPress={() => onUpdateStatus(b.id, 'completed')}
                >
                    <Text style={styles.actionText}>Mark Completed</Text>
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

export default function ManageBookingsScreen({ navigation }) {
    const [tab, setTab] = useState('pending');
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const tabIndicator = useRef(new Animated.Value(0)).current;

    const tabIndex = TABS.indexOf(tab);

    const fetchBookings = (status) => {
        setLoading(true);
        api.get(`/bookings/provider/list?status=${status}&limit=30`)
            .then(({ data }) => setBookings(data))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchBookings(tab); }, [tab]);

    const switchTab = (t) => {
        Animated.spring(tabIndicator, {
            toValue: TABS.indexOf(t),
            friction: 6,
            useNativeDriver: true,
        }).start();
        setTab(t);
    };

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

    return (
        <View style={styles.container}>
            {/* Animated Tab Bar */}
            <View style={styles.tabRow}>
                {TABS.map((t) => (
                    <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.activeTab]} onPress={() => switchTab(t)}>
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
                    renderItem={({ item, index }) => (
                        <BookingCard item={item} index={index} onUpdateStatus={updateStatus} />
                    )}
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
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    infoText: { color: '#374151', fontSize: 13 },
    meta: { color: '#6B7280', fontSize: 12 },
    amount: { color: '#6C63FF', fontWeight: '800', fontSize: 16, marginTop: 8 },
    actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
    actionBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
    actionBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    actionText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 60, fontSize: 14 },
});
