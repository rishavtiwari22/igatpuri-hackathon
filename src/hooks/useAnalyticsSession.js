// useAnalyticsSession.js - Hook for tracking comprehensive session analytics
import { useEffect, useRef, useState } from 'react';
import { trackSessionQuality, trackEngagement } from '../utils/analyticsService';

export const useAnalyticsSession = (user, progressData) => {
  const sessionRef = useRef({
    startTime: Date.now(),
    pagesVisited: 1,
    actionsPerformed: 0,
    errorsEncountered: 0,
    challengesAttempted: 0,
    challengesCompleted: 0,
    totalScore: 0,
    timeSpentPerChallenge: {},
    lastActivityTime: Date.now()
  });
  
  const [sessionData, setSessionData] = useState(sessionRef.current);

  // Track user activity for engagement
  const trackActivity = (activity, metadata = {}) => {
    const now = Date.now();
    sessionRef.current.actionsPerformed += 1;
    sessionRef.current.lastActivityTime = now;
    
    // Track specific activities
    if (activity === 'challenge_attempted') {
      sessionRef.current.challengesAttempted += 1;
    } else if (activity === 'challenge_completed') {
      sessionRef.current.challengesCompleted += 1;
      if (metadata.score) {
        sessionRef.current.totalScore += metadata.score;
      }
    } else if (activity === 'error_encountered') {
      sessionRef.current.errorsEncountered += 1;
    }
    
    setSessionData({...sessionRef.current});
  };

  // Track time spent on challenges
  const trackChallengeTime = (challengeName, timeSpent) => {
    sessionRef.current.timeSpentPerChallenge[challengeName] = timeSpent;
    setSessionData({...sessionRef.current});
  };

  // Calculate session quality metrics
  const calculateSessionQuality = () => {
    const sessionDuration = (Date.now() - sessionRef.current.startTime) / 1000;
    const completionRate = sessionRef.current.challengesAttempted > 0 
      ? sessionRef.current.challengesCompleted / sessionRef.current.challengesAttempted 
      : 0;
    const averageScore = sessionRef.current.challengesCompleted > 0 
      ? sessionRef.current.totalScore / sessionRef.current.challengesCompleted 
      : 0;
    const engagementScore = Math.min(sessionRef.current.actionsPerformed / sessionDuration * 60, 100); // actions per minute, capped at 100

    return {
      duration: sessionDuration,
      pagesVisited: sessionRef.current.pagesVisited,
      actionsPerformed: sessionRef.current.actionsPerformed,
      errorsEncountered: sessionRef.current.errorsEncountered,
      completionRate: completionRate * 100,
      averageScore,
      engagementScore,
      challengesAttempted: sessionRef.current.challengesAttempted,
      challengesCompleted: sessionRef.current.challengesCompleted
    };
  };

  // Send session quality data on unmount or periodically
  const sendSessionData = () => {
    const quality = calculateSessionQuality();
    trackSessionQuality(quality);
    
    // Track engagement level
    if (quality.duration > 60) { // Only track if session is longer than 1 minute
      let engagementLevel = 'low';
      if (quality.engagementScore > 30) engagementLevel = 'medium';
      if (quality.engagementScore > 60) engagementLevel = 'high';
      
      trackEngagement(engagementLevel, quality.duration);
    }
  };

  // Periodic session tracking (every 2 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      sendSessionData();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, []);

  // Track session end on component unmount
  useEffect(() => {
    return () => {
      sendSessionData();
    };
  }, []);

  // Update progress data metrics when progressData changes
  useEffect(() => {
    if (progressData) {
      const completed = Object.values(progressData).filter(p => p.completed).length;
      const totalScore = Object.values(progressData).reduce((sum, p) => sum + (p.bestScore || 0), 0);
      
      sessionRef.current.challengesCompleted = completed;
      sessionRef.current.totalScore = totalScore;
      setSessionData({...sessionRef.current});
    }
  }, [progressData]);

  return {
    trackActivity,
    trackChallengeTime,
    sessionData,
    sendSessionData,
    calculateSessionQuality
  };
};

export default useAnalyticsSession;
