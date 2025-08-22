// HangingShapes.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProgressTracker from "./ProgressTracker";
import { computeMSSSIM, getQualityDescription, formatDetailedScores, generateFeedback } from "../utils/imageComparison";
import "./HangingShapes.css";
import image1 from "../assets/car.jpg";
import image2 from "../assets/horse.jpg";
import image3 from "../assets/line_mountain.jpg";
import image4 from "../assets/oul.jpg";
import image5 from "../assets/sheep.avif";

const images = [image1, image2, image3, image4, image5];

const shapes = [
  { type: "circle", left: "10%", rope: "rope-1", image: image1 },
  { type: "square", left: "25%", rope: "rope-2", image: image2 },
  { type: "triangle", left: "40%", rope: "rope-3", image: image3 },
  { type: "diamond", left: "55%", rope: "rope-4", image: image4 },
  { type: "hexagon", left: "70%", rope: "rope-5", image: image5 },
  { type: "star", left: "85%", rope: "rope-6", image: image1 },
];

// Feedback Component for comparison results - Memoized and moved outside to prevent re-creation
const FeedbackComponent = React.memo(({ selectedImage, comparisonResult, isComparing, isSpeaking, speakFeedback }) => {
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
    const detailedScores = comparisonResult.detailed_scores ? formatDetailedScores(comparisonResult.detailed_scores) : {};
    
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

        {/* Enhanced detailed scores display */}
        {Object.keys(detailedScores).length > 0 && (
          <motion.div
            className="detailed-scores-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {Object.entries(detailedScores).slice(0, 5).map(([label, score], index) => (
              <motion.div 
                key={label} 
                className="score-item-compact"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                <div className="score-label">{label}</div>
                <div className="score-value" style={{ 
                  color: parseInt(score) >= 70 ? '#16a34a' : 
                         parseInt(score) >= 50 ? '#ca8a04' : '#dc2626' 
                }}>
                  {score}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
        
        {/* Analysis insights */}
        {comparisonResult.analysis && (
          <motion.div
            className="analysis-insights"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
          >
            <div className="insight-row">
              <span>Structure: {comparisonResult.analysis.structure_quality} | Color: {comparisonResult.analysis.color_alignment} | Shape: {comparisonResult.analysis.shape_alignment}</span>
              {comparisonResult.analysis.enhancement_applied && (
                <span className="enhancement-badge">Enhanced ✨</span>
              )}
            </div>
          </motion.div>
        )}
        {/* Feedback messages */}
        {comparisonResult.feedback && comparisonResult.feedback.length > 0 && (
          <motion.div
            className="feedback-messages"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            <h4>Improvement Suggestions:</h4>
            <ul>
              {comparisonResult.feedback.map((msg, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 + index * 0.1 }}
                >
                  {msg}
                </motion.li>
              ))}
            </ul>
            <motion.button
              className="speak-button"
              onClick={() => speakFeedback(comparisonResult.feedback.join(" "))}
              disabled={isSpeaking}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isSpeaking ? "Speaking..." : "Speak Feedback"}
            </motion.button>
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
});

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

  notes.forEach((note) => {
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

const playSuccessSound = (setShowSoundWave) => {
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

const createGenerationStartSound = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // More sophisticated chord progression with harmony
  const chordProgression = [
    // First chord: F major (warm, inviting)
    { notes: [174.61, 220, 261.63], duration: 0.25, volume: 0.15 }, // F3, A3, C4
    // Second chord: C major (bright, optimistic)
    { notes: [261.63, 329.63, 392], duration: 0.25, volume: 0.18 }, // C4, E4, G4
    // Third chord: Am (contemplative)
    { notes: [220, 261.63, 329.63], duration: 0.25, volume: 0.16 }, // A3, C4, E4
    // Final chord: G major (resolution, confidence)
    { notes: [196, 246.94, 293.66, 369.99], duration: 0.4, volume: 0.2 } // G3, B3, D4, F#4
  ];

  let time = audioContext.currentTime;

  chordProgression.forEach((chord) => {
    chord.notes.forEach((freq, noteIndex) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      const reverb = audioContext.createConvolver();

      // Create a simple reverb impulse response
      const impulseLength = audioContext.sampleRate * 0.3;
      const impulse = audioContext.createBuffer(1, impulseLength, audioContext.sampleRate);
      const impulseData = impulse.getChannelData(0);
      for (let i = 0; i < impulseLength; i++) {
        impulseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 2);
      }
      reverb.buffer = impulse;

      // Audio routing with reverb
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(reverb);
      reverb.connect(audioContext.destination);
      // Also connect dry signal
      gainNode.connect(audioContext.destination);

      // Use a warmer oscillator type
      oscillator.type = noteIndex === 0 ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(freq, time);

      // Gentle low-pass filter for warmth
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 4, time);
      filter.frequency.exponentialRampToValueAtTime(freq * 2, time + chord.duration);
      filter.Q.setValueAtTime(0.8, time);

      // Smooth volume envelope
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(chord.volume, time + 0.05);
      gainNode.gain.linearRampToValueAtTime(chord.volume * 0.7, time + chord.duration * 0.7);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + chord.duration);

      oscillator.start(time);
      oscillator.stop(time + chord.duration);
    });
    time += chord.duration * 0.8; // Slight overlap for smooth transitions
  });

  // Add magical sparkle effects
  setTimeout(() => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const sparkle = audioContext.createOscillator();
        const sparkleGain = audioContext.createGain();
        const sparkleFilter = audioContext.createBiquadFilter();

        sparkle.connect(sparkleFilter);
        sparkleFilter.connect(sparkleGain);
        sparkleGain.connect(audioContext.destination);

        // Higher frequencies for sparkle (pentatonic scale)
        const sparkleFreqs = [523.25, 587.33, 659.25, 783.99, 880]; // C5, D5, E5, G5, A5
        sparkle.frequency.setValueAtTime(
          sparkleFreqs[Math.floor(Math.random() * sparkleFreqs.length)],
          audioContext.currentTime
        );
        sparkle.type = 'sine';

        // High-pass filter for brightness
        sparkleFilter.type = 'highpass';
        sparkleFilter.frequency.setValueAtTime(1000, audioContext.currentTime);
        sparkleFilter.Q.setValueAtTime(2, audioContext.currentTime);

        sparkleGain.gain.setValueAtTime(0, audioContext.currentTime);
        sparkleGain.gain.linearRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
        sparkleGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);

        sparkle.start(audioContext.currentTime);
        sparkle.stop(audioContext.currentTime + 0.15);
      }, i * 150 + Math.random() * 100); // Slightly randomized timing
    }
  }, 600);

  // Add a gentle "whoosh" effect for AI activation
  setTimeout(() => {
    const whoosh = audioContext.createOscillator();
    const whooshGain = audioContext.createGain();
    const whooshFilter = audioContext.createBiquadFilter();

    whoosh.connect(whooshFilter);
    whooshFilter.connect(whooshGain);
    whooshGain.connect(audioContext.destination);

    whoosh.type = 'sawtooth';
    whoosh.frequency.setValueAtTime(60, audioContext.currentTime);
    whoosh.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);

    whooshFilter.type = 'bandpass';
    whooshFilter.frequency.setValueAtTime(100, audioContext.currentTime);
    whooshFilter.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.3);
    whooshFilter.Q.setValueAtTime(8, audioContext.currentTime);

    whooshGain.gain.setValueAtTime(0, audioContext.currentTime);
    whooshGain.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 0.1);
    whooshGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);

    whoosh.start(audioContext.currentTime);
    whoosh.stop(audioContext.currentTime + 0.3);
  }, 1000);
};

const playGenerationStartSound = () => {
  try {
    createGenerationStartSound();
  } catch (error) {
    console.log('Audio not supported or blocked by browser:', error);
  }
};

export default function HangingShapes() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [AIGeneratedimg, setAIGeneratedimg] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSoundWave, setShowSoundWave] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [selectedModel, setSelectedModel] = useState("pollinations");
  const [unlockedShapes, setUnlockedShapes] = useState(() => {
    // For testing - uncomment the next line to reset progress
    // localStorage.removeItem("unlockedShapes");
    const savedProgress = localStorage.getItem("unlockedShapes");
    return savedProgress ? JSON.parse(savedProgress) : [0];
  });
  const [showUnlockNotification, setShowUnlockNotification] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);


  // Available models for image generation
  const availableModels = [
    { id: "pollinations", name: "Pollinations AI", description: "Fast and reliable" },
    { id: "clipdrop", name: "ClipDrop", description: "High quality results" }
  ];

  const speakFeedback = (text) => {
    console.log("speakFeedback called with text:", text);
    if ('speechSynthesis' in window) {
      console.log("SpeechSynthesis API is supported.");
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      console.log("Available voices:", voices);
      utterance.voice = voices[0]; // Use the first available voice
      utterance.onend = () => {
        console.log("Speech finished.");
        setIsSpeaking(false);
      };
      utterance.onerror = (event) => {
        console.error("SpeechSynthesisUtterance.onerror", event);
        setIsSpeaking(false);
      };
      console.log("Attempting to speak...");
      window.speechSynthesis.speak(utterance);
    } else {
      console.log('Text-to-speech not supported in this browser.');
    }
  };

  // Save progress to localStorage whenever unlockedShapes changes
  useEffect(() => {
    localStorage.setItem("unlockedShapes", JSON.stringify(unlockedShapes));
    console.log("Progress saved to localStorage:", unlockedShapes);
  }, [unlockedShapes]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Cleanup function if needed
    };
  }, []);

  // Pick a random image from `images`
  const pickRandomImage = useCallback(() => {
    const randomIndex = 0;
    setSelectedImage(images[randomIndex]);
  }, []);

  // On mount → automatically set a random image
  useEffect(() => {
    pickRandomImage();
  }, [pickRandomImage]);

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
  const compareImages = useCallback(async (targetImage, generatedImage) => {
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
      const errorResult = { 
        error: "Failed to compare images: " + error.message,
        percentage: 0 
      };
      setComparisonResult(errorResult);
    } finally {
      setIsComparing(false);
    }
  }, []);

  // Effect to automatically compare when both images are available AND generation is complete
  useEffect(() => {
    if (selectedImage && AIGeneratedimg && !isGenerating && !isComparing) {
      console.log("Auto-comparing images after generation completed...");
      compareImages(selectedImage, AIGeneratedimg);
    }
  }, [selectedImage, AIGeneratedimg, isGenerating, isComparing, compareImages]);

  // Check for progression after comparison
  useEffect(() => {
    if (comparisonResult && !comparisonResult.error && comparisonResult.percentage >= 70) {
      // Find which challenge the user just completed based on the selected image
      const currentChallengeIndex = shapes.findIndex(shape => shape.image === selectedImage);
      
      console.log("Progression check:", {
        currentChallengeIndex,
        unlockedShapes,
        percentage: comparisonResult.percentage
      });
      
      // Only proceed if we found a valid challenge index
      if (currentChallengeIndex !== -1) {
        const nextChallengeIndex = currentChallengeIndex + 1;
        
        // Only unlock next challenge if:
        // 1. There is a next challenge (not at the end)
        // 2. The next challenge is not already unlocked
        // 3. The current challenge was already unlocked (user didn't somehow complete a locked challenge)
        if (nextChallengeIndex < shapes.length && 
            !unlockedShapes.includes(nextChallengeIndex) && 
            unlockedShapes.includes(currentChallengeIndex)) {
          
          console.log(`Unlocking challenge ${nextChallengeIndex} after completing challenge ${currentChallengeIndex}`);
          
          setTimeout(() => {
            setUnlockedShapes(prev => {
              const newUnlocked = [...prev, nextChallengeIndex];
              console.log("New unlocked shapes:", newUnlocked);
              return newUnlocked;
            });
            setShowUnlockNotification(true);
            
            // Hide notification after 3 seconds
            setTimeout(() => {
              setShowUnlockNotification(false);
            }, 3000);
            
            playSuccessSound(setShowSoundWave);
          }, 1000); // Delay to let user see the result first
        } else {
          console.log("No progression needed:", {
            nextChallengeIndex,
            shapesLength: shapes.length,
            nextAlreadyUnlocked: unlockedShapes.includes(nextChallengeIndex),
            currentIsUnlocked: unlockedShapes.includes(currentChallengeIndex)
          });
        }
      }
    }
  }, [comparisonResult, unlockedShapes, selectedImage]);

  // Image generation functions for different models
  const generateWithPollinations = async (prompt) => {
    const width = 1024;
    const height = 1024;
    const seed = 42;
    const model = "flux";
    
    const encodedPrompt = encodeURIComponent(prompt);
    const params = new URLSearchParams({
      width: width,
      height: height,
      seed: seed,
      model: model,
      nologo: 'true'
    });
    
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`;
    
    // Create image with proper loading
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    const imageLoadPromise = new Promise((resolve) => {
      img.onload = () => {
        console.log("Pollinations image loaded successfully");
        resolve();
      };
      
      img.onerror = (error) => {
        console.warn("Failed to load Pollinations image:", error);
        resolve(); // Still resolve to continue the flow
      };
      
      img.src = imageUrl;
    });
    
    await imageLoadPromise;
    return imageUrl;
  };

  const generateWithClipDrop = async (prompt) => {
    // Note: You'll need to add your ClipDrop API key here
    const API_KEY = '29da0145f174361bd87d07659016867767d8cb1b8a7cbf2376ddab617f3b7dca4effe88696214e2f5dd8efe7357a1e84'; // Replace with your actual API key
    
    const form = new FormData();
    form.append('prompt', prompt);
    
    try {
      const response = await fetch('https://clipdrop-api.co/text-to-image/v1', {
        method: 'POST',
        headers: {
          'x-api-key': API_KEY,
        },
        body: form,
      });
      
      if (!response.ok) {
        throw new Error(`ClipDrop API error: ${response.status}`);
      }
      
      const buffer = await response.arrayBuffer();
      const blob = new Blob([buffer], { type: 'image/png' });
      const imageUrl = URL.createObjectURL(blob);
      
      console.log("ClipDrop image generated successfully");
      return imageUrl;
    } catch (error) {
      console.error("Error generating with ClipDrop:", error);
      throw error;
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

  const handleGenerateClick = async () => {
    // Don't generate if prompt is empty or already generating
    if (!prompt.trim() || isGenerating) return;
    
    setIsGenerating(true);
    setAIGeneratedimg(null); // Clear previous image
    
    // Play generation start sound when generation begins
    playGenerationStartSound();
    
    try {
      let imageUrl;
      
      if (selectedModel === "pollinations") {
        imageUrl = await generateWithPollinations(prompt);
      } else if (selectedModel === "clipdrop") {
        imageUrl = await generateWithClipDrop(prompt);
      }

      console.log("Generated image with", selectedModel, ":", imageUrl);
      
      handleGenImg(imageUrl);

      // Trigger comparison after a short delay to ensure state is updated
      setTimeout(() => {
        if (selectedImage) {
          console.log("Triggering MS-SSIM comparison after image generation...");
          compareImages(selectedImage, imageUrl);
        }
      }, 500);
    } catch (error) {
      console.error("Error generating image:", error);
      setComparisonResult({ 
        error: `Failed to generate image with ${selectedModel}: ${error.message}`,
        percentage: 0 
      });
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

      {/* Unlock Notification */}
      <AnimatePresence>
        {showUnlockNotification && (
          <motion.div
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: 'linear-gradient(135deg, #4ade80, #10b981)',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              fontFamily: 'Poppins, sans-serif',
              boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            initial={{ x: 100, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 100, opacity: 0, scale: 0.8 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 20
            }}
          >
            <motion.span
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ 
                duration: 0.6,
                repeat: 2
              }}
            >
              🔓
            </motion.span>
            Next Challenge Unlocked!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="app-body">
        <div className="progress-tracker-wrapper">
          <ProgressTracker 
            unlockedShapes={unlockedShapes} 
            shapes={shapes} 
            comparisonResult={comparisonResult}
          />
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
              
              {/* Model Selection and Generate Button Row */}
              <div className="controls-row">
                <div className="model-selection">
                  <select 
                    value={selectedModel} 
                    onChange={(e) => {
                      const newModel = e.target.value;
                      setSelectedModel(newModel);
                    }}
                    className="model-dropdown"
                    disabled={isGenerating}
                  >
                    {availableModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} - {model.description}
                      </option>
                    ))}
                  </select>
                </div>
                
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
                  {isGenerating ? `Generating with ${availableModels.find(m => m.id === selectedModel)?.name}...` : "Generate Image"}
                </motion.button>
              </div>
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
              <FeedbackComponent 
                selectedImage={selectedImage}
                comparisonResult={comparisonResult}
                isComparing={isComparing}
                isSpeaking={isSpeaking}
                speakFeedback={speakFeedback}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
