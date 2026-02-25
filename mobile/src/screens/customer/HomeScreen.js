import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    ScrollView, Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import * as Location from 'expo-location';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const CATEGORIES = [
    { id: '1', name: 'Electrician', icon: '⚡' },
    { id: '2', name: 'Plumber', icon: '🔧' },
    { id: '3', name: 'Tutor', icon: '📚' },
    { id: '4', name: 'Carpenter', icon: '🪚' },
    { id: '5', name: 'Painter', icon: '🎨' },
    { id: '6', name: 'Cleaner', icon: '🧹' },
    { id: '7', name: 'AC Tech', icon: '❄️' },
];

export default function HomeScreen({ navigation }) {
    const { user } = useAuthStore();
    const [location, setLocation] = useState(null);
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCat, setSelectedCat] = useState(null);

    const fetchNearby = useCallback(async (loc, catId) => {
        try {
            const params = { lat: loc.latitude, lng: loc.longitude, radius_km: 10 };
            if (catId) params.category_id = catId;
            const { data } = await api.get('/providers/nearby', { params });
            setProviders(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') { setLoading(false); return; }
            const loc = await Location.getCurrentPositionAsync({});
            setLocation(loc.coords);
            fetchNearby(loc.coords, null);
        })();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        if (location) fetchNearby(location, selectedCat);
    };

    return (
        <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greet}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
                    <Text style={styles.sub}>What service do you need today?</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Browse')}>
                    <Text style={styles.searchBtn}>🔍 Search</Text>
                </TouchableOpacity>
            </View>

            {/* Categories */}
            <Text style={styles.sectionTitle}>Browse by Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                        key={cat.id}
                        style={[styles.catCard, selectedCat === cat.id && styles.catCardActive]}
                        onPress={() => {
                            const next = selectedCat === cat.id ? null : cat.id;
                            setSelectedCat(next);
                            if (location) fetchNearby(location, next);
                        }}
                    >
                        <Text style={styles.catIcon}>{cat.icon}</Text>
                        <Text style={[styles.catName, selectedCat === cat.id && { color: '#fff' }]}>{cat.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Nearby Providers */}
            <Text style={styles.sectionTitle}>Nearby Providers</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#6C63FF" style={{ marginTop: 40 }} />
            ) : providers.length === 0 ? (
                <Text style={styles.empty}>No providers found nearby. Try a wider radius.</Text>
            ) : (
                providers.map((p) => (
                    <TouchableOpacity
                        key={p.id}
                        style={styles.providerCard}
                        onPress={() => navigation.navigate('ProviderDetail', { providerId: p.id })}
                    >
                        <Image
                            source={{ uri: p.users?.avatar_url || 'https://i.pravatar.cc/80' }}
                            style={styles.avatar}
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.provName}>{p.users?.name}</Text>
                            <Text style={styles.category}>{p.categories?.name}</Text>
                            <Text style={styles.meta}>⭐ {p.rating?.toFixed(1)} · ₹{p.hourly_rate}/hr · {p.experience_yrs}y exp</Text>
                        </View>
                        <Text style={styles.arrow}>›</Text>
                    </TouchableOpacity>
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56, backgroundColor: '#6C63FF' },
    greet: { fontSize: 20, fontWeight: '700', color: '#fff' },
    sub: { color: '#DDD6FE', fontSize: 13, marginTop: 2 },
    searchBtn: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, color: '#6C63FF', fontWeight: '600' },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
    catScroll: { paddingLeft: 16, marginBottom: 4 },
    catCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginRight: 10, alignItems: 'center', width: 80, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    catCardActive: { backgroundColor: '#6C63FF' },
    catIcon: { fontSize: 24, marginBottom: 4 },
    catName: { fontSize: 11, color: '#374151', fontWeight: '600', textAlign: 'center' },
    providerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 12, backgroundColor: '#E5E7EB' },
    provName: { fontWeight: '700', fontSize: 15, color: '#1F2937' },
    category: { color: '#6B7280', fontSize: 12, marginTop: 2 },
    meta: { color: '#374151', fontSize: 12, marginTop: 4 },
    arrow: { fontSize: 22, color: '#9CA3AF' },
    empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 14 },
});
