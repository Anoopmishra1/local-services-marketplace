import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ScrollView, ActivityIndicator, Alert, Animated,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';

const ROLES = ['customer', 'provider'];

export default function RegisterScreen({ navigation }) {
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'customer' });
    const [loading, setLoad] = useState(false);
    const register = useAuthStore((s) => s.register);

    // One Animated.Value per row (7 rows total)
    const anim0 = useRef(new Animated.Value(0)).current;
    const anim1 = useRef(new Animated.Value(0)).current;
    const anim2 = useRef(new Animated.Value(0)).current;
    const anim3 = useRef(new Animated.Value(0)).current;
    const anim4 = useRef(new Animated.Value(0)).current;
    const anim5 = useRef(new Animated.Value(0)).current;
    const anim6 = useRef(new Animated.Value(0)).current;

    const slide0 = useRef(new Animated.Value(30)).current;
    const slide1 = useRef(new Animated.Value(30)).current;
    const slide2 = useRef(new Animated.Value(30)).current;
    const slide3 = useRef(new Animated.Value(30)).current;
    const slide4 = useRef(new Animated.Value(30)).current;
    const slide5 = useRef(new Animated.Value(30)).current;
    const slide6 = useRef(new Animated.Value(30)).current;

    const btnScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const makeAnim = (anim, slide) => Animated.parallel([
            Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(slide, { toValue: 0, duration: 350, useNativeDriver: true }),
        ]);
        Animated.stagger(80, [
            makeAnim(anim0, slide0),
            makeAnim(anim1, slide1),
            makeAnim(anim2, slide2),
            makeAnim(anim3, slide3),
            makeAnim(anim4, slide4),
            makeAnim(anim5, slide5),
            makeAnim(anim6, slide6),
        ]).start();
    }, []);

    const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
    const onPressIn = () => Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true }).start();
    const onPressOut = () => Animated.spring(btnScale, { toValue: 1, friction: 3, useNativeDriver: true }).start();

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

            {/* Title */}
            <Animated.View style={{ opacity: anim0, transform: [{ translateY: slide0 }] }}>
                <Text style={styles.title}>Create Account 🚀</Text>
                <Text style={styles.sub}>Join as a customer or service provider</Text>
            </Animated.View>

            {/* Role Selector */}
            <Animated.View style={{ opacity: anim1, transform: [{ translateY: slide1 }] }}>
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
            </Animated.View>

            {/* Name */}
            <Animated.View style={{ opacity: anim2, transform: [{ translateY: slide2 }] }}>
                <TextInput style={styles.input} placeholder="Full Name *"
                    value={form.name} onChangeText={(v) => set('name', v)} />
            </Animated.View>

            {/* Email */}
            <Animated.View style={{ opacity: anim3, transform: [{ translateY: slide3 }] }}>
                <TextInput style={styles.input} placeholder="Email *" value={form.email}
                    onChangeText={(v) => set('email', v)} keyboardType="email-address" autoCapitalize="none" />
            </Animated.View>

            {/* Phone */}
            <Animated.View style={{ opacity: anim4, transform: [{ translateY: slide4 }] }}>
                <TextInput style={styles.input} placeholder="Phone" value={form.phone}
                    onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" />
            </Animated.View>

            {/* Password */}
            <Animated.View style={{ opacity: anim5, transform: [{ translateY: slide5 }] }}>
                <TextInput style={styles.input} placeholder="Password *" value={form.password}
                    onChangeText={(v) => set('password', v)} secureTextEntry />
            </Animated.View>

            {/* Button + Link */}
            <Animated.View style={{ opacity: anim6, transform: [{ translateY: slide6 }] }}>
                <Animated.View style={{ transform: [{ scale: btnScale }] }}>
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={handleRegister}
                        onPressIn={onPressIn}
                        onPressOut={onPressOut}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Register</Text>}
                    </TouchableOpacity>
                </Animated.View>
                <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 20 }}>
                    <Text style={styles.link}>Already have an account? <Text style={{ color: '#6C63FF' }}>Login</Text></Text>
                </TouchableOpacity>
            </Animated.View>

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
