// ProgressTracker.jsx
import React, { useEffect, useRef } from 'react';
import './ProgressTracker.css';

const ProgressTracker = ({ unlockedShapes, shapes }) => {
  const progressListRef = useRef(null);

  useEffect(() => {
    if (progressListRef.current) {
      const progressPercentage = (unlockedShapes.length / shapes.length) * 100;
      progressListRef.current.style.setProperty('--progress-percentage', `${progressPercentage}%`);
    }
  }, [unlockedShapes, shapes.length]);

  return (
    <div className="progress-tracker">
      <div className="progress-list" ref={progressListRef}>
        {shapes.map((shape, index) => (
          <div
            key={index}
            className={`progress-item ${
              unlockedShapes.includes(index) ? 'unlocked' : ''
            }`}
          >
            <div className={`progress-shape ${shape.type}`}>
              {shape.type === 'star' && <div className="star-inner"></div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressTracker;
