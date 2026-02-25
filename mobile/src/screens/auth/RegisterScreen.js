import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';

const ROLES = ['customer', 'provider'];

export default function RegisterScreen({ navigation }) {
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'customer' });
    const [loading, setLoad] = useState(false);
    const register = useAuthStore((s) => s.register);

    const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

    const handleRegister = async () => {
        if (!form.name || !form.email || !form.password) return Alert.alert('Error', 'Fill all required fields');
        setLoad(true);
        try {
            await register(form);
        } catch (err) {
            Alert.alert('Registration Failed', err.response?.data?.error || err.message);
        } finally {
            setLoad(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Create Account 🚀</Text>
            <Text style={styles.sub}>Join as a customer or service provider</Text>

            {/* Role Selector */}
            <View style={styles.roleRow}>
                {ROLES.map((r) => (
                    <TouchableOpacity key={r} style={[styles.roleBtn, form.role === r && styles.roleBtnActive]}
                        onPress={() => set('role', r)}>
                        <Text style={[styles.roleText, form.role === r && { color: '#fff' }]}>
                            {r === 'customer' ? '🙋 Customer' : '🔧 Provider'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <TextInput style={styles.input} placeholder="Full Name *" value={form.name} onChangeText={(v) => set('name', v)} />
            <TextInput style={styles.input} placeholder="Email *" value={form.email}
                onChangeText={(v) => set('email', v)} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Phone" value={form.phone}
                onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Password *" value={form.password}
                onChangeText={(v) => set('password', v)} secureTextEntry />

            <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Register</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 20 }}>
                <Text style={styles.link}>Already have an account? <Text style={{ color: '#6C63FF' }}>Login</Text></Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 24, backgroundColor: '#fff', flexGrow: 1, justifyContent: 'center' },
    title: { fontSize: 26, fontWeight: '800', color: '#1F2937', marginBottom: 6 },
    sub: { color: '#6B7280', marginBottom: 28, fontSize: 14 },
    roleRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    roleBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center', backgroundColor: '#F9FAFB' },
    roleBtnActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
    roleText: { fontSize: 14, fontWeight: '600', color: '#374151' },
    input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, marginBottom: 14, fontSize: 15, backgroundColor: '#F9FAFB' },
    btn: { backgroundColor: '#6C63FF', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    link: { color: '#6B7280', textAlign: 'center', fontSize: 14 },
});
