const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// ── POST /api/payments/upi/initiate ──────────────────────────
// Customer initiates UPI payment — records intent, returns provider UPI ID + deep link
router.post('/upi/initiate', authMiddleware, requireRole('customer'), async (req, res) => {
    const { booking_id } = req.body;
    try {
        const { data: booking } = await supabase
            .from('bookings')
            .select('id, total_amount, customer_id, status, is_paid, provider_id')
            .eq('id', booking_id)
            .single();

        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        if (booking.customer_id !== req.user.id) return res.status(403).json({ error: 'Not your booking' });
        if (booking.is_paid) return res.status(400).json({ error: 'Already paid' });
        if (booking.status !== 'accepted') return res.status(400).json({ error: 'Booking not yet accepted by provider' });

        // Get provider's UPI ID
        const { data: provider } = await supabase
            .from('providers')
            .select('upi_id, users(name)')
            .eq('id', booking.provider_id)
            .single();

        if (!provider?.upi_id) {
            return res.status(400).json({ error: 'Provider has not set up their UPI ID yet. Use Cash on Delivery instead.' });
        }

        const providerName = encodeURIComponent(provider.users?.name || 'Provider');
        const note = encodeURIComponent('Local Services Payment');
        const amount = parseFloat(booking.total_amount).toFixed(2);

        // UPI deep link — works with GPay, PhonePe, Paytm, BHIM, any UPI app
        const upiLink = `upi://pay?pa=${provider.upi_id}&pn=${providerName}&am=${amount}&tn=${note}&cu=INR`;

        // Record payment intent
        const { data: payment, error } = await supabase
            .from('payments')
            .upsert({
                booking_id,
                amount: booking.total_amount,
                status: 'upi_pending',
                payment_method: 'upi',
            }, { onConflict: 'booking_id' })
            .select()
            .single();

        if (error) throw error;

        res.json({
            upi_link: upiLink,
            upi_id: provider.upi_id,
            provider_name: provider.users?.name,
            amount,
            payment_id: payment.id,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/payments/upi/confirm ────────────────────────────
// Customer confirms they've completed the UPI payment (self-reported)
router.post('/upi/confirm', authMiddleware, requireRole('customer'), async (req, res) => {
    const { booking_id, transaction_ref } = req.body; // transaction_ref = UPI transaction ID (optional)
    try {
        const { data: booking } = await supabase
            .from('bookings')
            .select('customer_id, is_paid')
            .eq('id', booking_id)
            .single();

        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        if (booking.customer_id !== req.user.id) return res.status(403).json({ error: 'Not your booking' });
        if (booking.is_paid) return res.json({ success: true, message: 'Already marked as paid' });

        // Mark payment as customer-confirmed (provider will verify)
        await supabase
            .from('payments')
            .update({
                status: 'upi_customer_confirmed',
                paid_at: new Date().toISOString(),
                razorpay_payment_id: transaction_ref || null, // reuse field for UPI txn ref
            })
            .eq('booking_id', booking_id);

        await supabase
            .from('bookings')
            .update({ is_paid: true })
            .eq('id', booking_id);

        res.json({ success: true, message: 'Payment confirmed! Provider will verify and start work.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/payments/cod ────────────────────────────────────
// Cash on Delivery — mark booking for pay-on-arrival (FREE, no gateway)
router.post('/cod', authMiddleware, requireRole('customer'), async (req, res) => {
    const { booking_id } = req.body;
    try {
        const { data: booking } = await supabase
            .from('bookings')
            .select('id, total_amount, customer_id, status, is_paid')
            .eq('id', booking_id)
            .single();

        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        if (booking.customer_id !== req.user.id) return res.status(403).json({ error: 'Not your booking' });
        if (booking.is_paid) return res.status(400).json({ error: 'Already paid' });
        if (booking.status !== 'accepted') return res.status(400).json({ error: 'Booking not yet accepted' });

        const { data: payment, error } = await supabase
            .from('payments')
            .upsert({
                booking_id,
                amount: booking.total_amount,
                status: 'cod_pending',
                payment_method: 'cod',
            }, { onConflict: 'booking_id' })
            .select()
            .single();

        if (error) throw error;

        await supabase.from('bookings').update({ payment_method: 'cod' }).eq('id', booking_id);

        res.json({ success: true, message: 'Booking confirmed — pay cash to provider on arrival', payment_id: payment.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/payments/cod/confirm ────────────────────────────
// Provider confirms cash received
router.post('/cod/confirm', authMiddleware, requireRole('provider'), async (req, res) => {
    const { booking_id } = req.body;
    try {
        await supabase
            .from('payments')
            .update({ status: 'captured', paid_at: new Date().toISOString() })
            .eq('booking_id', booking_id);

        await supabase
            .from('bookings')
            .update({ is_paid: true })
            .eq('id', booking_id);

        res.json({ success: true, message: 'Cash payment confirmed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/payments/booking/:id ────────────────────────────
router.get('/booking/:id', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('booking_id', req.params.id)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        res.json(data || null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
