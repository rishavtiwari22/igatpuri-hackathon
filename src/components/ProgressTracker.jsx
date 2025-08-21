// ProgressTracker.jsx
import React from 'react';
import './ProgressTracker.css';

const ProgressTracker = ({ unlockedShapes, shapes }) => {
  return (
    <div className="progress-tracker">
      <div className="progress-list">
        {shapes.map((shape, index) => (
          <div
            key={index}
            className={`progress-item ${
              unlockedShapes.includes(index) ? 'unlocked' : ''
            }`}
          >
            <div className={`progress-shape ${shape.type}`}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressTracker;
