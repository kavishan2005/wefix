const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    icon: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    category: {
        type: String,
        enum: ['home', 'transport', 'education', 'repair', 'cleaning']
    },
    averageRate: {
        type: Number,
        default: 0
    },
    activeProviders: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Service', serviceSchema);
