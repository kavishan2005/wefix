const express = require('express');
const router = express.Router();

// Get all service categories
router.get('/', (req, res) => {
    const services = [
        { id: 'gardener', name: 'Gardener', icon: '', description: 'Garden maintenance and landscaping' },
        { id: 'driver', name: 'Driver', icon: '', description: 'Personal and commercial driving services' },
        { id: 'plumber', name: 'Plumber', icon: '', description: 'Plumbing repairs and installations' },
        { id: 'electrician', name: 'Electrician', icon: '', description: 'Electrical work and repairs' },
        { id: 'maid', name: 'Maid', icon: '', description: 'House cleaning and maintenance' },
        { id: 'teacher', name: 'Teacher/Tutor', icon: '', description: 'Teaching and tutoring services' },
        { id: 'carpenter', name: 'Carpenter', icon: '', description: 'Carpentry and woodwork' },
        { id: 'painter', name: 'Painter', icon: '', description: 'Painting services' },
        { id: 'cleaner', name: 'Cleaner', icon: '', description: 'Professional cleaning services' }
    ];
    
    res.json(services);
});

// Get Sri Lankan districts
router.get('/districts', (req, res) => {
    const districts = [
        'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
        'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
        'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
        'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
        'Monaragala', 'Ratnapura', 'Kegalle'
    ];
    
    res.json(districts);
});

module.exports = router;