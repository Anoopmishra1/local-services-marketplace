import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, ScrollView, StyleSheet,
    TouchableOpacity, ActivityIndicator, Animated,
} from 'react-native';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const STATUS_COLOR = {
    pending: '#F59E0B',
    accepted: '#6C63FF',
    in_progress: '#3B82F6',
    completed: '#10B981',
    rejected: '#EF4444',
    cancelled: '#9CA3AF',
};

export default function ProviderDashboardScreen({ navigation }) {
    const { user, logout } = useAuthStore();
    const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, earned: 0 });
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Animations
    const headerFade = useRef(new Animated.Value(0)).current;
    const headerSlide = useRef(new Animated.Value(-40)).current;
    const statAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
    const statScales = useRef([0, 1, 2, 3].map(() => new Animated.Value(0.8))).current;
    const bookingAnims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;
    const bookingSlides = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(30))).current;

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

    useEffect(() => {
        if (!loading) {
            // Header flies in
            Animated.parallel([
                Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(headerSlide, { toValue: 0, duration: 450, useNativeDriver: true }),
            ]).start();

            // Stat cards pop in with stagger
            Animated.stagger(80, statAnims.map((anim, i) =>
                Animated.parallel([
                    Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
                    Animated.spring(statScales[i], { toValue: 1, friction: 5, useNativeDriver: true }),
                ])
            )).start();

            // Booking cards slide up with stagger
            Animated.stagger(70, bookingAnims.map((anim, i) =>
                Animated.parallel([
                    Animated.timing(anim, { toValue: 1, duration: 350, delay: 300, useNativeDriver: true }),
                    Animated.timing(bookingSlides[i], { toValue: 0, duration: 320, delay: 300, useNativeDriver: true }),
                ])
            )).start();
        }
    }, [loading]);

    if (loading) return <ActivityIndicator size="large" color="#10B981" style={{ flex: 1, marginTop: 100 }} />;

    const statItems = [
        { label: 'Total', value: stats.total, color: '#6C63FF' },
        { label: 'Pending', value: stats.pending, color: '#F59E0B' },
        { label: 'Done', value: stats.completed, color: '#10B981' },
        { label: 'Earned', value: `₹${stats.earned?.toFixed(0) || 0}`, color: '#EF4444' },
    ];

    return (
        <ScrollView style={styles.container}>
            {/* Animated Header */}
            <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
                <View>
                    <Text style={styles.hi}>Hi, {user?.name?.split(' ')[0]} 👷</Text>
                    <Text style={styles.sub}>Manage your bookings & earnings</Text>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Staggered Stat Cards */}
            <View style={styles.statsRow}>
                {statItems.map((s, i) => (
                    <Animated.View key={s.label} style={[styles.statCard, { borderTopColor: s.color }, { opacity: statAnims[i], transform: [{ scale: statScales[i] }] }]}>
                        <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
                        <Text style={styles.statLabel}>{s.label}</Text>
                    </Animated.View>
                ))}
            </View>

            {/* Animated Recent Bookings */}
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            {bookings.map((b, index) => (
                <Animated.View key={b.id} style={{ opacity: bookingAnims[index] || new Animated.Value(1), transform: [{ translateY: bookingSlides[index] || new Animated.Value(0) }] }}>
                    <TouchableOpacity style={styles.bookingCard} onPress={() => navigation.navigate('Bookings')}>
                        <View>
                            <Text style={styles.bookingService}>{b.service_type}</Text>
                            <Text style={styles.bookingCustomer}>{b.customer?.name}</Text>
                            <Text style={styles.bookingDate}>{new Date(b.scheduled_at).toLocaleDateString('en-IN')}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[b.status] + '20' }]}>
                            <Text style={[styles.statusText, { color: STATUS_COLOR[b.status] }]}>{b.status}</Text>
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            ))}
        </ScrollView>
    );
}

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
