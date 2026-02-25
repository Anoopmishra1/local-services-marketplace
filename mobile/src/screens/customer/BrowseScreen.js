import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator, Image,
} from 'react-native';
import * as Location from 'expo-location';
import api from '../../services/api';

export default function BrowseScreen({ navigation }) {
    const [search, setSearch] = useState('');
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [coords, setCoords] = useState(null);
    const [filters, setFilters] = useState({ min_rating: 0, max_price: '', sort_by: 'rating' });

    useEffect(() => {
        Location.requestForegroundPermissionsAsync().then(async ({ status }) => {
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                setCoords(loc.coords);
                doSearch(loc.coords, filters, '');
            }
        });
    }, []);

    const doSearch = async (loc, f, q) => {
        if (!loc) return;
        setLoading(true);
        try {
            const { data } = await api.get('/providers/nearby', {
                params: {
                    lat: loc.latitude, lng: loc.longitude, radius_km: 15,
                    min_rating: f.min_rating || 0,
                    max_price: f.max_price || undefined,
                    sort_by: f.sort_by,
                },
            });
            const filtered = q
                ? data.filter((p) => p.users?.name?.toLowerCase().includes(q.toLowerCase()) || p.categories?.name?.toLowerCase().includes(q.toLowerCase()))
                : data;
            setProviders(filtered);
        } finally {
            setLoading(false);
        }
    };

    const renderProvider = ({ item: p }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ProviderDetail', { providerId: p.id })}
        >
            <Image source={{ uri: p.users?.avatar_url || 'https://i.pravatar.cc/80' }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
                <Text style={styles.name}>{p.users?.name}</Text>
                <Text style={styles.cat}>{p.categories?.name}</Text>
                <View style={styles.metaRow}>
                    <Text style={styles.badge}>⭐ {p.rating?.toFixed(1)}</Text>
                    <Text style={styles.badge}>₹{p.hourly_rate}/hr</Text>
                    <Text style={styles.badge}>{p.experience_yrs}y exp</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <TextInput
                style={styles.search}
                placeholder="🔍  Search by name or service..."
                value={search}
                onChangeText={(v) => {
                    setSearch(v);
                    if (coords) doSearch(coords, filters, v);
                }}
            />

            {/* Filter Row */}
            <View style={styles.filterRow}>
                {[
                    { label: 'Top Rated', key: 'min_rating', val: 4 },
                    { label: 'Under ₹500', key: 'max_price', val: '500' },
                ].map((f) => (
                    <TouchableOpacity
                        key={f.label}
                        style={[styles.chip, filters[f.key] == f.val && styles.chipActive]}
                        onPress={() => {
                            const updated = { ...filters, [f.key]: filters[f.key] == f.val ? (f.key === 'min_rating' ? 0 : '') : f.val };
                            setFilters(updated);
                            if (coords) doSearch(coords, updated, search);
                        }}
                    >
                        <Text style={[styles.chipText, filters[f.key] == f.val && { color: '#fff' }]}>{f.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#6C63FF" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={providers}
                    keyExtractor={(i) => i.id}
                    renderItem={renderProvider}
                    ListEmptyComponent={<Text style={styles.empty}>No providers found</Text>}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
    search: { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 14, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff' },
    chipActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
    chipText: { fontSize: 12, fontWeight: '600', color: '#374151' },
    card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 12, backgroundColor: '#E5E7EB' },
    name: { fontWeight: '700', fontSize: 15, color: '#1F2937' },
    cat: { color: '#6B7280', fontSize: 12, marginTop: 2 },
    metaRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
    badge: { backgroundColor: '#EDE9FE', color: '#6C63FF', fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 14 },
});
