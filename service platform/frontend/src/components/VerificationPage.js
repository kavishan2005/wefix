import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sendVerificationOTP, verifyPhoneOTP, resendVerificationOTP, loginUser } from '../firebase/init';
import Logo from './Logo';
import './PhoneVerification.css';

const VerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [userId, setUserId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timer, setTimer] = useState(60); // 60 seconds
  const [canResend, setCanResend] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    // Get data from location state (passed from registration)
    console.log('Location state:', location.state);
    
    if (location.state) {
      const { userId, phone, email, password } = location.state;
      if (userId) {
        setUserId(userId);
        console.log('User ID set:', userId);
      }
      if (phone) {
        setPhone(phone);
        console.log('Phone set:', phone);
      }
      if (email) {
        setEmail(email);
        console.log('Email set:', email);
      }
      if (password) {
        setPassword(password);
      }
      
      // Auto-send OTP when component loads if we have userId
      if (userId && !otpSent) {
        console.log('Auto-sending OTP for user:', userId);
        sendOTP();
      }
    }
    
    // Timer for resend OTP
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
  }, [location.state, timer, otpSent]);

  const sendOTP = async () => {
    if (!userId) {
      setError('User ID not found. Please register again.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('Sending OTP for user:', userId);
      const result = await sendVerificationOTP(userId);
      
      if (result.success) {
        setOtpSent(true);
        setPhone(result.phone);
        setSuccess('✅ OTP sent to your phone! Use OTP: 123456');
        
        // Start timer
        setTimer(60);
        setCanResend(false);
        
        // Auto-focus first OTP input
        setTimeout(() => {
          document.getElementById('otp-0')?.focus();
        }, 100);
      } else {
        setError(result.error || 'Failed to send OTP.');
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
    
    // Auto submit when last digit entered
    if (value && index === 5) {
      handleSubmit();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
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
      console.log('Verifying OTP:', enteredOTP, 'for phone:', phone);
      const result = await verifyPhoneOTP(phone, enteredOTP, userId);
      
      if (result.success) {
        setSuccess('✅ Phone verified successfully! Logging you in...');
        
        // Auto-login after verification
        if (email && password) {
          setTimeout(async () => {
            try {
              const loginResult = await loginUser(email, password);
              
              if (loginResult.success) {
                // Check if user is admin
                if (loginResult.user.isAdmin) {
                  navigate('/admin');
                } else {
                  navigate('/profile');
                }
              } else {
                navigate('/login');
              }
            } catch (err) {
              navigate('/login');
            }
          }, 1500);
        } else {
          setTimeout(() => {
            navigate('/login');
          }, 1500);
        }
      } else {
        setError(`❌ ${result.error}. Use OTP: 123456`);
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        document.getElementById('otp-0')?.focus();
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
        setSuccess('✅ New OTP sent! Use OTP: 123456');
        
        document.getElementById('otp-0')?.focus();
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

  const formatPhone = (phoneNumber) => {
    if (!phoneNumber) return '';
    if (phoneNumber.startsWith('+94')) {
      return `+94 ${phoneNumber.substring(3, 6)} ${phoneNumber.substring(6)}`;
    }
    return phoneNumber;
  };

  return (
    <div className="verification-page">
      <div className="verification-container">
        <div className="verification-header">
          <Logo size="medium" centered={true} />
          <h2>Verify Your Phone Number</h2>
          
          {phone ? (
            <>
              <p className="verification-subtitle">
                We've sent an OTP to <strong>{formatPhone(phone)}</strong>
              </p>
              <p className="verification-hint">
                Enter the 6-digit OTP below to verify your phone
              </p>
            </>
          ) : (
            <p className="verification-subtitle">
              Loading verification details...
            </p>
          )}
        </div>

        {/* Always show OTP reminder */}
        <div className="demo-otp">
          <p><strong>Test OTP:</strong> <span className="otp-display">123456</span></p>
          <small>(This OTP works for ALL phone numbers during testing)</small>
        </div>

        {!otpSent && userId && (
          <div className="send-otp-section">
            <p>Click below to send verification OTP to your phone</p>
            <button 
              onClick={sendOTP} 
              disabled={loading}
              className="send-otp-btn"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
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

        {/* Always show OTP input if we have phone */}
        {phone && (
          <>
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
                  autoFocus={index === 0 && otpSent}
                  placeholder="•"
                />
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || otp.join('').length !== 6}
              className="verify-btn"
            >
              {loading ? 'Verifying...' : 'Verify Phone & Login'}
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
          </>
        )}

        <div className="verification-note">
          <p>📱 <strong>Important:</strong> Always use OTP: <strong>123456</strong> for testing</p>
          <p>⏱️ OTP expires in 10 minutes</p>
          <p>🔒 Maximum 3 attempts allowed</p>
        </div>

        <div className="verification-back">
          <button 
            onClick={() => navigate('/login')}
            className="back-btn"
          >
            ← Back to Login
          </button>
          <button 
            onClick={() => navigate('/register')}
            className="back-btn"
          >
            ← Back to Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;
