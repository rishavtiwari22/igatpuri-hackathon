// HangingShapes.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProgressTracker from "./ProgressTracker";
import { generateWithClipDrop } from "./Image_models";
import "./HangingShapes.css";
import image1 from "../assets/car.jpg";
import image2 from "../assets/horse.jpg";
import image3 from "../assets/line_mountain.jpg";
import image4 from "../assets/oul.jpg";
import image5 from "../assets/sheep.avif";
import FeedbackComponent from "./FeedbackComponent";
import handleComparison from "./Comparison_req";
import { playClickSound, playGenerationStartSound } from "./Sound_Generation";
import voiceManager from "../utils/voiceManager";
import { useAuth } from "../contexts/AuthContext";
import { useFirebaseProgress } from "../hooks/useFirebaseProgress";
import UserProfile from "./UserProfile";
import { 
  trackImageGeneration, 
  trackImageComparison, 
  trackGameProgress,
  trackGameCompletion,
  trackButtonClick,
  trackError,
  trackEngagement
} from "../utils/analyticsService";

const shapes = [
  { type: "circle", left: "10%", rope: "rope-1", image: image1, name: "Car" },
  { type: "square", left: "25%", rope: "rope-2", image: image2, name: "Horse" },
  { type: "triangle", left: "40%", rope: "rope-3", image: image3, name: "Mountain" },
  { type: "diamond", left: "55%", rope: "rope-4", image: image4, name: "Owl" },
  { type: "hexagon", left: "70%", rope: "rope-5", image: image5, name: "Sheep" },
];


export default function HangingShapes() {
  const { user } = useAuth();
  const { 
    progressData, 
    unlockedShapes, 
    updateProgressData, 
    updateUnlockedShapes, 
    isLoading: isProgressLoading,
    isSaving: isProgressSaving,
    syncError,
    lastSyncTime
  } = useFirebaseProgress();

  const [selectedImage, setSelectedImage] = useState(null);
  const [AIGeneratedimg, setAIGeneratedimg] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [result, setResult] = useState(null)
  const [selectedModel, setSelectedModel] = useState("pollinations");
  const [hasComparedCurrentGeneration, setHasComparedCurrentGeneration] = useState(false); // Flag to prevent multiple comparisons
  const [voiceEnabled, setVoiceEnabled] = useState(true); // Voice feedback preference
  const [isVoicePlaying, setIsVoicePlaying] = useState(false); // Voice status
  const [isImageLoading, setIsImageLoading] = useState(false); // Image loading status
  const [showUnlockNotification, setShowUnlockNotification] = useState(false);
  const [unlockNotificationData, setUnlockNotificationData] = useState({
    type: 'normal', // 'normal', 'auto', 'final'
    score: 0,
    challengeName: ''
  });
  const [isAutoProgressing, setIsAutoProgressing] = useState(false); // Auto-progression loading state
  const [showUserProfile, setShowUserProfile] = useState(false); // User profile modal state
  const [showSyncStatus, setShowSyncStatus] = useState(false); // Sync status notification visibility


  // Available models for image generation
  const availableModels = [
    { id: "pollinations", name: "Pollinations AI", description: "Fast and reliable" },
    { id: "clipdrop", name: "ClipDrop", description: "High quality results" }
  ];

  // Set initial target image to the first unlocked shape
  useEffect(() => {
    if (unlockedShapes.length > 0 && !isProgressLoading) {
      const firstUnlockedIndex = unlockedShapes[0];
      
      if (shapes[firstUnlockedIndex]) {
        setSelectedImage(shapes[firstUnlockedIndex].image);
      }
    }
  }, [unlockedShapes, isProgressLoading]); // Now depends on both unlockedShapes and loading state

  // Ensure first challenge is unlocked if no progress exists
  useEffect(() => {
    try {
      if (typeof updateUnlockedShapes === 'function' && unlockedShapes.length === 0 && !isProgressLoading) {
        // Only unlock the first challenge (index 0) if no progress exists
        updateUnlockedShapes([0]);
      }
    } catch (err) {
      console.warn('Failed to unlock first challenge:', err);
    }
  }, [updateUnlockedShapes, isProgressLoading]); // Remove unlockedShapes.length from dependencies to prevent infinite loop

  // PRACTICE MODE: Unlock all challenges for practice (optional - comment out for sequential progression)
  useEffect(() => {
    try {
      if (typeof updateUnlockedShapes === 'function' && !isProgressLoading && unlockedShapes.length <= 1) {
        // Unlock all challenges for practice mode, but only if we haven't already done so
        const allIndices = shapes.map((_, index) => index);
        updateUnlockedShapes(allIndices);
      }
    } catch (err) {
      console.warn('Failed to unlock all challenges for practice:', err);
    }
  }, [updateUnlockedShapes, isProgressLoading]); // Remove unlockedShapes from dependencies

  // Firebase sync status logging
  useEffect(() => {
    // Reduced excessive sync status logging for production
  }, [user, isProgressLoading, isProgressSaving, syncError, unlockedShapes, progressData]);

  // Debug: Track AIGeneratedimg state changes
  useEffect(() => {
    // Removed excessive state change logging
  }, [AIGeneratedimg]);

  // Cleanup: Stop voice when component unmounts
  useEffect(() => {
    return () => {
      if (isVoicePlaying) {
        voiceManager.stopCurrentAudio();
      }
      // Cleanup blob URLs to prevent memory leaks
      if (AIGeneratedimg && AIGeneratedimg.startsWith('blob:')) {
        URL.revokeObjectURL(AIGeneratedimg);
      }
    };
  }, [isVoicePlaying, AIGeneratedimg]);

  // Track game session start time and engagement
  useEffect(() => {
    if (!sessionStorage.getItem('gameStartTime')) {
      sessionStorage.setItem('gameStartTime', Date.now().toString());
    }
    
    // Track app launch
    trackEngagement('app_launched');
  }, []);

  // Track engagement when user interacts with the app
  useEffect(() => {
    const handleUserInteraction = () => {
      trackEngagement('user_active');
    };

    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  // Startup voice - play welcome/startup voice when app loads
  useEffect(() => {
    const hasPlayedStartup = sessionStorage.getItem('hasPlayedStartupVoice');
    
    if (!hasPlayedStartup && voiceEnabled) {
      // Delay startup voice to ensure component is fully loaded
      const timer = setTimeout(async () => {
        try {
          setIsVoicePlaying(true);
          await voiceManager.playStartupVoice();
          sessionStorage.setItem('hasPlayedStartupVoice', 'true');
        } catch (error) {
          console.warn("🎵 Startup voice failed:", error);
        } finally {
          setIsVoicePlaying(false);
        }
      }, 1500); // Wait 1.5 seconds after component mount
      
      return () => clearTimeout(timer);
    }
  }, []); // Only run once on mount



  const handleShapeClick = (image, index) => {
    // Normalize index and unlockedShapes to numbers to avoid string/number mismatch
    const numericIndex = Number(index);
    const unlockedArr = Array.isArray(unlockedShapes) ? unlockedShapes.map(Number) : [];
    const isUnlocked = unlockedArr.includes(numericIndex);

    // PRACTICE MODE: Allow clicking any shape (comment out the return statement below for sequential mode)
    // if (!isUnlocked) {
    //   console.log(`🔒 Shape ${shapes[numericIndex]?.name || numericIndex} is locked! Complete previous challenges to unlock.`);
    //   return; // Block the click for locked challenges
    // }

    // SEQUENTIAL MODE: Only allow clicking unlocked challenges (uncomment the lines above for this mode)
    // Currently in practice mode - all shapes are clickable

    // Stop any ongoing voice
    if (isVoicePlaying) {
      try { voiceManager.stopCurrentAudio(); } catch (e) { console.warn('Failed to stop voice:', e); }
      setIsVoicePlaying(false);
    }

    const shape = shapes[numericIndex] || shapes[index];

    // Track shape selection
    const shapeName = shapes.find(s => s.image === image)?.name || 'unknown';
    trackButtonClick(`hanging_shape_${shapeName.toLowerCase()}`, 'hanging_shapes');
    
    // Allow selecting shape
    setSelectedImage(image);
    setHasComparedCurrentGeneration(false);
    try { playClickSound(); } catch (e) { /* ignore sound errors */ }

    // Restore stored generated image and comparison result if available
    const storedProgress = progressData && progressData[numericIndex];
    if (storedProgress && storedProgress.generatedImage) {
      setAIGeneratedimg(storedProgress.generatedImage);
      setResult(storedProgress.lastComparisonResult || null);
    } else {
      setAIGeneratedimg(null);
      setResult(null);
    }

    setPrompt("");

    if (!isUnlocked) {
      // Practice mode - shape was previously locked but opened for practice
    }

    // Show progress data if available
    if (progressData && progressData[numericIndex]) {
      // Progress data available for this challenge
    }
  };

  // Handle shape navigation from progress tracker
  const handleProgressShapeClick = (index) => {
    const numericIndex = Number(index);
    const unlockedArr = Array.isArray(unlockedShapes) ? unlockedShapes.map(Number) : [];
    const isUnlocked = unlockedArr.includes(numericIndex);

    // PRACTICE MODE: Allow clicking any shape from progress tracker (comment out the return statement below for sequential mode)
    // if (!isUnlocked) {
    //   console.log(`🔒 Progress tracker: Shape ${shapes[numericIndex]?.name || numericIndex} is locked! Complete previous challenges to unlock.`);
    //   return; // Block the click for locked challenges
    // }

    // SEQUENTIAL MODE: Only allow clicking unlocked challenges (uncomment the lines above for this mode)
    // Currently in practice mode - all shapes are clickable

    // Stop any ongoing voice
    if (isVoicePlaying) {
      try { voiceManager.stopCurrentAudio(); } catch (e) { console.warn('Failed to stop voice:', e); }
      setIsVoicePlaying(false);
    }

    const shape = shapes[numericIndex] || shapes[index];

    // Track shape selection
    trackButtonClick(`shape_${shape.name.toLowerCase()}`, 'progress_tracker');
    
    // Navigate to challenge
    setSelectedImage(shape.image);
    setHasComparedCurrentGeneration(false);
    try { playClickSound(); } catch (e) { /* ignore sound errors */ }

    // Restore stored generated image and comparison result if available
    const storedProgress = progressData && progressData[numericIndex];
    if (storedProgress && storedProgress.generatedImage) {
      setAIGeneratedimg(storedProgress.generatedImage);
      setResult(storedProgress.lastComparisonResult || null);
    } else {
      setAIGeneratedimg(null);
      setResult(null);
    }

    setPrompt("");

    if (!isUnlocked) {
      // Practice mode - shape was previously locked but opened for practice
    }

    // Show progress data if available
    if (progressData && progressData[numericIndex]) {
      // Progress data available for this challenge
    }
  };



  // Loader Component
  const LoaderComponent = () => {
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
    try {
      // Use the simplified generation pattern with better error handling
      const width = 1024;
      const height = 1024;
      const seed = Math.floor(Math.random() * 1000);
      const encodedPrompt = encodeURIComponent(prompt);
      
      // Try multiple URL formats for better compatibility
      const urlFormats = [
        // Most basic format (try this first since it's working)
        () => `https://image.pollinations.ai/prompt/${encodedPrompt}`,
        // Simplified format with minimal parameters
        () => `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}`,
        // With seed but no model
        () => `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}`,
        // Alternative format without model parameter
        () => {
          const params = new URLSearchParams({
            width: width,
            height: height,
            seed: seed,
            nologo: 'true'
          });
          return `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`;
        }
      ];
      
      // Try each URL format
      for (let i = 0; i < urlFormats.length; i++) {
        const imageUrl = urlFormats[i]();
        
        try {
          // Test if the URL is accessible
          const isAccessible = await new Promise((resolve) => {
            const testImg = new Image();
            testImg.crossOrigin = "anonymous";
            
            const timeout = setTimeout(() => {
              resolve(false);
            }, 8000); // Increased to 8 seconds to allow for generation time
            
            testImg.onload = () => {
              clearTimeout(timeout);
              resolve(true);
            };
            
            testImg.onerror = (error) => {
              clearTimeout(timeout);
              resolve(false);
            };
            
            testImg.src = imageUrl;
          });
          
          if (isAccessible) {
            return imageUrl;
          }
        } catch (error) {
          // Continue to next format
        }
      }
      
      // If all Pollinations URLs fail, throw error to trigger ClipDrop fallback
      throw new Error("All Pollinations URL formats failed");
      
    } catch (error) {
      console.error("❌ Error in generate_img:", error);
      throw error;
    }
  };


// Helper function to validate generation prerequisites
const canStartGeneration = (prompt, isGenerating) => {
  if (!prompt.trim() || isGenerating) {
    return false;
  }
  return true;
};

// Helper function to stop ongoing voice and cleanup
const stopOngoingVoice = (isVoicePlaying, voiceManager, setIsVoicePlaying) => {
  if (isVoicePlaying) {
    voiceManager.stopCurrentAudio();
    setIsVoicePlaying(false);
  }
};

// Helper function to cleanup previous resources
const cleanupPreviousResources = (AIGeneratedimg) => {
  if (AIGeneratedimg && AIGeneratedimg.startsWith('blob:')) {
    URL.revokeObjectURL(AIGeneratedimg);
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

  setIsGenerating(true);
  setIsImageLoading(true);
  setAIGeneratedimg(null);
  setResult(null);
  setHasComparedCurrentGeneration(false);
};

// Helper function to play generation sound and voice safely
const playGenerationSoundAndVoice = async (playGenerationStartSound, voiceManager, voiceEnabled, setIsVoicePlaying) => {
  try {
    // Play the synthetic sound effect
    playGenerationStartSound();
    
    // Play generating voice if voice is enabled
    if (voiceEnabled) {
      setIsVoicePlaying(true);
      
      setTimeout(async () => {
        try {
          await voiceManager.playGeneratingVoice();
        } catch (error) {
          console.warn("Generating voice failed:", error);
        } finally {
          setIsVoicePlaying(false);
        }
      }, 500); // Small delay to let sound effect start first
    }
  } catch (error) {
    console.warn('Generation sound/voice failed:', error);
    setIsVoicePlaying(false);
  }
};

// Helper function to generate image based on selected model
const generateImageByModel = async (selectedModel, prompt, generate_img, generateWithClipDrop) => {
  let imageUrl;
  
  try {
    if (selectedModel === "pollinations") {
      imageUrl = await generate_img(prompt);
    } else if (selectedModel === "clipdrop") {
      imageUrl = await generateWithClipDrop(prompt);
    } else {
      throw new Error(`Unknown model: ${selectedModel}`);
    }
    
    return imageUrl;
  } catch (error) {
    console.error(`${selectedModel} generation failed:`, error);
    
    // If Pollinations fails, automatically try ClipDrop as fallback
    if (selectedModel === "pollinations") {
      try {
        imageUrl = await generateWithClipDrop(prompt);
        return imageUrl;
      } catch (fallbackError) {
        console.error("ClipDrop fallback also failed:", fallbackError);
        throw new Error("Both Pollinations and ClipDrop failed");
      }
    } else {
      // If ClipDrop fails, try Pollinations as fallback
      try {
        imageUrl = await generate_img(prompt);
        return imageUrl;
      } catch (fallbackError) {
        console.error("Pollinations fallback also failed:", fallbackError);
        throw new Error("Both ClipDrop and Pollinations failed");
      }
    }
  }
};

// Helper function to handle image loading and comparison
const handleImageLoadingAndComparison = (imageUrl, setters, comparisonParams) => {
  const { setAIGeneratedimg, setIsImageLoading, setHasComparedCurrentGeneration } = setters;
  const { selectedImage, handleComparison, setIsComparing, setResult, voiceEnabled, voiceManager, setIsVoicePlaying } = comparisonParams;
  
  setAIGeneratedimg(imageUrl);
  
  // Set isImageLoading to false immediately so the image can be displayed
  // The img element's onLoad/onError will handle any additional loading states
  setIsImageLoading(false);
  
  // Always check if we have selectedImage for comparison, ignore hasComparedCurrentGeneration flag here
  // since we already reset it at the start of generation
  if (selectedImage) {
    setHasComparedCurrentGeneration(true);
    handleImageComparisonFlow(imageUrl, setIsImageLoading, comparisonParams);
  }
};

// Helper function to handle image comparison flow
const handleImageComparisonFlow = (imageUrl, setIsImageLoading, comparisonParams) => {
  const { selectedImage, handleComparison, setIsComparing, setResult, voiceEnabled, voiceManager, setIsVoicePlaying, shapes, unlockedShapes, updateUnlockedShapes, setShowUnlockNotification, setSelectedImage: setSelectedImageFunc, updateProgressData, setPrompt, setAIGeneratedimg, setHasComparedCurrentGeneration, setIsAutoProgressing, setUnlockNotificationData } = comparisonParams;
  
  const img = new Image();
  img.onload = async () => {
    setIsImageLoading(false);
    await performComparison(imageUrl, selectedImage, handleComparison, setIsComparing, setResult, voiceEnabled, voiceManager, setIsVoicePlaying, shapes, unlockedShapes, updateUnlockedShapes, setShowUnlockNotification, setSelectedImageFunc, updateProgressData, setPrompt, setAIGeneratedimg, setHasComparedCurrentGeneration, setIsAutoProgressing, setUnlockNotificationData);
  };
  
  img.onerror = () => {
    console.error("❌ Failed to load generated image for comparison");
    setResult({ error: "Failed to load image for comparison, but image may still be visible", combined: 0 });
    setIsComparing(false);
    setIsImageLoading(false);
  };
  
  img.src = imageUrl;
};

// Helper function to perform the actual comparison
const performComparison = async (imageUrl, selectedImage, handleComparison, setIsComparing, setResult, voiceEnabled, voiceManager, setIsVoicePlaying, shapes, unlockedShapes, updateUnlockedShapes, setShowUnlockNotification, setSelectedImageFunc, updateProgressData, setPrompt, setAIGeneratedimg, setHasComparedCurrentGeneration, setIsAutoProgressing, setUnlockNotificationData) => {
  try {
    setIsComparing(true);
    const comparisonResult = await handleComparison(imageUrl, selectedImage);
    
    // Track image comparison
    if (comparisonResult && comparisonResult.percentage) {
      const currentChallengeIndex = shapes.findIndex(shape => shape.image === selectedImage);
      const attempts = (progressData && progressData[currentChallengeIndex]) ? (progressData[currentChallengeIndex].attempts || 0) + 1 : 1;
      trackImageComparison(comparisonResult.percentage, attempts);
    }
    
    // Save progress data for ALL attempts (not just successful auto-progression)
    const currentChallengeIndex = shapes.findIndex(shape => shape.image === selectedImage);
    const saveProgressData = (challengeIndex, percentage, generatedImageUrl = null, comparisonResultData = null) => {
      // Only save progress data for passing scores (≥60%)
      if (percentage >= 60) {
        // Track game progress
        trackGameProgress(challengeIndex + 1, percentage);
        
        updateProgressData(prev => ({
          ...prev,
          [challengeIndex]: {
            challengeName: shapes[challengeIndex].name,
            bestScore: Math.max(prev[challengeIndex]?.bestScore || 0, percentage),
            latestScore: percentage,
            attempts: (prev[challengeIndex]?.attempts || 0) + 1,
            completed: true, // Always true since we only store passing scores
            firstCompletedAt: prev[challengeIndex]?.firstCompletedAt || new Date().toISOString(),
            lastAttemptAt: new Date().toISOString(),
            // Store the generated image URL for passing scores only
            generatedImage: generatedImageUrl || prev[challengeIndex]?.generatedImage,
            // Store the full comparison result for restoring feedback
            lastComparisonResult: comparisonResultData || prev[challengeIndex]?.lastComparisonResult
          }
        }));
      }
    };
    
    // More robust validation for MS-SSIM result structure
    if (comparisonResult) {
      // Check if it has an explicit error
      if (comparisonResult.error) {
        console.warn("❌ Comparison failed with explicit error:", comparisonResult.error);
        const errorMessage = comparisonResult.error;
        setResult({ error: errorMessage, combined: 0, percentage: 0 });
        return;
      }
      
      // Check for any valid score indicators (be more permissive)
      const hasValidPercentage = typeof comparisonResult.percentage === 'number' && !isNaN(comparisonResult.percentage);
      const hasValidCombined = typeof comparisonResult.combined === 'number' && !isNaN(comparisonResult.combined);
      const hasValidMsSSIM = typeof comparisonResult.ms_ssim === 'number' && !isNaN(comparisonResult.ms_ssim);
      const hasAnyResult = comparisonResult.result;
      
      if (hasValidPercentage || hasValidCombined || hasValidMsSSIM || hasAnyResult) {
        // Normalize the result structure for the UI
        const normalizedResult = {
          ...comparisonResult,
          // Ensure combined is available (0-1 scale for UI compatibility)
          combined: comparisonResult.combined || (comparisonResult.percentage / 100) || comparisonResult.ms_ssim || 0,
          // Ensure percentage is available (0-100 scale for display)
          percentage: comparisonResult.percentage || (comparisonResult.combined * 100) || (comparisonResult.ms_ssim * 100) || 0
        };
        
        // Save progress data for this attempt with generated image
        if (currentChallengeIndex >= 0) {
          // Store the generated image URL when saving progress
          const currentGeneratedImage = imageUrl || AIGeneratedimg;
          saveProgressData(currentChallengeIndex, normalizedResult.percentage, currentGeneratedImage, normalizedResult);
        }
        
        setResult(normalizedResult);
        
        // Check for auto-progression FIRST (regardless of voice)
        await handleAutoProgression(normalizedResult, currentChallengeIndex, shapes, unlockedShapes, updateUnlockedShapes, setShowUnlockNotification, setSelectedImageFunc, setPrompt, setResult, setAIGeneratedimg, setHasComparedCurrentGeneration, setIsAutoProgressing, setUnlockNotificationData);
        
        // Then handle voice feedback
        handleVoiceFeedback(normalizedResult, voiceEnabled, voiceManager, setIsVoicePlaying, selectedImage, shapes, unlockedShapes, updateUnlockedShapes, setShowUnlockNotification, setSelectedImageFunc, AIGeneratedimg);
      } else {
        console.warn("❌ Comparison result missing valid score:", comparisonResult);
        const errorMessage = "Invalid comparison result - no valid score found";
        setResult({ error: errorMessage, combined: 0, percentage: 0 });
      }
    } else {
      console.warn("❌ No comparison result returned");
      setResult({ error: "No comparison result", combined: 0, percentage: 0 });
    }
  } catch (error) {
    console.error("💥 Comparison error:", error);
    setResult({ error: `Comparison failed: ${error.message}`, combined: 0, percentage: 0 });
  } finally {
    setIsComparing(false);
  }
};

// NEW: Simplified auto-progression function that works independently of voice
const handleAutoProgression = async (comparisonResult, currentChallengeIndex, shapes, unlockedShapes, updateUnlockedShapes, setShowUnlockNotification, setSelectedImage, setPrompt, setResult, setAIGeneratedimg, setHasComparedCurrentGeneration, setIsAutoProgressing, setUnlockNotificationData) => {
  const percentage = comparisonResult.percentage || 0;
  // Round to handle floating point issues, e.g., 59.99999999999999
  const roundedPercentage = parseFloat(percentage.toFixed(2));
  const nextChallengeIndex = currentChallengeIndex + 1;
  const hasNextChallenge = nextChallengeIndex < shapes.length;
  const isCurrentUnlocked = unlockedShapes.includes(currentChallengeIndex);
  const isNextAlreadyUnlocked = unlockedShapes.includes(nextChallengeIndex);
  
  // AUTO-PROGRESSION: Score >= 60% - Move to next challenge (works in both modes)
  if (roundedPercentage >= 60 && hasNextChallenge) {
    
    if (!isNextAlreadyUnlocked) {
      // SEQUENTIAL MODE: Unlock and progress
      
      // Step 1: Unlock the next challenge immediately
      updateUnlockedShapes(prev => {
        const prevArr = Array.isArray(prev) ? prev : (prev ? Object.values(prev).map(Number) : []);
        const merged = Array.from(new Set([...prevArr, nextChallengeIndex]));
        return merged;
      });
      
      // Step 2: Show notification
      setUnlockNotificationData({
        type: 'auto',
        score: percentage,
        challengeName: shapes[nextChallengeIndex].name
      });
      setShowUnlockNotification(true);
      
    } else {
      // PRACTICE MODE: All unlocked, just show success and progress
      
      // Show success notification
      setUnlockNotificationData({
        type: 'auto',
        score: percentage,
        challengeName: shapes[nextChallengeIndex].name
      });
      setShowUnlockNotification(true);
    }
    
    // Step 3: Auto-progress after 3 seconds (same for both modes)
    setTimeout(() => {
      setIsAutoProgressing(true);
      
      // Switch to next challenge
      setSelectedImage(shapes[nextChallengeIndex].image);
      
      // Clear state for fresh start
      setPrompt("");
      setResult(null);
      setAIGeneratedimg(null);
      setHasComparedCurrentGeneration(false);
      
      // Hide notification
      setShowUnlockNotification(false);
      setIsAutoProgressing(false);
      
    }, 3000); // 3 second delay for auto-progression
  }
};

// Helper function to handle voice feedback and automatic progression
const handleVoiceFeedback = async (comparisonResult, voiceEnabled, voiceManager, setIsVoicePlaying, selectedImage, shapes, unlockedShapes, updateUnlockedShapes, setShowUnlockNotification, setSelectedImage, AIGeneratedimg) => {
  if (voiceEnabled) {
    try {
      setIsVoicePlaying(true);
      
      // Create challenge context for contextual voice selection
      const currentChallengeIndex = shapes.findIndex(shape => shape.image === selectedImage);
      
      // Get the score from the normalized result
      const score = comparisonResult.combined || comparisonResult.percentage / 100 || 0;
      const percentage = comparisonResult.percentage || score * 100 || 0;
      const roundedPercentage = parseFloat(percentage.toFixed(2));
      
      // Save challenge progress data
      const saveProgressData = (challengeIndex, score, percentage, generatedImageUrl = null, comparisonResultData = null) => {
        // Only save progress data for passing scores (≥60%)
        if (roundedPercentage >= 60) {
          updateProgressData(prev => ({
            ...prev,
            [challengeIndex]: {
              challengeName: shapes[challengeIndex].name,
              bestScore: Math.max(prev[challengeIndex]?.bestScore || 0, percentage),
              latestScore: percentage,
              attempts: (prev[challengeIndex]?.attempts || 0) + 1,
              completed: true, // Always true since we only store passing scores
              firstCompletedAt: prev[challengeIndex]?.firstCompletedAt || new Date().toISOString(),
              lastAttemptAt: new Date().toISOString(),
              // Store the generated image URL for passing scores only
              generatedImage: generatedImageUrl || prev[challengeIndex]?.generatedImage,
              // Store the full comparison result for restoring feedback
              lastComparisonResult: comparisonResultData || prev[challengeIndex]?.lastComparisonResult
            }
          }));
        }
      };
      
      // Save progress for current challenge
      saveProgressData(currentChallengeIndex, score, percentage, AIGeneratedimg, comparisonResult);
      
      // Determine progression logic
      const nextChallengeIndex = currentChallengeIndex + 1;
      const hasNextChallenge = nextChallengeIndex < shapes.length;
      const isCurrentUnlocked = unlockedShapes.includes(currentChallengeIndex);
      const isNextAlreadyUnlocked = unlockedShapes.includes(nextChallengeIndex);
      
      // SUCCESS: Score >= 60% - Auto unlock and progress
      if (roundedPercentage >= 60 && hasNextChallenge) {
        if (!isNextAlreadyUnlocked) {
          // SEQUENTIAL MODE: Unlock and auto-progress
          const challengeContext = {
            unlocksNext: true,
            isLastChallenge: nextChallengeIndex === shapes.length - 1,
            challengeIndex: currentChallengeIndex,
            totalChallenges: shapes.length,
            autoProgression: true,
            successScore: percentage
          };
          
          // Play success/unlock voice
          await voiceManager.playContextualVoice(comparisonResult, challengeContext);
          
          // Auto-unlock next challenge after voice
          setTimeout(() => {
            setIsAutoProgressing(true); // Start auto-progression loading
            
            updateUnlockedShapes(prev => {
              const prevArr = Array.isArray(prev) ? prev : (prev ? Object.values(prev).map(Number) : []);
              const merged = Array.from(new Set([...prevArr, nextChallengeIndex]));
              return merged;
            });
            
            // Show enhanced unlock notification with score and auto-progression info
            setUnlockNotificationData({
              type: 'auto',
              score: percentage,
              challengeName: shapes[nextChallengeIndex].name
            });
            setShowUnlockNotification(true);
            setTimeout(() => setShowUnlockNotification(false), 4000);
            
            // Auto-select next challenge after a brief delay
            setTimeout(() => {
              // Switch to next challenge
              setSelectedImage(shapes[nextChallengeIndex].image);
              
              // Clear state for fresh start
              setPrompt("");
              setResult(null);
              setAIGeneratedimg(null);
              setHasComparedCurrentGeneration(false);
              
              setIsAutoProgressing(false); // End auto-progression loading
              
              // Play welcome voice for new challenge
              setTimeout(async () => {
                try {
                  setIsVoicePlaying(true);
                  await voiceManager.playWelcomeVoice();
                  setIsVoicePlaying(false);
                } catch (error) {
                  console.warn('Welcome voice failed:', error);
                  setIsVoicePlaying(false);
                }
              }, 500);
              
            }, 2000);
          }, 2500);
        } else {
          // PRACTICE MODE: All unlocked, just play success and auto-progress
          await voiceManager.playSuccessVoice();
          
          // Auto-select next challenge after voice
          setTimeout(() => {
            setIsAutoProgressing(true);
            
            // Show success notification
            setUnlockNotificationData({
              type: 'auto',
              score: percentage,
              challengeName: shapes[nextChallengeIndex].name
            });
            setShowUnlockNotification(true);
            setTimeout(() => setShowUnlockNotification(false), 3000);
            
            // Switch to next challenge
            setSelectedImage(shapes[nextChallengeIndex].image);
            
            // Clear state for fresh start
            setPrompt("");
            setResult(null);
            setAIGeneratedimg(null);
            setHasComparedCurrentGeneration(false);
            
            setIsAutoProgressing(false);
            
            // Play welcome voice for new challenge
            setTimeout(async () => {
              try {
                setIsVoicePlaying(true);
                await voiceManager.playWelcomeVoice();
                setIsVoicePlaying(false);
              } catch (error) {
                console.warn('Welcome voice failed:', error);
                setIsVoicePlaying(false);
              }
            }, 500);
            
          }, 2000);
        }
        
      } 
      // NEAR SUCCESS: Score 40-59% - Motivational feedback
      else if (roundedPercentage >= 40 && roundedPercentage < 60) {
        const challengeContext = {
          unlocksNext: false,
          isLastChallenge: currentChallengeIndex === shapes.length - 1,
          challengeIndex: currentChallengeIndex,
          totalChallenges: shapes.length,
          needsImprovement: true,
          score: percentage,
          encouragement: true
        };
        
        await voiceManager.playNearSuccessVoice();
        
      }
      // LOW SCORE: Score < 40% - Motivational retry feedback  
      else if (roundedPercentage < 40) {
        await voiceManager.playMotivationVoice();
        
      }
      // ALREADY AT FINAL CHALLENGE or ALREADY UNLOCKED
      else if (!hasNextChallenge || isNextAlreadyUnlocked) {
        if (!hasNextChallenge && roundedPercentage >= 60) {
          // Track game completion
          const totalTime = sessionStorage.getItem('gameStartTime') ? 
            (Date.now() - parseInt(sessionStorage.getItem('gameStartTime'))) / 1000 : 0;
          const completedChallenges = Object.keys(progressData || {}).length + 1; // +1 for current completion
          trackGameCompletion(roundedPercentage, totalTime, completedChallenges);
          
          await voiceManager.playFinalCelebrationVoice();
        } else {
          await voiceManager.playSuccessVoice();
        }
      }
      
      setIsVoicePlaying(false);
      
      // Log voice status after contextual voice
      const status = voiceManager.getVoiceAlternationStatus();
      
    } catch (error) {
      console.warn("🎵 Voice feedback failed:", error);
      setIsVoicePlaying(false);
    }
  } else {
    // Handle progression without voice
    const currentChallengeIndex = shapes.findIndex(shape => shape.image === selectedImage);
    const score = comparisonResult.combined || comparisonResult.percentage / 100 || 0;
    const percentage = comparisonResult.percentage || score * 100 || 0;
    const roundedPercentage = parseFloat(percentage.toFixed(2));
    const nextChallengeIndex = currentChallengeIndex + 1;
    const hasNextChallenge = nextChallengeIndex < shapes.length;
    const isCurrentUnlocked = unlockedShapes.includes(currentChallengeIndex);
    const isNextAlreadyUnlocked = unlockedShapes.includes(nextChallengeIndex);
    
    // Auto-progression even without voice
    if (roundedPercentage >= 60 && hasNextChallenge) {
      // Save progress data for silent mode too
      const saveProgressData = (challengeIndex, score, percentage, generatedImageUrl = null, comparisonResultData = null) => {
        // Only save progress data for passing scores (≥60%)
        if (roundedPercentage >= 60) {
          updateProgressData(prev => ({
            ...prev,
            [challengeIndex]: {
              challengeName: shapes[challengeIndex].name,
              bestScore: Math.max(prev[challengeIndex]?.bestScore || 0, percentage),
              latestScore: percentage,
              attempts: (prev[challengeIndex]?.attempts || 0) + 1,
              completed: true, // Always true since we only store passing scores
              firstCompletedAt: prev[challengeIndex]?.firstCompletedAt || new Date().toISOString(),
              lastAttemptAt: new Date().toISOString(),
              // Store the generated image URL for passing scores only
              generatedImage: generatedImageUrl || prev[challengeIndex]?.generatedImage,
              // Store the full comparison result for restoring feedback
              lastComparisonResult: comparisonResultData || prev[challengeIndex]?.lastComparisonResult
            }
          }));
        }
      };
      
      // Save progress for current challenge
      saveProgressData(currentChallengeIndex, score, percentage, AIGeneratedimg, comparisonResult);
      
      setTimeout(() => {
        if (!isNextAlreadyUnlocked) {
          // Sequential mode - unlock next challenge
          updateUnlockedShapes(prev => {
            const prevArr = Array.isArray(prev) ? prev : (prev ? Object.values(prev).map(Number) : []);
            const merged = Array.from(new Set([...prevArr, nextChallengeIndex]));
            return merged;
          });
        }
        
        setUnlockNotificationData({
          type: 'auto',
          score: percentage,
          challengeName: shapes[nextChallengeIndex].name
        });
        setShowUnlockNotification(true);
        setTimeout(() => setShowUnlockNotification(false), 4000);
        
        setTimeout(() => {
          setIsAutoProgressing(true); // Start auto-progression loading
          
          setSelectedImage(shapes[nextChallengeIndex].image);
          
          // Clear prompt field for fresh start on new challenge
          setPrompt("");
          
          // Clear any previous results and generated images for clean slate
          setResult(null);
          setAIGeneratedimg(null);
          setHasComparedCurrentGeneration(false);
          
          setIsAutoProgressing(false); // End auto-progression loading
        }, 2000);
      }, 1000);
    }
  }
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
  
  // Track generate button click
  trackButtonClick('generate_image', 'main_controls');
  
  // Cleanup and preparation
  stopOngoingVoice(isVoicePlaying, voiceManager, setIsVoicePlaying);
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
  
  // Sound and voice feedback
  playGenerationSoundAndVoice(playGenerationStartSound, voiceManager, voiceEnabled, setIsVoicePlaying);
  
  try {
    // Track image generation start
    trackImageGeneration(prompt, selectedModel);
    
    // Image generation
    const imageUrl = await generateImageByModel(selectedModel, prompt, generate_img, generateWithClipDrop);
    
    if (imageUrl) {
      // Comparison parameters - updated to use voice system and auto-progression
      const comparisonParams = {
        selectedImage,
        handleComparison,
        setIsComparing,
        setResult,
        voiceEnabled,
        voiceManager,
        setIsVoicePlaying,
        shapes,
        unlockedShapes,
        setUnlockedShapes: updateUnlockedShapes,
        setShowUnlockNotification,
        setSelectedImage,
        updateProgressData,
        setPrompt,
        setAIGeneratedimg,
        setHasComparedCurrentGeneration,
        setIsAutoProgressing,
        setUnlockNotificationData
      };
      
      handleImageLoadingAndComparison(imageUrl, stateSetters, comparisonParams);
    } else {
      console.error("Image generation failed - no URL returned");
    }
    
  } catch (error) {
    trackError('Image Generation Failed', `${selectedModel}: ${error.message}`);
    handleGenerationError(error, stateSetters);
  } finally {
    setIsGenerating(false);
  }
};



const handleKeyPress = (e) => {
  if (e.key === 'Enter') {
    handleGenerateClick();
  }
};

// Debug: Track user auth status and sync states
  useEffect(() => {
    // Reduced debug logging for production
  }, [user, isProgressLoading, isProgressSaving, syncError, unlockedShapes, progressData]);

  // Show sync status notification when user logs in or sync completes
  useEffect(() => {
    if (user && !user.isGuest && !isProgressLoading && !isProgressSaving && !syncError) {
      // Show sync status for 5 seconds when successfully synced
      setShowSyncStatus(true);
      const timer = setTimeout(() => {
        setShowSyncStatus(false);
      }, 5000); // Hide after 5 seconds

      return () => clearTimeout(timer);
    } else {
      setShowSyncStatus(false);
    }
  }, [user, isProgressLoading, isProgressSaving, syncError, lastSyncTime]);

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

      {/* Firebase Sync Status Indicator */}
      <AnimatePresence>
        {user && (showSyncStatus || user.isGuest || syncError || isProgressSaving) && (
          <motion.div
            style={{
              position: 'fixed',
              top: '20px',
              left: '20px',
              background: user.isGuest
                ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                : syncError 
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : isProgressSaving 
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                    : 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              fontFamily: 'Poppins, sans-serif',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              minWidth: '140px'
            }}
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.span
              animate={isProgressSaving ? { rotate: 360 } : {}}
              transition={{ duration: 1, repeat: isProgressSaving ? Infinity : 0, ease: "linear" }}
            >
              {user.isGuest ? '🎯' : syncError ? '❌' : isProgressSaving ? '⏳' : '✅'}
            </motion.span>
            <span>
              {user.isGuest ? 'Demo Mode' : syncError ? 'Sync Error' : isProgressSaving ? 'Saving...' : 'Synced'}
            </span>
            {user.email && (
              <span style={{ fontSize: '10px', opacity: 0.8 }}>
                ({user.email.split('@')[0]})
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Unlock Notification */}
      <AnimatePresence>
        {showUnlockNotification && (
          <motion.div
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: unlockNotificationData.type === 'auto' 
                ? 'linear-gradient(135deg, #10b981, #059669)' 
                : 'linear-gradient(135deg, #4ade80, #10b981)',
              color: 'white',
              padding: '16px 24px',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              fontFamily: 'Poppins, sans-serif',
              boxShadow: unlockNotificationData.type === 'auto'
                ? '0 8px 25px rgba(16, 185, 129, 0.5)'
                : '0 8px 25px rgba(16, 185, 129, 0.4)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              minWidth: '280px',
              textAlign: 'center'
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ 
                  duration: 0.6,
                  repeat: 2
                }}
                style={{ fontSize: '1.2rem' }}
              >
                {unlockNotificationData.type === 'auto' ? '🎉' : '🔓'}
              </motion.span>
              
              <div>
                {unlockNotificationData.type === 'auto' ? (
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: '700' }}>
                      Excellent Work! {Math.round(unlockNotificationData.score)}%
                    </div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '2px' }}>
                      Auto-unlocked: {unlockNotificationData.challengeName}
                    </div>
                  </div>
                ) : (
                  "Next Challenge Unlocked!"
                )}
              </div>
            </div>
            
            {unlockNotificationData.type === 'auto' && (
              <motion.div
                style={{
                  fontSize: '0.75rem',
                  opacity: 0.8,
                  marginTop: '4px',
                  padding: '4px 8px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.8, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  🎯
                </motion.span>
                <span>Moving to next challenge automatically...</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="app-body">
        <div className="progress-tracker-wrapper">
          <ProgressTracker 
            unlockedShapes={unlockedShapes} 
            shapes={shapes} 
            comparisonResult={result}
            voiceEnabled={voiceEnabled}
            setVoiceEnabled={setVoiceEnabled}
            isVoicePlaying={isVoicePlaying}
            setIsVoicePlaying={setIsVoicePlaying}
            voiceManager={voiceManager}
            progressData={progressData}
            onShapeClick={handleProgressShapeClick}
            selectedImage={selectedImage}
            onShowUserProfile={() => {
              trackButtonClick('user_profile', 'progress_tracker');
              setShowUserProfile(true);
            }}
          />
        </div>
        <div className="main-content">
          <div className="left-panel">
            <div className="generated-image-placeholder">
              {selectedImage ? (
                <motion.div 
                  className="image-display"
                  key={selectedImage} // Force re-render when selectedImage changes
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <motion.img 
                    src={selectedImage} 
                    alt="Selected Shape"
                    initial={{ filter: "blur(10px)" }}
                    animate={{ filter: "blur(0px)" }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  />
                  <motion.div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(16, 185, 129, 0.9)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    🎯 Target
                  </motion.div>
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
                      trackButtonClick(`model_${newModel}`, 'model_selection');
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
              {(() => {
                // Show image if we have one and we're not generating
                if (AIGeneratedimg && !isGenerating) {
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
                          // Image loaded successfully
                        }} 
                        onError={(e) => {
                          console.error("Generated image display failed:", e);
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
                } else if (isGenerating) {
                  // Show loading state when generating
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
                    target vs generated image (Local Processing Only)
                    {voiceEnabled && (
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
                <>
                  <FeedbackComponent 
                    selectedImage={selectedImage}
                    comparisonResult={result}
                    isComparing={isComparing}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User Profile Modal */}
      <UserProfile 
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
      />
    </div>
  );
}