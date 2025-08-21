// src/components/Quest.jsx
import React from 'react';
import './Quest.css';

const Quest = () => {
  return (
    <div className="quest-notification">
      <div className="quest-icon">🚀</div>
      <div className="quest-content">
        <div className="quest-title">Daily Design Challenge</div>
        <div className="quest-description">Create an image using the "triangle" shape.</div>
      </div>
    </div>
  );
};

export default Quest;
