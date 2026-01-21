import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDb4m2UmvviaTMi38_mpqGzXCGshbF_i3A",
  authDomain: "wefix-266bc.firebaseapp.com",
  projectId: "wefix-266bc",
  storageBucket: "wefix-266bc.firebasestorage.app",
  messagingSenderId: "757966396017",
  appId: "1:757966396017:web:cd9e0189c449eec2d399d0",
  measurementId: "G-3GKKZBF5CB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const createAdminUser = async (email, password, name) => {
  try {
    console.log(`Creating admin user: ${email}`);
    
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log(`Firebase Auth admin created: ${user.uid}`);
    
    // Create user data for Firestore
    const userProfile = {
      uid: user.uid,
      email: user.email,
      name: name,
      phone: '+94710000000',
      localPhone: '0710000000',
      countryCode: '+94',
      phoneVerified: true,
      userType: 'consumer',
      isAdmin: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active'
    };
    
    // Store user data in Firestore
    await setDoc(doc(db, 'users', user.uid), userProfile);
    
    console.log(` Admin user ${email} created successfully!`);
    console.log(`Password: ${password}`);
    
    return { success: true, user: userProfile };
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(` Admin user ${email} already exists. Skipping...`);
      return { success: false, error: 'User already exists' };
    }
    console.error(` Error creating admin user ${email}:`, error);
    return { success: false, error: error.message };
  }
};

// Create admin users
const createAdminUsers = async () => {
  try {
    const adminUsers = [
      {
        email: 'kavishan16@icloud.com',
        password: 'shan16@K',
        name: 'Kavishan Admin'
      },
      {
        email: 'admin@wefix.com',
        password: 'admin123',
        name: 'System Admin'
      }
    ];
    
    console.log('🚀 Starting to create admin users...');
    console.log('=====================================');
    
    for (const admin of adminUsers) {
      await createAdminUser(admin.email, admin.password, admin.name);
      console.log('-------------------------------------');
    }
    
    console.log(' All admin users created!');
    console.log('\n Admin Login Credentials:');
    console.log('1. kavishan16@icloud.com / shan16@K');
    console.log('2. admin@wefix.com / admin123');
    console.log('\n Test OTP for ANY phone number: 123456');
    
    // Logout after creating users
    await auth.signOut();
    
    process.exit(0);
  } catch (error) {
    console.error(' Error creating admin users:', error);
    process.exit(1);
  }
};

// Run the script
createAdminUsers();
