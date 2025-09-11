// useFirebaseProgress.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import firebaseService from '../utils/firebaseService';

export const useFirebaseProgress = () => {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState({});
  const [unlockedShapes, setUnlockedShapes] = useState([0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncError, setSyncError] = useState(null);

  // Load progress data when user changes
  useEffect(() => {
    let unsubscribe = null;

    const loadUserProgress = async () => {
      if (!user) {
        console.log('👤 No user - using default progress data');
        setProgressData({});
        setUnlockedShapes([0]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setSyncError(null);

        // Handle guest users (demo mode) - use localStorage only
        if (user.isGuest) {
          console.log('🎯 Guest user detected - using localStorage only');
          
          const storedProgress = JSON.parse(localStorage.getItem('challengeProgress') || '{}');
          const storedUnlocked = JSON.parse(localStorage.getItem('unlockedShapes') || '[0]');
          
          setProgressData(storedProgress);
          setUnlockedShapes(storedUnlocked);
          setLastSyncTime(new Date());
          setIsLoading(false);
          
          console.log('✅ Guest progress loaded from localStorage:', {
            challengeProgressKeys: Object.keys(storedProgress),
            unlockedShapesCount: storedUnlocked.length
          });
          
          return;
        }

        console.log('🔄 Loading user progress for Firebase user:', user.uid);

        // Check for localStorage data to migrate
        const migrated = await firebaseService.migrateLocalStorageToFirebase(user.uid);
        if (migrated) {
          console.log('✅ localStorage data migrated to Firebase');
        }

        // Get progress data using dual database approach
        const data = await firebaseService.getProgressDataDual(user.uid);
        
        setProgressData(data.challengeProgress);
        setUnlockedShapes(data.unlockedShapes);
        setLastSyncTime(new Date());

        console.log('✅ User progress loaded successfully:', {
          challengeProgressKeys: Object.keys(data.challengeProgress),
          unlockedShapesCount: data.unlockedShapes.length
        });

        // Set up real-time listener
        unsubscribe = firebaseService.subscribeToProgressData(user.uid, (updatedData) => {
          console.log('🔄 Real-time update received');
          setProgressData(updatedData.challengeProgress);
          setUnlockedShapes(updatedData.unlockedShapes);
          setLastSyncTime(new Date());
        });

      } catch (error) {
        console.error('❌ Error loading user progress:', error);
        setSyncError(error.message);
        
        // Fallback to localStorage if Firebase fails
        try {
          const localUnlockedShapes = localStorage.getItem('unlockedShapes');
          const localChallengeProgress = localStorage.getItem('challengeProgress');
          
          if (localUnlockedShapes || localChallengeProgress) {
            setUnlockedShapes(localUnlockedShapes ? JSON.parse(localUnlockedShapes) : [0]);
            setProgressData(localChallengeProgress ? JSON.parse(localChallengeProgress) : {});
            console.log('🔄 Fallback: Using localStorage data');
          }
        } catch (localError) {
          console.error('❌ Error loading localStorage fallback:', localError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProgress();

    // Cleanup function
    return () => {
      if (unsubscribe && user) {
        firebaseService.unsubscribeFromProgressData(user.uid);
      }
    };
  }, [user]);

  // Save progress data to Firebase
  const saveProgress = useCallback(async (newProgressData, newUnlockedShapes) => {
    if (!user) {
      console.log('👤 No user - saving to localStorage only');
      localStorage.setItem('challengeProgress', JSON.stringify(newProgressData));
      localStorage.setItem('unlockedShapes', JSON.stringify(newUnlockedShapes));
      return;
    }

    try {
      setIsSaving(true);
      setSyncError(null);

      await firebaseService.saveProgressDataDual(user.uid, newProgressData, newUnlockedShapes);
      
      setLastSyncTime(new Date());
      console.log('✅ Progress saved to Firebase successfully');

    } catch (error) {
      console.error('❌ Error saving progress to Firebase:', error);
      setSyncError(error.message);
      
      // Fallback to localStorage
      try {
        localStorage.setItem('challengeProgress', JSON.stringify(newProgressData));
        localStorage.setItem('unlockedShapes', JSON.stringify(newUnlockedShapes));
        console.log('🔄 Fallback: Progress saved to localStorage');
      } catch (localError) {
        console.error('❌ Error saving to localStorage fallback:', localError);
      }
      
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  // Update progress data (with automatic save)
  const updateProgressData = useCallback((updater) => {
    setProgressData(prevData => {
      const newData = typeof updater === 'function' ? updater(prevData) : updater;
      
      // Handle guest users - save to localStorage only
      if (user?.isGuest) {
        localStorage.setItem('challengeProgress', JSON.stringify(newData));
        console.log('💾 Guest progress saved to localStorage');
        return newData;
      }
      
      // Save to Firebase in background for authenticated users
      saveProgress(newData, unlockedShapes).catch(error => {
        console.error('❌ Background save failed:', error);
      });
      
      return newData;
    });
  }, [saveProgress, unlockedShapes, user]);

  // Update unlocked shapes (with automatic save)
  const updateUnlockedShapes = useCallback((updater) => {
    setUnlockedShapes(prevShapes => {
      const newShapes = typeof updater === 'function' ? updater(prevShapes) : updater;
      
      // Handle guest users - save to localStorage only
      if (user?.isGuest) {
        localStorage.setItem('unlockedShapes', JSON.stringify(newShapes));
        console.log('💾 Guest unlocked shapes saved to localStorage');
        return newShapes;
      }
      
      // Save to Firebase in background for authenticated users
      saveProgress(progressData, newShapes).catch(error => {
        console.error('❌ Background save failed:', error);
      });
      
      return newShapes;
    });
  }, [saveProgress, progressData, user]);



  // Get user statistics
  const getUserStats = useCallback(async () => {
    if (!user) {
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

    try {
      return await firebaseService.getUserStats(user.uid);
    } catch (error) {
      console.error('❌ Error getting user stats:', error);
      throw error;
    }
  }, [user]);

  // Force sync (manual refresh)
  const forceSync = useCallback(async () => {
    if (!user) {
      console.log('👤 No user - nothing to sync');
      return;
    }

    try {
      setIsLoading(true);
      setSyncError(null);

      const data = await firebaseService.getProgressDataDual(user.uid);
      setProgressData(data.challengeProgress);
      setUnlockedShapes(data.unlockedShapes);
      setLastSyncTime(new Date());

      console.log('✅ Manual sync completed');
    } catch (error) {
      console.error('❌ Error during manual sync:', error);
      setSyncError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    // State
    progressData,
    unlockedShapes,
    isLoading,
    isSaving,
    lastSyncTime,
    syncError,
    
    // Actions
    updateProgressData,
    updateUnlockedShapes,
    saveProgress,
    getUserStats,
    forceSync,
    
    // Utils
    isAuthenticated: !!user
  };
};
