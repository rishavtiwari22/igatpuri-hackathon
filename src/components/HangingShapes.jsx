// HangingShapes.jsx
import React, { useState, useEffect } from "react";
import "./HangingShapes.css";
import Header from "./Header";
import Quest from "./Quest";
import GeneratedImage from "./GeneratedImage";
import image1 from "../assets/car.jpg";
import image2 from "../assets/horse.jpg";
import image3 from "../assets/line_mountain.jpg";
import image4 from "../assets/oul.jpg";
import image5 from "../assets/sheep.avif";

const initialShapes = [
  { type: "circle", left: "10%", rope: "rope-1", image: image1, locked: false, unlockLevel: 1 },
  { type: "square", left: "25%", rope: "rope-2", image: image2, locked: false, unlockLevel: 1 },
  { type: "triangle", left: "40%", rope: "rope-3", image: image3, locked: false, unlockLevel: 1 },
  { type: "diamond", left: "55%", rope: "rope-4", image: image4, locked: true, unlockLevel: 2 },
  { type: "hexagon", left: "70%", rope: "rope-5", image: image5, locked: true, unlockLevel: 3 },
  { type: "star", left: "85%", rope: "rope-6", image: image1, locked: true, unlockLevel: 4 },
];

const XP_PER_LEVEL = 100;

export default function HangingShapes() {
  const [shapes, setShapes] = useState(initialShapes);
  const [selectedImage, setSelectedImage] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(30);
  const [gems, setGems] =useState(150);
  const [generatedImage, setGeneratedImage] = useState(null);

  const playSound = (sound) => {
    // In a real application, you would use a library like Howler.js
    // to play audio files. For now, we'll just log to the console.
    console.log(`Playing sound: ${sound}`);
  };

  const handleShapeClick = (shape) => {
    if (shape.locked) {
      playSound("locked");
      console.log("This shape is locked!");
      return;
    }
    playSound("shape-click");
    setSelectedImage(shape.image);
  };

  const handleGenerateClick = () => {
    console.log("Generate image with prompt:", prompt);
    playSound("generate");
    const images = [image1, image2, image3, image4, image5];
    const randomImage = images[Math.floor(Math.random() * images.length)];
    setGeneratedImage(randomImage);

    // Award XP and gems
    setXp(prevXp => prevXp + 25);
    setGems(prevGems => prevGems + 10);
  };

  const handleKeep = () => {
    console.log("Image kept");
    setGeneratedImage(null);
  };

  const handleDiscard = () => {
    console.log("Image discarded");
    setGeneratedImage(null);
  };

  // Effect for leveling up
  useEffect(() => {
    if (xp >= XP_PER_LEVEL) {
      setLevel(prevLevel => prevLevel + 1);
      setXp(prevXp => prevXp % XP_PER_LEVEL);
      setGems(prevGems => prevGems + 50); // Level up bonus
    }
  }, [xp]);

  // Effect for unlocking shapes
  useEffect(() => {
    setShapes(prevShapes =>
      prevShapes.map(shape =>
        level >= shape.unlockLevel ? { ...shape, locked: false } : shape
      )
    );
  }, [level]);

  return (
    <div className="container">
      <Header level={level} xp={xp} gems={gems} />
      <div className="ceiling"></div>
      <div className="shapes-container">
        {shapes.map((shape, index) => (
          <div
            className={`hanging-system ${shape.locked ? 'locked' : ''}`}
            style={{ left: shape.left }}
            key={index}
            onClick={() => handleShapeClick(shape)}
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
          <div className="image-placeholder">
            {selectedImage && (
              <div className="image-display">
                <img src={selectedImage} alt="Selected Shape" />
              </div>
            )}
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
          <GeneratedImage
            image={generatedImage}
            onKeep={handleKeep}
            onDiscard={handleDiscard}
          />
        </div>
      </div>
      <Quest />
    </div>
  );
}
