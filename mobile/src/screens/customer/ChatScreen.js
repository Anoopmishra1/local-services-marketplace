import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, FlatList, TextInput, TouchableOpacity,
    StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import api from '../../services/api';
import { getSocket, connectSocket } from '../../services/socket';
import { useAuthStore } from '../../store/authStore';

export default function ChatScreen({ route }) {
    const { bookingId, receiverId } = route.params;
    const { user } = useAuthStore();
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);
    const [typing, setTyping] = useState(false);
    const flatRef = useRef(null);
    const typingTimer = useRef(null);

    // Load history
    useEffect(() => {
        api.get(`/chat/${bookingId}`).then(({ data }) => {
            setMessages(data);
        }).finally(() => setLoading(false));
    }, [bookingId]);

    // Socket.io
    useEffect(() => {
        const socket = connectSocket(user.id);
        socket.emit('join_room', { booking_id: bookingId, user_id: user.id });

        socket.on('receive_message', (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        socket.on('user_typing', ({ name }) => {
            setTyping(true);
        });

        socket.on('user_stopped_typing', () => {
            setTyping(false);
        });

        return () => {
            socket.off('receive_message');
            socket.off('user_typing');
            socket.off('user_stopped_typing');
        };
    }, [bookingId, user.id]);

    const sendMessage = () => {
        if (!text.trim()) return;
        const socket = getSocket();
        socket.emit('send_message', {
            booking_id: bookingId,
            sender_id: user.id,
            receiver_id: receiverId,
            content: text.trim(),
        });
        setText('');
        socket.emit('stop_typing', { booking_id: bookingId, user_id: user.id });
    };

    const handleTyping = (val) => {
        setText(val);
        const socket = getSocket();
        socket.emit('typing', { booking_id: bookingId, user_id: user.id, name: user.name });
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => {
            socket.emit('stop_typing', { booking_id: bookingId, user_id: user.id });
        }, 1500);
    };

    const renderMessage = useCallback(({ item }) => {
        const isMine = item.sender_id === user.id;
        return (
            <View style={[styles.bubble, isMine ? styles.mine : styles.theirs]}>
                <Text style={[styles.bubbleText, isMine && { color: '#fff' }]}>{item.content}</Text>
                <Text style={[styles.time, isMine && { color: '#DDD6FE' }]}>
                    {new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    }, [user.id]);

    if (loading) return <ActivityIndicator size="large" color="#6C63FF" style={{ flex: 1, marginTop: 100 }} />;

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: '#F9FAFB' }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 70}
        >
            <FlatList
                ref={flatRef}
                data={messages}
                keyExtractor={(i) => i.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messageList}
                onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
                ListFooterComponent={
                    typing ? (
                        <View style={[styles.bubble, styles.theirs, { paddingVertical: 8 }]}>
                            <Text style={styles.bubbleText}>typing...</Text>
                        </View>
                    ) : null
                }
            />

            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    value={text}
                    onChangeText={handleTyping}
                    multiline
                />
                <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                    <Text style={styles.sendIcon}>➤</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    messageList: { padding: 16, paddingBottom: 10 },
    bubble: { maxWidth: '75%', padding: 12, borderRadius: 16, marginBottom: 10 },
    mine: { backgroundColor: '#6C63FF', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
    theirs: { backgroundColor: '#fff', alignSelf: 'flex-start', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
    bubbleText: { fontSize: 14, color: '#1F2937', lineHeight: 20 },
    time: { fontSize: 10, color: '#9CA3AF', marginTop: 4, alignSelf: 'flex-end' },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#E5E7EB' },
    input: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, maxHeight: 100, borderWidth: 1, borderColor: '#E5E7EB' },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#6C63FF', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
    sendIcon: { color: '#fff', fontSize: 16 },
});
