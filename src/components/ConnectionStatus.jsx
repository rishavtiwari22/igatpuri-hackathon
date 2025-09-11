// ConnectionStatus.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ConnectionStatus = ({ user, syncError, isProgressSaving }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTip, setShowTip] = useState(false);

  // Show tip for new users with sync errors
  useEffect(() => {
    if (syncError && !user?.isGuest) {
      const hasSeenTip = sessionStorage.getItem('firebaseTipShown');
      if (!hasSeenTip) {
        setShowTip(true);
        sessionStorage.setItem('firebaseTipShown', 'true');
      }
    }
  }, [syncError, user]);

  const getStatusInfo = () => {
    if (user?.isGuest) {
      return {
        icon: '🎯',
        status: 'Demo Mode',
        color: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        description: 'Using local storage only'
      };
    }

    if (syncError) {
      return {
        icon: '🔌',
        status: 'Offline Mode',
        color: 'linear-gradient(135deg, #f59e0b, #d97706)',
        description: 'Data saved locally, will sync when connection restored'
      };
    }

    if (isProgressSaving) {
      return {
        icon: '⏳',
        status: 'Syncing...',
        color: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        description: 'Saving to cloud'
      };
    }

    return {
      icon: '✅',
      status: 'Connected',
      color: 'linear-gradient(135deg, #10b981, #059669)',
      description: 'Cloud sync active'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <>
      {/* Main status indicator */}
      <motion.div
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          background: statusInfo.color,
          color: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '600',
          fontFamily: 'Poppins, sans-serif',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          minWidth: '140px',
          cursor: 'pointer'
        }}
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.02 }}
      >
        <motion.span
          animate={isProgressSaving ? { rotate: 360 } : {}}
          transition={{ duration: 1, repeat: isProgressSaving ? Infinity : 0, ease: "linear" }}
        >
          {statusInfo.icon}
        </motion.span>
        <span>{statusInfo.status}</span>
        {user?.email && (
          <span style={{ fontSize: '10px', opacity: 0.8 }}>
            ({user.email.split('@')[0]})
          </span>
        )}
      </motion.div>

      {/* Expanded status details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            style={{
              position: 'fixed',
              top: '60px',
              left: '20px',
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#1e293b',
              padding: '16px',
              borderRadius: '12px',
              fontSize: '13px',
              fontFamily: 'Poppins, sans-serif',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
              zIndex: 999,
              minWidth: '280px',
              border: '1px solid rgba(0,0,0,0.1)'
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{ fontWeight: '600', marginBottom: '8px' }}>
              {statusInfo.status}
            </div>
            <div style={{ marginBottom: '12px', color: '#64748b' }}>
              {statusInfo.description}
            </div>
            
            {syncError && !user?.isGuest && (
              <div style={{ 
                padding: '8px', 
                background: '#fef3c7', 
                borderRadius: '6px',
                border: '1px solid #f59e0b',
                fontSize: '12px',
                marginBottom: '8px'
              }}>
                <div style={{ fontWeight: '600', color: '#92400e' }}>Connection Issue</div>
                <div style={{ color: '#92400e', marginTop: '4px' }}>
                  Firebase connection failed. Your progress is saved locally and will sync when reconnected.
                </div>
              </div>
            )}

            <div style={{ fontSize: '11px', color: '#9ca3af' }}>
              {user?.isGuest 
                ? 'Sign in with Google to enable cloud sync'
                : syncError 
                  ? 'All features work normally. Data syncs when online.'
                  : 'All features active with cloud backup'
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Firebase setup tip */}
      <AnimatePresence>
        {showTip && syncError && !user?.isGuest && (
          <motion.div
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white',
              padding: '16px',
              borderRadius: '12px',
              fontSize: '13px',
              fontFamily: 'Poppins, sans-serif',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
              zIndex: 998,
              maxWidth: '320px'
            }}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                  🔧 Firebase Setup Needed
                </div>
                <div style={{ fontSize: '12px', lineHeight: '1.4', marginBottom: '8px' }}>
                  To enable cloud sync, please:
                  <br />• Enable Firestore in Firebase Console
                  <br />• Set security rules for your project
                  <br />• Check FIREBASE_TROUBLESHOOTING.md
                </div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>
                  App works perfectly in offline mode!
                </div>
              </div>
              <button
                onClick={() => setShowTip(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  marginLeft: '8px'
                }}
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ConnectionStatus;
