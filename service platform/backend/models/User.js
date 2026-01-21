const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    userType: {
        type: String,
        enum: ['consumer', 'provider'],
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        code: String,
        expiresAt: Date
    },
    profile: {
        profilePicture: String,
        bio: String,
        skills: [String],
        experience: Number,
        hourlyRate: Number,
        rating: {
            type: Number,
            default: 0
        },
        reviews: [{
            userId: mongoose.Schema.Types.ObjectId,
            rating: Number,
            comment: String,
            date: Date
        }],
        location: {
            district: String,
            city: String,
            address: String
        }
    },
    servicesOffered: [{
        type: String,
        enum: ['gardener', 'driver', 'plumber', 'electrician', 'maid', 'teacher', 'tutor', 'carpenter', 'painter', 'cleaner']
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
