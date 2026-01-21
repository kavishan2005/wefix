const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

// Generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register User
router.post('/register', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('phone', 'Phone number is required').not().isEmpty(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    check('userType', 'User type is required').isIn(['consumer', 'provider'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, phone, password, userType } = req.body;

        // Check if user exists
        let user = await User.findOne({ $or: [{ email }, { phone }] });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Create user
        user = new User({
            name,
            email,
            phone,
            password,
            userType
        });

        // Generate OTP
        const otp = generateOTP();
        user.otp = {
            code: otp,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        };

        await user.save();

        // TODO: Send OTP via SMS (Twilio) or Email
        console.log(`OTP for ${phone}: ${otp}`);

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, name, email, userType } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Verify OTP
router.post('/verify-otp', [
    check('phone', 'Phone number is required').not().isEmpty(),
    check('otp', 'OTP is required').not().isEmpty()
], async (req, res) => {
    try {
        const { phone, otp } = req.body;
        
        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(400).json({ msg: 'User not found' });
        }

        if (!user.otp || user.otp.code !== otp) {
            return res.status(400).json({ msg: 'Invalid OTP' });
        }

        if (user.otp.expiresAt < new Date()) {
            return res.status(400).json({ msg: 'OTP expired' });
        }

        user.isVerified = true;
        user.otp = undefined;
        await user.save();

        res.json({ msg: 'Phone number verified successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Login
router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
], async (req, res) => {
    try {
        const { email, password } = req.body;

        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        userType: user.userType,
                        isVerified: user.isVerified
                    }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
