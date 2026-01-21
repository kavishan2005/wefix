const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    consumerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    serviceType: {
        type: String,
        required: true,
        enum: ['gardener', 'driver', 'plumber', 'electrician', 'maid', 'teacher', 'tutor', 'carpenter', 'painter', 'cleaner']
    },
    status: {
        type: String,
        enum: ['posted', 'assigned', 'in-progress', 'completed', 'cancelled', 'disputed'],
        default: 'posted'
    },
    location: {
        district: String,
        city: String,
        address: String
    },
    budget: {
        type: Number,
        required: true
    },
    finalAmount: {
        type: Number
    },
    scheduledDate: Date,
    completedDate: Date,
    consumerReview: {
        rating: Number,
        comment: String,
        date: Date
    },
    providerReview: {
        rating: Number,
        comment: String,
        date: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Job', jobSchema);
