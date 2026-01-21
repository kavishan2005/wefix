const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Atlas Connection
const MONGODB_URI = process.env.MONGODB_URI;

console.log('🔗 Connecting to MongoDB Atlas...');
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env file');
} else {
  // Mask password for logging
  const maskedUri = MONGODB_URI.replace(/:[^:@]+@/, ':****@');
  console.log('Connection string:', maskedUri);
}

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
})
.then(() => {
  console.log('✅ MongoDB Atlas connected successfully');
  
  // Check connection
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', () => {
    console.log('📊 Database connection established');
  });
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('\n💡 Troubleshooting:');
  console.log('1. Check your .env file has MONGODB_URI');
  console.log('2. Check MongoDB Atlas Network Access (whitelist IP)');
  console.log('3. Check username/password in connection string');
});

// Import models (after mongoose connection)
const User = require('./models/User');
const Job = require('./models/JobModel');

// Simple test route
app.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusText = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };
  
  res.json({
    message: 'Service Platform API',
    database: 'MongoDB Atlas',
    status: statusText[dbStatus] || 'Unknown',
    endpoints: {
      test: '/api/test',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login'
    }
  });
});

// Test database endpoint
app.get('/api/test', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const statusText = {
      0: 'Disconnected',
      1: 'Connected',
      2: 'Connecting',
      3: 'Disconnecting'
    };
    
    let userCount = 0;
    if (dbStatus === 1) {
      userCount = await User.countDocuments();
    }
    
    res.json({
      database: 'MongoDB Atlas',
      status: statusText[dbStatus] || 'Unknown',
      userCount: userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      database: 'MongoDB Atlas',
      status: 'Error'
    });
  }
});

// Simple registration endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password, userType } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ $or: [{ email }, { phone }] });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    
    // Create user (password will be hashed automatically by pre-save hook)
    user = new User({
      name,
      email,
      phone,
      password,
      userType,
      isVerified: true // Skip OTP for testing
    });
    
    await user.save();
    
    // Create JWT token
    const jwt = require('jsonwebtoken');
    const payload = { user: { id: user.id } };
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`�� API available at http://localhost:${PORT}`);
  console.log(`📊 MongoDB status: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...'}`);
});
