// HangingShapes.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProgressTracker from "./ProgressTracker";
import { computeMSSSIM, getQualityDescription, formatDetailedScores } from "../utils/imageComparison";
import { generateWithClipDrop,generateWithPollinations } from "./Image_models";
import "./HangingShapes.css";
import image1 from "../assets/car.jpg";
import image2 from "../assets/horse.jpg";
import image3 from "../assets/line_mountain.jpg";
import image4 from "../assets/oul.jpg";
import image5 from "../assets/sheep.avif";
import FeedbackComponent from "./FeedbackComponent";
import image6 from "./images/car.png";
import image7 from "./images/foxes.png";
import image8 from "./images/llama.jpg";
import image9 from "./images/owl.png";
import image10 from "./images/van.jpg";
import handleComparison from "./Comparison_req";
import { playClickSound,playGenerationStartSound,playSuccessSound,createCheerSound,createVictorySound,createClickSound,createGenerationStartSound } from "./Sound_Generation";

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
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [result, setResult] = useState(null)
  const [selectedModel, setSelectedModel] = useState("pollinations");
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

  // // Save progress to localStorage whenever unlockedShapes changes
  useEffect(() => {
    localStorage.setItem("unlockedShapes", JSON.stringify(unlockedShapes));
    console.log("Progress saved to localStorage:", unlockedShapes);
  }, [unlockedShapes]);

  // // Cleanup on component unmount
  // useEffect(() => {
  //   return () => {
  //     // Cleanup function if needed
  //   };
  // }, []);

  // const images = [image1, image2, image3, image4, image5,image6,image7,image8,image9,image10];
  const images = [image6,image7,image8,image9,image10];

  // Pick a random image from `images`
   function pickRandomImage() {
    const randomIndex = Math.floor(Math.random() * images.length);
    setSelectedImage(images[randomIndex]);
  }

  // On mount → automatically set a random image
  useEffect(() => {
    pickRandomImage();
  }, []);

  const handleShapeClick = (image, index) => {
    if (unlockedShapes.includes(index)) {
      // setSelectedImage(image);
      setComparisonResult(null); // Clear previous comparison when selecting new target
      playClickSound(); // Play click sound when shape is successfully clicked
      
      // If there's already a generated image, compare with the new target
      if (AIGeneratedimg && !isGenerating && !isComparing) {
        setTimeout(() => {
          console.log("Comparing with new target image...",image,AIGeneratedimg);
          handleComparison(image,AIGeneratedimg);
        }, 300);
      }
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
    
    const imageLoadPromise = new Promise((resolve, reject) => {
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
  const generate_img = () => {
    const width = 1024;
    const height = 1024;
    const seed = 42;
    const model = "flux";
    const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=${model}`;
  // Writing the buffer to a file named 'image.png'
    console.log("Generate image with prompt:", imageUrl);
    setAIGeneratedimg(imageUrl);
  };


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
        imageUrl = generate_img(prompt);
      } else if (selectedModel === "clipdrop") {
        imageUrl = await generateWithClipDrop(prompt);
      }

      console.log("Generated image with", selectedModel, ":", imageUrl);
      
      // Trigger comparison after a short delay to ensure state is updated
    //   setTimeout(() => {
    //     if (selectedImage) {
    //       // console.log("Triggering MS-SSIM comparison after image generation...");
    //       console.log("The Images are ",selectedImage,imageUrl)
    //       // handleComparison(imageUrl,selectedImage);
    //     }
    //   }, 500);
    } catch (error) {
      console.error("Error generating image:", error);
      // setComparisonResult({ 
      //   error: `Failed to generate image with ${selectedModel}: ${error.message}`,
      //   percentage: 0 
      // });
    } finally {
      setIsGenerating(false);
    }
  };
const onCompareClick = async () => {
    try {
      const comparisonresult = await handleComparison(AIGeneratedimg, selectedImage);
      console.log(comparisonresult)
      if (comparisonresult) {
        setResult(comparisonresult);
        // setComparisonResult(comparisonResult.result)
        // console.log(`The comparison Result is ${result["combined"]}`)
      }
    } catch (error) {
      alert("Error comparing images!",error);
      console.log(error)
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
            <button onClick = {onCompareClick}> Generate feedback</button>
            <div className="feedback-placeholder">
              <FeedbackComponent 
                selectedImage={selectedImage}
                comparisonResult={result}
                isComparing={isComparing}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}