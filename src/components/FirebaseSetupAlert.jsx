// FirebaseSetupAlert.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FirebaseSetupAlert = () => {
  const [showAlert, setShowAlert] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Listen for Firebase setup errors
    const checkForFirebaseErrors = () => {
      const hasFirestoreErrors = window.console && 
        performance.getEntriesByType('navigation').some(entry => 
          entry.name.includes('firestore') && entry.responseStatus === 400
        );
      
      if (hasFirestoreErrors && !hasShown) {
        setShowAlert(true);
        setHasShown(true);
      }
    };

    // Check immediately and then periodically
    checkForFirebaseErrors();
    const interval = setInterval(checkForFirebaseErrors, 5000);
    
    return () => clearInterval(interval);
  }, [hasShown]);

  const handleSetupClick = () => {
    window.open('https://console.firebase.google.com/project/img-prompt-project', '_blank');
    setShowAlert(false);
  };

  const handleDismiss = () => {
    setShowAlert(false);
  };

  return (
    <AnimatePresence>
      {showAlert && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: 'white',
            padding: '20px 24px',
            borderRadius: '12px',
            fontFamily: 'Poppins, sans-serif',
            boxShadow: '0 8px 25px rgba(239, 68, 68, 0.4)',
            zIndex: 10000,
            maxWidth: '90vw',
            textAlign: 'center',
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
            🚨 Database Setup Required
          </div>
          <div style={{ fontSize: '14px', opacity: '0.9', marginBottom: '16px' }}>
            Firestore database needs to be enabled in Firebase Console
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={handleSetupClick}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
            >
              🔧 Setup Now
            </button>
            <button
              onClick={handleDismiss}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseOut={(e) => e.target.style.background = 'transparent'}
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FirebaseSetupAlert;
