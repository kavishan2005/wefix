import React, { useState, useEffect } from 'react';
import { verifyPhoneOTP, resendVerificationOTP } from '../firebase/init';
import './PhoneVerification.css';

const PhoneVerification = ({ phone, onVerified, userId }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timer, setTimer] = useState(60); // 60 seconds
  const [canResend, setCanResend] = useState(false);
  const [otpDisplay, setOtpDisplay] = useState('');

  // Format phone number for display
  const formatPhone = (phoneNumber) => {
    if (!phoneNumber) return '';
    if (phoneNumber.startsWith('+94')) {
      return `+94 ${phoneNumber.substring(3, 6)} ${phoneNumber.substring(6)}`;
    }
    return phoneNumber;
  };

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // Show OTP for admin/demo purposes
  useEffect(() => {
    if (phone.includes('admin') || phone.includes('kavishan')) {
      setOtpDisplay('123456');
    }
  }, [phone]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
    
    // Auto submit when last digit entered
    if (value && index === 5) {
      handleSubmit();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handleSubmit = async () => {
    const enteredOTP = otp.join('');
    
    if (enteredOTP.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await verifyPhoneOTP(phone, enteredOTP);
      
      if (result.success) {
        setSuccess('Phone verified successfully! Redirecting...');
        setTimeout(() => {
          onVerified && onVerified();
        }, 1500);
      } else {
        setError(result.error);
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        document.getElementById('otp-0').focus();
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    setOtp(['', '', '', '', '', '']);
    
    try {
      const result = await resendVerificationOTP(phone);
      
      if (result.success) {
        setTimer(60); // Reset to 60 seconds
        setCanResend(false);
        setSuccess('New OTP sent successfully!');
        
        // Show OTP for admin/demo
        if (result.otp) {
          setOtpDisplay(result.otp);
        }
        
        document.getElementById('otp-0').focus();
      } else {
        setError(result.error || 'Failed to resend OTP.');
      }
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    return `${seconds.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="verification-container">
      <div className="verification-header">
        <div className="verification-icon">📱</div>
        <h2>Verify Your Phone Number</h2>
        <p className="verification-subtitle">
          We've sent an OTP to <strong>{formatPhone(phone)}</strong>
        </p>
        <p className="verification-hint">
          Enter the 6-digit OTP below to verify your phone
        </p>
      </div>

      {/* Demo OTP Display */}
      {otpDisplay && (
        <div className="demo-otp">
          <p>Demo OTP: <strong>{otpDisplay}</strong></p>
          <small>(For testing/demo purposes only)</small>
        </div>
      )}

      {error && (
        <div className="verification-error">
          {error}
        </div>
      )}

      {success && (
        <div className="verification-success">
          {success}
        </div>
      )}

      <div className="otp-inputs">
        {otp.map((digit, index) => (
          <input
            key={index}
            id={`otp-${index}`}
            type="text"
            inputMode="numeric"
            maxLength="1"
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={loading}
            className="otp-input"
            autoFocus={index === 0}
          />
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || otp.join('').length !== 6}
        className="verify-btn"
      >
        {loading ? 'Verifying...' : 'Verify Phone'}
      </button>

      <div className="verification-footer">
        <p>Didn't receive the OTP?</p>
        {canResend ? (
          <button
            onClick={handleResend}
            disabled={loading}
            className="resend-btn"
          >
            Resend OTP
          </button>
        ) : (
          <p className="timer">
            Resend OTP in <span>{formatTime(timer)}</span>
          </p>
        )}
      </div>

      <div className="verification-note">
        <p>📱 In production, OTP would be sent via SMS to your phone</p>
        <p>⏱️ OTP expires in 10 minutes</p>
        <p>🔒 Maximum 3 attempts allowed</p>
      </div>
    </div>
  );
};

export default PhoneVerification;
