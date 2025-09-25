// UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useFirebaseProgress } from '../hooks/useFirebaseProgress';
import './UserProfile.css';

const UserProfile = ({ isOpen, onClose }) => {
  const { user, signOutUser } = useAuth();
  const { getUserStats, lastSyncTime, syncError, forceSync, isSaving } = useFirebaseProgress();
  const [userStats, setUserStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadUserStats();
    }
  }, [isOpen, user]);

  const loadUserStats = async () => {
    try {
      setIsLoadingStats(true);
      
      if (user?.isGuest) {
        const storedProgress = JSON.parse(localStorage.getItem('challengeProgress') || '{}');
        const storedUnlocked = JSON.parse(localStorage.getItem('unlockedShapes') || '[0]');
        
        const stats = {
          totalChallenges: 6,
          completedChallenges: Object.keys(storedProgress).length,
          unlockedChallenges: storedUnlocked.length,
          bestScore: Object.values(storedProgress).reduce((max, challenge) => 
            Math.max(max, challenge.bestScore || 0), 0),
          totalAttempts: Object.values(storedProgress).reduce((sum, challenge) => 
            sum + (challenge.attempts || 0), 0),
          averageScore: Object.values(storedProgress).length > 0 
            ? Object.values(storedProgress).reduce((sum, challenge) => 
                sum + (challenge.bestScore || 0), 0) / Object.values(storedProgress).length 
            : 0,
          firstPlayDate: new Date().toISOString(),
          lastPlayDate: new Date().toISOString(),
          isGuest: true
        };
        
        setUserStats(stats);
        return;
      }
      
      const stats = await getUserStats();
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOutUser();
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleForceSync = async () => {
    try {
      await forceSync();
      await loadUserStats();
    } catch (error) {
      console.error('Error during force sync:', error);
    }
  };

  if (!user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" onClick={onClose}>
          <motion.div
            className="modal-container"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="user-info">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="user-avatar"
                  />
                )}
                <div className="user-details">
                  <h2>{user.displayName || 'Guest User'}</h2>
                  <p>{user.email || 'Demo Mode'}</p>
                </div>
              </div>
              <button className="close-button" onClick={onClose}>
                ✕
              </button>
            </div>

            <div className="modal-content">
              {user.isGuest && (
                <div className="guest-banner">
                  <h3>🎯 Demo Mode</h3>
                  <p>You're playing in demo mode. Sign in with Google to save your progress permanently!</p>
                </div>
              )}

              {!user.isGuest && (
                <div className={`sync-status ${syncError ? 'error' : ''}`}>
                  <div className="sync-status-content">
                    <div className="sync-info">
                      <span>{syncError ? '❌' : isSaving ? '⏳' : '☁️'}</span>
                      <span>
                        {syncError ? 'Sync Error' : 
                         isSaving ? 'Saving...' : 
                         lastSyncTime ? `Last sync: ${lastSyncTime.toLocaleTimeString()}` : 'Ready to sync'}
                      </span>
                    </div>
                    
                    <button
                      className="refresh-button"
                      onClick={handleForceSync}
                      disabled={isSaving}
                    >
                      🔄 Refresh
                    </button>
                  </div>
                  
                  {syncError && (
                    <div className="sync-error">
                      {syncError}
                    </div>
                  )}
                </div>
              )}

              <div className="stats-section">
                <h3 className="stats-title">
                  📊 Your Progress
                </h3>

                {isLoadingStats ? (
                  <div className="loading-spinner">
                    <motion.div
                      className="spinner"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <div>Loading statistics...</div>
                  </div>
                ) : userStats ? (
                  <div className="stats-grid">
                    {[
                      { label: 'Challenges Completed', value: userStats.completedChallenges, icon: '🏆' },
                      { label: 'Total Attempts', value: userStats.totalAttempts, icon: '🎯' },
                      { label: 'Best Score', value: `${userStats.bestScore.toFixed(1)}%`, icon: '⭐' },
                      { label: 'Average Score', value: `${userStats.averageScore.toFixed(1)}%`, icon: '📈' }
                    ].map((stat, index) => (
                      <motion.div
                        key={index}
                        className="stat-card"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <span className="stat-icon">{stat.icon}</span>
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="no-stats">
                    No statistics available yet. Start playing to track your progress!
                  </div>
                )}
              </div>

              {!user.isGuest && (
                <div className="account-section">
                  <h3 className="account-title">
                    👤 Account Details
                  </h3>
                  
                  <div className="account-details">
                    <div className="account-row">
                      <span className="account-label">Member Since</span>
                      <span className="account-value">
                        {userStats?.firstPlayDate ? 
                          new Date(userStats.firstPlayDate).toLocaleDateString() : 
                          'Today'
                        }
                      </span>
                    </div>
                    <div className="account-row">
                      <span className="account-label">Last Active</span>
                      <span className="account-value">
                        {userStats?.lastPlayDate ? 
                          new Date(userStats.lastPlayDate).toLocaleDateString() : 
                          'Today'
                        }
                      </span>
                    </div>
                    <div className="account-row">
                      <span className="account-label">Account Type</span>
                      <span className="account-value">Google Account</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="action-buttons">
                {user.isGuest ? (
                  <button className="action-button" onClick={onClose}>
                    <span>🎮</span>
                    <span>Continue Playing</span>
                  </button>
                ) : (
                  <button
                    className="action-button danger"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                  >
                    {isSigningOut ? (
                      <>
                        <motion.div
                          className="spinner"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <span>Signing out...</span>
                      </>
                    ) : (
                      <>
                        <span>🚪</span>
                        <span>Sign Out</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UserProfile;
