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

// Enhanced user properties tracking
export const setEnhancedUserProperties = (user, additionalProps = {}) => {
  if (!isAnalyticsAvailable() || !user) return;
  
  try {
    setUserId(analytics, user.uid);
    
    // Set comprehensive user properties
    const userProperties = {
      user_type: 'registered',
      account_creation_date: user.metadata?.creationTime ? 
        new Date(user.metadata.creationTime).toISOString().split('T')[0] : null,
      last_login_date: user.metadata?.lastSignInTime ? 
        new Date(user.metadata.lastSignInTime).toISOString().split('T')[0] : null,
      provider: user.providerData[0]?.providerId || 'unknown',
      email_verified: user.emailVerified,
      has_display_name: !!user.displayName,
      has_photo_url: !!user.photoURL,
      user_domain: user.email ? user.email.split('@')[1] : null,
      session_start_time: new Date().toISOString(),
      ...additionalProps
    };
    
    setUserProperties(analytics, userProperties);
    console.log(`📊 Analytics: Enhanced user properties set for ${user.email}`);
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

// Track user journey milestones
export const trackUserMilestone = (milestone, metadata = {}) => {
  if (!isAnalyticsAvailable()) return;
  
  try {
    logEvent(analytics, 'user_milestone', {
      milestone_type: milestone,
      timestamp: new Date().toISOString(),
      ...metadata
    });
    console.log(`📊 Analytics: User milestone tracked - ${milestone}`);
  } catch (error) {
    console.warn('Analytics tracking error:', error);
  }
};

// Track feature usage
export const trackFeatureUsage = (featureName, action, metadata = {}) => {
  if (!isAnalyticsAvailable()) return;
  
  try {
    logEvent(analytics, 'feature_usage', {
      feature_name: featureName,
      action: action,
      timestamp: new Date().toISOString(),
      ...metadata
    });
    console.log(`📊 Analytics: Feature usage tracked - ${featureName}: ${action}`);
  } catch (error) {
    console.warn('Analytics tracking error:', error);
  }
};

// Track user session quality
export const trackSessionQuality = (sessionData) => {
  if (!isAnalyticsAvailable()) return;
  
  try {
    logEvent(analytics, 'session_quality', {
      session_duration: sessionData.duration || 0,
      pages_visited: sessionData.pagesVisited || 1,
      actions_performed: sessionData.actionsPerformed || 0,
      errors_encountered: sessionData.errorsEncountered || 0,
      completion_rate: sessionData.completionRate || 0,
      timestamp: new Date().toISOString()
    });
    console.log('📊 Analytics: Session quality tracked');
  } catch (error) {
    console.warn('Analytics tracking error:', error);
  }
};

// Track AI model performance
export const trackModelPerformance = (modelName, performanceData) => {
  if (!isAnalyticsAvailable()) return;
  
  try {
    logEvent(analytics, 'ai_model_performance', {
      model_name: modelName,
      response_time: performanceData.responseTime || 0,
      success_rate: performanceData.successRate || 0,
      quality_score: performanceData.qualityScore || 0,
      user_satisfaction: performanceData.userSatisfaction || 0,
      timestamp: new Date().toISOString()
    });
    console.log(`📊 Analytics: Model performance tracked - ${modelName}`);
  } catch (error) {
    console.warn('Analytics tracking error:', error);
  }
};

// Track user preferences
export const trackUserPreferences = (preferences) => {
  if (!isAnalyticsAvailable()) return;
  
  try {
    logEvent(analytics, 'user_preferences', {
      ...preferences,
      timestamp: new Date().toISOString()
    });
    console.log('📊 Analytics: User preferences tracked');
  } catch (error) {
    console.warn('Analytics tracking error:', error);
  }
};

// Track conversion events
export const trackConversion = (conversionType, value = 0, metadata = {}) => {
  if (!isAnalyticsAvailable()) return;
  
  try {
    logEvent(analytics, 'conversion', {
      conversion_type: conversionType,
      value: value,
      currency: 'USD',
      timestamp: new Date().toISOString(),
      ...metadata
    });
    console.log(`📊 Analytics: Conversion tracked - ${conversionType}`);
  } catch (error) {
    console.warn('Analytics tracking error:', error);
  }
};

export default {
  trackPageView,
  trackUserLogin,
  trackUserLogout,
  setAnalyticsUser,
  setEnhancedUserProperties,
  trackImageGeneration,
  trackImageComparison,
  trackGameProgress,
  trackGameCompletion,
  trackButtonClick,
  trackError,
  trackCustomEvent,
  trackEngagement,
  trackUserMilestone,
  trackFeatureUsage,
  trackSessionQuality,
  trackModelPerformance,
  trackUserPreferences,
  trackConversion
};
