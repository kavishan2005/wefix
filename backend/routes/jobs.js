const express = require('express');
const router = express.Router();
const Job = require('../models/JobModel');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Create a new job
router.post('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (user.userType !== 'consumer') {
            return res.status(400).json({ msg: 'Only consumers can post jobs' });
        }
        
        const job = new Job({
            consumerId: req.user.id,
            ...req.body
        });
        
        await job.save();
        
        res.status(201).json(job);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get jobs for consumer
router.get('/consumer', auth, async (req, res) => {
    try {
        const jobs = await Job.find({ consumerId: req.user.id })
            .sort({ createdAt: -1 })
            .populate('providerId', 'name profile.profilePicture');
        
        res.json(jobs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get available jobs for providers
router.get('/available', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (user.userType !== 'provider') {
            return res.status(400).json({ msg: 'Only providers can view available jobs' });
        }
        
        const jobs = await Job.find({
            status: 'posted',
            serviceType: { $in: user.servicesOffered }
        })
        .populate('consumerId', 'name profile.profilePicture')
        .sort({ createdAt: -1 });
        
        res.json(jobs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Assign provider to job
router.put('/:id/assign', auth, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        
        if (!job) {
            return res.status(404).json({ msg: 'Job not found' });
        }
        
        if (job.status !== 'posted') {
            return res.status(400).json({ msg: 'Job is not available' });
        }
        
        const provider = await User.findById(req.user.id);
        if (provider.userType !== 'provider') {
            return res.status(400).json({ msg: 'Only providers can accept jobs' });
        }
        
        job.providerId = req.user.id;
        job.status = 'assigned';
        
        await job.save();
        
        res.json(job);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Update job status
router.put('/:id/status', auth, async (req, res) => {
    try {
        const { status, finalAmount } = req.body;
        
        const job = await Job.findById(req.params.id);
        
        if (!job) {
            return res.status(404).json({ msg: 'Job not found' });
        }
        
        // Check authorization
        const isConsumer = job.consumerId.toString() === req.user.id;
        const isProvider = job.providerId && job.providerId.toString() === req.user.id;
        
        if (!isConsumer && !isProvider) {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        
        if (status) job.status = status;
        if (finalAmount) job.finalAmount = finalAmount;
        
        if (status === 'completed') {
            job.completedDate = new Date();
        }
        
        await job.save();
        
        res.json(job);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Add review to job
router.post('/:id/review', auth, async (req, res) => {
    try {
        const { rating, comment, reviewType } = req.body;
        
        const job = await Job.findById(req.params.id);
        
        if (!job) {
            return res.status(404).json({ msg: 'Job not found' });
        }
        
        if (reviewType === 'consumer') {
            job.consumerReview = {
                rating,
                comment,
                date: new Date()
            };
        } else if (reviewType === 'provider') {
            job.providerReview = {
                rating,
                comment,
                date: new Date()
            };
        }
        
        await job.save();
        
        // Update provider rating if consumer review
        if (reviewType === 'consumer' && rating) {
            const provider = await User.findById(job.providerId);
            if (provider) {
                provider.profile.reviews.push({
                    userId: req.user.id,
                    rating,
                    comment,
                    date: new Date()
                });
                
                // Recalculate average rating
                const reviews = provider.profile.reviews;
                const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
                provider.profile.rating = totalRating / reviews.length;
                
                await provider.save();
            }
        }
        
        res.json(job);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
