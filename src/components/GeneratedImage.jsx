// src/components/GeneratedImage.jsx
import React from 'react';
import './GeneratedImage.css';

const GeneratedImage = ({ image, onKeep, onDiscard }) => {
  if (!image) {
    return (
      <div className="generated-image-placeholder">
        <p>Generated image will appear here</p>
      </div>
    );
  }

  return (
    <div className="generated-image-container">
      <img src={image} alt="Generated" className="generated-image" />
      <div className="feedback-buttons">
        <button onClick={onKeep} className="keep-button">Keep</button>
        <button onClick={onDiscard} className="discard-button">Discard</button>
      </div>
      <div className="positive-feedback">
        Great Creation!
      </div>
    </div>
  );
};

export default GeneratedImage;
