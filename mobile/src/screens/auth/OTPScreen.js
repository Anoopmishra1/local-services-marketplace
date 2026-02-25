import React, { useState, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';

export default function OTPScreen({ route, navigation }) {
    const { phone } = route.params;
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoad] = useState(false);
    const inputs = useRef([]);
    const verifyOTP = useAuthStore((s) => s.verifyOTP);

    const handleChange = (val, idx) => {
        const next = [...otp];
        next[idx] = val;
        setOtp(next);
        if (val && idx < 5) inputs.current[idx + 1]?.focus();
    };

    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length < 6) return Alert.alert('Error', 'Enter 6-digit OTP');
        setLoad(true);
        try {
            await verifyOTP(phone, code);
        } catch (err) {
            Alert.alert('Invalid OTP', err.response?.data?.error || err.message);
        } finally {
            setLoad(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.sub}>Sent to {phone}</Text>

            <View style={styles.otpRow}>
                {otp.map((digit, i) => (
                    <TextInput
                        key={i}
                        ref={(r) => (inputs.current[i] = r)}
                        style={styles.box}
                        maxLength={1}
                        keyboardType="number-pad"
                        value={digit}
                        onChangeText={(v) => handleChange(v, i)}
                    />
                ))}
            </View>

            <TouchableOpacity style={styles.btn} onPress={handleVerify} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify & Continue</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
                <Text style={styles.link}>← Change number</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, backgroundColor: '#fff', justifyContent: 'center' },
    title: { fontSize: 26, fontWeight: '800', color: '#1F2937', marginBottom: 6 },
    sub: { color: '#6B7280', marginBottom: 36, fontSize: 14 },
    otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 36 },
    box: {
        width: 48, height: 56, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
        textAlign: 'center', fontSize: 22, fontWeight: '700', color: '#1F2937', backgroundColor: '#F9FAFB'
    },
    btn: { backgroundColor: '#6C63FF', borderRadius: 12, padding: 16, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    link: { color: '#6B7280', textAlign: 'center', fontSize: 14 },
});
