// ProgressTracker.jsx
import React, { useEffect, useRef } from 'react';
import './ProgressTracker.css';

const ProgressTracker = ({ unlockedShapes, shapes, comparisonResult }) => {
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
