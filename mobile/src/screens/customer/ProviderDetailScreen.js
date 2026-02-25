import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Image, ScrollView,
    TouchableOpacity, ActivityIndicator, FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../services/api';

export default function ProviderDetailScreen({ route, navigation }) {
    const { providerId } = route.params;
    const [provider, setProvider] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const { data } = await api.get(`/providers/${providerId}`);
                setProvider(data);

                // Fetch reviews for this provider
                const { data: reviewData } = await api.get(`/reviews/provider/${providerId}`);
                setReviews(reviewData);
            } catch (err) {
                console.error('Error fetching provider details:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [providerId]);

    if (loading) return <ActivityIndicator size="large" color="#6C63FF" style={{ flex: 1 }} />;
    if (!provider) return <View style={styles.container}><Text>Provider not found.</Text></View>;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Image
                    source={{ uri: provider.users?.avatar_url || 'https://i.pravatar.cc/150' }}
                    style={styles.coverImage}
                />

                <View style={styles.headerInfo}>
                    <Text style={styles.name}>{provider.users?.name}</Text>
                    <Text style={styles.category}>{provider.categories?.name}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Icon name="star" size={18} color="#FBBF24" />
                            <Text style={styles.statText}>{provider.rating?.toFixed(1) || 'N/A'}</Text>
                        </View>
                        <View style={styles.stat}>
                            <Icon name="briefcase" size={18} color="#6C63FF" />
                            <Text style={styles.statText}>{provider.experience_yrs} yrs exp</Text>
                        </View>
                        <View style={styles.stat}>
                            <Icon name="cash" size={18} color="#10B981" />
                            <Text style={styles.statText}>₹{provider.hourly_rate}/hr</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.bio}>{provider.bio || 'No bio provided.'}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
                    {reviews.length === 0 ? (
                        <Text style={styles.emptyText}>No reviews yet.</Text>
                    ) : (
                        reviews.map((item) => (
                            <View key={item.id} style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <Text style={styles.reviewerName}>{item.customer?.name}</Text>
                                    <View style={styles.stars}>
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Icon
                                                key={s}
                                                name="star"
                                                size={14}
                                                color={s <= item.rating ? "#FBBF24" : "#E5E7EB"}
                                            />
                                        ))}
                                    </View>
                                </View>
                                <Text style={styles.reviewComment}>{item.comment}</Text>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.bookBtn}
                    onPress={() => navigation.navigate('BookService', { provider })}
                >
                    <Text style={styles.bookBtnText}>Book Now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { paddingBottom: 100 },
    coverImage: { width: '100%', height: 250, backgroundColor: '#F3F4F6' },
    headerInfo: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    name: { fontSize: 24, fontWeight: '800', color: '#1F2937' },
    category: { fontSize: 16, color: '#6B7280', marginTop: 4 },
    statsRow: { flexDirection: 'row', marginTop: 16, gap: 20 },
    stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: { fontSize: 14, fontWeight: '600', color: '#374151' },
    section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
    bio: { fontSize: 15, color: '#4B5563', lineHeight: 22 },
    reviewCard: { marginBottom: 16, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12 },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    reviewerName: { fontWeight: '600', fontSize: 14, color: '#1F2937' },
    stars: { flexDirection: 'row' },
    reviewComment: { fontSize: 14, color: '#4B5563' },
    emptyText: { color: '#9CA3AF', fontStyle: 'italic' },
    footer: { position: 'absolute', bottom: 0, width: '100%', padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    bookBtn: { backgroundColor: '#6C63FF', padding: 16, borderRadius: 14, alignItems: 'center' },
    bookBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
