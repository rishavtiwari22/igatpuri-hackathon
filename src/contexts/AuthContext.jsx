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
import { 
  trackUserLogin, 
  trackUserLogout, 
  setAnalyticsUser,
  setEnhancedUserProperties,
  trackUserMilestone,
  trackError 
} from '../utils/analyticsService';

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
      
      // Set persistence to local
      await setPersistence(auth, browserLocalPersistence);
      
      // Configure Google Provider
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Track login event with enhanced analytics
      trackUserLogin('google');
      setEnhancedUserProperties(user, {
        sign_in_method: 'google',
        is_new_user: result.additionalUserInfo?.isNewUser || false,
      });
      
      // Track milestone if new user
      if (result.additionalUserInfo?.isNewUser) {
        trackUserMilestone('account_created', {
          provider: 'google',
          registration_method: 'popup'
        });
      } else {
        trackUserMilestone('user_returned', {
          provider: 'google'
        });
      }
      
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
        // Continue with authentication even if profile save fails
      }
      
      return user;
    } catch (error) {
      console.error('❌ Google Sign In error:', error);
      trackError('Google Sign In Failed', error.message);
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  };

  // Sign Out
  const signOutUser = async () => {
    try {      
      if (user) {
        // Track logout
        trackUserLogout();
        
        // Clear Firebase service cache
        firebaseService.clearUserData(user.uid);
      }
      
      await signOut(auth);
    } catch (error) {
      console.error('❌ Sign out error:', error);
      trackError('Sign Out Failed', error.message);
      throw error;
    }
  };

  // Guest Sign In (for demo mode)
  const signInAsGuest = async () => {
    try {
      setIsSigningIn(true);
      
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
      
      // Track guest login
      trackUserLogin('guest');
      setAnalyticsUser(guestUser.uid, {
        user_type: 'guest',
        sign_in_method: 'guest'
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          
          // Update last login time
          await firebaseService.saveUserProfile(firebaseUser.uid, {
            lastSignInTime: firebaseUser.metadata.lastSignInTime,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL
          });
          
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Auth state change error:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => {
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
