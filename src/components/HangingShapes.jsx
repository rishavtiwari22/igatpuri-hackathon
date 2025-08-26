// HangingShapes.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProgressTracker from "./ProgressTracker";
import { computeMSSSIM, getQualityDescription, formatDetailedScores } from "../utils/imageComparison";
import { generateWithClipDrop } from "./Image_models";
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
import FeedbackComponent from "./FeedbackComponent";
import handleComparison from "./Comparison_req";
import { playClickSound,playGenerationStartSound,playSuccessSound,createCheerSound,createVictorySound,createClickSound,createGenerationStartSound } from "./Sound_Generation";
import { speakFeedback, stopSpeech, getSpeechStatus, testSpeech } from "../utils/speechSynthesis";

const shapes = [
  { type: "circle", left: "10%", rope: "rope-1", image: image1, name: "Car" },
  { type: "square", left: "25%", rope: "rope-2", image: image2, name: "Horse" },
  { type: "triangle", left: "40%", rope: "rope-3", image: image3, name: "Mountain" },
  { type: "diamond", left: "55%", rope: "rope-4", image: image4, name: "Owl" },
  { type: "hexagon", left: "70%", rope: "rope-5", image: image5, name: "Sheep" },
  { type: "star", left: "85%", rope: "rope-6", image: image6, name: "Car (PNG)" },
];


export default function HangingShapes() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [AIGeneratedimg, setAIGeneratedimg] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSoundWave, setShowSoundWave] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [result, setResult] = useState(null)
  const [selectedModel, setSelectedModel] = useState("pollinations");
  const [hasComparedCurrentGeneration, setHasComparedCurrentGeneration] = useState(false); // Flag to prevent multiple comparisons
  const [speechEnabled, setSpeechEnabled] = useState(true); // Speech feedback preference
  const [isSpeaking, setIsSpeaking] = useState(false); // Speech status
  const [isImageLoading, setIsImageLoading] = useState(false); // Image loading status
  const [unlockedShapes, setUnlockedShapes] = useState(() => {
    // For testing - uncomment the next line to reset progress
    // localStorage.removeItem("unlockedShapes");
    const savedProgress = localStorage.getItem("unlockedShapes");
    return savedProgress ? JSON.parse(savedProgress) : [0];
  });
  const [showUnlockNotification, setShowUnlockNotification] = useState(false);


  // Available models for image generation
  const availableModels = [
    { id: "pollinations", name: "Pollinations AI", description: "Fast and reliable" },
    { id: "clipdrop", name: "ClipDrop", description: "High quality results" }
  ];

  // Save progress to localStorage whenever unlockedShapes changes
  useEffect(() => {
    localStorage.setItem("unlockedShapes", JSON.stringify(unlockedShapes));
    console.log("Progress saved to localStorage:", unlockedShapes);
  }, [unlockedShapes]);

  // Set initial target image to the first unlocked shape
  useEffect(() => {
    if (unlockedShapes.length > 0) {
      const firstUnlockedIndex = unlockedShapes[0];
      if (shapes[firstUnlockedIndex]) {
        setSelectedImage(shapes[firstUnlockedIndex].image);
      }
    }
  }, []);

  // Debug: Track AIGeneratedimg state changes
  useEffect(() => {
    console.log("🔍 AIGeneratedimg state changed:", AIGeneratedimg);
  }, [AIGeneratedimg]);

  // Cleanup: Stop speech when component unmounts
  useEffect(() => {
    return () => {
      if (isSpeaking) {
        stopSpeech();
        console.log("🎤 Speech stopped on component unmount");
      }
      // Cleanup blob URLs to prevent memory leaks
      if (AIGeneratedimg && AIGeneratedimg.startsWith('blob:')) {
        URL.revokeObjectURL(AIGeneratedimg);
        console.log("🧙 Cleaned up blob URL on unmount");
      }
    };
  }, [isSpeaking, AIGeneratedimg]);

  const handleShapeClick = (image, index) => {
    if (unlockedShapes.includes(index)) {
      // Stop any ongoing speech
      if (isSpeaking) {
        stopSpeech();
        setIsSpeaking(false);
      }
      
      setSelectedImage(image); // Set the target image
      setComparisonResult(null); // Clear previous comparison when selecting new target
      setResult(null); // Clear previous results
      setHasComparedCurrentGeneration(false); // Reset comparison flag for new target
      playClickSound(); // Play click sound when shape is successfully clicked
      
      console.log(`🎯 Shape ${shapes[index].name} clicked! Setting target image:`, image);
      console.log("📊 Target image set. Generate an image to start comparison.");
    } else {
      console.log("Shape is locked");
    }
  };

  // const handleGenImg = (image) => {
  //   setAIGeneratedimg(image);
  //   // Clear any previous comparison result when setting new generated image
  //   // setComparisonResult(null);
  // };

  // // Image comparison function
  // const compareImages = async (targetImage, generatedImage) => {
  //   if (!targetImage || !generatedImage) return;
    
  //   setIsComparing(true);
  //   setComparisonResult(null);
    
  //   try {
  //     console.log("Starting image comparison...");
  //     console.log("Target:", targetImage);
  //     console.log("Generated:", generatedImage);
      
  //     const result = await computeMSSSIM(targetImage, generatedImage);
  //     setComparisonResult(result);
  //     console.log("MS-SSIM Comparison Result:", result);
  //   } catch (error) {
  //     console.error("Error comparing images:", error);
  //     const errorResult = { 
  //       error: "Failed to compare images: " + error.message,
  //       percentage: 0 
  //     };
  //     setComparisonResult(errorResult);
  //   } finally {
  //     setIsComparing(false);
  //   }
  // };

  // // Effect to automatically compare when both images are available AND generation is complete
  // useEffect(() => {
  //   if (selectedImage && AIGeneratedimg && !isGenerating && !isComparing) {
  //     console.log("Auto-comparing images after generation completed...");
  //     handleComparison(selectedImage, AIGeneratedimg);
  //   }
  // }, [selectedImage, AIGeneratedimg, isGenerating]);

  // // Check for progression after comparison
  // useEffect(() => {
  //   if (comparisonResult && !comparisonResult.error && comparisonResult.percentage >= 70) {
  //     // Find which challenge the user just completed based on the selected image
  //     const currentChallengeIndex = shapes.findIndex(shape => shape.image === selectedImage);
      
  //     console.log("Progression check:", {
  //       currentChallengeIndex,
  //       unlockedShapes,
  //       percentage: comparisonResult.percentage
  //     });
      
  //     // Only proceed if we found a valid challenge index
  //     if (currentChallengeIndex !== -1) {
  //       const nextChallengeIndex = currentChallengeIndex + 1;
        
  //       // Only unlock next challenge if:
  //       // 1. There is a next challenge (not at the end)
  //       // 2. The next challenge is not already unlocked
  //       // 3. The current challenge was already unlocked (user didn't somehow complete a locked challenge)
  //       if (nextChallengeIndex < shapes.length && 
  //           !unlockedShapes.includes(nextChallengeIndex) && 
  //           unlockedShapes.includes(currentChallengeIndex)) {
          
  //         console.log(`Unlocking challenge ${nextChallengeIndex} after completing challenge ${currentChallengeIndex}`);
          
  //         setTimeout(() => {
  //           setUnlockedShapes(prev => {
  //             const newUnlocked = [...prev, nextChallengeIndex];
  //             console.log("New unlocked shapes:", newUnlocked);
  //             return newUnlocked;
  //           });
  //           setShowUnlockNotification(true);
            
  //           // Hide notification after 3 seconds
  //           setTimeout(() => {
  //             setShowUnlockNotification(false);
  //           }, 3000);
            
  //           playSuccessSound();
  //         }, 1000); // Delay to let user see the result first
  //       } else {
  //         console.log("No progression needed:", {
  //           nextChallengeIndex,
  //           shapesLength: shapes.length,
  //           nextAlreadyUnlocked: unlockedShapes.includes(nextChallengeIndex),
  //           currentIsUnlocked: unlockedShapes.includes(currentChallengeIndex)
  //         });
  //       }
  //     }
  //   }
  // }, [comparisonResult, unlockedShapes, shapes, selectedImage]);
  // const generateWithPollinations = async (prompt) => {
  //   const width = 1024;
  //   const height = 1024;
  //   const seed = 42;
  //   const model = "flux";
    
  //   const encodedPrompt = encodeURIComponent(prompt);
  //   const params = new URLSearchParams({
  //     width: width,
  //     height: height,
  //     seed: seed,
  //     model: model,
  //     nologo: 'true'
  //   });
    
  //   const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`;
    
  //   // Create image with proper loading
  //   const img = new Image();
  //   img.crossOrigin = "anonymous";
    
  //   const imageLoadPromise = new Promise((resolve, reject) => {
  //     img.onload = () => {
  //       console.log("Pollinations image loaded successfully");
  //       resolve();
  //     };
      
  //     img.onerror = (error) => {
  //       console.warn("Failed to load Pollinations image:", error);
  //       resolve(); // Still resolve to continue the flow
  //     };
      
  //     img.src = imageUrl;
  //   });
    
  //   await imageLoadPromise;
  //   return imageUrl;
  // };

  // const generateWithClipDrop = async (prompt) => {
  //   // Note: You'll need to add your ClipDrop API key here
  //   // const API_KEY = '29da0145f174361bd87d07659016867767d8cb1b8a7cbf2376ddab617f3b7dca4effe88696214e2f5dd8efe7357a1e84'; // Replace with your actual API key

  //   const API_KEY = 'fc6c83f512362814d41b52eaec726a250e8561f0ed992e9dfdc3339846b41f1928a70b5b782b611403129be2f58a594c';
  //   const form = new FormData();
  //   form.append('prompt', prompt);
    
  //   try {
  //     const response = await fetch('https://clipdrop-api.co/text-to-image/v1', {
  //       method: 'POST',
  //       headers: {
  //         'x-api-key': API_KEY,
  //       },
  //       body: form,
  //     });
      
  //     if (!response.ok) {
  //       throw new Error(`ClipDrop API error: ${response.status}`);
  //     }
      
  //     const buffer = await response.arrayBuffer();
  //     const blob = new Blob([buffer], { type: 'image/png' });
  //     const imageUrl = URL.createObjectURL(blob);
      
  //     console.log("ClipDrop image generated successfully");
  //     return imageUrl;
  //   } catch (error) {
  //     console.error("Error generating with ClipDrop:", error);
  //     throw error;
  //   }
  // };
  
  const generateWithClipDrop = async (prompt) => {
    // Note: You'll need to add your ClipDrop API key here

    const API_KEY = 'fc6c83f512362814d41b52eaec726a250e8561f0ed992e9dfdc3339846b41f1928a70b5b782b611403129be2f58a594c'; // Replace with your actual API key
    
    
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
  const LoaderComponent = () => {
    console.log("⌛ Loader component rendered - isGenerating:", isGenerating);
    return (
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
  };
  const generate_img = async (prompt) => {
    console.log("🎨 Starting image generation with prompt:", prompt);
    
    // Use the simplified generation pattern
    const width = 1024;
    const height = 1024;
    const seed = Math.floor(Math.random() * 1000);
    const encodedPrompt = encodeURIComponent(prompt);
    const params = new URLSearchParams({
        width: width,
        height: height,
        seed: seed,
        model: "flux",
        nologo: 'true'
    });
    
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`;
    
    console.log("✅ Image URL generated:", imageUrl);
    return imageUrl;
  };


// Helper function to validate generation prerequisites
const canStartGeneration = (prompt, isGenerating) => {
  if (!prompt.trim() || isGenerating) {
    console.log("⚠️ Generation blocked - empty prompt or already generating");
    return false;
  }
  return true;
};

// Helper function to stop ongoing speech and cleanup
const stopOngoingSpeech = (isSpeaking, stopSpeech, setIsSpeaking) => {
  if (isSpeaking) {
    stopSpeech();
    setIsSpeaking(false);
    console.log("🎤 Stopped speech for new generation");
  }
};

// Helper function to cleanup previous resources
const cleanupPreviousResources = (AIGeneratedimg) => {
  if (AIGeneratedimg && AIGeneratedimg.startsWith('blob:')) {
    URL.revokeObjectURL(AIGeneratedimg);
    console.log("🧙 Cleaned up previous blob URL");
  }
};

// Helper function to reset generation state
const resetGenerationState = (setters) => {
  const {
    setIsGenerating,
    setIsImageLoading,
    setAIGeneratedimg,
    setResult,
    setHasComparedCurrentGeneration
  } = setters;

  console.log("🚀 Starting new image generation - Resetting comparison flag");
  setIsGenerating(true);
  setIsImageLoading(true);
  setAIGeneratedimg(null);
  setResult(null);
  setHasComparedCurrentGeneration(false);
};

// Helper function to play generation sound safely
const playGenerationSoundSafely = (playGenerationStartSound) => {
  try {
    playGenerationStartSound();
  } catch (error) {
    console.warn("Sound generation failed:", error);
  }
};

// Helper function to generate image based on selected model
const generateImageByModel = async (selectedModel, prompt, generate_img, generateWithClipDrop) => {
  let imageUrl;
  
  if (selectedModel === "pollinations") {
    console.log("📸 Generating with Pollinations AI...");
    imageUrl = await generate_img(prompt);
  } else if (selectedModel === "clipdrop") {
    console.log("📸 Generating with ClipDrop AI...");
    imageUrl = await generateWithClipDrop(prompt);
  } else {
    throw new Error(`Unknown model: ${selectedModel}`);
  }
  
  return imageUrl;
};

// Helper function to handle image loading and comparison
const handleImageLoadingAndComparison = (imageUrl, setters, comparisonParams) => {
  const { setAIGeneratedimg, setIsImageLoading, setHasComparedCurrentGeneration } = setters;
  const { selectedImage, handleComparison, setIsComparing, setResult, speechEnabled, speakFeedback } = comparisonParams;
  
  console.log("✅ Image generation successful - displaying immediately");
  setAIGeneratedimg(imageUrl);
  
  // Always check if we have selectedImage for comparison, ignore hasComparedCurrentGeneration flag here
  // since we already reset it at the start of generation
  if (selectedImage) {
    console.log("🔍 Selected image found, starting comparison flow...");
    setHasComparedCurrentGeneration(true);
    handleImageComparisonFlow(imageUrl, setIsImageLoading, comparisonParams);
  } else {
    console.log("📷 No selected image, skipping comparison...");
    handleSimpleImageLoad(imageUrl, setIsImageLoading);
  }
};

// Helper function to handle image comparison flow
const handleImageComparisonFlow = (imageUrl, setIsImageLoading, comparisonParams) => {
  const { selectedImage, handleComparison, setIsComparing, setResult, speechEnabled, speakFeedback } = comparisonParams;
  
  console.log("🔄 Waiting for image to load before comparison...");
  
  const img = new Image();
  img.onload = async () => {
    console.log("🖼️ Image fully loaded, starting comparison...");
    setIsImageLoading(false);
    await performComparison(imageUrl, selectedImage, handleComparison, setIsComparing, setResult, speechEnabled, speakFeedback);
  };
  
  img.onerror = () => {
    console.error("❌ Failed to load generated image for comparison");
    setResult({ error: "Failed to load image", combined: 0 });
    setIsComparing(false);
    setIsImageLoading(false);
  };
  
  img.src = imageUrl;
};

// Helper function to perform the actual comparison
const performComparison = async (imageUrl, selectedImage, handleComparison, setIsComparing, setResult, speechEnabled, speakFeedback) => {
  try {
    setIsComparing(true);
    const comparisonResult = await handleComparison(imageUrl, selectedImage);
    
    if (comparisonResult && comparisonResult.result) {
      console.log("✅ Comparison completed:", comparisonResult);
      setResult(comparisonResult);
      handleSpeechFeedback(comparisonResult, speechEnabled, speakFeedback);
    } else {
      console.warn("Comparison failed");
      setResult({ error: "Comparison failed", combined: 0 });
    }
  } catch (error) {
    console.error("Comparison error:", error);
    setResult({ error: "Comparison failed", combined: 0 });
  } finally {
    setIsComparing(false);
  }
};

// Helper function to handle speech feedback
const handleSpeechFeedback = (comparisonResult, speechEnabled, speakFeedback) => {
  if (speechEnabled) {
    const score = comparisonResult.result.combined || comparisonResult.combined || 0;
    if (score > 0.7 || score > 70) {
      try {
        speakFeedback(comparisonResult);
      } catch (error) {
        console.warn("Speech failed:", error);
      }
    }
  }
};

// Helper function to handle simple image loading (no comparison)
const handleSimpleImageLoad = (imageUrl, setIsImageLoading) => {
  const img = new Image();
  img.onload = () => setIsImageLoading(false);
  img.onerror = () => setIsImageLoading(false);
  img.src = imageUrl;
};

// Helper function to handle generation errors
const handleGenerationError = (error, setters) => {
  const { setAIGeneratedimg, setIsImageLoading, setHasComparedCurrentGeneration, setIsGenerating } = setters;
  
  console.error("Error generating image:", error);
  setAIGeneratedimg(null);
  setIsImageLoading(false);
  setHasComparedCurrentGeneration(false);
  setIsGenerating(false);
};

// Main refactored function - now much cleaner and focused
const handleGenerateClick = async () => {
  // Validation
  if (!canStartGeneration(prompt, isGenerating)) return;
  
  // Cleanup and preparation
  stopOngoingSpeech(isSpeaking, stopSpeech, setIsSpeaking);
  cleanupPreviousResources(AIGeneratedimg);
  
  // State management
  const stateSetters = {
    setIsGenerating,
    setIsImageLoading,
    setAIGeneratedimg,
    setResult,
    setHasComparedCurrentGeneration
  };
  resetGenerationState(stateSetters);
  
  // Sound feedback
  playGenerationSoundSafely(playGenerationStartSound);
  
  try {
    // Image generation
    const imageUrl = await generateImageByModel(selectedModel, prompt, generate_img, generateWithClipDrop);
    
    if (imageUrl) {
      // Comparison parameters - removed hasComparedCurrentGeneration from params
      const comparisonParams = {
        selectedImage,
        handleComparison,
        setIsComparing,
        setResult,
        speechEnabled,
        speakFeedback
      };
      
      handleImageLoadingAndComparison(imageUrl, stateSetters, comparisonParams);
    } else {
      console.error("Image generation failed - no URL returned");
    }
    
  } catch (error) {
    handleGenerationError(error, stateSetters);
  } finally {
    console.log("Image generation complete");
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
                
                {/* Speech Control Toggle */}
                <motion.button
                  onClick={() => {
                    if (isSpeaking) {
                      stopSpeech();
                      setIsSpeaking(false);
                    }
                    setSpeechEnabled(!speechEnabled);
                    console.log(`🎤 Speech feedback ${!speechEnabled ? 'enabled' : 'disabled'}`);
                  }}
                  className={`speech-toggle ${speechEnabled ? 'enabled' : 'disabled'}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={speechEnabled ? 'Disable voice feedback' : 'Enable voice feedback'}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: speechEnabled ? '#10b981' : '#6b7280',
                    color: 'white',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>{speechEnabled ? '🎤' : '🅾️'}</span>
                  <span>{isSpeaking ? 'Speaking...' : (speechEnabled ? 'Voice On' : 'Voice Off')}</span>
                </motion.button>
                
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
                {(isGenerating || isImageLoading) && <LoaderComponent />}
              </AnimatePresence>
              {(() => {
                // console.log("Render check - AIGeneratedimg:", !!AIGeneratedimg, "isGenerating:", isGenerating, "isImageLoading:", isImageLoading);
                
                if (AIGeneratedimg && !isGenerating && !isImageLoading) {
                  return (
                    <motion.div 
                      className="image-display"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }} // Faster animation
                      key={AIGeneratedimg} // Force re-render when URL changes
                    >
                      <img 
                        src={AIGeneratedimg} 
                        alt="AI Generated" 
                        onLoad={() => {
                          console.log("🖼️ Image loaded successfully");
                          setIsImageLoading(false);
                        }} 
                        onError={(e) => {
                          console.error("Image load failed:", e);
                          setIsImageLoading(false);
                        }}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                          display: 'block'
                        }}
                      />
                    </motion.div>
                  );
                } else if (isGenerating || isImageLoading) {
                  // Show loading state - loader is handled above in AnimatePresence
                  return null;
                } else {
                  return (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      height: '100%',
                      color: '#999',
                      textAlign: 'center'
                    }}>
                      <p>Generated image will appear here</p>
                      <small style={{ marginTop: '8px', fontSize: '0.9em' }}>
                        Enter a prompt and click "Generate Image"
                      </small>
                    </div>
                  );
                }
              })()}
            </div>
            
            <div className="feedback-placeholder">
              {isComparing ? (
                <motion.div 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    color: '#007bff',
                    textAlign: 'center'
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div 
                    style={{
                      width: '50px',
                      height: '50px',
                      border: '4px solid #e3f2fd',
                      borderTop: '4px solid #007bff',
                      borderRadius: '50%',
                      marginBottom: '20px'
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div 
                    style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🔍 Analyzing Images
                  </motion.div>
                  <motion.div 
                    style={{ fontSize: '14px', opacity: 0.8, lineHeight: '1.4' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    transition={{ delay: 0.3 }}
                  >
                    Using MS-SSIM algorithm to compare<br/>
                    target vs generated image
                    {speechEnabled && (
                      <motion.div
                        style={{ 
                          marginTop: '8px', 
                          fontSize: '12px', 
                          color: '#10b981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <span>🎤</span>
                        <span>Voice feedback ready</span>
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>
              ) : (
                <FeedbackComponent 
                  selectedImage={selectedImage}
                  comparisonResult={result}
                  isComparing={isComparing}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}