// HangingShapes.jsx
import React, { useState, useEffect } from "react";
import "./HangingShapes.css";
import image1 from "../assets/car.jpg";
import image2 from "../assets/horse.jpg";
import image3 from "../assets/line_mountain.jpg";
import image4 from "../assets/oul.jpg";
import image5 from "../assets/sheep.avif";

import image6 from "./images/car.png";
import image7 from "./images/foxes.png";
import image8 from "./images/llama.jpg";
import image9 from "./images/owl.png";
import image10 from "./images/van.jpg";

import handleComparison from "./Comparison_req"

const shapes = [
  { type: "circle", left: "10%", rope: "rope-1", image: image1 },
  { type: "square", left: "25%", rope: "rope-2", image: image2 },
  { type: "triangle", left: "40%", rope: "rope-3", image: image3 },
  { type: "diamond", left: "55%", rope: "rope-4", image: image4 },
  { type: "hexagon", left: "70%", rope: "rope-5", image: image5 },
  { type: "star", left: "85%", rope: "rope-6", image: image1 },
];

export default function HangingShapes() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [AIGeneratedimg, setAIGeneratedimg] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const images = [image6, image7, image8, image9, image10];
  
  const onCompareClick = async () => {
    setLoading(true);
    try {
      const comparisonResult = await handleComparison(AIGeneratedimg, selectedImage);
      console.log(comparisonResult);
      if (comparisonResult && comparisonResult.result) {
        setResult(comparisonResult.result);
      }
    } catch (error) {
      alert("Error comparing images: " + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Pick a random image from `images`
  function pickRandomImage() {
    const randomIndex = Math.floor(Math.random() * images.length);
    setSelectedImage(images[randomIndex]);
  }

  // On mount → automatically set a random image
  useEffect(() => {
    pickRandomImage();
  }, []);

  const handleShapeClick = (image) => {
    setSelectedImage(image);
  };

  const handleGenImg = (image) => {
    setAIGeneratedimg(image);
  };

  const handleGenerateClick = () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt first!");
      return;
    }
    
    const width = 1024;
    const height = 1024;
    const seed = 42;
    const model = "flux";
    const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=${model}`;
    console.log("Generate image with prompt:", imageUrl);
    handleGenImg(imageUrl);
  };

  // Format percentage for display
  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="container">
      <div className="ceiling"></div>
      <div className="shapes-container">
        {shapes.map((shape, index) => (
          <div
            className="hanging-system"
            style={{ left: shape.left }}
            key={index}
            onClick={() => handleShapeClick(shape.image)}
          >
            <div className="hook"></div>
            <div className={`swing-container ${shape.rope}`}>
              <div className="rope"></div>
              <div className={`shape ${shape.type}`}>
                <div className="shape-inner"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="main-content">
        <div className="left-panel">
          <div className="generated-image-placeholder">
            {AIGeneratedimg ? (
              <div className="image-display">
                <img src={AIGeneratedimg} alt="AI Generated" />
                <p className="image-label">AI Generated Image</p>
              </div>
            ) : <p>AI generated image will appear here</p>}
          </div>

          <div className="generation-controls">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a prompt to generate an image"
              className="prompt-input"
            />
            <button onClick={handleGenerateClick} className="generate-button">
              Generate Image
            </button>
          </div>
        </div>

        <div className="right-panel">
          <div className="image-placeholder">
            {selectedImage ? (
              <div className="image-display">
                <img src={selectedImage} alt="Target Shape" />
                <p className="image-label">Target Image</p>
              </div>
            ) : <p>Target image will appear here</p>}
          </div>

          <div className="feedback-placeholder">
            {loading ? (
              <div className="loading">Comparing images...</div>
            ) : result ? (
              <div className="comparison-results">
                <h3>🎯 Comparison Results</h3>
                
                <div className="score-card">
                  <div className="score-item main-score">
                    <span className="score-label">Overall Similarity</span>
                    <span className="score-value">{formatPercentage(result.combined)}</span>
                  </div>
                  
                  <div className="score-details">
                    <div className="score-item">
                      <span className="score-label">Structural</span>
                      <span className="score-value">{formatPercentage(result.structural)}</span>
                    </div>
                    
                    <div className="score-item">
                      <span className="score-label">Edge Similarity</span>
                      <span className="score-value">{formatPercentage(result.edges)}</span>
                    </div>
                    
                    <div className="score-item">
                      <span className="score-label">HOG Features</span>
                      <span className="score-value">{formatPercentage(result.hog_features)}</span>
                    </div>
                    
                    <div className="score-item">
                      <span className="score-label">Histogram</span>
                      <span className="score-value">{formatPercentage(result.histogram)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Optional: Show raw data for debugging */}
                <details className="raw-data">
                  <summary>View Raw Data</summary>
                  <pre>{JSON.stringify(result, null, 2)}</pre>
                </details>
              </div>
            ) : (
              <p>Click "Generate Feedback" to see comparison results</p>
            )}
          </div>

          <button 
            onClick={onCompareClick} 
            className="generate-button"
            disabled={!AIGeneratedimg || !selectedImage || loading}
          >
            {loading ? "Comparing..." : "Generate Feedback"}
          </button>
        </div>
      </div>
    </div>
  );
}