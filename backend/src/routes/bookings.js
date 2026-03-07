const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// ── POST /api/bookings ────────────────────────────────────────
// Customer creates a booking
router.post('/', authMiddleware, requireRole('customer'), async (req, res) => {
    const {
        provider_id, category_id, service_type,
        description, scheduled_at, duration_hours,
        address, lat, lng,
    } = req.body;

    try {
        // Calculate total amount
        const { data: provider } = await supabase
            .from('providers')
            .select('hourly_rate, is_approved')
            .eq('id', provider_id)
            .single();

        if (!provider) return res.status(404).json({ error: 'Provider not found' });
        if (!provider.is_approved) return res.status(400).json({ error: 'Provider is not approved' });

        const total_amount = provider.hourly_rate * (duration_hours || 1);

        const { data, error } = await supabase
            .from('bookings')
            .insert({
                customer_id: req.user.id,
                provider_id,
                category_id,
                service_type,
                description,
                scheduled_at,
                duration_hours,
                address,
                lat,
                lng,
                total_amount,
                status: 'pending',
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/bookings/:id ─────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select(`
        *,
        customer:users!bookings_customer_id_fkey(id, name, avatar_url, phone),
        provider:providers(id, bio, hourly_rate, rating,
          user:users(name, avatar_url, phone)
        ),
        categories(name, icon_url),
        payments(status, razorpay_payment_id, paid_at)
      `)
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/bookings/provider/list ───────────────────────────
// Provider sees their bookings
router.get('/provider/list', authMiddleware, requireRole('provider'), async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    try {
        const { data: provider } = await supabase
            .from('providers')
            .select('id')
            .eq('user_id', req.user.id)
            .single();

        // Provider profile not set up yet — return empty list
        if (!provider) return res.json([]);

        let query = supabase
            .from('bookings')
            .select(`*, customer:users!bookings_customer_id_fkey(name, avatar_url, phone), categories(name)`)
            .eq('provider_id', provider.id)
            .order('scheduled_at', { ascending: false });

        if (status) query = query.eq('status', status);
        const from = (parseInt(page) - 1) * parseInt(limit);
        query = query.range(from, from + parseInt(limit) - 1);

        const { data, error } = await query;
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ── PUT /api/bookings/:id/status ──────────────────────────────
// Provider accepts or rejects; updates in_progress/completed by either party
router.put('/:id/status', authMiddleware, async (req, res) => {
    const { status } = req.body;
    const allowedStatuses = ['accepted', 'rejected', 'in_progress', 'completed', 'cancelled'];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const { data: booking } = await supabase
            .from('bookings')
            .select('customer_id, provider_id, providers(user_id)')
            .eq('id', req.params.id)
            .single();

        const isCustomer = booking.customer_id === req.user.id;
        const isProvider = booking.providers.user_id === req.user.id;

        if (!isCustomer && !isProvider && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Role-based status rules
        if (['accepted', 'rejected'].includes(status) && !isProvider) {
            return res.status(403).json({ error: 'Only provider can accept/reject' });
        }
        if (status === 'cancelled' && !isCustomer && !isProvider) {
            return res.status(403).json({ error: 'Not authorized to cancel' });
        }

        const { data, error } = await supabase
            .from('bookings')
            .update({ status })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
