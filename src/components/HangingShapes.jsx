// HangingShapes.jsx
import React, { useState, useEffect } from "react";
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
  const [unlockedShapes, setUnlockedShapes] = useState(() => {
    const savedProgress = localStorage.getItem("unlockedShapes");
    return savedProgress ? JSON.parse(savedProgress) : [0];
  });

  useEffect(() => {
    localStorage.setItem("unlockedShapes", JSON.stringify(unlockedShapes));
  }, [unlockedShapes]);

  const images = [image6, image7, image8, image9, image10];

  // Pick a random image from `images`
  // function pickRandomImage() {
  //   const randomIndex = Math.floor(Math.random() * images.length);
  //   setSelectedImage(images[randomIndex]);
  // }

  // On mount → automatically set a random image
  // useEffect(() => {
  //   pickRandomImage();
  // }, []);

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

  const handleGenerateClick = () => {
    const width = 1024;
    const height = 1024;
    const seed = 42;
    const model = "flux";
    const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(
      prompt
    )}?width=${width}&height=${height}&seed=${seed}&model=${model}`;

    console.log("Generate image with prompt:", imageUrl);
    handleGenImg(imageUrl);

    // Unlock the next shape
    if (unlockedShapes.length < shapes.length) {
      setUnlockedShapes([...unlockedShapes, unlockedShapes.length]);
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
              <div className={`shape ${shape.type}`}>
                <div className="shape-inner"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="app-body">
        <ProgressTracker unlockedShapes={unlockedShapes} shapes={shapes} />
        <div className="main-content">
          <div className="left-panel">

            <div className="generated-image-placeholder">
            {selectedImage ? (
              <div className="image-display">
                <img src={selectedImage} alt="Selected Shape" />
              </div>
            ) : <p>Target image will appear here</p>}
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
            {AIGeneratedimg ? (
              <div className="image-display">
                <img src={AIGeneratedimg} alt="AI Generated" />
              </div>
            ) : <p>Generate image will appear here</p>}
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
