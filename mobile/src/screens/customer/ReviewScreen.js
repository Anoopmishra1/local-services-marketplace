import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, TextInput,
    StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import api from '../../services/api';

export default function ReviewScreen({ route, navigation }) {
    const { bookingId, providerId } = route.params;
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        if (!rating) return Alert.alert('Error', 'Please select a rating');
        setLoading(true);
        try {
            await api.post('/reviews', { booking_id: bookingId, rating, comment });
            Alert.alert('Review Submitted! ⭐', 'Thank you for your feedback.', [
                { text: 'OK', onPress: () => navigation.navigate('Bookings') },
            ]);
        } catch (err) {
            Alert.alert('Error', err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>How was your experience?</Text>
            <Text style={styles.sub}>Your feedback helps providers and other customers.</Text>

            <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((s) => (
                    <TouchableOpacity key={s} onPress={() => setRating(s)}>
                        <Text style={[styles.star, s <= rating && styles.starActive]}>★</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <Text style={styles.ratingLabel}>
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating] || 'Tap a star'}
            </Text>

            <TextInput
                style={styles.textarea}
                placeholder="Share your experience (optional)..."
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
            />

            <TouchableOpacity style={styles.btn} onPress={submit} disabled={loading || !rating}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Review</Text>}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 22, fontWeight: '800', color: '#1F2937', textAlign: 'center', marginBottom: 8 },
    sub: { color: '#6B7280', fontSize: 13, textAlign: 'center', marginBottom: 28 },
    stars: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    star: { fontSize: 44, color: '#E5E7EB' },
    starActive: { color: '#F59E0B' },
    ratingLabel: { color: '#6B7280', fontSize: 14, marginBottom: 24, fontWeight: '600' },
    textarea: { width: '100%', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 14, minHeight: 100, backgroundColor: '#F9FAFB', marginBottom: 20 },
    btn: { backgroundColor: '#6C63FF', borderRadius: 14, padding: 16, alignItems: 'center', width: '100%' },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
