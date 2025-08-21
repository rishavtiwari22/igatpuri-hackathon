// HangingShapes.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProgressTracker from "./ProgressTracker";
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [unlockedShapes, setUnlockedShapes] = useState(() => {
    const savedProgress = localStorage.getItem("unlockedShapes");
    return savedProgress ? JSON.parse(savedProgress) : [0];
  });

  useEffect(() => {
    localStorage.setItem("unlockedShapes", JSON.stringify(unlockedShapes));
  }, [unlockedShapes]);

  const images = [image1, image2, image3, image4, image5];

  // Pick a random image from `images`
  function pickRandomImage() {
    const randomIndex = 0;
    setSelectedImage(images[randomIndex]);
  }

  // On mount → automatically set a random image
  useEffect(() => {
    pickRandomImage();
  }, []);

  const handleShapeClick = (image, index) => {
    if (unlockedShapes.includes(index)) {
      setSelectedImage(image);
    } else {
      console.log("Shape is locked");
    }
  };

  const handleGenImg = (image) => {
    setAIGeneratedimg(image);
  };

  // Loader Component
  const LoaderComponent = () => (
    <motion.div 
      className="loader-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="loader-wrapper">
        <div className="loader-circle">
          <div className="loader-inner-circle"></div>
          <div className="loader-particles">
            <div className="loader-particle"></div>
            <div className="loader-particle"></div>
            <div className="loader-particle"></div>
            <div className="loader-particle"></div>
            <div className="loader-particle"></div>
            <div className="loader-particle"></div>
          </div>
        </div>
        <motion.div 
          className="loader-text"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          Generating your image...
        </motion.div>
        <div className="loader-subtext">
          Please wait while AI creates your masterpiece
        </div>
      </div>
    </motion.div>
  );

  const handleGenerateClick = async () => {
    // Don't generate if prompt is empty or already generating
    if (!prompt.trim() || isGenerating) return;
    
    setIsGenerating(true);
    setAIGeneratedimg(null); // Clear previous image
    
    const width = 1024;
    const height = 1024;
    const seed = 42;
    const model = "flux";
    const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(
      prompt
    )}?width=${width}&height=${height}&seed=${seed}&model=${model}`;

    console.log("Generate image with prompt:", imageUrl);
    
    try {
      // Simulate the image loading process
      await new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
          resolve();
        };
        img.onerror = () => {
          resolve(); // Still resolve even on error
        };
        img.src = imageUrl;
      });
      
      handleGenImg(imageUrl);

      // Unlock the next shape
      if (unlockedShapes.length < shapes.length) {
        setUnlockedShapes([...unlockedShapes, unlockedShapes.length]);
      }
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleGenerateClick();
    }
  };

  return (
    <div className="container">
      <div className="ceiling"></div>
      <div className="shapes-container">
        {shapes.map((shape, index) => (
          <div
            className={`hanging-system ${
              !unlockedShapes.includes(index) ? "locked" : ""
            }`}
            style={{ left: shape.left }}
            key={index}
            onClick={() => handleShapeClick(shape.image, index)}
          >
            <div className="hook"></div>
            <div className={`swing-container ${shape.rope}`}>
              <div className="rope"></div>
              <div className={`shape ${shape.type} ${
                unlockedShapes.includes(index) ? "filled" : ""
              }`}>
                <div className="shape-inner"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="app-body">
        <div className="progress-tracker-wrapper">
          <ProgressTracker unlockedShapes={unlockedShapes} shapes={shapes} />
        </div>
        <div className="main-content">
          <div className="left-panel">
            <div className="generated-image-placeholder">
              {selectedImage ? (
                <motion.div 
                  className="image-display"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <img src={selectedImage} alt="Selected Shape" />
                </motion.div>
              ) : <p>Target image will appear here</p>}
            </div>

            <div className="generation-controls">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter a prompt to generate an image"
                className="prompt-input"
                disabled={isGenerating}
              />
              <motion.button 
                onClick={handleGenerateClick} 
                className="generate-button"
                disabled={isGenerating || !prompt.trim()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={isGenerating ? { 
                  backgroundColor: ["#ff6b6b", "#f06595", "#ff6b6b"],
                } : {}}
                transition={{ 
                  backgroundColor: { repeat: Infinity, duration: 1.5 }
                }}
              >
                {isGenerating ? "Generating..." : "Generate Image"}
              </motion.button>
            </div>
          </div>
          <div className="right-panel">
            <div className="image-placeholder" style={{ position: 'relative' }}>
              <AnimatePresence>
                {isGenerating && <LoaderComponent />}
              </AnimatePresence>
              {AIGeneratedimg ? (
                <motion.div 
                  className="image-display"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <img src={AIGeneratedimg} alt="AI Generated" />
                </motion.div>
              ) : !isGenerating && <p>Generated image will appear here</p>}
            </div>
            <div className="feedback-placeholder">
              <p>Matching feedback will appear here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
