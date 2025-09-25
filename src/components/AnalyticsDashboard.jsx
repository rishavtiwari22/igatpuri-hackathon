// AnalyticsDashboard.jsx - Simple analytics viewer for debugging
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { analytics } from '../firebase';
import { 
  logEvent, 
  getAnalytics 
} from 'firebase/analytics';

const AnalyticsDashboard = ({ isOpen, onClose }) => {
  const [isAnalyticsEnabled, setIsAnalyticsEnabled] = useState(false);
  const [recentEvents, setRecentEvents] = useState([]);

  useEffect(() => {
    // Check if analytics is available
    setIsAnalyticsEnabled(analytics !== null && analytics !== undefined);
    
    // Load recent events from localStorage (for demo purposes)
    try {
      const stored = localStorage.getItem('recentAnalyticsEvents');
      if (stored) {
        setRecentEvents(JSON.parse(stored).slice(-10)); // Last 10 events
      }
    } catch (error) {
      console.warn('Error loading recent events:', error);
    }
  }, []);

  const handleTestEvent = () => {
    if (!analytics) return;
    
    try {
      logEvent(analytics, 'test_event', {
        test_parameter: 'dashboard_test',
        timestamp: new Date().toISOString()
      });
      
      // Add to recent events for display
      const newEvent = {
        name: 'test_event',
        parameters: { test_parameter: 'dashboard_test' },
        timestamp: new Date().toISOString()
      };
      
      setRecentEvents(prev => [...prev.slice(-9), newEvent]);
      
      // Store in localStorage
      try {
        const allEvents = [...recentEvents, newEvent];
        localStorage.setItem('recentAnalyticsEvents', JSON.stringify(allEvents));
      } catch (error) {
        console.warn('Error storing events:', error);
      }
      
      console.log('📊 Test event sent to Firebase Analytics');
    } catch (error) {
      console.error('Analytics test event failed:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '600px',
          maxHeight: '80vh',
          width: '100%',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '1.5rem', 
            fontWeight: '700',
            color: '#1f2937'
          }}>
            📊 Analytics Dashboard
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Analytics Status */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: '#374151'
          }}>
            Status
          </h3>
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: isAnalyticsEnabled ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${isAnalyticsEnabled ? '#d1fae5' : '#fecaca'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '1.2rem' }}>
              {isAnalyticsEnabled ? '✅' : '❌'}
            </span>
            <span style={{ 
              color: isAnalyticsEnabled ? '#065f46' : '#991b1b',
              fontWeight: '600'
            }}>
              Firebase Analytics is {isAnalyticsEnabled ? 'enabled' : 'disabled'}
            </span>
          </div>
        </div>

        {/* Test Button */}
        {isAnalyticsEnabled && (
          <div style={{ marginBottom: '24px' }}>
            <button
              onClick={handleTestEvent}
              style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              Send Test Event
            </button>
          </div>
        )}

        {/* Analytics Features */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: '#374151'
          }}>
            Tracked Events
          </h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            {[
              { name: 'User Authentication', events: 'login, logout, user_properties' },
              { name: 'Image Generation', events: 'image_generated, model_selection' },
              { name: 'Game Progress', events: 'image_compared, game_progress, game_completion' },
              { name: 'UI Interactions', events: 'button_click, shape_selection, page_view' },
              { name: 'Errors & Performance', events: 'error_occurred, engagement_tracking' }
            ].map((category, index) => (
              <div
                key={index}
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}
              >
                <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#374151' }}>
                  {category.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>
                  {category.events}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Events */}
        <div>
          <h3 style={{ 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: '#374151'
          }}>
            Recent Events (Local Log)
          </h3>
          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            {recentEvents.length > 0 ? (
              recentEvents.slice(-5).reverse().map((event, index) => (
                <div
                  key={index}
                  style={{
                    padding: '8px 12px',
                    borderBottom: index < recentEvents.length - 1 ? '1px solid #e5e7eb' : 'none',
                    fontSize: '0.8rem'
                  }}
                >
                  <div style={{ fontWeight: '600', color: '#374151' }}>
                    {event.name}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ 
                padding: '20px', 
                textAlign: 'center', 
                color: '#6b7280',
                fontSize: '0.9rem'
              }}>
                No recent events available
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#fffbeb',
          borderRadius: '8px',
          border: '1px solid #fed7aa'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#92400e' }}>
            <strong>View Analytics:</strong> Visit the Firebase Console → Analytics → Events to see real-time data and user behavior insights.
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AnalyticsDashboard;
