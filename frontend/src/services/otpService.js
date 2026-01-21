import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase'; // Your Firebase config

// OTP Storage (in-memory for demo - use database in production)
const otpStorage = new Map();

// Generate OTP - With TEST MODE option
export const generateOTP = (phone, testMode = false) => {
  // In test mode, always return 123456
  const otp = testMode ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  // Store OTP
  otpStorage.set(phone, {
    otp,
    expiresAt,
    attempts: 0,
    verified: false
  });
  
  console.log(`[OTP Service] OTP for ${phone}: ${otp} ${testMode ? '(TEST MODE)' : ''}`);
  
  // In production, you would send SMS here:
  // await sendSMS(phone, `Your WeFix verification code is: ${otp}`);
  
  return otp;
};

// Verify OTP (standalone - no Firebase)
export const verifyOTP = (phone, userOTP) => {
  const storedOTP = otpStorage.get(phone);
  
  if (!storedOTP) {
    return { success: false, error: 'OTP expired or not requested' };
  }
  
  // Check if expired
  if (new Date() > storedOTP.expiresAt) {
    otpStorage.delete(phone);
    return { success: false, error: 'OTP expired. Please request a new one.' };
  }
  
  // Check if too many attempts
  if (storedOTP.attempts >= 3) {
    otpStorage.delete(phone);
    return { success: false, error: 'Too many attempts. Please request a new OTP.' };
  }
  
  // Verify OTP
  if (storedOTP.otp === userOTP) {
    storedOTP.verified = true;
    otpStorage.set(phone, storedOTP);
    return { success: true, message: 'Phone verified successfully!' };
  } else {
    // Increment attempts
    storedOTP.attempts += 1;
    otpStorage.set(phone, storedOTP);
    return { 
      success: false, 
      error: `Invalid OTP. ${3 - storedOTP.attempts} attempts remaining.` 
    };
  }
};

// Verify OTP WITH Firebase update
export const verifyPhoneOTP = async (phone, otp, userId) => {
  try {
    if (!userId) {
      return { 
        success: false, 
        error: 'User ID is required. Please restart the verification process.' 
      };
    }
    
    // Verify OTP locally
    const result = verifyOTP(phone, otp);
    
    if (result.success) {
      // ✅ CORRECT: Reference users/userId document
      const userRef = doc(db, 'users', userId);
      
      try {
        // Update user's phoneVerified status in Firestore
        await updateDoc(userRef, {
          phoneVerified: true,
          updatedAt: new Date().toISOString(),
          status: 'active'
        });
        
        // Clear OTP from storage
        otpStorage.delete(phone);
        
        return { 
          success: true, 
          message: 'Phone verified successfully! You can now login.' 
        };
      } catch (firestoreError) {
        console.error('Firestore update error:', firestoreError);
        
        if (firestoreError.code === 'not-found') {
          return { 
            success: false, 
            error: 'User account not found. Please register again.' 
          };
        }
        
        throw firestoreError;
      }
    }
    
    return result;
  } catch (error) {
    console.error('Verify OTP error:', error);
    return { 
      success: false, 
      error: error.message || 'Verification failed. Please try again.' 
    };
  }
};

// Send OTP to user (with Firebase integration)
export const sendVerificationOTP = async (userId, testMode = true) => {
  try {
    if (!userId) {
      return { 
        success: false, 
        error: 'User ID is required to send OTP' 
      };
    }
    
    // ✅ CORRECT: Reference users/userId document
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return { 
        success: false, 
        error: 'User not found in database' 
      };
    }
    
    const userData = userDoc.data();
    const phone = userData.phone;
    
    if (!phone) {
      return { 
        success: false, 
        error: 'Phone number not found in user profile' 
      };
    }
    
    // Generate OTP (testMode = true for development)
    const otp = generateOTP(phone, testMode);
    
    return { 
      success: true, 
      message: testMode 
        ? 'OTP sent successfully! Use 123456 for testing.' 
        : 'OTP sent to your phone!',
      phone: phone,
      otp: otp // Will be 123456 in test mode
    };
  } catch (error) {
    console.error('Send OTP error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send OTP' 
    };
  }
};

// Check if phone is verified
export const isPhoneVerified = (phone) => {
  const storedOTP = otpStorage.get(phone);
  return storedOTP && storedOTP.verified;
};

// Remove verified OTP
export const clearOTP = (phone) => {
  otpStorage.delete(phone);
};

// Resend OTP
export const resendOTP = (phone, testMode = false) => {
  return generateOTP(phone, testMode);
};