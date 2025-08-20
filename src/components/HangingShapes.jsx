// HangingShapes.jsx
import React from "react";
import "./HangingShapes.css";

const shapes = [
  { type: "circle", left: "10%", rope: "rope-1" },
  { type: "square", left: "25%", rope: "rope-2" },
  { type: "triangle", left: "40%", rope: "rope-3" },
  { type: "diamond", left: "55%", rope: "rope-4" },
  { type: "hexagon", left: "70%", rope: "rope-5" },
  { type: "star", left: "85%", rope: "rope-6" },
];

export default function HangingShapes() {
  return (
    <div className="container">
      <div className="ceiling"></div>
      {shapes.map((shape, index) => (
        <div
          className={`hanging-system ${shape.rope}`}
          style={{ left: shape.left }}
          key={index}
        >
          <div className="hook"></div>
          <div className="rope"></div>
          <div className={`shape ${shape.type}`}>
            <div className="shape-inner"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
