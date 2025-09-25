// App.jsx
import React, { useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import HangingShapes from "./components/HangingShapes";
import Login from "./components/Login";
import FirebaseSetupAlert from "./components/FirebaseSetupAlert";
import { trackPageView } from "./utils/analyticsService";
import "./App.css";

// Main App Content Component
const AppContent = () => {
  const { user, loading } = useAuth();

  // Track page views when component mounts or user changes
  useEffect(() => {
    if (!loading) {
      if (user) {
        trackPageView('main_app', 'AI Art Challenge - Main Game');
      } else {
        trackPageView('login_page', 'AI Art Challenge - Login');
      }
    }
  }, [user, loading]);

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'Poppins, sans-serif'
      }}>
        <div style={{
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid transparent',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>
            Loading AI Art Challenge...
          </div>
        </div>
      </div>
    );
  }

  // Show login if user is not authenticated
  if (!user) {
    return <Login />;
  }

  // Show main app if user is authenticated
  return (
    <div className="app">
      <FirebaseSetupAlert />
      <HangingShapes />
    </div>
  );
};

// Main App Component with Auth Provider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
