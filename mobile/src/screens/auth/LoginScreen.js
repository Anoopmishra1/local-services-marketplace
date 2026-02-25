import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

export default function LoginScreen({ navigation }) {
    const [tab, setTab] = useState('email'); // 'email' | 'otp'
    const [email, setEmail] = useState('');
    const [password, setPass] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const loginWithEmail = useAuthStore((s) => s.loginWithEmail);

    const handleEmailLogin = async () => {
        if (!email || !password) return Alert.alert('Error', 'Fill all fields');
        setLoading(true);
        try {
            await loginWithEmail(email, password);
        } catch (err) {
            Alert.alert('Login Failed', err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSendOTP = async () => {
        if (!phone || phone.length < 10) return Alert.alert('Error', 'Enter valid phone');
        setLoading(true);
        try {
            await api.post('/auth/send-otp', { phone: `+91${phone}` });
            navigation.navigate('OTP', { phone: `+91${phone}` });
        } catch (err) {
            Alert.alert('Error', err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <Text style={styles.title}>Welcome Back 👋</Text>
            <Text style={styles.subtitle}>Book local services in minutes</Text>

            {/* Tab Switcher */}
            <View style={styles.tabRow}>
                {['email', 'otp'].map((t) => (
                    <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.activeTab]} onPress={() => setTab(t)}>
                        <Text style={[styles.tabText, tab === t && styles.activeTabText]}>
                            {t === 'email' ? 'Email' : 'OTP'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {tab === 'email' ? (
                <>
                    <TextInput style={styles.input} placeholder="Email" value={email}
                        onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                    <TextInput style={styles.input} placeholder="Password" value={password}
                        onChangeText={setPass} secureTextEntry />
                    <TouchableOpacity style={styles.btn} onPress={handleEmailLogin} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Login</Text>}
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <View style={styles.phoneRow}>
                        <Text style={styles.code}>+91</Text>
                        <TextInput style={[styles.input, { flex: 1 }]} placeholder="Mobile number"
                            value={phone} onChangeText={setPhone} keyboardType="number-pad" maxLength={10} />
                    </View>
                    <TouchableOpacity style={styles.btn} onPress={handleSendOTP} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send OTP</Text>}
                    </TouchableOpacity>
                </>
            )}

            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ marginTop: 20 }}>
                <Text style={styles.link}>Don't have an account? <Text style={{ color: '#6C63FF' }}>Register</Text></Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, backgroundColor: '#fff', justifyContent: 'center' },
    title: { fontSize: 28, fontWeight: '800', color: '#1F2937', marginBottom: 6 },
    subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 32 },
    tabRow: { flexDirection: 'row', marginBottom: 24, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#F9FAFB' },
    activeTab: { backgroundColor: '#6C63FF' },
    tabText: { color: '#6B7280', fontWeight: '600' },
    activeTabText: { color: '#fff' },
    input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, marginBottom: 14, fontSize: 15, backgroundColor: '#F9FAFB' },
    btn: { backgroundColor: '#6C63FF', borderRadius: 12, padding: 16, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    link: { color: '#6B7280', textAlign: 'center', fontSize: 14 },
    phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    code: { fontSize: 16, fontWeight: '600', color: '#1F2937', paddingRight: 4 },
});
