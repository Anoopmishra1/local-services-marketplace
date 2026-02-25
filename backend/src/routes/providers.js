const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// ── GET /api/providers/nearby ─────────────────────────────────
// ?lat=&lng=&radius_km=&category_id=&min_rating=&max_price=&sort_by=
router.get('/nearby', async (req, res) => {
    const {
        lat, lng,
        radius_km = 10,
        category_id,
        min_rating = 0,
        max_price,
        sort_by = 'rating',
        page = 1,
        limit = 20,
    } = req.query;

    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' });

    try {
        // Use PostGIS ST_DWithin for proximity
        let query = supabase.rpc('providers_nearby', {
            user_lat: parseFloat(lat),
            user_lng: parseFloat(lng),
            radius_m: parseFloat(radius_km) * 1000,
        });

        if (category_id) query = query.eq('category_id', category_id);
        if (min_rating) query = query.gte('rating', parseFloat(min_rating));
        if (max_price) query = query.lte('hourly_rate', parseFloat(max_price));

        const from = (parseInt(page) - 1) * parseInt(limit);
        const to = from + parseInt(limit) - 1;
        query = query.range(from, to);

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/providers/:id ────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('providers')
            .select(`*, users(name, avatar_url, email, phone), categories(name, icon_url), availability(*)`)
            .eq('id', req.params.id)
            .single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/providers/register ─────────────────────────────
router.post('/register', authMiddleware, requireRole('provider'), async (req, res) => {
    const { bio, skills, hourly_rate, experience_yrs, lat, lng, address, city, state, category_id } = req.body;
    try {
        // Check if provider profile already exists
        const { data: existing } = await supabase
            .from('providers')
            .select('id')
            .eq('user_id', req.user.id)
            .single();
        if (existing) return res.status(400).json({ error: 'Provider profile already exists' });

        const { data, error } = await supabase
            .from('providers')
            .insert({
                user_id: req.user.id,
                bio,
                skills,
                hourly_rate,
                experience_yrs,
                location: `POINT(${lng} ${lat})`,
                address,
                city,
                state,
                category_id,
            })
            .select()
            .single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PUT /api/providers/profile ────────────────────────────────
router.put('/profile', authMiddleware, requireRole('provider'), async (req, res) => {
    const { bio, skills, hourly_rate, experience_yrs, lat, lng, address, city, state } = req.body;
    try {
        const updateData = { bio, skills, hourly_rate, experience_yrs, address, city, state };
        if (lat && lng) updateData.location = `POINT(${lng} ${lat})`;

        const { data, error } = await supabase
            .from('providers')
            .update(updateData)
            .eq('user_id', req.user.id)
            .select()
            .single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/providers/availability ─────────────────────────
router.post('/availability', authMiddleware, requireRole('provider'), async (req, res) => {
    const { availability } = req.body; // Array of { day_of_week, start_time, end_time }
    try {
        const { data: provider } = await supabase
            .from('providers')
            .select('id')
            .eq('user_id', req.user.id)
            .single();
        if (!provider) return res.status(404).json({ error: 'Provider profile not found' });

        // Replace availability entirely
        await supabase.from('availability').delete().eq('provider_id', provider.id);
        const rows = availability.map((a) => ({ ...a, provider_id: provider.id }));
        const { data, error } = await supabase.from('availability').insert(rows).select();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/providers/earnings ──────────────────────────────
router.get('/earnings/summary', authMiddleware, requireRole('provider'), async (req, res) => {
    try {
        const { data: provider } = await supabase
            .from('providers')
            .select('id')
            .eq('user_id', req.user.id)
            .single();

        const { data, error } = await supabase
            .from('commissions')
            .select('gross_amount, commission, provider_payout, is_settled, created_at')
            .eq('provider_id', provider.id)
            .order('created_at', { ascending: false });
        if (error) throw error;

        const total = data.reduce((s, r) => s + parseFloat(r.provider_payout), 0);
        const pending = data.filter((r) => !r.is_settled).reduce((s, r) => s + parseFloat(r.provider_payout), 0);
        res.json({ records: data, total_earned: total, pending_payout: pending });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
