// ProgressTracker.jsx
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './ProgressTracker.css';

const ProgressTracker = ({ unlockedShapes, shapes, comparisonResult, voiceEnabled, setVoiceEnabled, isVoicePlaying, setIsVoicePlaying, voiceManager }) => {
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
      
      <div className="progress-list" ref={progressListRef}>
        {shapes.map((shape, index) => {
          const isUnlocked = unlockedShapes.includes(index);
          // Current challenge is the last unlocked challenge (the most recent one unlocked)
          const maxUnlockedIndex = Math.max(...unlockedShapes);
          const isCurrentChallenge = isUnlocked && (index === maxUnlockedIndex);
          
          return (
            <div
              key={index}
              className={`progress-item ${isUnlocked ? 'unlocked' : ''} ${isCurrentChallenge ? 'current-challenge' : ''}`}
            >
              <div className={`progress-shape ${shape.type}`}>
                {shape.type === 'star' && <div className="star-inner"></div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressTracker;
