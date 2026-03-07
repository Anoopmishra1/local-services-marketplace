const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');

const generateToken = (user) =>
    jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

// ── POST /api/auth/signup ────────────────────────────────────
router.post(
    '/signup',
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('email').optional().isEmail(),
        body('phone').optional().isMobilePhone(),
        body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
        body('role').isIn(['customer', 'provider']),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { name, email, phone, password, role } = req.body;
        try {
            const hashedPassword = await bcrypt.hash(password, 12);

            // Create user in Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email,
                phone,
                password,
                email_confirm: true,
            });
            if (authError) throw new Error(authError.message);

            // Insert into our users table
            const { data: user, error } = await supabase
                .from('users')
                .insert({ id: authData.user.id, name, email, phone, role })
                .select()
                .single();
            if (error) throw new Error(error.message);

            const token = generateToken(user);
            res.status(201).json({ user, token });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
);

// ── POST /api/auth/login ─────────────────────────────────────
router.post(
    '/login',
    [body('email').isEmail(), body('password').notEmpty()],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { email, password } = req.body;
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return res.status(401).json({ error: 'Invalid credentials' });

            const { data: user, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (userError || !user) {
                return res.status(404).json({ error: 'User profile not found. Please sign up again.' });
            }

            const token = generateToken(user);
            res.json({ user, token });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

// ── POST /api/auth/send-otp ──────────────────────────────────
router.post('/send-otp', [body('phone').isMobilePhone()], async (req, res) => {
    const { phone } = req.body;
    try {
        const { error } = await supabase.auth.signInWithOtp({ phone });
        if (error) throw new Error(error.message);
        res.json({ message: 'OTP sent successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/auth/verify-otp ────────────────────────────────
router.post('/verify-otp', [body('phone').isMobilePhone(), body('token').notEmpty()], async (req, res) => {
    const { phone, token } = req.body;
    try {
        const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
        if (error) return res.status(401).json({ error: 'Invalid OTP' });

        // Upsert user
        let { data: user } = await supabase.from('users').select('*').eq('phone', phone).single();
        if (!user) {
            const { data: newUser } = await supabase
                .from('users')
                .insert({ id: data.user.id, phone, role: 'customer', name: 'User' })
                .select()
                .single();
            user = newUser;
        }

        const jwtToken = generateToken(user);
        res.json({ user, token: jwtToken });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/auth/logout ────────────────────────────────────
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
