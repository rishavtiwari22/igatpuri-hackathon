// AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import firebaseService from '../utils/firebaseService';

// Create Auth Context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Google Sign In
  const signInWithGoogle = async () => {
    try {
      setIsSigningIn(true);
      console.log('🔐 Starting Google Sign In...');
      
      // Set persistence to local
      await setPersistence(auth, browserLocalPersistence);
      
      // Configure Google Provider
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      console.log('✅ Google Sign In successful:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      });
      
      // Save user profile to Firebase (with offline handling)
      try {
        await firebaseService.saveUserProfile(user.uid, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: user.metadata.creationTime,
          lastSignInTime: user.metadata.lastSignInTime
        });
      } catch (saveError) {
        console.warn('⚠️ Could not save user profile to Firebase:', saveError.message);
        // Continue with authentication even if profile save fails
      }
      
      return user;
    } catch (error) {
      console.error('❌ Google Sign In error:', error);
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  };

  // Sign Out
  const signOutUser = async () => {
    try {
      console.log('🔐 Signing out...');
      
      if (user) {
        // Clear Firebase service cache
        firebaseService.clearUserData(user.uid);
      }
      
      await signOut(auth);
      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }
  };

  // Guest Sign In (for demo mode)
  const signInAsGuest = async () => {
    try {
      setIsSigningIn(true);
      console.log('🎯 Starting Guest Sign In (Demo Mode)...');
      
      // Create a mock user object for guest mode
      const guestUser = {
        uid: 'guest-' + Date.now(),
        email: 'guest@demo.com',
        displayName: 'Demo User',
        photoURL: null,
        isGuest: true,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString()
        }
      };
      
      console.log('✅ Guest Sign In successful (Demo Mode):', {
        uid: guestUser.uid,
        email: guestUser.email,
        displayName: guestUser.displayName,
        isGuest: true
      });
      
      // Set the user directly (bypass Firebase)
      setUser(guestUser);
      
      return guestUser;
    } catch (error) {
      console.error('❌ Guest Sign In error:', error);
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  };

  // Auth state change listener
  useEffect(() => {
    console.log('👂 Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log('✅ User authenticated:', {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName
          });
          
          setUser(firebaseUser);
          
          // Update last login time
          await firebaseService.saveUserProfile(firebaseUser.uid, {
            lastSignInTime: firebaseUser.metadata.lastSignInTime,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL
          });
          
        } else {
          console.log('👤 No user authenticated');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Auth state change error:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      console.log('👋 Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
    isSigningIn,
    signInWithGoogle,
    signOutUser,
    signInAsGuest
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
