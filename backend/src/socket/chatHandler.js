const supabase = require('../config/supabase');

/**
 * Socket.io Chat Handler
 *
 * Events:
 *  Client → Server: join_room, send_message, typing, stop_typing
 *  Server → Client: receive_message, user_typing, user_stopped_typing, error
 *
 * Room name convention: `booking_<booking_id>`
 */
const initSocket = (io) => {
    io.on('connection', (socket) => {
        console.log(`🔌 Socket connected: ${socket.id}`);

        // ── Join a booking chat room ──────────────────────────────
        socket.on('join_room', ({ booking_id, user_id }) => {
            const room = `booking_${booking_id}`;
            socket.join(room);
            socket.data.user_id = user_id;
            socket.data.booking_id = booking_id;
            console.log(`👤 User ${user_id} joined room: ${room}`);
        });

        // ── Send a message ────────────────────────────────────────
        socket.on('send_message', async ({ booking_id, sender_id, receiver_id, content }) => {
            const room = `booking_${booking_id}`;

            try {
                // Persist to Supabase
                const { data: message, error } = await supabase
                    .from('messages')
                    .insert({ booking_id, sender_id, receiver_id, content })
                    .select('*, sender:users!messages_sender_id_fkey(id, name, avatar_url)')
                    .single();

                if (error) throw error;

                // Broadcast to all clients in the room (including sender)
                io.to(room).emit('receive_message', message);
            } catch (err) {
                socket.emit('error', { message: err.message });
            }
        });

        // ── Typing indicators ─────────────────────────────────────
        socket.on('typing', ({ booking_id, user_id, name }) => {
            socket.to(`booking_${booking_id}`).emit('user_typing', { user_id, name });
        });

        socket.on('stop_typing', ({ booking_id, user_id }) => {
            socket.to(`booking_${booking_id}`).emit('user_stopped_typing', { user_id });
        });

        // ── Disconnect ─────────────────────────────────────────────
        socket.on('disconnect', () => {
            console.log(`❌ Socket disconnected: ${socket.id}`);
        });
    });
};

module.exports = { initSocket };
