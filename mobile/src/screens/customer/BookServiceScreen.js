import React, { useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, TextInput,
    StyleSheet, ActivityIndicator, Alert, Platform,
} from 'react-native';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const HOURS = [1, 2, 3, 4];

export default function BookServiceScreen({ route, navigation }) {
    const { provider, providerId: paramProviderId } = route.params;
    const providerId = paramProviderId || provider?.id;
    const { user } = useAuthStore();

    const [form, setForm] = useState({
        service_type: provider?.categories?.name || '',
        description: '',
        address: '',
        scheduled_date: '',  // YYYY-MM-DD
        scheduled_time: '',  // HH:MM
        duration_hours: 1,
    });
    const [loading, setLoading] = useState(false);

    const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

    const handleBook = async () => {
        const { service_type, address, scheduled_date, scheduled_time } = form;
        if (!service_type || !address || !scheduled_date || !scheduled_time) {
            return Alert.alert('Missing Fields', 'Please fill all required fields');
        }

        const scheduled_at = new Date(`${scheduled_date}T${scheduled_time}:00`).toISOString();
        if (isNaN(new Date(scheduled_at).getTime())) {
            return Alert.alert('Invalid Date', 'Enter date as YYYY-MM-DD and time as HH:MM');
        }

        setLoading(true);
        try {
            const { data: booking } = await api.post('/bookings', {
                provider_id: providerId,
                service_type: form.service_type,
                description: form.description,
                address: form.address,
                scheduled_at,
                duration_hours: form.duration_hours,
            });

            Alert.alert(
                'Booking Placed! 🎉',
                'Waiting for provider to accept. You can pay after acceptance.',
                [
                    {
                        text: 'Chat with Provider',
                        onPress: () => navigation.navigate('Chat', { bookingId: booking.id }),
                    },
                    {
                        text: 'My Bookings',
                        onPress: () => navigation.navigate('Bookings'),
                    },
                ]
            );
        } catch (err) {
            Alert.alert('Error', err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const totalEstimate = provider?.hourly_rate
        ? `₹${(provider.hourly_rate * form.duration_hours).toFixed(0)}`
        : 'TBD';

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.providerBox}>
                <Text style={styles.provName}>{provider?.users?.name || 'Provider'}</Text>
                <Text style={styles.provMeta}>
                    {provider?.categories?.name} · ⭐ {provider?.rating?.toFixed(1)} · ₹{provider?.hourly_rate}/hr
                </Text>
            </View>

            <Text style={styles.label}>Service Type *</Text>
            <TextInput style={styles.input} value={form.service_type}
                onChangeText={(v) => set('service_type', v)} placeholder="e.g. Fan installation" />

            <Text style={styles.label}>Problem Description</Text>
            <TextInput style={[styles.input, styles.textarea]} value={form.description}
                onChangeText={(v) => set('description', v)}
                placeholder="Describe your issue in detail..." multiline numberOfLines={4} textAlignVertical="top" />

            <Text style={styles.label}>Service Address *</Text>
            <TextInput style={[styles.input, styles.textarea]} value={form.address}
                onChangeText={(v) => set('address', v)}
                placeholder="Complete address with landmark..." multiline numberOfLines={3} textAlignVertical="top" />

            <Text style={styles.label}>Date * (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={form.scheduled_date}
                onChangeText={(v) => set('scheduled_date', v)} placeholder="2026-03-15" keyboardType="numbers-and-punctuation" />

            <Text style={styles.label}>Time * (HH:MM)</Text>
            <TextInput style={styles.input} value={form.scheduled_time}
                onChangeText={(v) => set('scheduled_time', v)} placeholder="10:00" keyboardType="numbers-and-punctuation" />

            <Text style={styles.label}>Duration (hours)</Text>
            <View style={styles.durationRow}>
                {HOURS.map((h) => (
                    <TouchableOpacity key={h} style={[styles.hrBtn, form.duration_hours === h && styles.hrBtnActive]}
                        onPress={() => set('duration_hours', h)}>
                        <Text style={[styles.hrText, form.duration_hours === h && { color: '#fff' }]}>{h}h</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.summary}>
                <Text style={styles.summaryLabel}>Estimated Total</Text>
                <Text style={styles.summaryAmount}>{totalEstimate}</Text>
            </View>

            <TouchableOpacity style={styles.btn} onPress={handleBook} disabled={loading}>
                {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.btnText}>Confirm Booking</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
    providerBox: { backgroundColor: '#6C63FF', borderRadius: 14, padding: 16, marginBottom: 20 },
    provName: { color: '#fff', fontWeight: '700', fontSize: 17 },
    provMeta: { color: '#DDD6FE', fontSize: 13, marginTop: 4 },
    label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
    input: { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 14, borderWidth: 1, borderColor: '#E5E7EB' },
    textarea: { minHeight: 80, textAlignVertical: 'top' },
    durationRow: { flexDirection: 'row', gap: 10 },
    hrBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center', backgroundColor: '#fff' },
    hrBtnActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
    hrText: { fontWeight: '700', color: '#374151' },
    summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#EDE9FE', borderRadius: 12, padding: 16, marginTop: 20 },
    summaryLabel: { fontWeight: '600', color: '#5B21B6', fontSize: 14 },
    summaryAmount: { fontWeight: '800', color: '#6C63FF', fontSize: 22 },
    btn: { backgroundColor: '#6C63FF', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20 },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
