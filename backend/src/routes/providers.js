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
        page = 1,
        limit = 20,
    } = req.query;

    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' });

    try {
        let data = null;

        // Try PostGIS RPC first
        try {
            let rpcQuery = supabase.rpc('providers_nearby', {
                user_lat: parseFloat(lat),
                user_lng: parseFloat(lng),
                radius_m: parseFloat(radius_km) * 1000,
            });
            if (category_id) rpcQuery = rpcQuery.eq('category_id', category_id);
            if (min_rating) rpcQuery = rpcQuery.gte('rating', parseFloat(min_rating));
            if (max_price) rpcQuery = rpcQuery.lte('hourly_rate', parseFloat(max_price));
            const from = (parseInt(page) - 1) * parseInt(limit);
            rpcQuery = rpcQuery.range(from, from + parseInt(limit) - 1);
            const { data: rpcData, error: rpcErr } = await rpcQuery;
            if (!rpcErr) data = rpcData;
        } catch (_) { /* PostGIS RPC not available */ }

        // Fallback: simple table query (no location filter)
        if (data === null) {
            let fbQuery = supabase
                .from('providers')
                .select('*, users(name, avatar_url, email, phone), categories(name, icon_url)')
                .order('rating', { ascending: false })
                .range(0, parseInt(limit) - 1);
            if (category_id) fbQuery = fbQuery.eq('category_id', category_id);
            if (min_rating) fbQuery = fbQuery.gte('rating', parseFloat(min_rating));
            if (max_price) fbQuery = fbQuery.lte('hourly_rate', parseFloat(max_price));
            const { data: fbData } = await fbQuery;
            data = fbData || [];
        }

        res.json(data || []);
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

// ── GET /api/providers/profile ────────────────────────────────
router.get('/profile', authMiddleware, requireRole('provider'), async (req, res) => {
    try {
        // Try with availability join first
        let { data, error } = await supabase
            .from('providers')
            .select('*, categories(name, icon_url), availability(*)')
            .eq('user_id', req.user.id)
            .single();

        // If availability table doesn't exist yet, retry without it
        if (error && error.message?.includes('availability')) {
            const fallback = await supabase
                .from('providers')
                .select('*, categories(name, icon_url)')
                .eq('user_id', req.user.id)
                .single();
            data = fallback.data;
            error = fallback.error;
        }

        if (error && error.code !== 'PGRST116') throw error;
        res.json(data || null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PUT /api/providers/profile ────────────────────────────────
router.put('/profile', authMiddleware, requireRole('provider'), async (req, res) => {
    const { bio, skills, hourly_rate, experience_yrs, lat, lng, address, city, state, upi_id } = req.body;
    try {
        const updateData = { bio, skills, hourly_rate, experience_yrs, address, city, state };
        if (lat && lng) updateData.location = `POINT(${lng} ${lat})`;
        if (upi_id !== undefined) updateData.upi_id = upi_id;

        // Try update first (no .single() — avoids the "cannot coerce to single JSON object" error
        // when the row doesn't exist yet)
        let { data, error } = await supabase
            .from('providers')
            .update(updateData)
            .eq('user_id', req.user.id)
            .select();

        if (error) throw error;

        // If no row was matched, fall back to insert (profile not created yet)
        if (!data || data.length === 0) {
            const insertPayload = { ...updateData, user_id: req.user.id };
            const { data: inserted, error: insertError } = await supabase
                .from('providers')
                .insert(insertPayload)
                .select()
                .single();
            if (insertError) throw insertError;
            return res.json(inserted);
        }

        res.json(data[0]);
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

// ── GET /api/providers/earnings/summary ──────────────────────────────
router.get('/earnings/summary', authMiddleware, requireRole('provider'), async (req, res) => {
    try {
        const { data: provider } = await supabase
            .from('providers')
            .select('id')
            .eq('user_id', req.user.id)
            .single();

        if (!provider) {
            return res.json({ records: [], total_earned: 0, pending_payout: 0 });
        }

        const { data, error } = await supabase
            .from('commissions')
            .select('gross_amount, commission, provider_payout, is_settled, created_at')
            .eq('provider_id', provider.id)
            .order('created_at', { ascending: false });

        // If commissions table doesn't exist yet, return zeroes gracefully
        if (error) {
            return res.json({ records: [], total_earned: 0, pending_payout: 0 });
        }

        const total = (data || []).reduce((s, r) => s + parseFloat(r.provider_payout || 0), 0);
        const pending = (data || []).filter((r) => !r.is_settled).reduce((s, r) => s + parseFloat(r.provider_payout || 0), 0);
        res.json({ records: data || [], total_earned: total, pending_payout: pending });
    } catch (err) {
        // Return zeroes instead of crashing if table is missing
        res.json({ records: [], total_earned: 0, pending_payout: 0 });
    }
});

// ── GET /api/providers/:id ────────────────────────────────────
// NOTE: This MUST stay LAST — the /:id wildcard would otherwise swallow named routes above
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

module.exports = router;
