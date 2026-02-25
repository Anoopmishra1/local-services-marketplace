const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// All admin routes require authentication + admin role
router.use(authMiddleware, requireRole('admin'));

// ── GET /api/admin/dashboard ──────────────────────────────────
router.get('/dashboard', async (req, res) => {
    try {
        const [users, bookings, revenue, pendingProviders] = await Promise.all([
            supabase.from('users').select('id', { count: 'exact', head: true }),
            supabase.from('bookings').select('id', { count: 'exact', head: true }),
            supabase.from('commissions').select('commission').eq('is_settled', false),
            supabase.from('providers').select('id', { count: 'exact', head: true }).eq('is_approved', false),
        ]);

        const totalRevenue = (revenue.data || []).reduce((s, r) => s + parseFloat(r.commission), 0);

        res.json({
            total_users: users.count,
            total_bookings: bookings.count,
            total_revenue: totalRevenue,
            pending_approvals: pendingProviders.count,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/admin/providers ──────────────────────────────────
router.get('/providers', async (req, res) => {
    const { status = 'all', page = 1, limit = 20 } = req.query;
    const from = (parseInt(page) - 1) * parseInt(limit);
    try {
        let query = supabase
            .from('providers')
            .select('*, users(name, email, phone, avatar_url), categories(name)')
            .range(from, from + parseInt(limit) - 1)
            .order('created_at', { ascending: false });

        if (status === 'pending') query = query.eq('is_approved', false);
        if (status === 'approved') query = query.eq('is_approved', true);

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PATCH /api/admin/providers/:id/approve ────────────────────
router.patch('/providers/:id/approve', async (req, res) => {
    const { approve } = req.body; // boolean
    try {
        const { data, error } = await supabase
            .from('providers')
            .update({ is_approved: !!approve })
            .eq('id', req.params.id)
            .select()
            .single();
        if (error) throw error;
        res.json({ message: approve ? 'Provider approved' : 'Provider rejected', provider: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/admin/bookings ───────────────────────────────────
router.get('/bookings', async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const from = (parseInt(page) - 1) * parseInt(limit);
    try {
        let query = supabase
            .from('bookings')
            .select(`
        *,
        customer:users!bookings_customer_id_fkey(name, email),
        providers(id, hourly_rate, users(name))
      `)
            .order('created_at', { ascending: false })
            .range(from, from + parseInt(limit) - 1);
        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/admin/revenue ────────────────────────────────────
router.get('/revenue', async (req, res) => {
    const { from_date, to_date } = req.query;
    try {
        let query = supabase
            .from('commissions')
            .select('*, bookings(scheduled_at), providers(users(name))')
            .order('created_at', { ascending: false });

        if (from_date) query = query.gte('created_at', from_date);
        if (to_date) query = query.lte('created_at', to_date);

        const { data, error } = await query;
        if (error) throw error;

        const totalRevenue = data.reduce((s, r) => s + parseFloat(r.commission), 0);
        const totalPayouts = data.reduce((s, r) => s + parseFloat(r.provider_payout), 0);
        const unsettledAmount = data.filter((r) => !r.is_settled).reduce((s, r) => s + parseFloat(r.provider_payout), 0);

        res.json({ records: data, total_revenue: totalRevenue, total_payouts: totalPayouts, unsettled_amount: unsettledAmount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/admin/disputes ───────────────────────────────────
router.get('/disputes', async (req, res) => {
    const { status = 'open', page = 1, limit = 20 } = req.query;
    const from = (parseInt(page) - 1) * parseInt(limit);
    try {
        const { data, error } = await supabase
            .from('disputes')
            .select('*, raised_by_user:users!disputes_raised_by_fkey(name, email), bookings(service_type)')
            .eq('status', status)
            .order('created_at', { ascending: false })
            .range(from, from + parseInt(limit) - 1);
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PATCH /api/admin/disputes/:id ────────────────────────────
router.patch('/disputes/:id', async (req, res) => {
    const { status, admin_notes } = req.body;
    try {
        const update = { status, admin_notes };
        if (status === 'resolved' || status === 'closed') update.resolved_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('disputes')
            .update(update)
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
