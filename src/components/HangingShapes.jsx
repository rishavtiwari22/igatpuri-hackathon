// HangingShapes.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProgressTracker from "./ProgressTracker";
import { computeMSSSIM, getQualityDescription, formatPerScaleScores } from "../utils/imageComparison";
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
  const [showSoundWave, setShowSoundWave] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
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
      setComparisonResult(null); // Clear previous comparison when selecting new target
      playClickSound(); // Play click sound when shape is successfully clicked
      
      // If there's already a generated image, compare with the new target
      if (AIGeneratedimg && !isGenerating && !isComparing) {
        setTimeout(() => {
          console.log("Comparing with new target image...");
          compareImages(image, AIGeneratedimg);
        }, 300);
      }
    } else {
      console.log("Shape is locked");
    }
  };

  const handleGenImg = (image) => {
    setAIGeneratedimg(image);
    // Clear any previous comparison result when setting new generated image
    setComparisonResult(null);
  };

  // Image comparison function
  const compareImages = async (targetImage, generatedImage) => {
    if (!targetImage || !generatedImage) return;
    
    setIsComparing(true);
    setComparisonResult(null);
    
    try {
      console.log("Starting image comparison...");
      console.log("Target:", targetImage);
      console.log("Generated:", generatedImage);
      
      const result = await computeMSSSIM(targetImage, generatedImage);
      setComparisonResult(result);
      console.log("MS-SSIM Comparison Result:", result);
    } catch (error) {
      console.error("Error comparing images:", error);
      setComparisonResult({ 
        error: "Failed to compare images: " + error.message,
        percentage: 0 
      });
    } finally {
      setIsComparing(false);
    }
  };

  // Effect to automatically compare when both images are available AND generation is complete
  useEffect(() => {
    if (selectedImage && AIGeneratedimg && !isGenerating && !isComparing) {
      console.log("Auto-comparing images after generation completed...");
      compareImages(selectedImage, AIGeneratedimg);
    }
  }, [selectedImage, AIGeneratedimg, isGenerating]);

  // Sound generation functions
  const createVictorySound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Victory melody sequence - more triumphant
    const notes = [
      { freq: 523.25, duration: 0.15 }, // C5
      { freq: 659.25, duration: 0.15 }, // E5
      { freq: 783.99, duration: 0.15 }, // G5
      { freq: 1046.50, duration: 0.3 }, // C6
      { freq: 1174.66, duration: 0.15 }, // D6
      { freq: 1318.51, duration: 0.4 }, // E6
    ];
    
    let time = audioContext.currentTime;
    
    notes.forEach((note, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(note.freq, time);
      oscillator.type = 'triangle';
      
      // Add some sparkle with filtering
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(note.freq * 2, time);
      filter.Q.setValueAtTime(1, time);
      
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(0.4, time + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + note.duration);
      
      oscillator.start(time);
      oscillator.stop(time + note.duration);
      
      time += note.duration * 0.8; // Slight overlap for smoother melody
    });
  };

  const createCheerSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create multiple oscillators for a rich celebratory sound
    const frequencies = [150, 300, 450, 600, 750];
    const duration = 1.2;
    
    frequencies.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Add some vibrato for celebration effect
      const lfo = audioContext.createOscillator();
      const lfoGain = audioContext.createGain();
      lfo.connect(lfoGain);
      lfoGain.connect(oscillator.frequency);
      
      lfo.frequency.setValueAtTime(6, audioContext.currentTime); // 6Hz vibrato
      lfoGain.gain.setValueAtTime(freq * 0.1, audioContext.currentTime);
      
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
      oscillator.type = 'sawtooth';
      
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq * 1.5, audioContext.currentTime);
      filter.Q.setValueAtTime(5, audioContext.currentTime);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      lfo.start(audioContext.currentTime);
      oscillator.start(audioContext.currentTime + index * 0.05);
      
      lfo.stop(audioContext.currentTime + duration);
      oscillator.stop(audioContext.currentTime + duration);
    });
    
    // Add some high-frequency sparkle
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const sparkle = audioContext.createOscillator();
        const sparkleGain = audioContext.createGain();
        
        sparkle.connect(sparkleGain);
        sparkleGain.connect(audioContext.destination);
        
        sparkle.frequency.setValueAtTime(2000 + Math.random() * 1000, audioContext.currentTime);
        sparkle.type = 'sine';
        
        sparkleGain.gain.setValueAtTime(0, audioContext.currentTime);
        sparkleGain.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
        sparkleGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
        
        sparkle.start(audioContext.currentTime);
        sparkle.stop(audioContext.currentTime + 0.2);
      }, i * 200);
    }
  };

  const playSuccessSound = () => {
    try {
      // Show visual sound wave effect
      setShowSoundWave(true);
      setTimeout(() => {
        setShowSoundWave(false);
      }, 2000);
      
      createVictorySound();
      setTimeout(() => {
        createCheerSound();
      }, 800); // Play cheer sound after victory sound
    } catch (error) {
      console.log('Audio not supported or blocked by browser:', error);
    }
  };

  const createClickSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const playClickSound = () => {
    try {
      createClickSound();
    } catch (error) {
      console.log('Audio not supported or blocked by browser:', error);
    }
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

  // Feedback Component for comparison results - Optimized compact version
  const FeedbackComponent = () => {
    // Calculate progress percentages for horizontal bars
    const targetReadiness = selectedImage ? 100 : 0;
    const matchLevel = comparisonResult && !comparisonResult.error ? comparisonResult.percentage : 0;

    if (isComparing) {
      return (
        <motion.div 
          className="comparison-loading"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '100%'
          }}
        >
          {/* Horizontal Progress Bars */}
          <div className="progress-bars-container">
            <div className="progress-bar-row">
              <span className="progress-bar-label">Target:</span>
              <div className="horizontal-progress-bar">
                <motion.div 
                  className="horizontal-progress-fill target-progress"
                  initial={{ width: 0 }}
                  animate={{ width: `${targetReadiness}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="progress-percentage">{targetReadiness}%</span>
            </div>
            <div className="progress-bar-row">
              <span className="progress-bar-label">Match:</span>
              <div className="horizontal-progress-bar">
                <motion.div 
                  className="horizontal-progress-fill match-progress"
                  initial={{ width: 0 }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="progress-percentage">...</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              style={{ fontSize: '2rem', marginBottom: '8px' }}
            >
              🔍
            </motion.div>
            <motion.p
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ fontSize: '0.9rem', fontWeight: '500', margin: 0 }}
            >
              Analyzing similarity...
            </motion.p>
          </div>
        </motion.div>
      );
    }

    if (comparisonResult && !comparisonResult.error) {
      const quality = getQualityDescription(comparisonResult.percentage);
      const perScaleScores = formatPerScaleScores(comparisonResult.per_scale_scores || []);
      
      return (
        <motion.div 
          className="comparison-result-compact"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Horizontal Progress Bars */}
          <motion.div 
            className="progress-bars-container"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="progress-bar-row">
              <span className="progress-bar-label">Target:</span>
              <div className="horizontal-progress-bar">
                <motion.div 
                  className="horizontal-progress-fill target-progress"
                  initial={{ width: 0 }}
                  animate={{ width: `${targetReadiness}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />
              </div>
              <span className="progress-percentage">{targetReadiness}%</span>
            </div>
            <div className="progress-bar-row">
              <span className="progress-bar-label">Match:</span>
              <div className="horizontal-progress-bar">
                <motion.div 
                  className="horizontal-progress-fill match-progress"
                  initial={{ width: 0 }}
                  animate={{ width: `${matchLevel}%` }}
                  transition={{ duration: 1.2, delay: 0.5 }}
                />
              </div>
              <span className="progress-percentage">{matchLevel}%</span>
            </div>
          </motion.div>

          {/* Compact result display */}
          <motion.div 
            className="comparison-header"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <motion.span
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                style={{ fontSize: '1.5rem' }}
              >
                {quality.emoji}
              </motion.span>
              <motion.span
                className="comparison-main-score"
                style={{ color: quality.color }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                {Math.round(comparisonResult.percentage)}%
              </motion.span>
            </div>
            <motion.div
              className="comparison-quality-badge"
              style={{ backgroundColor: quality.color }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: "spring" }}
            >
              {quality.text}
            </motion.div>
          </motion.div>

          {/* Compact per-scale scores */}
          {perScaleScores.length > 0 && (
            <motion.div
              className="per-scale-compact"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              {perScaleScores.map((scale, index) => (
                <motion.div 
                  key={index} 
                  className="scale-item-compact"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  <div className="scale-label">S{index + 1}</div>
                  <div className="scale-dots">
                    {[1, 2, 3].map((dot, dotIndex) => (
                      <motion.div
                        key={dotIndex}
                        className="scale-dot"
                        style={{
                          backgroundColor: dotIndex < Math.ceil(scale.score / 33.33) 
                            ? quality.color 
                            : 'rgba(0,0,0,0.2)'
                        }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                          delay: 0.9 + index * 0.1 + dotIndex * 0.05,
                          type: "spring"
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      );
    }

    if (comparisonResult && comparisonResult.error) {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#ef4444',
            textAlign: 'center'
          }}
        >
          <motion.div 
            style={{ fontSize: '2rem', marginBottom: '8px' }}
            animate={{ 
              rotate: [0, -10, 10, -5, 5, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            ⚠️
          </motion.div>
          <motion.p 
            style={{ fontSize: '0.9rem', marginBottom: '4px', fontWeight: '600', margin: 0 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Analysis Error
          </motion.p>
          <motion.p 
            style={{ 
              fontSize: '0.75rem', 
              color: '#666', 
              lineHeight: '1.3',
              margin: 0
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {comparisonResult.error}
          </motion.p>
        </motion.div>
      );
    }

    return (
      <motion.div 
        className="feedback-ready"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Progress bars for ready state */}
        <motion.div 
          className="progress-bars-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="progress-bar-row">
            <span className="progress-bar-label">Target:</span>
            <div className="horizontal-progress-bar">
              <motion.div 
                className="horizontal-progress-fill target-progress"
                initial={{ width: 0 }}
                animate={{ width: `${targetReadiness}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </div>
            <span className="progress-percentage">{targetReadiness}%</span>
          </div>
          <div className="progress-bar-row">
            <span className="progress-bar-label">Match:</span>
            <div className="horizontal-progress-bar">
              <div className="horizontal-progress-fill match-progress" style={{ width: "0%" }} />
            </div>
            <span className="progress-percentage">0%</span>
          </div>
        </motion.div>

        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
        >
          <motion.div 
            className="feedback-ready-icon"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            🎯
          </motion.div>
          <motion.p 
            className="feedback-ready-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Ready for Analysis
          </motion.p>
          <motion.p 
            className="feedback-ready-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Generate an image to see similarity results
          </motion.p>
        </motion.div>
      </motion.div>
    );
  };

  const handleGenerateClick = async () => {
    // Don't generate if prompt is empty or already generating
    if (!prompt.trim() || isGenerating) return;
    
    setIsGenerating(true);
    setAIGeneratedimg(null); // Clear previous image
    
    const width = 1024;
    const height = 1024;
    const seed = 42;
    const model = "flux";
    
    // Use the working Pollinations AI URL format
    const encodedPrompt = encodeURIComponent(prompt);
    const params = new URLSearchParams({
        width: width,
        height: height,
        seed: seed,
        model: model,
        nologo: 'true'
    });
    
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`;

    console.log("Generate image with prompt:", imageUrl);
    
    try {
      // Create image with proper loading
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      const imageLoadPromise = new Promise((resolve, reject) => {
        img.onload = () => {
          console.log("Image loaded successfully for generation");
          resolve();
        };
        
        img.onerror = (error) => {
          console.warn("Failed to load image:", error);
          resolve(); // Still resolve to continue the flow
        };
        
        img.src = imageUrl;
      });
      
      await imageLoadPromise;
      
      handleGenImg(imageUrl);

      // Trigger comparison after a short delay to ensure state is updated
      setTimeout(() => {
        if (selectedImage) {
          console.log("Triggering MS-SSIM comparison after image generation...");
          compareImages(selectedImage, imageUrl);
        }
      }, 500);

      // Unlock the next shape and play success sound
      if (unlockedShapes.length < shapes.length) {
        setUnlockedShapes([...unlockedShapes, unlockedShapes.length]);
        // Play success sound after a short delay to let the UI update
        setTimeout(() => {
          playSuccessSound();
        }, 300);
      }
    } catch (error) {
      console.error("Error generating image:", error);
      // Still set the image URL even if there was an error, as it might work for display
      handleGenImg(imageUrl);
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

      {/* Sound Wave Effect */}
      <AnimatePresence>
        {showSoundWave && (
          <motion.div 
            className="sound-wave"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              style={{
                position: 'absolute',
                top: '60px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(255, 107, 107, 0.9)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '25px',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                fontFamily: 'Poppins, sans-serif',
                textAlign: 'center',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.3)'
              }}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              🎉 Task Completed! 🎉
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <FeedbackComponent />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
