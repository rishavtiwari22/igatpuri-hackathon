// Login.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const { signInWithGoogle, isSigningIn, signInAsGuest } = useAuth();
  const [error, setError] = useState(null);
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  // Track screen size for responsive design
  useEffect(() => {
    // Add login-page class to body for scrolling
    document.body.classList.add('login-page');
    
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      document.body.classList.remove('login-page');
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Responsive breakpoints
  const isMobile = screenSize.width < 768;
  const isTablet = screenSize.width >= 768 && screenSize.width < 1024;
  const isDesktop = screenSize.width >= 1024;

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setError(null);
      await signInAsGuest();
    } catch (error) {
      console.error('Guest login error:', error);
      setError(error.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      maxHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 25%, #8b5cf6 75%, #ec4899 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Poppins, sans-serif',
      padding: isMobile ? '10px' : isTablet ? '15px' : '20px',
      position: 'relative',
      overflow: isMobile ? 'auto' : 'hidden',
      width: '100%'
    }}>
      {/* Animated Background Elements */}
      {!isMobile && (
        <>
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: isTablet ? '250px' : '300px',
            height: isTablet ? '250px' : '300px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 6s ease-in-out infinite'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '10%',
            right: '10%',
            width: isTablet ? '150px' : '200px',
            height: isTablet ? '150px' : '200px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 8s ease-in-out infinite reverse'
          }} />
        </>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: isMobile ? '16px' : '24px',
          padding: isMobile ? '16px 12px' : isTablet ? '35px 25px' : '40px 30px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          textAlign: 'center',
          width: '100%',
          maxWidth: isMobile ? '100%' : isTablet ? '85%' : '900px',
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          margin: '0 auto',
          maxHeight: isMobile ? 'calc(100vh - 20px)' : 'calc(100vh - 40px)',
          overflowY: isMobile ? 'auto' : 'visible',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Logo/Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          style={{
            fontSize: isMobile ? '2.5rem' : isTablet ? '3rem' : '3.5rem',
            marginBottom: isMobile ? '12px' : isTablet ? '15px' : '18px'
          }}
        >
          🎨
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            color: '#333',
            fontSize: isMobile ? '1.5rem' : isTablet ? '1.8rem' : '2.2rem',
            fontWeight: '700',
            marginBottom: isMobile ? '6px' : '8px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: '1.2'
          }}
        >
          AI Art Challenge
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            color: '#666',
            fontSize: isMobile ? '0.85rem' : isTablet ? '0.9rem' : '1rem',
            marginBottom: isMobile ? '20px' : isTablet ? '25px' : '30px',
            lineHeight: '1.4',
            maxWidth: '100%'
          }}
        >
          Create AI artwork and match target images
        </motion.p>

        {/* Main Content Area - Responsive Layout */}
        <div style={{
          display: isDesktop ? 'flex' : 'block',
          justifyContent: isDesktop ? 'center' : 'normal',
          alignItems: 'start',
          flex: 1,
          width: '100%',
          maxWidth: isDesktop ? '450px' : '100%',
          margin: isDesktop ? '0 auto' : '0'
        }}>
          {/* Sign In Actions - Centered */}
          <div style={{ width: '100%' }}>
            {/* Primary Google Sign In Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              style={{
                background: isSigningIn 
                  ? 'linear-gradient(135deg, #f3f4f6, #d1d5db)' 
                  : 'linear-gradient(135deg, #ffffff, #f8fafc)',
                color: isSigningIn ? '#6b7280' : '#1f2937',
                border: '2px solid #e5e7eb',
                borderRadius: isMobile ? '14px' : '16px',
                padding: isMobile ? '16px 20px' : isTablet ? '17px 22px' : '18px 24px',
                fontSize: isMobile ? '1rem' : isTablet ? '1.05rem' : '1.1rem',
                fontWeight: '600',
                cursor: isSigningIn ? 'not-allowed' : 'pointer',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? '10px' : '12px',
                boxShadow: isSigningIn 
                  ? '0 4px 12px rgba(0, 0, 0, 0.1)' 
                  : '0 8px 25px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                transition: 'all 0.3s ease',
                marginBottom: isMobile ? '16px' : '20px',
                position: 'relative',
                overflow: 'hidden',
                minHeight: isMobile ? '50px' : '56px'
              }}
            >
              {/* Google Logo */}
              {!isSigningIn && (
                <svg width={isMobile ? "18" : "20"} height={isMobile ? "18" : "20"} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              
              {isSigningIn ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{
                      width: isMobile ? '18px' : '20px',
                      height: isMobile ? '18px' : '20px',
                      border: '2px solid transparent',
                      borderTop: '2px solid #6b7280',
                      borderRadius: '50%'
                    }}
                  />
                  <span>Signing you in...</span>
                </>
              ) : (
                <>
                  <span style={{ 
                    fontSize: isMobile ? '1rem' : isTablet ? '1.05rem' : '1.1rem', 
                    fontWeight: '600' 
                  }}>
                    Continue with Google
                  </span>
                </>
              )}
              
              {/* Shine effect - disabled on mobile for performance */}
              {!isSigningIn && !isMobile && (
                <motion.div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                    transform: 'skewX(-15deg)'
                  }}
                  animate={{ left: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
              )}
              
              {/* Subtle pulse effect for prominence */}
              {!isSigningIn && (
                <motion.div
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    left: '-2px',
                    right: '-2px',
                    bottom: '-2px',
                    borderRadius: isMobile ? '16px' : '18px',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    opacity: 0,
                    zIndex: -1
                  }}
                  animate={{ opacity: [0, 0.3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
              )}
            </motion.button>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                margin: isMobile ? '16px 0' : '20px 0',
                gap: '15px'
              }}
            >
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, #e5e7eb, transparent)' }} />
              <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: '500' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, #e5e7eb, transparent)' }} />
            </motion.div>

            {/* Try Demo Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGuestSignIn}
              disabled={isSigningIn}
              style={{
                background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                color: '#475569',
                border: '2px solid #e2e8f0',
                borderRadius: isMobile ? '12px' : '14px',
                padding: isMobile ? '14px 18px' : '16px 20px',
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                fontWeight: '500',
                cursor: isSigningIn ? 'not-allowed' : 'pointer',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                marginBottom: isMobile ? '16px' : '20px',
                minHeight: isMobile ? '46px' : '52px'
              }}
            >
              <span>🎯</span>
              <span>Try Demo</span>
            </motion.button>
            
            {/* Mobile/Tablet - Minimal info if needed */}
            {(isMobile || isTablet) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                style={{
                  marginTop: isMobile ? '16px' : '20px',
                  padding: isMobile ? '8px' : '10px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div style={{ fontSize: '0.7rem', color: '#64748b', textAlign: 'center' }}>
                  Demo: Local storage only
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background: '#fee2e2',
              color: '#dc2626',
              padding: '12px',
              borderRadius: '8px',
              marginTop: '15px',
              fontSize: '0.9rem',
              border: '1px solid #fecaca'
            }}
          >
            ❌ {error}
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          style={{
            marginTop: isMobile ? '16px' : '20px',
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: '#9ca3af',
            borderTop: '1px solid #e5e7eb',
            paddingTop: isMobile ? '10px' : '12px'
          }}
        >
          Secure authentication 🔒
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
