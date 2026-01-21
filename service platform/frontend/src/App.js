import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import './App.css';
import { auth, registerUser, loginUser, logoutUser, onAuthStateChanged, getCurrentUserData, isUserVerified } from './firebase/init';
import Logo from './components/Logo';
import Profile from './components/Profile';
import VerificationPage from './components/VerificationPage';
import AdminDashboard from './components/AdminDashboard';
import ProviderDashboard from './components/ProviderDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Check if user is verified
        const isVerified = await isUserVerified(currentUser.uid);
        
        if (!isVerified) {
          // If not verified, logout immediately
          await logoutUser();
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Get user data from Firestore
        const userData = await getCurrentUserData(currentUser.uid);
        
        if (userData.success) {
          const userProfile = userData.user;
          setUser(userProfile);
        } else {
          // If user document doesn't exist, create it
          const userProfile = {
            uid: currentUser.uid,
            email: currentUser.email,
            name: currentUser.displayName || currentUser.email.split('@')[0],
            userType: 'consumer',
            phoneVerified: false,
            isAdmin: currentUser.email === 'kavishan16@icloud.com' || 
                     currentUser.email === 'admin@wefix.com',
            createdAt: new Date().toISOString()
          };
          setUser(userProfile);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
  };

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <Logo size="large" centered={true} />
        <div className="spinner"></div>
        <p>Loading WeFix...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">
            <Link to="/" className="logo-link">
              <Logo size="small" />
            </Link>
          </div>
          <div className="nav-links">
            {/* Hide home link if logged in */}
            {!user && <Link to="/">Home</Link>}
            <Link to="/providers">Providers</Link>
            {user ? (
              <>
                <Link to="/profile">Profile</Link>
                {user.userType === 'provider' && <Link to="/provider-dashboard">Provider Dashboard</Link>}
                {user.isAdmin && <Link to="/admin">Admin</Link>}
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </>
            ) : (
              <>
                <Link to="/register">Register</Link>
                <Link to="/login">Login</Link>
              </>
            )}
          </div>
        </nav>

        <div className="container">
          <Routes>
            <Route path="/" element={user ? <Navigate to={user.userType === 'provider' ? "/provider-dashboard" : "/profile"} /> : <Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify" element={<VerificationPage />} />
            <Route path="/profile" element={
              user ? <Profile user={user} onUpdate={handleProfileUpdate} /> : <Navigate to="/login" />
            } />
            <Route path="/provider-dashboard" element={
              user?.userType === 'provider' ? <ProviderDashboard user={user} /> : <Navigate to="/profile" />
            } />
            <Route path="/admin" element={
              user?.isAdmin ? <AdminDashboard adminUser={user} /> : <Navigate to="/" />
            } />
            <Route path="/providers" element={<Providers />} />
          </Routes>
        </div>

        <footer className="footer">
          <p>WeFix &copy; 2024 | Service Platform for Sri Lanka</p>
        </footer>
      </div>
    </Router>
  );
}

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">
      <div className="hero">
        <Logo size="large" centered={true} />
        <h2>Find Trusted Service Providers in Sri Lanka</h2>
        <p>Connect with verified professionals for every need</p>
        <button onClick={() => navigate('/register')} className="cta-btn">
          Get Started
        </button>
      </div>

      <div className="features">
        <h3>How It Works</h3>
        <div className="features-grid">
          <div className="feature">
            <div className="feature-icon"></div>
            <h4>Register & Verify</h4>
            <p>Sign up with phone verification</p>
          </div>
          <div className="feature">
            <div className="feature-icon"></div>
            <h4>Find Services</h4>
            <p>Browse verified service providers</p>
          </div>
          <div className="feature">
            <div className="feature-icon"></div>
            <h4>Book & Relax</h4>
            <p>Quality work guaranteed</p>
          </div>
        </div>
      </div>

      {/* Testing Info (SIMPLIFIED - No admin login box) */}
      <div className="testing-info">
        <h3> Testing Information</h3>
        <div className="testing-card">
          <h4>Test OTP for ALL Numbers</h4>
          <p><strong>Always use:</strong> <span className="test-otp">123456</span></p>
          <p>This OTP works for any Sri Lankan phone number during testing.</p>
          <div className="testing-hint">
            <p><strong>Note:</strong> Admin accounts are pre-created in Firebase</p>
            <p>🔧 Admin dashboard accessible after login with admin credentials</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    userType: 'consumer'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await registerUser(form.email, form.password, {
        name: form.name,
        phone: form.phone,
        userType: form.userType
      });

      if (result.success) {
        // Redirect to verification page with user data
        navigate('/verify', {
          state: {
            userId: result.userId,
            phone: result.phone,
            email: form.email,
            password: form.password
          }
        });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Create Account</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Full Name"
          value={form.name}
          onChange={(e) => setForm({...form, name: e.target.value})}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({...form, email: e.target.value})}
          required
        />
        <div className="phone-input-group">
          <div className="country-code-select">
            <span>🇱🇰 +94</span>
          </div>
          <input
            type="tel"
            placeholder="0712345678"
            value={form.phone}
            onChange={(e) => setForm({...form, phone: e.target.value})}
            required
            maxLength="10"
            pattern="[0-9]{10}"
            title="10-digit Sri Lankan mobile number (0712345678)"
          />
        </div>
        <small className="phone-hint">10-digit Sri Lankan mobile number (07XXXXXXXX)</small>
        
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={form.password}
          onChange={(e) => setForm({...form, password: e.target.value})}
          required
          minLength="6"
        />
        
        <div className="user-type-selection">
          <h4>I am a:</h4>
          <div className="user-type-options">
            <label className={`user-type-option ${form.userType === 'consumer' ? 'selected' : ''}`}>
              <input
                type="radio"
                value="consumer"
                checked={form.userType === 'consumer'}
                onChange={(e) => setForm({...form, userType: e.target.value})}
                hidden
              />
              <div className="option-content">
                <span className="option-icon">👤</span>
                <span className="option-label">Service Consumer</span>
                <small>I need services</small>
              </div>
            </label>
            <label className={`user-type-option ${form.userType === 'provider' ? 'selected' : ''}`}>
              <input
                type="radio"
                value="provider"
                checked={form.userType === 'provider'}
                onChange={(e) => setForm({...form, userType: e.target.value})}
                hidden
              />
              <div className="option-content">
                <span className="option-icon">🔧</span>
                <span className="option-label">Service Provider</span>
                <small>I offer services</small>
              </div>
            </label>
          </div>
        </div>

        <div className="testing-note">
          <p><strong>Testing Information:</strong></p>
          <p>• Use any valid Sri Lankan phone number (07XXXXXXXX)</p>
          <p>• OTP for ALL numbers: <strong>123456</strong></p>
          <p>• Admin accounts pre-created in Firebase</p>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Register & Verify Phone'}
        </button>
        
        <p className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </form>
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await loginUser(form.email, form.password);

      if (result.success) {
        // Check if user is admin
        if (result.user.isAdmin) {
          navigate('/admin');
        } else if (result.user.userType === 'provider') {
          navigate('/provider-dashboard');
        } else {
          navigate('/profile');
        }
      } else {
        // If verification is required, redirect to verification page
        if (result.verificationRequired) {
          navigate('/verify', {
            state: {
              phone: result.phone,
              email: form.email,
              password: form.password
            }
          });
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Login</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({...form, email: e.target.value})}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({...form, password: e.target.value})}
          required
        />
        
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        
        <div className="testing-info-login">
          <h4>Testing Information:</h4>
          <div className="testing-details">
            <p><strong>OTP for ALL numbers:</strong> <span className="otp-display">123456</span></p>
            <p><strong>Admin accounts (pre-created):</strong></p>
            <ul>
              <li>kavishan16@icloud.com / shan16@K</li>
              <li>admin@wefix.com / admin123</li>
            </ul>
            <p className="otp-reminder">💡 <strong>Remember:</strong> Use OTP <strong>123456</strong> for phone verification</p>
          </div>
        </div>
        
        <p className="auth-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </form>
    </div>
  );
}

function Providers() {
  const services = [
    'Plumber', 'Electrician', 'Gardener', 'Driver', 
    'Maid', 'Teacher/Tutor', 'Carpenter', 'Painter', 'Cleaner'
  ];

  return (
    <div className="providers">
      <h2>Service Providers</h2>
      <div className="services-grid">
        {services.map((service, index) => (
          <div key={index} className="service-card">
            <h3>{service}</h3>
            <p>Find skilled {service.toLowerCase()}s</p>
            <button>Browse</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
