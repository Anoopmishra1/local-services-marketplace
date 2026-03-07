import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ActivityIndicator,
    TouchableOpacity, Alert, ScrollView, Linking,
    TextInput, Animated,
} from 'react-native';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function PaymentScreen({ route, navigation }) {
    const { bookingId } = route.params;
    const { user } = useAuthStore();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [method, setMethod] = useState('upi'); // 'upi' or 'cod'
    const [transactionRef, setTransactionRef] = useState('');
    const [upiStep, setUpiStep] = useState('idle'); // idle | opened | confirming

    // Animations
    const cardFade = useRef(new Animated.Value(0)).current;
    const cardSlide = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        api.get(`/bookings/${bookingId}`).then(({ data }) => {
            setBooking(data);
        }).finally(() => {
            setLoading(false);
            Animated.parallel([
                Animated.timing(cardFade, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(cardSlide, { toValue: 0, duration: 450, useNativeDriver: true }),
            ]).start();
        });
    }, [bookingId]);

    // ── UPI Payment ───────────────────────────────────────────
    const handleUPI = async () => {
        setPaying(true);
        try {
            const { data } = await api.post('/payments/upi/initiate', { booking_id: bookingId });

            // Try to open UPI deep link
            const supported = await Linking.canOpenURL(data.upi_link);
            if (supported) {
                await Linking.openURL(data.upi_link);
                setUpiStep('opened');
            } else {
                // Fallback: show UPI ID manually
                Alert.alert(
                    'Open UPI App Manually',
                    `Pay ₹${data.amount} to:\n\nUPI ID: ${data.upi_id}\nName: ${data.provider_name}`,
                    [{ text: 'Done', onPress: () => setUpiStep('opened') }]
                );
            }
        } catch (err) {
            Alert.alert('Error', err.response?.data?.error || err.message);
        } finally {
            setPaying(false);
        }
    };

    // ── Confirm UPI Payment done ──────────────────────────────
    const handleConfirmUPI = async () => {
        setUpiStep('confirming');
        try {
            await api.post('/payments/upi/confirm', {
                booking_id: bookingId,
                transaction_ref: transactionRef.trim() || undefined,
            });
            Alert.alert(
                'Payment Confirmed! ✅',
                'The provider has been notified. They will verify and proceed with the service.',
                [{
                    text: 'Chat with Provider',
                    onPress: () => navigation.replace('Chat', {
                        bookingId,
                        receiverId: booking?.provider?.user_id,
                    }),
                }]
            );
        } catch (err) {
            Alert.alert('Error', err.response?.data?.error || err.message);
            setUpiStep('opened');
        }
    };

    // ── Cash on Delivery ──────────────────────────────────────
    const handleCOD = async () => {
        setPaying(true);
        try {
            await api.post('/payments/cod', { booking_id: bookingId });
            Alert.alert(
                'Booking Confirmed! 🎉',
                'Pay cash to the provider when they arrive.',
                [{
                    text: 'Chat with Provider',
                    onPress: () => navigation.replace('Chat', {
                        bookingId,
                        receiverId: booking?.provider?.user_id,
                    }),
                }]
            );
        } catch (err) {
            Alert.alert('Error', err.response?.data?.error || err.message);
        } finally {
            setPaying(false);
        }
    };

    if (loading) return <ActivityIndicator size="large" color="#6C63FF" style={{ flex: 1, marginTop: 100 }} />;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Booking Summary */}
            <Animated.View style={[styles.card, { opacity: cardFade, transform: [{ translateY: cardSlide }] }]}>
                <Text style={styles.cardTitle}>Booking Summary</Text>
                <Row label="Service" value={booking?.service_type} />
                <Row label="Provider" value={booking?.provider?.user?.name || booking?.provider?.users?.name} />
                <Row label="Scheduled" value={new Date(booking?.scheduled_at).toLocaleString('en-IN')} />
                <Row label="Duration" value={`${booking?.duration_hours} hour(s)`} />
                <Row label="Address" value={booking?.address} />
                <View style={styles.divider} />
                <Row label="Total Amount" value={`₹${booking?.total_amount}`} highlight />
                <Row label="Status" value={booking?.is_paid ? '✅ Paid' : '⏳ Pending'} />
            </Animated.View>

            {/* Payment pending + booking accepted */}
            {!booking?.is_paid && booking?.status === 'accepted' && (
                <>
                    {/* Method selector — only show if not yet in UPI flow */}
                    {upiStep === 'idle' && (
                        <>
                            <Text style={styles.methodTitle}>Choose Payment Method</Text>
                            <View style={styles.methodRow}>
                                {/* UPI Card */}
                                <TouchableOpacity
                                    style={[styles.methodCard, method === 'upi' && styles.methodActive]}
                                    onPress={() => setMethod('upi')}
                                >
                                    <Text style={styles.methodIcon}>📱</Text>
                                    <Text style={[styles.methodLabel, method === 'upi' && styles.methodLabelActive]}>
                                        Pay via UPI
                                    </Text>
                                    <Text style={styles.methodSub}>GPay · PhonePe · Paytm · BHIM</Text>
                                    <Text style={styles.methodFree}>FREE ✓ Zero fees</Text>
                                </TouchableOpacity>

                                {/* COD Card */}
                                <TouchableOpacity
                                    style={[styles.methodCard, method === 'cod' && styles.methodActive]}
                                    onPress={() => setMethod('cod')}
                                >
                                    <Text style={styles.methodIcon}>💵</Text>
                                    <Text style={[styles.methodLabel, method === 'cod' && styles.methodLabelActive]}>
                                        Cash on Delivery
                                    </Text>
                                    <Text style={styles.methodSub}>Pay when provider arrives</Text>
                                    <Text style={styles.methodFree}>FREE ✓</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={styles.payBtn}
                                onPress={method === 'upi' ? handleUPI : handleCOD}
                                disabled={paying}
                            >
                                {paying
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text style={styles.payBtnText}>
                                        {method === 'upi'
                                            ? `Open UPI App — Pay ₹${booking?.total_amount}`
                                            : `Confirm (Pay ₹${booking?.total_amount} on arrival)`}
                                    </Text>}
                            </TouchableOpacity>
                        </>
                    )}

                    {/* After UPI app opened — confirm step */}
                    {upiStep === 'opened' && (
                        <View style={styles.confirmBox}>
                            <Text style={styles.confirmTitle}>Did you complete the payment?</Text>
                            <Text style={styles.confirmSub}>
                                Enter your UPI Transaction ID (optional but helpful for provider)
                            </Text>
                            <TextInput
                                style={styles.txnInput}
                                placeholder="UPI Transaction ID (e.g. 426789234567)"
                                value={transactionRef}
                                onChangeText={setTransactionRef}
                                keyboardType="default"
                            />
                            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmUPI}>
                                {upiStep === 'confirming'
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text style={styles.confirmBtnText}>✅ Yes, I've Paid</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.retryBtn} onPress={handleUPI}>
                                <Text style={styles.retryBtnText}>↩ Retry UPI Payment</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </>
            )}

            {/* Waiting for acceptance */}
            {booking?.status === 'pending' && (
                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>⏳ Waiting for provider to accept your booking before payment.</Text>
                </View>
            )}

            {/* Already paid — leave review */}
            {booking?.is_paid && (
                <TouchableOpacity
                    style={styles.reviewBtn}
                    onPress={() => navigation.navigate('Review', { bookingId, providerId: booking.provider_id })}
                >
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
    methodCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: '#E5E7EB', elevation: 1 },
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
    // UPI confirm step
    confirmBox: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 2, alignItems: 'center' },
    confirmTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937', textAlign: 'center', marginBottom: 8 },
    confirmSub: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
    txnInput: { width: '100%', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 14, backgroundColor: '#F9FAFB', marginBottom: 16 },
    confirmBtn: { backgroundColor: '#10B981', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 32, width: '100%', alignItems: 'center', marginBottom: 10 },
    confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    retryBtn: { paddingVertical: 10 },
    retryBtnText: { color: '#6C63FF', fontWeight: '600', fontSize: 14 },
});
