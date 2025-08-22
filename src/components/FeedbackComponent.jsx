// Feedback Component for comparison results - Memoized and moved outside to prevent re-creation
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProgressTracker from "./ProgressTracker";

// Helper functions
const getQualityDescription = (percentage) => {
  if (percentage >= 80) return { emoji: "🎯", text: "Excellent", color: "#16a34a" };
  if (percentage >= 60) return { emoji: "👍", text: "Good", color: "#65a30d" };
  if (percentage >= 40) return { emoji: "🤔", text: "Fair", color: "#ca8a04" };
  if (percentage >= 20) return { emoji: "👎", text: "Poor", color: "#ea580c" };
  return { emoji: "❌", text: "Very Poor", color: "#dc2626" };
};

const formatDetailedScores = (scores) => {
  return {
    "Structural": `${(scores["structural"] * 100).toFixed(1)}%`,
    "Edges": `${(scores["edges"] * 100).toFixed(1)}%`,
    "Colors": `${(scores["colors"] * 100).toFixed(1)}%`,
    "HOG Features": `${(scores["hog_features"] * 100).toFixed(1)}%`,
    "Histogram": `${(scores["histogram"] * 100).toFixed(1)}%`,
    "HSV Similarity": `${(scores["hsv_similarity"] * 100).toFixed(1)}%`
  };
};

const FeedbackComponent = React.memo(({ selectedImage, comparisonResult, isComparing }) => {
  // Calculate progress percentages for horizontal bars
  const targetReadiness = selectedImage ? 100 : 0;
  
  // Convert the combined score to percentage (0.5624 -> 56.24%)
  const matchLevel = comparisonResult && comparisonResult.result ? 
    Math.round(comparisonResult.result["combined"] * 100) : 0;

  if (isComparing) {
    return (
      <motion.div 
        className="comparison-loading"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          height: '100%'
        }}
      >
        {/* Horizontal Progress Bars */}
        <div className="progress-bars-container">
          <div className="progress-bar-row">
            <span className="progress-bar-label">Target:</span>
            <div className="horizontal-progress-bar">
              <motion.div 
                className="horizontal-progress-fill target-progress"
                initial={{ width: 0 }}
                animate={{ width: `${targetReadiness}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="progress-percentage">{targetReadiness}%</span>
          </div>
          <div className="progress-bar-row">
            <span className="progress-bar-label">Match:</span>
            <div className="horizontal-progress-bar">
              <motion.div 
                className="horizontal-progress-fill match-progress"
                initial={{ width: 0 }}
                animate={{ width: "0%" }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="progress-percentage">...</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            style={{ fontSize: '2rem', marginBottom: '8px' }}
          >
            🔍
          </motion.div>
          <motion.p
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ fontSize: '0.9rem', fontWeight: '500', margin: 0 }}
          >
            Analyzing similarity...
          </motion.p>
        </div>
      </motion.div>
    );
  }

  if (comparisonResult && comparisonResult.result && !comparisonResult.error) {
    const quality = getQualityDescription(matchLevel);
    const detailedScores = formatDetailedScores(comparisonResult.result);
    
    return (
      <motion.div 
        className="comparison-result-compact"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Horizontal Progress Bars */}
        <motion.div 
          className="progress-bars-container"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="progress-bar-row">
            <span className="progress-bar-label">Target:</span>
            <div className="horizontal-progress-bar">
              <motion.div 
                className="horizontal-progress-fill target-progress"
                initial={{ width: 0 }}
                animate={{ width: `${targetReadiness}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
            <span className="progress-percentage">{targetReadiness}%</span>
          </div>
          <div className="progress-bar-row">
            <span className="progress-bar-label">Match:</span>
            <div className="horizontal-progress-bar">
              <motion.div 
                className="horizontal-progress-fill match-progress"
                initial={{ width: 0 }}
                animate={{ width: `${matchLevel}%` }}
                transition={{ duration: 1.2, delay: 0.5 }}
              />
            </div>
            <span className="progress-percentage">{matchLevel}%</span>
          </div>
        </motion.div>

        {/* Compact result display */}
        <motion.div 
          className="comparison-header"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <motion.span
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
              style={{ fontSize: '1.5rem' }}
            >
              {quality.emoji}
            </motion.span>
            <motion.span
              className="comparison-main-score"
              style={{ color: quality.color }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              {matchLevel}%
            </motion.span>
          </div>
          <motion.div
            className="comparison-quality-badge"
            style={{ backgroundColor: quality.color }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: "spring" }}
          >
            {quality.text}
          </motion.div>
        </motion.div>

        {/* Enhanced detailed scores display */}
        {Object.keys(detailedScores).length > 0 && (
          <motion.div
            className="detailed-scores-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {Object.entries(detailedScores).map(([label, score], index) => (
              <motion.div 
                key={label} 
                className="score-item-compact"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                <div className="score-label">{label}</div>
                <div className="score-value" style={{ 
                  color: parseInt(score) >= 70 ? '#16a34a' : 
                         parseInt(score) >= 50 ? '#ca8a04' : '#dc2626' 
                }}>
                  {score}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
        
        {/* Analysis insights */}
        <motion.div
          className="analysis-insights"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          <div className="insight-row">
            <span>
              Structure: {parseInt(detailedScores["Structural"])}% | 
              Edges: {parseInt(detailedScores["Edges"])}% | 
              Colors: {parseInt(detailedScores["Colors"])}%
            </span>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (comparisonResult && comparisonResult.error) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#ef4444',
          textAlign: 'center'
        }}
      >
        <motion.div 
          style={{ fontSize: '2rem', marginBottom: '8px' }}
          animate={{ 
            rotate: [0, -10, 10, -5, 5, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3
          }}
        >
          ⚠️
        </motion.div>
        <motion.p 
          style={{ fontSize: '0.9rem', marginBottom: '4px', fontWeight: '600', margin: 0 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Analysis Error
        </motion.p>
        <motion.p 
          style={{ 
            fontSize: '0.75rem', 
            color: '#666', 
            lineHeight: '1.3',
            margin: 0
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {comparisonResult.error}
        </motion.p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="feedback-ready"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Progress bars for ready state */}
      <motion.div 
        className="progress-bars-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="progress-bar-row">
          <span className="progress-bar-label">Target:</span>
          <div className="horizontal-progress-bar">
            <motion.div 
              className="horizontal-progress-fill target-progress"
              initial={{ width: 0 }}
              animate={{ width: `${targetReadiness}%` }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
          </div>
          <span className="progress-percentage">{targetReadiness}%</span>
        </div>
        <div className="progress-bar-row">
          <span className="progress-bar-label">Match:</span>
          <div className="horizontal-progress-bar">
            <div className="horizontal-progress-fill match-progress" style={{ width: "0%" }} />
          </div>
          <span className="progress-percentage">0%</span>
        </div>
      </motion.div>

      <motion.div
        animate={{ 
          scale: [1, 1.05, 1],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
      >
        <motion.div 
          className="feedback-ready-icon"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          🎯
        </motion.div>
        <motion.p 
          className="feedback-ready-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Ready for Analysis
        </motion.p>
        <motion.p 
          className="feedback-ready-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Generate an image to see similarity results
        </motion.p>
      </motion.div>
    </motion.div>
  );
});

export default FeedbackComponent;