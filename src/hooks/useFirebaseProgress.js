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

  const normalizeUnlocked = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.map((v) => {
      const n = Number(v);
      return Number.isNaN(n) ? null : n;
    }).filter((v) => v !== null);
  };

  // Load initial unlockedShapes from firebase or localStorage
  useEffect(() => {
    let mounted = true;

    const loadInitial = async () => {
      try {
        const remote = await firebaseService.getProgress(user?.uid);
        if (!mounted) return;
        if (remote && remote.unlockedShapes) {
          const normalized = normalizeUnlocked(remote.unlockedShapes);
          setUnlockedShapes(normalized);
        } else {
          const raw = localStorage.getItem('progress_unlockedShapes');
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              const normalized = normalizeUnlocked(parsed);
              setUnlockedShapes(normalized.length > 0 ? normalized : [0]); // Ensure first challenge is unlocked
            } catch (e) {
              setUnlockedShapes([0]); // Always ensure first challenge is unlocked
            }
          } else {
            setUnlockedShapes([0]); // Always ensure first challenge is unlocked
          }
        }
      } catch (e) {
        setUnlockedShapes([0]); // Always ensure first challenge is unlocked
      }
    };

    loadInitial();

    return () => { mounted = false; };
  }, [user]);

  // Load progress data when user changes
  useEffect(() => {
    let unsubscribe = null;

    const loadUserProgress = async () => {
      if (!user) {
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
          const storedProgress = JSON.parse(localStorage.getItem('challengeProgress') || '{}');
          const storedUnlocked = JSON.parse(localStorage.getItem('unlockedShapes') || '[0]');
          
          // Normalize unlocked indices to numbers
          const normalizedUnlocked = normalizeUnlocked(storedUnlocked);
          
          setProgressData(storedProgress);
          setUnlockedShapes(normalizedUnlocked);
          setLastSyncTime(new Date());
          setIsLoading(false);
          
          return;
        }

        // Check for localStorage data to migrate
        const migrated = await firebaseService.migrateLocalStorageToFirebase(user.uid);

        // Get progress data using dual database approach
        const data = await firebaseService.getProgressDataDual(user.uid);
        
        setProgressData(data.challengeProgress);
        // Normalize unlocked indices to numbers
        setUnlockedShapes(normalizeUnlocked(data.unlockedShapes));
        setLastSyncTime(new Date());

        // Set up real-time listener
        unsubscribe = firebaseService.subscribeToProgressData(user.uid, (updatedData) => {
          setProgressData(updatedData.challengeProgress);
          setUnlockedShapes(normalizeUnlocked(updatedData.unlockedShapes));
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
            setUnlockedShapes(localUnlockedShapes ? normalizeUnlocked(JSON.parse(localUnlockedShapes)) : [0]);
            setProgressData(localChallengeProgress ? JSON.parse(localChallengeProgress) : {});
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
      localStorage.setItem('challengeProgress', JSON.stringify(newProgressData));
      localStorage.setItem('unlockedShapes', JSON.stringify(newUnlockedShapes));
      return;
    }

    try {
      setIsSaving(true);
      setSyncError(null);

      await firebaseService.saveProgressDataDual(user.uid, newProgressData, newUnlockedShapes);
      
      setLastSyncTime(new Date());

    } catch (error) {
      console.error('❌ Error saving progress to Firebase:', error);
      setSyncError(error.message);
      
      // Fallback to localStorage
      try {
        localStorage.setItem('challengeProgress', JSON.stringify(newProgressData));
        localStorage.setItem('unlockedShapes', JSON.stringify(newUnlockedShapes));
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
  const updateUnlockedShapes = async (updater) => {
    try {
      let next = null;
      if (typeof updater === 'function') {
        next = updater((Array.isArray(unlockedShapes) ? unlockedShapes : []).slice());
      } else {
        next = updater;
      }
      const normalized = normalizeUnlocked(next || []);
      setUnlockedShapes(normalized);

      // Persist to firebase if user exists, otherwise localStorage
      if (user && user.uid) {
        await firebaseService.saveProgressDataDual(user.uid, progressData, normalized);
      } else {
        try { localStorage.setItem('progress_unlockedShapes', JSON.stringify(normalized)); } catch (e) { }
      }
    } catch (e) {
      console.error('Failed to update unlocked shapes', e);
    }
  };

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
      return;
    }

    try {
      setIsLoading(true);
      setSyncError(null);

      const data = await firebaseService.getProgressDataDual(user.uid);
      setProgressData(data.challengeProgress);
      setUnlockedShapes(normalizeUnlocked(data.unlockedShapes));
      setLastSyncTime(new Date());
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
