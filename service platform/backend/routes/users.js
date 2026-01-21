const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get current user profile
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { bio, skills, hourlyRate, location, servicesOffered } = req.body;
        
        const user = await User.findById(req.user.id);
        
        if (bio !== undefined) user.profile.bio = bio;
        if (skills !== undefined) user.profile.skills = skills;
        if (hourlyRate !== undefined) user.profile.hourlyRate = hourlyRate;
        if (location !== undefined) user.profile.location = location;
        if (servicesOffered !== undefined) user.servicesOffered = servicesOffered;
        
        await user.save();
        
        res.json({ msg: 'Profile updated successfully', user });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get all service providers
router.get('/providers', async (req, res) => {
    try {
        const { service, district } = req.query;
        
        let query = { userType: 'provider', isVerified: true };
        
        if (service) {
            query.servicesOffered = service;
        }
        
        if (district) {
            query['profile.location.district'] = district;
        }
        
        const providers = await User.find(query)
            .select('name email phone profile servicesOffered')
            .sort({ 'profile.rating': -1 });
        
        res.json(providers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get provider by ID
router.get('/provider/:id', async (req, res) => {
    try {
        const provider = await User.findOne({
            _id: req.params.id,
            userType: 'provider'
        }).select('-password');
        
        if (!provider) {
            return res.status(404).json({ msg: 'Provider not found' });
        }
        
        res.json(provider);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;