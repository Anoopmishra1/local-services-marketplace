const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const supabase = require('../config/supabase');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Razorpay — only loaded if keys are configured
let razorpay = null;
try {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        razorpay = require('../config/razorpay');
    }
} catch (e) {
    console.log('ℹ️  Razorpay not configured — only COD will be available');
}

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

        // Save COD payment record
        const { data: payment, error } = await supabase
            .from('payments')
            .insert({
                booking_id,
                amount: booking.total_amount,
                status: 'cod_pending',  // will be marked 'captured' when provider confirms cash received
            })
            .select()
            .single();

        if (error) throw error;

        // Mark booking payment method
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

// ── POST /api/payments/order ───────────────────────────────────
// Create a Razorpay order for a booking (only works if Razorpay is configured)
router.post('/order', authMiddleware, requireRole('customer'), async (req, res) => {
    if (!razorpay) return res.status(400).json({ error: 'Online payment not configured. Use Cash on Delivery.' });

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

        const options = {
            amount: Math.round(parseFloat(booking.total_amount) * 100),
            currency: 'INR',
            receipt: `receipt_${booking_id}`,
            notes: { booking_id },
        };

        const order = await razorpay.orders.create(options);

        const { data: payment, error } = await supabase
            .from('payments')
            .insert({
                booking_id,
                amount: booking.total_amount,
                razorpay_order_id: order.id,
                status: 'pending',
            })
            .select()
            .single();

        if (error) throw error;

        res.json({
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID,
            payment_id: payment.id,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/payments/verify ─────────────────────────────────
router.post('/verify', authMiddleware, async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = req.body;

    try {
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSig = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSig !== razorpay_signature) {
            return res.status(400).json({ error: 'Invalid payment signature' });
        }

        await supabase
            .from('payments')
            .update({
                razorpay_payment_id,
                razorpay_signature,
                status: 'captured',
                paid_at: new Date().toISOString(),
            })
            .eq('razorpay_order_id', razorpay_order_id);

        await supabase
            .from('bookings')
            .update({ is_paid: true })
            .eq('id', booking_id);

        res.json({ success: true, message: 'Payment verified successfully' });
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
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
