import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updatePassword,
  updateEmail,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs as getFirestoreDocs
} from 'firebase/firestore';
import firebaseConfig from './config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// OTP Storage (in-memory for demo - use database in production)
const otpStorage = new Map();

// Generate OTP - ALWAYS return 123456 for testing
const generateOTP = (phone) => {
  const otp = '123456'; // Always 123456 for testing
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  // Store OTP
  otpStorage.set(phone, {
    otp,
    expiresAt,
    attempts: 0,
    verified: false
  });
  
  console.log(`[OTP Service] OTP for ${phone}: ${otp} (TEST MODE)`);
  
  // In production, you would send SMS here:
  // await sendSMS(phone, `Your WeFix verification code is: ${otp}`);
  
  return otp;
};

// Verify OTP
const verifyOTP = (phone, userOTP) => {
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
  
  // Verify OTP - Accept only 123456 in test mode
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
      error: `Invalid OTP. Use 123456 for testing. ${3 - storedOTP.attempts} attempts remaining.` 
    };
  }
};

// Check if OTP is verified
const isPhoneVerified = (phone) => {
  const storedOTP = otpStorage.get(phone);
  return storedOTP && storedOTP.verified;
};

// Remove verified OTP
const clearOTP = (phone) => {
  otpStorage.delete(phone);
};

// Resend OTP
const resendOTP = (phone) => {
  return generateOTP(phone); // Always returns 123456
};

// Validate Sri Lankan phone number
export const validateSLPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  
  // Remove country code if present
  let phoneNumber = cleaned;
  if (cleaned.startsWith('94')) {
    phoneNumber = cleaned.substring(2);
  }
  
  // Check if it's exactly 10 digits (0712345678 format)
  if (phoneNumber.length !== 10) {
    return { valid: false, error: 'Sri Lankan mobile numbers must be 10 digits' };
  }
  
  // Check if it starts with valid prefix
  const validPrefixes = ['070', '071', '072', '074', '075', '076', '077', '078'];
  const prefix = phoneNumber.substring(0, 3);
  
  if (!validPrefixes.includes(prefix)) {
    return { valid: false, error: 'Invalid Sri Lankan mobile number prefix' };
  }
  
  return { valid: true, phone: `+94${phoneNumber}`, localPhone: phoneNumber };
};

// Send OTP to phone (called after registration)
export const sendVerificationOTP = async (userId) => {
  try {
    // Get user data
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }
    
    const userData = userDoc.data();
    const phone = userData.phone;
    
    if (!phone) {
      return { success: false, error: 'Phone number not found' };
    }
    
    // Generate OTP (always 123456 in test mode)
    const otp = generateOTP(phone);
    
    return { 
      success: true, 
      message: 'OTP sent successfully! Use 123456 for testing.',
      phone: phone,
      otp: otp // Always 123456
    };
  } catch (error) {
    console.error('Send OTP error:', error);
    return { success: false, error: error.message };
  }
};

// Verify phone with OTP
export const verifyPhoneOTP = async (phone, otp, userId) => {
  try {
    const result = verifyOTP(phone, otp);
    
    if (result.success) {
      // Update user's phoneVerified status in Firestore
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        phoneVerified: true,
        updatedAt: new Date().toISOString()
      });
      
      // Clear OTP from storage
      clearOTP(phone);
      
      return { 
        success: true, 
        message: 'Phone verified successfully!'
      };
    }
    
    return result;
  } catch (error) {
    console.error('Verify OTP error:', error);
    return { success: false, error: error.message };
  }
};

// Resend OTP
export const resendVerificationOTP = async (phone) => {
  try {
    const otp = resendOTP(phone);
    return { 
      success: true, 
      message: 'New OTP sent successfully! Use 123456.',
      otp: otp // Always 123456
    };
  } catch (error) {
    console.error('Resend OTP error:', error);
    return { success: false, error: error.message };
  }
};

// Auth functions
export const registerUser = async (email, password, userData) => {
  try {
    console.log('Attempting to register user:', email);
    
    // Validate phone
    const phoneValidation = validateSLPhone(userData.phone);
    if (!phoneValidation.valid) {
      return { success: false, error: phoneValidation.error };
    }
    
    // Check if this is an admin email (pre-created in Firebase)
    const isAdmin = email === 'kavishan16@icloud.com' || email === 'admin@wefix.com';
    
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('Firebase Auth user created:', user.uid);
    
    // Prepare user data for Firestore
    const userProfile = {
      uid: user.uid,
      email: user.email,
      name: userData.name,
      phone: phoneValidation.phone,
      localPhone: phoneValidation.localPhone,
      countryCode: '+94',
      phoneVerified: false, // NOT verified yet - user needs to verify with OTP
      userType: userData.userType,
      isAdmin: isAdmin, // Will be true for pre-created admin accounts
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pending_verification' // User cannot login until verified
    };
    
    // Store additional user data in Firestore
    await setDoc(doc(db, 'users', user.uid), userProfile);
    
    console.log('User data saved to Firestore');
    
    // IMPORTANT: Logout user immediately after registration
    // User MUST verify phone before they can login
    await signOut(auth);
    
    return { 
      success: true, 
      userId: user.uid,
      user: userProfile,
      verificationRequired: true,
      phone: phoneValidation.phone,
      message: 'Registration successful! Please verify your phone number to continue.'
    };
  } catch (error) {
    console.error('Registration error:', error);
    let errorMessage = error.message;
    
    // User-friendly error messages
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already registered. Please login instead.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password should be at least 6 characters.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    }
    
    return { success: false, error: errorMessage };
  }
};

export const loginUser = async (email, password) => {
  try {
    console.log('Attempting login for:', email);
    
    // First try to login
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('Login successful for:', user.uid);
    
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    let userData = {};
    if (userDoc.exists()) {
      userData = userDoc.data();
      
      // Check if phone is verified - if not, user cannot login
      if (!userData.phoneVerified) {
        // Logout user immediately
        await signOut(auth);
        
        // Generate OTP for verification (always 123456)
        const otp = generateOTP(userData.phone);
        
        console.log('OTP for verification:', otp);
        
        return { 
          success: false, 
          verificationRequired: true,
          phone: userData.phone,
          otp: otp, // Always 123456
          error: 'Please verify your phone number first. Use OTP: 123456'
        };
      }
      
      // User is verified, allow login
      return { 
        success: true, 
        user: userData,
        token: await user.getIdToken()
      };
      
    } else {
      // If user document doesn't exist, create it but mark as unverified
      userData = {
        uid: user.uid,
        email: user.email,
        name: user.email.split('@')[0],
        userType: 'consumer',
        phoneVerified: false,
        isAdmin: email === 'kavishan16@icloud.com' || email === 'admin@wefix.com',
        createdAt: new Date().toISOString(),
        status: 'pending_verification'
      };
      await setDoc(doc(db, 'users', user.uid), userData);
      
      // Logout user immediately - they need to verify phone
      await signOut(auth);
      
      return { 
        success: false,
        verificationRequired: true,
        error: 'Please complete your profile and verify your phone number.'
      };
    }
    
  } catch (error) {
    console.error('Login error:', error);
    let errorMessage = error.message;
    
    // User-friendly error messages
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email. Please register first.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password. Please try again.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    }
    
    return { success: false, error: errorMessage };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
};

// Profile functions
export const updateUserProfile = async (userId, updates) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(userRef, updateData);
    
    // Update Firebase Auth if email changed
    if (updates.email && auth.currentUser) {
      await updateEmail(auth.currentUser, updates.email);
    }
    
    // Update name in Firebase Auth
    if (updates.name && auth.currentUser) {
      await updateFirebaseProfile(auth.currentUser, {
        displayName: updates.name
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, error: error.message };
  }
};

export const changePassword = async (newPassword) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }
    
    await updatePassword(user, newPassword);
    return { success: true };
  } catch (error) {
    console.error('Change password error:', error);
    return { success: false, error: error.message };
  }
};

export const sendEmailVerificationToUser = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }
    
    await sendEmailVerification(user);
    return { success: true };
  } catch (error) {
    console.error('Send verification email error:', error);
    return { success: false, error: error.message };
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error('Reset password error:', error);
    return { success: false, error: error.message };
  }
};

// Get current user data
export const getCurrentUserData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { success: true, user: userDoc.data() };
    }
    return { success: false, error: 'User not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Check if user is verified (for route protection)
export const isUserVerified = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.phoneVerified === true;
    }
    return false;
  } catch (error) {
    console.error('Check user verification error:', error);
    return false;
  }
};

// Admin functions
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getFirestoreDocs(usersRef);
    const users = [];
    
    querySnapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, users };
  } catch (error) {
    console.error('Get all users error:', error);
    return { success: false, error: error.message };
  }
};

export const getUserStats = async () => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getFirestoreDocs(usersRef);
    
    let totalUsers = 0;
    let totalProviders = 0;
    let totalConsumers = 0;
    let verifiedUsers = 0;
    let unverifiedUsers = 0;
    
    querySnapshot.forEach(doc => {
      const user = doc.data();
      totalUsers++;
      
      if (user.phoneVerified) verifiedUsers++;
      else unverifiedUsers++;
      
      if (user.userType === 'provider') totalProviders++;
      if (user.userType === 'consumer') totalConsumers++;
    });
    
    return {
      success: true,
      stats: {
        totalUsers,
        totalProviders,
        totalConsumers,
        verifiedUsers,
        unverifiedUsers
      }
    };
  } catch (error) {
    console.error('Get user stats error:', error);
    return { success: false, error: error.message };
  }
};

// Firestore functions
export const addService = async (serviceData) => {
  try {
    const docRef = await addDoc(collection(db, 'services'), {
      ...serviceData,
      createdAt: new Date().toISOString(),
      active: true
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Add service error:', error);
    return { success: false, error: error.message };
  }
};

export const getServices = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'services'));
    const services = [];
    querySnapshot.forEach(doc => {
      services.push({ id: doc.id, ...doc.data() });
    });
    
    // If no services in Firestore, return default ones
    if (services.length === 0) {
      return { success: true, services: defaultServices };
    }
    
    return { success: true, services };
  } catch (error) {
    console.error('Get services error:', error);
    // Return default services on error
    return { success: true, services: defaultServices };
  }
};

export const addJob = async (jobData) => {
  try {
    const docRef = await addDoc(collection(db, 'jobs'), {
      ...jobData,
      createdAt: new Date().toISOString(),
      status: 'posted',
      updatedAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Add job error:', error);
    return { success: false, error: error.message };
  }
};

// Default services
const defaultServices = [
  { name: 'Plumber', icon: '🔧', description: 'Pipe repairs, installations, maintenance' },
  { name: 'Electrician', icon: '⚡', description: 'Wiring, repairs, installations' },
  { name: 'Gardener', icon: '🌿', description: 'Landscaping, maintenance, planting' },
  { name: 'Driver', icon: '🚗', description: 'Personal, commercial, delivery' },
  { name: 'Maid', icon: '🏠', description: 'Cleaning, housekeeping' },
  { name: 'Teacher/Tutor', icon: '📚', description: 'Academic support, lessons' },
  { name: 'Carpenter', icon: '🔨', description: 'Furniture, repairs, woodwork' },
  { name: 'Painter', icon: '🎨', description: 'Home painting, commercial' },
  { name: 'Cleaner', icon: '🧹', description: 'Professional cleaning services' }
];

export { auth, db, onAuthStateChanged };
