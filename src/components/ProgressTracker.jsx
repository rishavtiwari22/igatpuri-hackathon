// ProgressTracker.jsx
import React from 'react';
import './ProgressTracker.css';

const ProgressTracker = ({ unlockedShapes, shapes }) => {
  return (
    <div className="progress-tracker">
      <h3>Progress</h3>
      <div className="progress-list">
        {shapes.map((shape, index) => (
          <div
            key={index}
            className={`progress-item ${
              unlockedShapes.includes(index) ? 'unlocked' : 'locked'
            }`}
          >
            <div className={`shape-preview ${shape.type}`}></div>
            <span>{shape.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressTracker;
