// ProgressTracker.jsx
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './ProgressTracker.css';

const ProgressTracker = ({ 
  unlockedShapes, 
  shapes, 
  comparisonResult, 
  voiceEnabled, 
  setVoiceEnabled, 
  isVoicePlaying, 
  setIsVoicePlaying, 
  voiceManager,
  progressData = {},
  onShapeClick,
  selectedImage,
  onResetProgress
}) => {
  const progressListRef = useRef(null);

  useEffect(() => {
    if (progressListRef.current) {
      const progressPercentage = (unlockedShapes.length / shapes.length) * 100;
      progressListRef.current.style.setProperty('--progress-percentage', `${progressPercentage}%`);
    }
  }, [unlockedShapes, shapes.length]);

  // Debug logging
  useEffect(() => {
    console.log("ProgressTracker - unlockedShapes:", unlockedShapes);
  }, [unlockedShapes]);

  return (
    <div className="progress-tracker">
      {/* Voice Toggle Button */}
      <motion.button
        onClick={() => {
          if (isVoicePlaying) {
            voiceManager.stopCurrentAudio();
            setIsVoicePlaying(false);
          }
          setVoiceEnabled(!voiceEnabled);
          console.log(`🎤 Voice feedback ${!voiceEnabled ? 'enabled' : 'disabled'}`);
        }}
        className={`voice-toggle-progress ${voiceEnabled ? 'enabled' : 'disabled'}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title={voiceEnabled ? 'Disable voice feedback' : 'Enable voice feedback'}
        style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: voiceEnabled ? '#10b981' : '#6b7280',
          color: 'white',
          fontSize: '18px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          zIndex: 10
        }}
      >
        {isVoicePlaying ? '📢' : (voiceEnabled ? '🎤' : '🔇')}
      </motion.button>

      {/* Reset Progress Button */}
      {onResetProgress && (
        <motion.button
          onClick={onResetProgress}
          className="reset-progress-button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Reset all progress"
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 12px',
            borderRadius: '6px',
            border: 'none',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: 'white',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
            zIndex: 10
          }}
        >
          🔄 Reset
        </motion.button>
      )}
      
      <div className="progress-list" ref={progressListRef}>
        {shapes.map((shape, index) => {
          const isUnlocked = unlockedShapes.includes(index);
          const maxUnlockedIndex = Math.max(...unlockedShapes);
          const isCurrentChallenge = isUnlocked && (selectedImage === shape.image);
          const shapeProgress = progressData[index];
          
          return (
            <div
              key={index}
              className={`progress-item ${isUnlocked ? 'unlocked' : ''} ${isCurrentChallenge ? 'current-challenge' : ''}`}
              onClick={() => isUnlocked && onShapeClick && onShapeClick(index)}
              style={{ 
                cursor: isUnlocked ? 'pointer' : 'not-allowed',
                position: 'relative'
              }}
              title={isUnlocked ? 
                `${shape.name}${shapeProgress ? ` - Best: ${shapeProgress.bestScore.toFixed(1)}% (${shapeProgress.attempts} attempts)` : ' - Click to navigate'}` : 
                `${shape.name} - Locked`
              }
            >
              <div className={`progress-shape ${shape.type}`}>
                {shape.type === 'star' && <div className="star-inner"></div>}
              </div>
              
              {/* Progress indicators */}
              {isUnlocked && shapeProgress && (
                <div style={{
                  position: 'absolute',
                  bottom: '-20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '0.7rem',
                  color: shapeProgress.completed ? '#10b981' : '#f59e0b',
                  fontWeight: '600',
                  textAlign: 'center',
                  minWidth: '40px'
                }}>
                  {shapeProgress.bestScore.toFixed(0)}%
                </div>
              )}
              
              {/* Current challenge indicator */}
              {isCurrentChallenge && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }}>
                  🎯
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressTracker;
