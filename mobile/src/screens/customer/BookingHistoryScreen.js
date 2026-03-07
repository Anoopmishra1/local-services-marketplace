import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, ActivityIndicator, RefreshControl, Animated,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import api from '../../services/api';

const BookingCard = ({ item, index, navigation }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 70, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 380, delay: index * 70, useNativeDriver: true }),
        ]).start();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#FBBF24';
            case 'accepted': return '#6C63FF';
            case 'completed': return '#10B981';
            case 'rejected':
            case 'cancelled': return '#EF4444';
            default: return '#9CA3AF';
        }
    };

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('Payment', { bookingId: item.id })}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.serviceType}>{item.service_type}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                            {item.status.toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                        <Icon name="account" size={16} color="#9CA3AF" />
                        <Text style={styles.infoText}>{item.providers?.users?.name || 'Provider'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Icon name="calendar" size={16} color="#9CA3AF" />
                        <Text style={styles.infoText}>
                            {new Date(item.scheduled_at).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            })}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Icon name="cash" size={16} color="#9CA3AF" />
                        <Text style={styles.infoText}>₹{item.total_amount} · {item.is_paid ? 'Paid' : 'Unpaid'}</Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <Text style={styles.footerLink}>View Details</Text>
                    <Icon name="chevron-right" size={16} color="#6C63FF" />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function BookingHistoryScreen({ navigation }) {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchBookings = useCallback(async () => {
        try {
            const { data } = await api.get('/users/bookings');
            setBookings(data);
        } catch (err) {
            console.error('Error fetching bookings:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);

    const onRefresh = () => { setRefreshing(true); fetchBookings(); };

    if (loading) return <ActivityIndicator size="large" color="#6C63FF" style={{ flex: 1 }} />;

    return (
        <View style={styles.container}>
            <FlatList
                data={bookings}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <BookingCard item={item} index={index} navigation={navigation} />
                )}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="calendar-blank" size={64} color="#E5E7EB" />
                        <Text style={styles.emptyTitle}>No bookings yet</Text>
                        <Text style={styles.emptyText}>When you book a service, it will appear here.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    list: { padding: 16 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    serviceType: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 10, fontWeight: '800' },
    cardBody: { gap: 8 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoText: { fontSize: 14, color: '#4B5563' },
    cardFooter: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
    footerLink: { color: '#6C63FF', fontWeight: '600', fontSize: 13, marginRight: 4 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 16 },
    emptyText: { fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
});
