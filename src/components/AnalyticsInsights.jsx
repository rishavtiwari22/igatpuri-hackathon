// AnalyticsInsights.jsx - Component to show user their analytics insights
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './AnalyticsInsights.css';

const AnalyticsInsights = ({ progressData, user, isOpen, onClose }) => {
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    if (isOpen && progressData) {
      generateInsights();
    }
  }, [isOpen, progressData]);

  const generateInsights = () => {
    const challenges = Object.values(progressData);
    if (challenges.length === 0) {
      setInsights(null);
      return;
    }

    const totalAttempts = challenges.reduce((sum, c) => sum + (c.attempts || 0), 0);
    const averageScore = challenges.reduce((sum, c) => sum + (c.bestScore || 0), 0) / challenges.length;
    const bestScore = Math.max(...challenges.map(c => c.bestScore || 0));
    const completedChallenges = challenges.filter(c => c.completed).length;
    const perfectScores = challenges.filter(c => (c.bestScore || 0) >= 95).length;
    
    // Calculate improvement trends
    const sortedChallenges = challenges.sort((a, b) => 
      new Date(a.firstCompletedAt || 0) - new Date(b.firstCompletedAt || 0)
    );
    
    let improvementTrend = 'stable';
    if (sortedChallenges.length >= 3) {
      const firstHalf = sortedChallenges.slice(0, Math.floor(sortedChallenges.length / 2));
      const secondHalf = sortedChallenges.slice(Math.floor(sortedChallenges.length / 2));
      
      const firstHalfAvg = firstHalf.reduce((sum, c) => sum + (c.bestScore || 0), 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, c) => sum + (c.bestScore || 0), 0) / secondHalf.length;
      
      if (secondHalfAvg > firstHalfAvg + 5) improvementTrend = 'improving';
      else if (secondHalfAvg < firstHalfAvg - 5) improvementTrend = 'declining';
    }

    // Performance categories
    let performanceLevel = 'beginner';
    if (averageScore >= 80) performanceLevel = 'expert';
    else if (averageScore >= 65) performanceLevel = 'advanced';
    else if (averageScore >= 50) performanceLevel = 'intermediate';

    // Generate personalized insights
    const personalizedInsights = [];
    
    if (perfectScores > 0) {
      personalizedInsights.push(`🎯 You've achieved ${perfectScores} near-perfect score${perfectScores > 1 ? 's' : ''}! Your attention to detail is exceptional.`);
    }
    
    if (improvementTrend === 'improving') {
      personalizedInsights.push(`📈 You're on an improvement streak! Your recent challenges show significant progress.`);
    }
    
    if (averageScore >= 70) {
      personalizedInsights.push(`⭐ Your ${averageScore.toFixed(1)}% average score puts you in the top tier of players!`);
    } else if (averageScore >= 50) {
      personalizedInsights.push(`🎨 You're developing strong AI art skills with a solid ${averageScore.toFixed(1)}% average.`);
    }
    
    if (totalAttempts >= 20) {
      personalizedInsights.push(`🔥 You're dedicated! With ${totalAttempts} total attempts, you're really mastering the craft.`);
    }

    const strongestArea = sortedChallenges.reduce((best, current) => 
      (current.bestScore || 0) > (best.bestScore || 0) ? current : best
    );

    setInsights({
      totalAttempts,
      averageScore,
      bestScore,
      completedChallenges,
      perfectScores,
      improvementTrend,
      performanceLevel,
      personalizedInsights,
      strongestArea: strongestArea.challengeName,
      strongestScore: strongestArea.bestScore
    });
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="analytics-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="analytics-modal"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="analytics-header">
          <h2>🎨 Your AI Art Journey</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        {insights ? (
          <div className="analytics-content">
            {/* Performance Overview */}
            <div className="insights-section">
              <h3>📊 Performance Overview</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-number">{insights.completedChallenges}</div>
                  <div className="stat-label">Challenges Completed</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{insights.averageScore.toFixed(1)}%</div>
                  <div className="stat-label">Average Score</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{insights.bestScore.toFixed(1)}%</div>
                  <div className="stat-label">Best Score</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{insights.totalAttempts}</div>
                  <div className="stat-label">Total Attempts</div>
                </div>
              </div>
            </div>

            {/* Performance Level */}
            <div className="insights-section">
              <h3>🏆 Skill Level</h3>
              <div className={`performance-badge ${insights.performanceLevel}`}>
                {insights.performanceLevel.charAt(0).toUpperCase() + insights.performanceLevel.slice(1)}
              </div>
              <div className="trend-indicator">
                {insights.improvementTrend === 'improving' && '📈 Improving'}
                {insights.improvementTrend === 'declining' && '📉 Keep practicing'}
                {insights.improvementTrend === 'stable' && '➡️ Consistent'}
              </div>
            </div>

            {/* Strongest Area */}
            <div className="insights-section">
              <h3>💪 Your Strength</h3>
              <div className="strength-highlight">
                <div className="strength-name">{insights.strongestArea}</div>
                <div className="strength-score">{insights.strongestScore?.toFixed(1)}%</div>
              </div>
            </div>

            {/* Personalized Insights */}
            <div className="insights-section">
              <h3>✨ Personal Insights</h3>
              <div className="insights-list">
                {insights.personalizedInsights.map((insight, index) => (
                  <motion.div
                    key={index}
                    className="insight-item"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {insight}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            {insights.perfectScores > 0 && (
              <div className="insights-section">
                <h3>🎯 Achievements</h3>
                <div className="achievement-badges">
                  {insights.perfectScores > 0 && (
                    <div className="achievement-badge">
                      🎯 Perfectionist ({insights.perfectScores} perfect score{insights.perfectScores > 1 ? 's' : ''})
                    </div>
                  )}
                  {insights.completedChallenges >= 5 && (
                    <div className="achievement-badge">
                      🌟 Dedicated Artist (5+ challenges)
                    </div>
                  )}
                  {insights.averageScore >= 80 && (
                    <div className="achievement-badge">
                      🏆 Master Creator (80%+ average)
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="no-data">
            <div className="no-data-icon">📊</div>
            <h3>No Analytics Yet</h3>
            <p>Complete some challenges to see your personalized insights!</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AnalyticsInsights;
