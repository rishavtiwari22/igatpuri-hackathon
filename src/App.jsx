// App.jsx
import React from "react";
import HangingShapes from "./components/HangingShapes";
import BugGame from "./components/LandingGame/BugGame";
import "./App.css";

function App() {
  return (
    <div className="app">
      <HangingShapes />
      <BugGame />
    </div>
  );
}

export default App;
