import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    ScrollView, Image, ActivityIndicator, RefreshControl, Animated,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as Location from 'expo-location';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const CATEGORIES = [
    { id: '1', name: 'Electrician', icon: 'flash' },
    { id: '2', name: 'Plumber', icon: 'wrench' },
    { id: '3', name: 'Tutor', icon: 'book-open-variant' },
    { id: '4', name: 'Carpenter', icon: 'saw-blade' },
    { id: '5', name: 'Painter', icon: 'palette' },
    { id: '6', name: 'Cleaner', icon: 'broom' },
    { id: '7', name: 'AC Tech', icon: 'snowflake' },
];

// ── Extracted components (hooks must be at component level) ──

const CategoryCard = ({ cat, index, isSelected, onPress }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 300, delay: index * 60, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }, { scale: scaleAnim }] }}>
            <TouchableOpacity
                style={[styles.catCard, isSelected && styles.catCardActive]}
                onPress={onPress}
                onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.93, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start()}
            >
                <Icon name={cat.icon} size={28} color={isSelected ? '#fff' : '#6C63FF'} style={styles.catIcon} />
                <Text style={[styles.catName, isSelected && { color: '#fff' }]}>{cat.name}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const ProviderCard = ({ item, index, navigation }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 350, delay: index * 80, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
            <TouchableOpacity
                style={styles.providerCard}
                onPress={() => navigation.navigate('ProviderDetail', { providerId: item.id })}
                onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start()}
            >
                <Image source={{ uri: item.users?.avatar_url || 'https://i.pravatar.cc/80' }} style={styles.avatar} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.provName}>{item.users?.name}</Text>
                    <Text style={styles.category}>{item.categories?.name}</Text>
                    <Text style={styles.meta}>⭐ {item.rating?.toFixed(1)} · ₹{item.hourly_rate}/hr · {item.experience_yrs}y exp</Text>
                </View>
                <Icon name="chevron-right" size={24} color="#9CA3AF" />
            </TouchableOpacity>
        </Animated.View>
    );
};

// ── Main Screen ──

export default function HomeScreen({ navigation }) {
    const { user } = useAuthStore();
    const [location, setLocation] = useState(null);
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCat, setSelectedCat] = useState(null);

    const headerSlide = useRef(new Animated.Value(-60)).current;
    const headerFade = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(headerSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
            Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]).start();
    }, []);

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
            <Animated.View style={[styles.header, { transform: [{ translateY: headerSlide }], opacity: headerFade }]}>
                <View>
                    <Text style={styles.greet}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
                    <Text style={styles.sub}>What service do you need today?</Text>
                </View>
                <TouchableOpacity style={styles.searchBtn} onPress={() => navigation.navigate('Browse')}>
                    <Icon name="magnify" size={18} color="#6C63FF" />
                    <Text style={styles.searchBtnText}>Search</Text>
                </TouchableOpacity>
            </Animated.View>

            <Text style={styles.sectionTitle}>Browse by Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                {CATEGORIES.map((cat, index) => (
                    <CategoryCard
                        key={cat.id}
                        cat={cat}
                        index={index}
                        isSelected={selectedCat === cat.id}
                        onPress={() => {
                            const next = selectedCat === cat.id ? null : cat.id;
                            setSelectedCat(next);
                            if (location) fetchNearby(location, next);
                        }}
                    />
                ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>Nearby Providers</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#6C63FF" style={{ marginTop: 40 }} />
            ) : providers.length === 0 ? (
                <Text style={styles.empty}>No providers found nearby. Try a wider radius.</Text>
            ) : (
                providers.map((p, index) => (
                    <ProviderCard key={p.id} item={p} index={index} navigation={navigation} />
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
    searchBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
    searchBtnText: { color: '#6C63FF', fontWeight: '600', marginLeft: 4 },
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
    empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 14 },
});
