import React, { useState, useEffect } from 'react';
import { 
  updateUserProfile, 
  changePassword, 
  sendEmailVerificationToUser,
  validateSLPhone,
  getCurrentUserData
} from '../firebase/init';
import Logo from './Logo';
import './Profile.css';

const Profile = ({ user, onUpdate }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+94',
    userType: 'consumer'
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [phoneVerified, setPhoneVerified] = useState(true);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone ? user.phone.replace('+94', '') : '',
        countryCode: user.countryCode || '+94',
        userType: user.userType || 'consumer'
      });
      setPhoneVerified(user.phoneVerified || false);
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Validate phone
      const phoneValidation = validateSLPhone(form.phone);
      if (!phoneValidation.valid) {
        setMessage({ type: 'error', text: phoneValidation.error });
        setLoading(false);
        return;
      }

      const updates = {
        name: form.name,
        phone: phoneValidation.phone,
        countryCode: '+94',
        userType: form.userType
      };

      // Only update email if changed
      if (form.email !== user.email) {
        updates.email = form.email;
      }

      const result = await updateUserProfile(user.uid, updates);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        // Update parent component
        onUpdate && onUpdate({ ...user, ...updates });
        
        // Send verification email if email changed
        if (form.email !== user.email) {
          await sendEmailVerificationToUser();
          setMessage({ 
            type: 'info', 
            text: 'Profile updated! Please check your email for verification.' 
          });
        }
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setLoading(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      setLoading(false);
      return;
    }

    try {
      const result = await changePassword(passwordForm.newPassword);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchUserType = async (newType) => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await updateUserProfile(user.uid, { userType: newType });
      
      if (result.success) {
        setForm({ ...form, userType: newType });
        setMessage({ 
          type: 'success', 
          text: `Switched to ${newType === 'consumer' ? 'Service Consumer' : 'Service Provider'}. Please refresh the page to see the provider dashboard.` 
        });
        onUpdate && onUpdate({ ...user, userType: newType });
        
        // Reload page after 2 seconds to show provider dashboard
        if (newType === 'provider') {
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <Logo size="medium" />
        <h1>My Profile</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="profile-sections">
        {/* Personal Info */}
        <section className="profile-section">
          <h2>Personal Information</h2>
          <form onSubmit={handleProfileUpdate}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                required
              />
              {!user.emailVerified && (
                <span className="verification-badge not-verified">
                  Email not verified
                </span>
              )}
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <div className="phone-input">
                <select 
                  value={form.countryCode}
                  onChange={(e) => setForm({...form, countryCode: e.target.value})}
                  className="country-code"
                  disabled
                >
                  <option value="+94">🇱🇰 +94</option>
                </select>
                <input
                  type="tel"
                  placeholder="0712345678"
                  value={form.phone}
                  onChange={(e) => setForm({...form, phone: e.target.value})}
                  required
                  maxLength="10"
                />
              </div>
              {!phoneVerified && (
                <span className="verification-badge not-verified">
                  Phone not verified
                </span>
              )}
              <small className="hint">10-digit Sri Lankan mobile number (07XXXXXXXX)</small>
            </div>

            <div className="form-group">
              <label>Account Type</label>
              <div className="user-type-toggle">
                <button
                  type="button"
                  className={`type-btn ${form.userType === 'consumer' ? 'active' : ''}`}
                  onClick={() => handleSwitchUserType('consumer')}
                >
                  👤 Service Consumer
                  <small>Browse & book services</small>
                </button>
                <button
                  type="button"
                  className={`type-btn ${form.userType === 'provider' ? 'active' : ''}`}
                  onClick={() => handleSwitchUserType('provider')}
                >
                  🔧 Service Provider
                  <small>Offer & manage services</small>
                </button>
              </div>
              {form.userType === 'provider' && (
                <div className="provider-note">
                  <p>✅ As a Service Provider, you can:</p>
                  <ul>
                    <li>Add services in different sectors</li>
                    <li>Set your prices in Provider Dashboard</li>
                    <li>Receive booking requests</li>
                    <li>Manage your service portfolio</li>
                  </ul>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="save-btn">
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </section>

        {/* Change Password */}
        <section className="profile-section">
          <h2>Change Password</h2>
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                placeholder="Enter current password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                placeholder="Enter new password (min 6 characters)"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                required
                minLength="6"
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                required
                minLength="6"
              />
            </div>

            <button type="submit" disabled={loading} className="save-btn">
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </section>

        {/* Account Info */}
        <section className="profile-section">
          <h2>Account Information</h2>
          <div className="account-info">
            <div className="info-row">
              <span className="label">User ID:</span>
              <span className="value">{user.uid}</span>
            </div>
            <div className="info-row">
              <span className="label">Account Created:</span>
              <span className="value">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="info-row">
              <span className="label">Last Updated:</span>
              <span className="value">
                {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="info-row">
              <span className="label">Status:</span>
              <span className={`status ${user.isAdmin ? 'admin' : 'active'}`}>
                {user.isAdmin ? 'Administrator' : 'Active'}
              </span>
            </div>
            <div className="info-row">
              <span className="label">Account Type:</span>
              <span className={`status ${form.userType}`}>
                {form.userType === 'provider' ? 'Service Provider' : 'Service Consumer'}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Profile;
