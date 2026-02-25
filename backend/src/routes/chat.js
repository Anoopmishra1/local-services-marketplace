const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authMiddleware } = require('../middleware/authMiddleware');

// ── GET /api/chat/:booking_id ─────────────────────────────────
router.get('/:booking_id', authMiddleware, async (req, res) => {
    const { page = 1, limit = 50 } = req.query;
    try {
        const from = (parseInt(page) - 1) * parseInt(limit);
        const { data, error } = await supabase
            .from('messages')
            .select('*, sender:users!messages_sender_id_fkey(id, name, avatar_url)')
            .eq('booking_id', req.params.booking_id)
            .order('created_at', { ascending: true })
            .range(from, from + parseInt(limit) - 1);

        if (error) throw error;

        // Mark messages as read
        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('booking_id', req.params.booking_id)
            .eq('receiver_id', req.user.id)
            .eq('is_read', false);

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/chat/:booking_id ────────────────────────────────
// REST fallback for sending message (primary is Socket.io)
router.post('/:booking_id', authMiddleware, async (req, res) => {
    const { receiver_id, content } = req.body;
    try {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                booking_id: req.params.booking_id,
                sender_id: req.user.id,
                receiver_id,
                content,
            })
            .select()
            .single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
