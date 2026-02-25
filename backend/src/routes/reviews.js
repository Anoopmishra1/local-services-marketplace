const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// ── POST /api/reviews ─────────────────────────────────────────
router.post('/', authMiddleware, requireRole('customer'), async (req, res) => {
    const { booking_id, rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    try {
        const { data: booking } = await supabase
            .from('bookings')
            .select('customer_id, provider_id, status')
            .eq('id', booking_id)
            .single();

        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        if (booking.customer_id !== req.user.id) return res.status(403).json({ error: 'Not your booking' });
        if (booking.status !== 'completed') return res.status(400).json({ error: 'Booking not completed yet' });

        // Check if already reviewed
        const { data: existing } = await supabase
            .from('reviews')
            .select('id')
            .eq('booking_id', booking_id)
            .single();
        if (existing) return res.status(400).json({ error: 'Already reviewed this booking' });

        const { data, error } = await supabase
            .from('reviews')
            .insert({
                booking_id,
                customer_id: req.user.id,
                provider_id: booking.provider_id,
                rating,
                comment,
            })
            .select()
            .single();

        if (error) throw error;
        // Note: provider rating is auto-updated via DB trigger
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/reviews/provider/:id ────────────────────────────
router.get('/provider/:id', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const from = (parseInt(page) - 1) * parseInt(limit);
        const { data, error } = await supabase
            .from('reviews')
            .select('*, customer:users!reviews_customer_id_fkey(name, avatar_url)')
            .eq('provider_id', req.params.id)
            .order('created_at', { ascending: false })
            .range(from, from + parseInt(limit) - 1);
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
