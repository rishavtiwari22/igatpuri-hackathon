// Feedback Component for comparison results - Memoized and moved outside to prevent re-creation
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Helper functions
const getQualityDescription = (percentage) => {
  if (percentage >= 80) return { emoji: "🎯", text: "Excellent", color: "#16a34a" };
  if (percentage >= 60) return { emoji: "🎉", text: "Great Match", color: "#10b981" }; // Auto-unlock threshold
  if (percentage >= 40) return { emoji: "🔥", text: "Close", color: "#f59e0b" }; // Near success
  if (percentage >= 20) return { emoji: "💪", text: "Keep Trying", color: "#ef4444" };
  return { emoji: "🔄", text: "Try Again", color: "#dc2626" };
};

const formatDetailedScores = (scores) => {
  // Safely extract scores with fallbacks
  const safeScore = (value) => {
    if (typeof value === 'number' && !isNaN(value)) {
      // Handle both 0-1 scale and 0-100 scale
      return value > 1 ? value.toFixed(1) : (value * 100).toFixed(1);
    }
    return "0.0"; // Return 0.0 instead of NaN
  };

  return {
    "Structural": `${safeScore(scores?.structural)}%`,
    "Edges": `${safeScore(scores?.edges)}%`,
    "Colors": `${safeScore(scores?.colors)}%`,
    "HOG Features": `${safeScore(scores?.hog_features)}%`,
    "Histogram": `${safeScore(scores?.histogram)}%`,
    "HSV Similarity": `${safeScore(scores?.hsv_similarity)}%`
  };
};

const FeedbackComponent = React.memo(({ selectedImage, comparisonResult, isComparing }) => {
  // DEBUG: Log all props received by FeedbackComponent
  console.log("🔍 FeedbackComponent PROPS:", {
    selectedImage: !!selectedImage,
    comparisonResult,
    isComparing,
    hasError: comparisonResult?.error,
    hasPercentage: comparisonResult?.percentage,
    hasCombined: comparisonResult?.combined,
    hasMsSSIM: comparisonResult?.ms_ssim
  });
  
  // Calculate progress percentages for horizontal bars
  const targetReadiness = selectedImage ? 100 : 0;
  
  // Convert the combined score to percentage with safe handling
  const matchLevel = (() => {
    if (!comparisonResult) {
      console.log("🔍 FeedbackComponent - No comparison result");
      return 0;
    }
    
    console.log("🔍 FeedbackComponent - Processing result:", comparisonResult);
    
    // Handle direct result structure (MS-SSIM returns result directly)
    if (typeof comparisonResult.percentage === 'number' && !isNaN(comparisonResult.percentage)) {
      console.log("🔍 FeedbackComponent - Using percentage:", comparisonResult.percentage);
      return Math.round(comparisonResult.percentage);
    }
    
    if (typeof comparisonResult.combined === 'number' && !isNaN(comparisonResult.combined)) {
      const percentage = Math.round(comparisonResult.combined * 100);
      console.log("🔍 FeedbackComponent - Using combined:", comparisonResult.combined, "->", percentage);
      return percentage;
    }
    
    if (typeof comparisonResult.ms_ssim === 'number' && !isNaN(comparisonResult.ms_ssim)) {
      const percentage = Math.round(comparisonResult.ms_ssim * 100);
      console.log("🔍 FeedbackComponent - Using ms_ssim:", comparisonResult.ms_ssim, "->", percentage);
      return percentage;
    }
    
    // Fallback to nested result structure (if exists)
    const combined = comparisonResult.result?.combined || 
                    comparisonResult.result?.result?.combined;
    
    if (typeof combined === 'number' && !isNaN(combined)) {
      const percentage = Math.round(combined * 100);
      console.log("🔍 FeedbackComponent - Using nested combined:", combined, "->", percentage);
      return percentage;
    }
    
    const percentage = comparisonResult.result?.percentage || 
                      comparisonResult.result?.result?.percentage;
    
    if (typeof percentage === 'number' && !isNaN(percentage)) {
      console.log("🔍 FeedbackComponent - Using nested percentage:", percentage);
      return Math.round(percentage);
    }
    
    console.log("🔍 FeedbackComponent - No valid score found, returning 0");
    return 0;
  })();

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

  console.log("🔍 FeedbackComponent CONDITION CHECK:", {
    hasComparisonResult: !!comparisonResult,
    hasError: !!comparisonResult?.error,
    hasPercentage: typeof comparisonResult?.percentage === 'number',
    hasCombined: typeof comparisonResult?.combined === 'number', 
    hasMsSSIM: typeof comparisonResult?.ms_ssim === 'number',
    percentageValue: comparisonResult?.percentage,
    combinedValue: comparisonResult?.combined,
    msssimValue: comparisonResult?.ms_ssim,
    willShowSuccess: !!(comparisonResult && !comparisonResult.error && 
      (comparisonResult.percentage || comparisonResult.combined || comparisonResult.ms_ssim))
  });

  if (comparisonResult && !comparisonResult.error && (comparisonResult.percentage || comparisonResult.combined || comparisonResult.ms_ssim)) {
    // Debug logging to understand the data structure
    console.log("✅ FeedbackComponent - SUCCESS CONDITION MET! Showing results...");
    console.log("🔍 FeedbackComponent - Full comparison result:", comparisonResult);
    console.log("🔍 FeedbackComponent - Match level calculated:", matchLevel);
    
    const quality = getQualityDescription(matchLevel);
    
    // Find detailed_scores in the result structure
    const detailedScoresData = comparisonResult.detailed_scores || 
                              comparisonResult.result?.detailed_scores || 
                              {};
    
    console.log("🔍 FeedbackComponent - Found detailed scores:", detailedScoresData);
    const detailedScores = formatDetailedScores(detailedScoresData);
    
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
        
        {/* Analysis insights with score-based recommendations */}
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
          
          {/* Score-based feedback messages */}
          {matchLevel >= 60 && (
            <motion.div
              style={{
                fontSize: '0.8rem',
                color: '#10b981',
                marginTop: '6px',
                fontWeight: '600',
                textAlign: 'center'
              }}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              🎉 Great match! Auto-progressing to next challenge...
            </motion.div>
          )}
          
          {matchLevel >= 40 && matchLevel < 60 && (
            <motion.div
              style={{
                fontSize: '0.8rem',
                color: '#f59e0b',
                marginTop: '6px',
                fontWeight: '600',
                textAlign: 'center'
              }}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              🔥 Close! Try adjusting your prompt for 60%+ to unlock next level
            </motion.div>
          )}
          
          {matchLevel < 40 && (
            <motion.div
              style={{
                fontSize: '0.8rem',
                color: '#ef4444',
                marginTop: '6px',
                fontWeight: '600',
                textAlign: 'center'
              }}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              💪 Keep trying! Consider different keywords or descriptions
            </motion.div>
          )}
          
          <div className="method-indicator" style={{
            fontSize: '0.7rem',
            color: '#16a34a',
            marginTop: '4px',
            fontWeight: '500'
          }}>
            🔬 MS-SSIM Local Analysis
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Fallback: If we have any comparison result with a valid numeric score, show it
  if (comparisonResult && matchLevel > 0 && !comparisonResult.error) {
    console.log("⚠️ FeedbackComponent - Using FALLBACK condition for result with valid score");
    console.log("🔍 FeedbackComponent - Fallback result:", comparisonResult);
    
    const quality = getQualityDescription(matchLevel);
    const detailedScoresData = comparisonResult.detailed_scores || {};
    const detailedScores = formatDetailedScores(detailedScoresData);
    
    return (
      <motion.div 
        className="comparison-result-compact"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Progress bars */}
        <motion.div className="progress-bars-container">
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

        {/* Result display */}
        <motion.div className="comparison-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <motion.span style={{ fontSize: '1.5rem' }}>
              {quality.emoji}
            </motion.span>
            <motion.span
              className="comparison-main-score"
              style={{ color: quality.color }}
            >
              {matchLevel}%
            </motion.span>
          </div>
          <motion.div
            className="comparison-quality-badge"
            style={{ backgroundColor: quality.color }}
          >
            {quality.text}
          </motion.div>
        </motion.div>
        
        <div className="method-indicator" style={{
          fontSize: '0.7rem',
          color: '#16a34a',
          marginTop: '8px',
          fontWeight: '500',
          textAlign: 'center'
        }}>
          🔬 MS-SSIM Local Analysis (Fallback)
        </div>
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