// HangingShapes.jsx
import React, { useState } from "react";
import "./HangingShapes.css";
import image1 from "../assets/car.jpg";
import image2 from "../assets/horse.jpg";
import image3 from "../assets/line_mountain.jpg";
import image4 from "../assets/oul.jpg";
import image5 from "../assets/sheep.avif";

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

  const handleShapeClick = (image) => {
    setSelectedImage(image);
  };

  return (
    <div className="container">
      <div className="ceiling"></div>
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
      {selectedImage && (
        <div className="image-display">
          <img src={selectedImage} alt="Selected Shape" />
        </div>
      )}
    </div>
  );
}
