import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, Switch, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import api from '../../services/api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const defaultSlots = DAYS.map((_, i) => ({
    day_of_week: i,
    start_time: '09:00',
    end_time: '18:00',
    is_available: i >= 1 && i <= 5, // Mon–Fri default
}));

export default function AvailabilityScreen() {
    const [slots, setSlots] = useState(defaultSlots);
    const [loading, setLoad] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get('/providers/profile').then(({ data }) => {
            if (data?.availability?.length) {
                const merged = defaultSlots.map((d) => {
                    const found = data.availability.find((a) => a.day_of_week === d.day_of_week);
                    return found ? { ...d, ...found } : d;
                });
                setSlots(merged);
            }
        }).finally(() => setLoad(false));
    }, []);

    const toggle = (idx) => {
        const next = [...slots];
        next[idx] = { ...next[idx], is_available: !next[idx].is_available };
        setSlots(next);
    };

    const setTime = (idx, key, val) => {
        const next = [...slots];
        next[idx] = { ...next[idx], [key]: val };
        setSlots(next);
    };

    const save = async () => {
        setSaving(true);
        try {
            await api.post('/providers/availability', {
                availability: slots.filter((s) => s.is_available),
            });
            Alert.alert('Saved ✅', 'Your availability has been updated.');
        } catch (err) {
            Alert.alert('Error', err.response?.data?.error || err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <ActivityIndicator size="large" color="#10B981" style={{ flex: 1, marginTop: 100 }} />;

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={styles.title}>Set Your Availability</Text>
            <Text style={styles.sub}>Choose which days and hours you accept bookings.</Text>

            {slots.map((slot, idx) => (
                <View key={idx} style={[styles.dayCard, !slot.is_available && styles.dayCardOff]}>
                    <View style={styles.dayHeader}>
                        <Text style={styles.dayName}>{DAYS[idx]}</Text>
                        <Switch
                            value={slot.is_available}
                            onValueChange={() => toggle(idx)}
                            trackColor={{ true: '#10B981', false: '#E5E7EB' }}
                            thumbColor={slot.is_available ? '#fff' : '#9CA3AF'}
                        />
                    </View>

                    {slot.is_available && (
                        <View style={styles.timeRow}>
                            <View style={styles.timeField}>
                                <Text style={styles.timeLabel}>Start</Text>
                                <TextInput
                                    style={styles.timeInput}
                                    value={slot.start_time}
                                    onChangeText={(v) => setTime(idx, 'start_time', v)}
                                    placeholder="09:00"
                                />
                            </View>
                            <Text style={styles.dash}>–</Text>
                            <View style={styles.timeField}>
                                <Text style={styles.timeLabel}>End</Text>
                                <TextInput
                                    style={styles.timeInput}
                                    value={slot.end_time}
                                    onChangeText={(v) => setTime(idx, 'end_time', v)}
                                    placeholder="18:00"
                                />
                            </View>
                        </View>
                    )}
                </View>
            ))}

            <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Availability</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
    title: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
    sub: { color: '#6B7280', fontSize: 13, marginBottom: 20 },
    dayCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    dayCardOff: { opacity: 0.5 },
    dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dayName: { fontWeight: '700', fontSize: 15, color: '#1F2937' },
    timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
    timeField: { flex: 1 },
    timeLabel: { fontSize: 11, color: '#6B7280', marginBottom: 4 },
    timeInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 10, fontSize: 14, textAlign: 'center', backgroundColor: '#F9FAFB' },
    dash: { fontSize: 18, color: '#9CA3AF', marginTop: 16 },
    saveBtn: { backgroundColor: '#10B981', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 10 },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
