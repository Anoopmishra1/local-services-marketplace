import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ActivityIndicator,
    TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

// Try importing Razorpay — may not be installed
let RazorpayCheckout = null;
try { RazorpayCheckout = require('react-native-razorpay').default; } catch (e) { /* COD only */ }

export default function PaymentScreen({ route, navigation }) {
    const { bookingId } = route.params;
    const { user } = useAuthStore();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [method, setMethod] = useState('cod'); // 'cod' or 'online'

    useEffect(() => {
        api.get(`/bookings/${bookingId}`).then(({ data }) => {
            setBooking(data);
        }).finally(() => setLoading(false));
    }, [bookingId]);

    // ── Cash on Delivery ─────────────────────────────────────
    const handleCOD = async () => {
        setPaying(true);
        try {
            await api.post('/payments/cod', { booking_id: bookingId });
            Alert.alert('Booking Confirmed! 🎉', 'Pay cash to the provider when they arrive.', [
                {
                    text: 'Chat with Provider',
                    onPress: () => navigation.replace('Chat', {
                        bookingId,
                        receiverId: booking?.provider?.user_id,
                    }),
                },
            ]);
        } catch (err) {
            Alert.alert('Error', err.response?.data?.error || err.message);
        } finally {
            setPaying(false);
        }
    };

    // ── Razorpay Online Payment ──────────────────────────────
    const handleOnlinePay = async () => {
        if (!RazorpayCheckout) {
            return Alert.alert('Not Available', 'Online payment module is not installed. Use Cash on Delivery.');
        }
        setPaying(true);
        try {
            const { data: orderData } = await api.post('/payments/order', { booking_id: bookingId });

            const options = {
                description: `Payment for ${booking.service_type}`,
                image: 'https://i.imgur.com/7k12EPD.png',
                currency: orderData.currency,
                key: orderData.key_id,
                amount: orderData.amount,
                order_id: orderData.order_id,
                name: 'Local Services',
                prefill: { email: user.email || '', contact: user.phone || '', name: user.name },
                theme: { color: '#6C63FF' },
            };

            const paymentData = await RazorpayCheckout.open(options);

            await api.post('/payments/verify', {
                razorpay_order_id: paymentData.razorpay_order_id,
                razorpay_payment_id: paymentData.razorpay_payment_id,
                razorpay_signature: paymentData.razorpay_signature,
                booking_id: bookingId,
            });

            Alert.alert('Payment Successful! ✅', 'Your booking is confirmed.', [
                { text: 'Chat with Provider', onPress: () => navigation.replace('Chat', { bookingId }) },
            ]);
        } catch (err) {
            if (err?.code) {
                Alert.alert('Payment Cancelled', 'You cancelled the payment.');
            } else {
                Alert.alert('Payment Failed', err.response?.data?.error || err.message);
            }
        } finally {
            setPaying(false);
        }
    };

    if (loading) return <ActivityIndicator size="large" color="#6C63FF" style={{ flex: 1, marginTop: 100 }} />;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Booking Summary</Text>
                <Row label="Service" value={booking?.service_type} />
                <Row label="Provider" value={booking?.provider?.user?.name} />
                <Row label="Scheduled" value={new Date(booking?.scheduled_at).toLocaleString('en-IN')} />
                <Row label="Duration" value={`${booking?.duration_hours} hour(s)`} />
                <Row label="Address" value={booking?.address} />
                <View style={styles.divider} />
                <Row label="Total Amount" value={`₹${booking?.total_amount}`} highlight />
                <Row label="Status" value={booking?.is_paid ? '✅ Paid' : '⏳ Pending'} />
            </View>

            {/* Payment Method Selector */}
            {!booking?.is_paid && booking?.status === 'accepted' && (
                <>
                    <Text style={styles.methodTitle}>Choose Payment Method</Text>
                    <View style={styles.methodRow}>
                        <TouchableOpacity
                            style={[styles.methodCard, method === 'cod' && styles.methodActive]}
                            onPress={() => setMethod('cod')}
                        >
                            <Text style={styles.methodIcon}>💵</Text>
                            <Text style={[styles.methodLabel, method === 'cod' && styles.methodLabelActive]}>Cash on Delivery</Text>
                            <Text style={styles.methodSub}>Pay when provider arrives</Text>
                            <Text style={styles.methodFree}>FREE ✓</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.methodCard, method === 'online' && styles.methodActive]}
                            onPress={() => setMethod('online')}
                        >
                            <Text style={styles.methodIcon}>💳</Text>
                            <Text style={[styles.methodLabel, method === 'online' && styles.methodLabelActive]}>Pay Online</Text>
                            <Text style={styles.methodSub}>Razorpay (Test Mode)</Text>
                            <Text style={styles.methodFree}>FREE in test</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.payBtn}
                        onPress={method === 'cod' ? handleCOD : handleOnlinePay}
                        disabled={paying}
                    >
                        {paying
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.payBtnText}>
                                {method === 'cod'
                                    ? `Confirm Booking (Pay ₹${booking?.total_amount} on arrival)`
                                    : `Pay ₹${booking?.total_amount} Online`}
                            </Text>}
                    </TouchableOpacity>
                </>
            )}

            {booking?.status === 'pending' && (
                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>⏳ Waiting for provider to accept your booking before payment.</Text>
                </View>
            )}

            {booking?.is_paid && (
                <TouchableOpacity style={styles.reviewBtn}
                    onPress={() => navigation.navigate('Review', { bookingId, providerId: booking.provider_id })}>
                    <Text style={styles.reviewBtnText}>Leave a Review ⭐</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
}

const Row = ({ label, value, highlight }) => (
    <View style={styles.row}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={[styles.rowValue, highlight && styles.rowHighlight]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { padding: 16, backgroundColor: '#F9FAFB', flexGrow: 1 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, elevation: 3, marginBottom: 20 },
    cardTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937', marginBottom: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    rowLabel: { color: '#6B7280', fontSize: 13 },
    rowValue: { color: '#1F2937', fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
    rowHighlight: { color: '#6C63FF', fontSize: 18, fontWeight: '800' },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 8 },
    methodTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
    methodRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    methodCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: '#E5E7EB', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
    methodActive: { borderColor: '#6C63FF', backgroundColor: '#EDE9FE' },
    methodIcon: { fontSize: 28, marginBottom: 6 },
    methodLabel: { fontWeight: '700', fontSize: 13, color: '#1F2937', textAlign: 'center' },
    methodLabelActive: { color: '#6C63FF' },
    methodSub: { color: '#6B7280', fontSize: 10, marginTop: 2, textAlign: 'center' },
    methodFree: { color: '#10B981', fontSize: 10, fontWeight: '700', marginTop: 4 },
    payBtn: { backgroundColor: '#6C63FF', borderRadius: 14, padding: 18, alignItems: 'center' },
    payBtnText: { color: '#fff', fontWeight: '700', fontSize: 15, textAlign: 'center' },
    infoBox: { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 16 },
    infoText: { color: '#92400E', fontSize: 13, textAlign: 'center' },
    reviewBtn: { marginTop: 12, backgroundColor: '#10B981', borderRadius: 14, padding: 16, alignItems: 'center' },
    reviewBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
