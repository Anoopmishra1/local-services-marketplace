const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authMiddleware } = require('../middleware/authMiddleware');

// ── GET /api/users/profile ───────────────────────────────────
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, name, email, phone, role, avatar_url, created_at')
            .eq('id', req.user.id)
            .single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PUT /api/users/profile ───────────────────────────────────
router.put('/profile', authMiddleware, async (req, res) => {
    const { name, avatar_url } = req.body;
    try {
        const { data, error } = await supabase
            .from('users')
            .update({ name, avatar_url })
            .eq('id', req.user.id)
            .select()
            .single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/users/bookings ──────────────────────────────────
// Shorthand for current authenticated user's bookings
router.get('/bookings', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select(`*, providers(id, user_id, users(name, avatar_url), hourly_rate, rating), categories(name)`)
            .eq('customer_id', req.user.id)
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/users/:id/bookings ──────────────────────────────
router.get('/:id/bookings', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select(`*, providers(id, user_id, users(name, avatar_url), hourly_rate, rating), categories(name)`)
            .eq('customer_id', req.params.id)
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
