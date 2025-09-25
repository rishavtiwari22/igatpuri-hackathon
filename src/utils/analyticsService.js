// analyticsService.js
import { analytics } from '../firebase';
import { 
  logEvent, 
  setUserId, 
  setUserProperties,
  setCurrentScreen 
} from 'firebase/analytics';

// Check if analytics is available
const isAnalyticsAvailable = () => {
  return analytics !== null && analytics !== undefined;
};

// Track page views
export const trackPageView = (pageName, pageTitle = null) => {
  if (!isAnalyticsAvailable()) return;
  
  try {
    setCurrentScreen(analytics, pageName);
    logEvent(analytics, 'page_view', {
      page_title: pageTitle || pageName,
      page_location: window.location.href,
      page_path: window.location.pathname
    });
    console.log(`📊 Analytics: Page view tracked - ${pageName}`);
  } catch (error) {
    console.warn('Analytics tracking error:', error);
  }
};

// Track user login
export const trackUserLogin = (method = 'google') => {
  if (!isAnalyticsAvailable()) return;
  
  try {
    logEvent(analytics, 'login', { method });
    console.log(`📊 Analytics: User login tracked - ${method}`);
  } catch (error) {
    console.warn('Analytics tracking error:', error);
  }
};

// Track user logout
export const trackUserLogout = () => {
  if (!isAnalyticsAvailable()) return;
  
  try {
    logEvent(analytics, 'logout');
    console.log('📊 Analytics: User logout tracked');
  } catch (error) {
    console.warn('Analytics tracking error:', error);
  }
};

// Set user properties for analytics
export const setAnalyticsUser = (userId, properties = {}) => {
  if (!isAnalyticsAvailable()) return;
  
  try {
    setUserId(analytics, userId);
    setUserProperties(analytics, {
      user_type: 'registered',
      ...properties
    });
    console.log(`📊 Analytics: User properties set for ${userId}`);
  } catch (error) {
    console.warn('Analytics tracking error:', error);
  }
};

// Track image generation events
export const trackImageGeneration = (prompt, model = 'unknown') => {
  if (!isAnalyticsAvailable()) return;
  
  try {
    logEvent(analytics, 'image_generated', {
      prompt_length: prompt?.length || 0,
      model_used: model,
      timestamp: new Date().toISOString()
    });
    console.log('📊 Analytics: Image generation tracked');
  } catch (error) {
    console.warn('Analytics tracking error:', error);
  }
};

// Track image comparison events
export const trackImageComparison = (score, attempts = 1) => {
  if (!isAnalyticsAvailable()) return;
  
  try {
    logEvent(analytics, 'image_compared', {
      similarity_score: score,
      attempt_number: attempts,
      timestamp: new Date().toISOString()
    });
    console.log(`📊 Analytics: Image comparison tracked - Score: ${score}`);
  } catch (error) {
    console.warn('Analytics tracking error:', error);
  }
};

// Track game progress
export const trackGameProgress = (level, score, timeSpent = 0) => {
  if (!isAnalyticsAvailable()) return;
  
  try {
    logEvent(analytics, 'game_progress', {
      level: level,
      score: score,
      time_spent_seconds: timeSpent,
      timestamp: new Date().toISOString()
    });
    console.log(`📊 Analytics: Game progress tracked - Level: ${level}, Score: ${score}`);
  } catch (error) {
    console.warn('Analytics tracking error:', error);
  }
};

// Track game completion
export const trackGameCompletion = (finalScore, totalTime, levelsCompleted) => {
  if (!isAnalyticsAvailable()) return;
  
  try {
    logEvent(analytics, 'game_completed', {
      final_score: finalScore,
      total_time_seconds: totalTime,
      levels_completed: levelsCompleted,
      timestamp: new Date().toISOString()
    });
    console.log(`📊 Analytics: Game completion tracked - Final Score: ${finalScore}`);
  } catch (error) {
    console.warn('Analytics tracking error:', error);
  }
};

// Track button clicks and interactions
export const trackButtonClick = (buttonName, context = '') => {
  if (!isAnalyticsAvailable()) return;
  
  try {
    logEvent(analytics, 'button_click', {
      button_name: buttonName,
      context: context,
      timestamp: new Date().toISOString()
    });
    console.log(`📊 Analytics: Button click tracked - ${buttonName}`);
  } catch (error) {
    console.warn('Analytics tracking error:', error);
  }
};

// Track errors
export const trackError = (errorMessage, errorContext = '') => {
  if (!isAnalyticsAvailable()) return;
  
  try {
    logEvent(analytics, 'error_occurred', {
      error_message: errorMessage,
      error_context: errorContext,
      timestamp: new Date().toISOString()
    });
    console.log(`📊 Analytics: Error tracked - ${errorMessage}`);
  } catch (error) {
    console.warn('Analytics tracking error:', error);
  }
};

// Track custom events
export const trackCustomEvent = (eventName, parameters = {}) => {
  if (!isAnalyticsAvailable()) return;
  
  try {
    logEvent(analytics, eventName, {
      ...parameters,
      timestamp: new Date().toISOString()
    });
    console.log(`📊 Analytics: Custom event tracked - ${eventName}`);
  } catch (error) {
    console.warn('Analytics tracking error:', error);
  }
};

// Track app engagement
export const trackEngagement = (action, duration = 0) => {
  if (!isAnalyticsAvailable()) return;
  
  try {
    logEvent(analytics, 'user_engagement', {
      engagement_action: action,
      duration_seconds: duration,
      timestamp: new Date().toISOString()
    });
    console.log(`📊 Analytics: Engagement tracked - ${action}`);
  } catch (error) {
    console.warn('Analytics tracking error:', error);
  }
};

export default {
  trackPageView,
  trackUserLogin,
  trackUserLogout,
  setAnalyticsUser,
  trackImageGeneration,
  trackImageComparison,
  trackGameProgress,
  trackGameCompletion,
  trackButtonClick,
  trackError,
  trackCustomEvent,
  trackEngagement
};
