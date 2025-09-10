// firebaseService.js
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import { 
  ref, 
  set, 
  get, 
  update, 
  push, 
  onValue, 
  off,
  serverTimestamp as realtimeServerTimestamp
} from 'firebase/database';
import { db, realtimeDb } from '../firebase';

class FirebaseService {
  constructor() {
    this.userProgressCache = new Map();
    this.listeners = new Map();
    this.firestoreAvailable = true;
    this.realtimeAvailable = true;
    this.hasShownFirestoreWarning = false;
  }

  // Check if error indicates Firestore is not set up
  isFirestoreNotSetupError(error) {
    return (
      error.code === 'permission-denied' ||
      error.code === 'failed-precondition' ||
      error.code === 'unavailable' ||
      error.code === 'not-found' ||
      error.message?.includes('400') ||
      error.message?.includes('Bad Request') ||
      error.message?.includes('not found') ||
      error.message?.includes('PERMISSION_DENIED') ||
      error.message?.includes('transport errored')
    );
  }

  // Show user-friendly notification about Firestore setup
  showFirestoreSetupNotification() {
    if (this.hasShownFirestoreWarning) return;
    
    this.hasShownFirestoreWarning = true;
    
    // Create a visual notification for the user
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
      z-index: 10000;
      max-width: 90vw;
      text-align: center;
      cursor: pointer;
    `;
    
    notification.innerHTML = `
      🚨 Database Setup Required<br>
      <small style="font-weight: 400; opacity: 0.9;">
        Click to view setup instructions
      </small>
    `;
    
    notification.onclick = () => {
      window.open('https://console.firebase.google.com/project/img-prompt-project', '_blank');
      notification.remove();
    };
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);
  }

  // Log detailed error information
  logFirebaseError(operation, error) {
    console.error(`❌ Firebase ${operation} Error:`, {
      code: error.code,
      message: error.message,
      operation,
      timestamp: new Date().toISOString()
    });

    if (this.isFirestoreNotSetupError(error)) {
      console.warn(`
🚨 FIRESTORE SETUP REQUIRED!

This error suggests Firestore is not properly configured:
1. Go to Firebase Console: https://console.firebase.google.com/project/img-prompt-project
2. Click "Firestore Database" → "Create database"
3. Choose "Start in test mode"
4. Select a location and create
5. Refresh the application

Error details: ${error.code} - ${error.message}
      `);
      this.firestoreAvailable = false;
      this.showFirestoreSetupNotification();
    }
  }

  // Generate user document path
  getUserDocPath(userId) {
    return `users/${userId}`;
  }

  // Generate progress document path
  getProgressDocPath(userId) {
    return `users/${userId}/gameData/progress`;
  }

  // Generate settings document path
  getSettingsDocPath(userId) {
    return `users/${userId}/gameData/settings`;
  }

  // Save user profile data
  async saveUserProfile(userId, profileData) {
    if (!this.firestoreAvailable) {
      console.warn('🔌 Firestore unavailable - skipping profile save');
      return false;
    }

    try {
      const userDocRef = doc(db, this.getUserDocPath(userId));
      await setDoc(userDocRef, {
        ...profileData,
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log('✅ Firebase: User profile saved successfully');
      return true;
    } catch (error) {
      this.logFirebaseError('saveUserProfile', error);
      
      if (this.isFirestoreNotSetupError(error)) {
        return false;
      }
      
      if (error.code === 'unavailable' || error.message.includes('offline')) {
        console.warn('🔌 Firebase: Offline - user profile will sync when online');
        return false;
      }
      console.error('❌ Firebase: Error saving user profile:', error);
      throw error;
    }
  }

  // Get user profile data
  async getUserProfile(userId) {
    try {
      const userDocRef = doc(db, this.getUserDocPath(userId));
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log('✅ Firebase: User profile retrieved successfully');
        return data;
      } else {
        console.log('📝 Firebase: No user profile found, will create new one');
        return null;
      }
    } catch (error) {
      console.error('❌ Firebase: Error getting user profile:', error);
      throw error;
    }
  }

  // Save progress data (unlockedShapes + challengeProgress)
  async saveProgressData(userId, progressData, unlockedShapes) {
    try {
      const progressDocRef = doc(db, this.getProgressDocPath(userId));
      
      const dataToSave = {
        challengeProgress: progressData,
        unlockedShapes: unlockedShapes,
        lastUpdated: serverTimestamp(),
        version: '1.0' // For future migration compatibility
      };

      await setDoc(progressDocRef, dataToSave, { merge: true });
      
      // Update cache
      this.userProgressCache.set(userId, {
        challengeProgress: progressData,
        unlockedShapes: unlockedShapes,
        lastUpdated: new Date()
      });
      
      console.log('✅ Firebase: Progress data saved successfully', {
        challengeProgressKeys: Object.keys(progressData),
        unlockedShapesCount: unlockedShapes.length
      });
      
      return true;
    } catch (error) {
      if (error.code === 'unavailable' || error.message.includes('offline') || error.code === 'permission-denied') {
        console.warn('🔌 Firebase: Offline or permission denied - progress will sync when available');
        // Update cache anyway for local consistency
        this.userProgressCache.set(userId, {
          challengeProgress: progressData,
          unlockedShapes: unlockedShapes,
          lastUpdated: new Date()
        });
        return false; // Indicate offline save
      }
      console.error('❌ Firebase: Error saving progress data:', error);
      throw error;
    }
  }

  // Get progress data
  async getProgressData(userId) {
    try {
      // Check cache first
      if (this.userProgressCache.has(userId)) {
        const cached = this.userProgressCache.get(userId);
        console.log('🔄 Firebase: Using cached progress data');
        return {
          challengeProgress: cached.challengeProgress || {},
          unlockedShapes: cached.unlockedShapes || [0]
        };
      }

      const progressDocRef = doc(db, this.getProgressDocPath(userId));
      const progressDoc = await getDoc(progressDocRef);
      
      if (progressDoc.exists()) {
        const data = progressDoc.data();
        
        // Update cache
        this.userProgressCache.set(userId, {
          challengeProgress: data.challengeProgress || {},
          unlockedShapes: data.unlockedShapes || [0],
          lastUpdated: new Date()
        });
        
        console.log('✅ Firebase: Progress data retrieved successfully', {
          challengeProgressKeys: Object.keys(data.challengeProgress || {}),
          unlockedShapesCount: (data.unlockedShapes || [0]).length
        });
        
        return {
          challengeProgress: data.challengeProgress || {},
          unlockedShapes: data.unlockedShapes || [0]
        };
      } else {
        console.log('📝 Firebase: No progress data found, returning defaults');
        const defaultData = {
          challengeProgress: {},
          unlockedShapes: [0]
        };
        
        // Cache default data
        this.userProgressCache.set(userId, {
          ...defaultData,
          lastUpdated: new Date()
        });
        
        return defaultData;
      }
    } catch (error) {
      if (error.code === 'unavailable' || error.message.includes('offline')) {
        console.warn('🔌 Firebase: Offline - returning cached or default progress data');
        // Return cached data if available, otherwise defaults
        if (this.userProgressCache.has(userId)) {
          const cached = this.userProgressCache.get(userId);
          return {
            challengeProgress: cached.challengeProgress || {},
            unlockedShapes: cached.unlockedShapes || [0]
          };
        }
        // Return defaults when offline and no cache
        return {
          challengeProgress: {},
          unlockedShapes: [0]
        };
      }
      console.error('❌ Firebase: Error getting progress data:', error);
      throw error;
    }
  }

  // Save user settings (voice preferences, etc.)
  async saveUserSettings(userId, settings) {
    try {
      const settingsDocRef = doc(db, this.getSettingsDocPath(userId));
      await setDoc(settingsDocRef, {
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log('✅ Firebase: User settings saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Firebase: Error saving user settings:', error);
      throw error;
    }
  }

  // Get user settings
  async getUserSettings(userId) {
    try {
      const settingsDocRef = doc(db, this.getSettingsDocPath(userId));
      const settingsDoc = await getDoc(settingsDocRef);
      
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        console.log('✅ Firebase: User settings retrieved successfully');
        return data;
      } else {
        console.log('📝 Firebase: No user settings found, returning defaults');
        return {
          voiceEnabled: true,
          selectedModel: 'pollinations'
        };
      }
    } catch (error) {
      console.error('❌ Firebase: Error getting user settings:', error);
      throw error;
    }
  }

  // Real-time listener for progress data changes
  subscribeToProgressData(userId, callback) {
    try {
      const progressDocRef = doc(db, this.getProgressDocPath(userId));
      
      const unsubscribe = onSnapshot(progressDocRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          
          // Update cache
          this.userProgressCache.set(userId, {
            challengeProgress: data.challengeProgress || {},
            unlockedShapes: data.unlockedShapes || [0],
            lastUpdated: new Date()
          });
          
          callback({
            challengeProgress: data.challengeProgress || {},
            unlockedShapes: data.unlockedShapes || [0]
          });
          
          console.log('🔄 Firebase: Progress data updated from real-time listener');
        } else {
          console.log('📝 Firebase: Progress document does not exist yet');
          callback({
            challengeProgress: {},
            unlockedShapes: [0]
          });
        }
      }, (error) => {
        console.error('❌ Firebase: Error in progress data listener:', error);
      });

      this.listeners.set(userId, unsubscribe);
      console.log('👂 Firebase: Progress data listener attached');
      
      return unsubscribe;
    } catch (error) {
      console.error('❌ Firebase: Error setting up progress listener:', error);
      throw error;
    }
  }

  // Unsubscribe from real-time listener
  unsubscribeFromProgressData(userId) {
    if (this.listeners.has(userId)) {
      const unsubscribe = this.listeners.get(userId);
      unsubscribe();
      this.listeners.delete(userId);
      console.log('👋 Firebase: Progress data listener removed');
    }
  }

  // Clear all caches and listeners (for logout)
  clearUserData(userId) {
    this.userProgressCache.delete(userId);
    this.unsubscribeFromProgressData(userId);
    console.log('🧹 Firebase: User data cleared from cache');
  }

  // Migrate localStorage data to Firebase (one-time operation)
  async migrateLocalStorageToFirebase(userId) {
    try {
      console.log('🔄 Firebase: Starting localStorage migration...');
      
      // Get localStorage data
      const localUnlockedShapes = localStorage.getItem('unlockedShapes');
      const localChallengeProgress = localStorage.getItem('challengeProgress');
      
      if (localUnlockedShapes || localChallengeProgress) {
        const unlockedShapes = localUnlockedShapes ? JSON.parse(localUnlockedShapes) : [0];
        const challengeProgress = localChallengeProgress ? JSON.parse(localChallengeProgress) : {};
        
        console.log('📊 Firebase: Migrating data:', {
          unlockedShapesCount: unlockedShapes.length,
          challengeProgressKeys: Object.keys(challengeProgress)
        });
        
        // Save to Firebase
        await this.saveProgressData(userId, challengeProgress, unlockedShapes);
        
        // Clear localStorage after successful migration
        localStorage.removeItem('unlockedShapes');
        localStorage.removeItem('challengeProgress');
        
        console.log('✅ Firebase: localStorage migration completed and local data cleared');
        return true;
      } else {
        console.log('📝 Firebase: No localStorage data to migrate');
        return false;
      }
    } catch (error) {
      console.error('❌ Firebase: Error during localStorage migration:', error);
      throw error;
    }
  }


  // Get user statistics
  async getUserStats(userId) {
    try {
      const progressData = await this.getProgressData(userId);
      const challengeProgress = progressData.challengeProgress;
      
      const stats = {
        totalChallenges: Object.keys(challengeProgress).length,
        completedChallenges: Object.values(challengeProgress).filter(c => c.completed).length,
        totalAttempts: Object.values(challengeProgress).reduce((sum, c) => sum + (c.attempts || 0), 0),
        averageScore: 0,
        bestScore: 0,
        firstCompletedAt: null,
        lastAttemptAt: null
      };
      
      if (stats.totalChallenges > 0) {
        const scores = Object.values(challengeProgress).map(c => c.bestScore || 0);
        stats.averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        stats.bestScore = Math.max(...scores);
        
        const completedDates = Object.values(challengeProgress)
          .filter(c => c.firstCompletedAt)
          .map(c => new Date(c.firstCompletedAt));
        
        if (completedDates.length > 0) {
          stats.firstCompletedAt = new Date(Math.min(...completedDates));
        }
        
        const attemptDates = Object.values(challengeProgress)
          .filter(c => c.lastAttemptAt)
          .map(c => new Date(c.lastAttemptAt));
        
        if (attemptDates.length > 0) {
          stats.lastAttemptAt = new Date(Math.max(...attemptDates));
        }
      }
      
      console.log('📊 Firebase: User stats calculated:', stats);
      return stats;
    } catch (error) {
      if (error.code === 'unavailable' || error.message.includes('offline')) {
        console.warn('🔌 Firebase: Offline - returning default user stats');
        return {
          totalChallenges: 0,
          completedChallenges: 0,
          totalAttempts: 0,
          averageScore: 0,
          bestScore: 0,
          firstCompletedAt: null,
          lastAttemptAt: null
        };
      }
      console.error('❌ Firebase: Error getting user stats:', error);
      throw error;
    }
  }

  // ==================== REALTIME DATABASE METHODS ====================
  
  // Save data to Realtime Database
  async saveToRealtimeDB(userId, path, data) {
    try {
      const dbRef = ref(realtimeDb, `users/${userId}/${path}`);
      await set(dbRef, {
        ...data,
        timestamp: realtimeServerTimestamp()
      });
      console.log('✅ Realtime DB: Data saved successfully to', path);
      return true;
    } catch (error) {
      console.error('❌ Realtime DB: Error saving data:', error);
      throw error;
    }
  }

  // Get data from Realtime Database
  async getFromRealtimeDB(userId, path) {
    try {
      const dbRef = ref(realtimeDb, `users/${userId}/${path}`);
      const snapshot = await get(dbRef);
      
      if (snapshot.exists()) {
        console.log('✅ Realtime DB: Data retrieved successfully from', path);
        return snapshot.val();
      } else {
        console.log('📝 Realtime DB: No data found at', path);
        return null;
      }
    } catch (error) {
      console.error('❌ Realtime DB: Error getting data:', error);
      throw error;
    }
  }

  // Update data in Realtime Database
  async updateRealtimeDB(userId, path, updates) {
    try {
      const dbRef = ref(realtimeDb, `users/${userId}/${path}`);
      await update(dbRef, {
        ...updates,
        lastUpdated: realtimeServerTimestamp()
      });
      console.log('✅ Realtime DB: Data updated successfully at', path);
      return true;
    } catch (error) {
      console.error('❌ Realtime DB: Error updating data:', error);
      throw error;
    }
  }

  // Subscribe to real-time changes in Realtime Database
  subscribeToRealtimeDB(userId, path, callback) {
    try {
      const dbRef = ref(realtimeDb, `users/${userId}/${path}`);
      
      const unsubscribe = onValue(dbRef, (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.val());
          console.log('🔄 Realtime DB: Data updated from listener at', path);
        } else {
          callback(null);
          console.log('📝 Realtime DB: No data at', path);
        }
      }, (error) => {
        console.error('❌ Realtime DB: Listener error:', error);
      });

      // Store listener for cleanup
      const listenerKey = `${userId}_${path}`;
      if (!this.realtimeListeners) {
        this.realtimeListeners = new Map();
      }
      this.realtimeListeners.set(listenerKey, { ref: dbRef, unsubscribe });
      
      console.log('👂 Realtime DB: Listener attached to', path);
      return unsubscribe;
    } catch (error) {
      console.error('❌ Realtime DB: Error setting up listener:', error);
      throw error;
    }
  }

  // Unsubscribe from Realtime Database listener
  unsubscribeFromRealtimeDB(userId, path) {
    const listenerKey = `${userId}_${path}`;
    if (this.realtimeListeners && this.realtimeListeners.has(listenerKey)) {
      const listener = this.realtimeListeners.get(listenerKey);
      off(listener.ref);
      this.realtimeListeners.delete(listenerKey);
      console.log('👋 Realtime DB: Listener removed from', path);
    }
  }

  // Save progress to both Firestore and Realtime Database
  async saveProgressDataDual(userId, challengeProgress, unlockedShapes) {
    let firestoreResult = false;
    let realtimeResult = false;

    // Try Firestore first (but don't fail if it's not set up)
    try {
      if (this.firestoreAvailable) {
        firestoreResult = await this.saveProgressData(userId, challengeProgress, unlockedShapes);
        if (firestoreResult) {
          console.log('✅ Dual save: Data saved to Firestore');
        }
      } else {
        console.log('⚠️ Dual save: Firestore unavailable, skipping');
      }
    } catch (error) {
      if (this.isFirestoreNotSetupError(error)) {
        console.log('⚠️ Dual save: Firestore not set up, using Realtime DB only');
        this.firestoreAvailable = false;
      } else {
        console.error('❌ Dual save: Firestore error:', error);
      }
    }

    // Try Realtime Database
    try {
      if (this.realtimeAvailable) {
        realtimeResult = await this.saveToRealtimeDB(userId, 'progress', {
          challengeProgress,
          unlockedShapes,
          lastUpdated: new Date().toISOString()
        });
        if (realtimeResult) {
          console.log('✅ Dual save: Data saved to Realtime DB');
        }
      }
    } catch (error) {
      console.error('❌ Dual save: Realtime DB error:', error);
      this.realtimeAvailable = false;
    }

    // Return true if at least one database succeeded
    const success = firestoreResult || realtimeResult;
    if (success) {
      console.log(`✅ Dual save: Successfully saved to ${firestoreResult && realtimeResult ? 'both databases' : firestoreResult ? 'Firestore only' : 'Realtime DB only'}`);
    } else {
      console.error('❌ Dual save: Failed to save to any database');
    }
    
    return success;
  }

  // Get progress from both databases with fallback
  async getProgressDataDual(userId) {
    // Try Firestore first (if available)
    if (this.firestoreAvailable) {
      try {
        const firestoreData = await this.getProgressData(userId);
        console.log('✅ Dual get: Retrieved data from Firestore');
        return firestoreData;
      } catch (firestoreError) {
        if (this.isFirestoreNotSetupError(firestoreError)) {
          console.warn('⚠️ Firestore not set up, falling back to Realtime DB');
          this.firestoreAvailable = false;
        } else {
          console.warn('⚠️ Firestore error, trying Realtime DB:', firestoreError.message);
        }
      }
    }
    
    // Fallback to Realtime Database
    if (this.realtimeAvailable) {
      try {
        const realtimeData = await this.getFromRealtimeDB(userId, 'progress');
        if (realtimeData) {
          console.log('✅ Dual get: Retrieved data from Realtime DB');
          return {
            challengeProgress: realtimeData.challengeProgress || {},
            unlockedShapes: realtimeData.unlockedShapes || [0]
          };
        }
      } catch (realtimeError) {
        console.error('❌ Realtime DB error:', realtimeError);
        this.realtimeAvailable = false;
      }
    }
    
    // If both fail, return defaults
    console.log('📝 Dual get: No data found in any database, returning defaults');
    return {
      challengeProgress: {},
      unlockedShapes: [0]
    };
  }
}

// Create and export singleton instance
const firebaseService = new FirebaseService();
export default firebaseService;
