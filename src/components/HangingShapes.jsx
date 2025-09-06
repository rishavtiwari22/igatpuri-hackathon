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

const shapes = [
  { type: "circle", left: "10%", rope: "rope-1", image: image1, name: "Car" },
  { type: "square", left: "25%", rope: "rope-2", image: image2, name: "Horse" },
  { type: "triangle", left: "40%", rope: "rope-3", image: image3, name: "Mountain" },
  { type: "diamond", left: "55%", rope: "rope-4", image: image4, name: "Owl" },
  { type: "hexagon", left: "70%", rope: "rope-5", image: image5, name: "Sheep" },
  { type: "star", left: "85%", rope: "rope-6", image: image1, name: "Car (Duplicate)" },
];


export default function HangingShapes() {
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

  // Cleanup: Stop voice when component unmounts
  useEffect(() => {
    return () => {
      if (isVoicePlaying) {
        voiceManager.stopCurrentAudio();
        console.log("🎵 Voice stopped on component unmount");
      }
      // Cleanup blob URLs to prevent memory leaks
      if (AIGeneratedimg && AIGeneratedimg.startsWith('blob:')) {
        URL.revokeObjectURL(AIGeneratedimg);
        console.log("🧙 Cleaned up blob URL on unmount");
      }
    };
  }, [isVoicePlaying, AIGeneratedimg]);

  // Startup voice - play welcome/startup voice when app loads
  useEffect(() => {
    const hasPlayedStartup = sessionStorage.getItem('hasPlayedStartupVoice');
    
    if (!hasPlayedStartup && voiceEnabled) {
      // Delay startup voice to ensure component is fully loaded
      const timer = setTimeout(async () => {
        try {
          setIsVoicePlaying(true);
          console.log('🎵 Playing startup voice with alternation...');
          await voiceManager.playStartupVoice();
          console.log("🎵 Startup voice played successfully");
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

  // Debug: Log voice status periodically (for development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        const status = voiceManager.getVoiceAlternationStatus();
        console.log('📊 Voice Status:', status);
      }, 10000); // Log every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, []);

  // Expose voice testing functions to window for easy console testing
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.testVoices = {
        playStartup: () => voiceManager.playStartupVoice(),
        playGenerating: () => voiceManager.playGeneratingVoice(),
        playSuccess: () => voiceManager.playSuccessVoice(),
        playMotivation: () => voiceManager.playMotivationVoice(),
        playUnlock: () => voiceManager.playUnlockVoice(),
        playNearSuccess: () => voiceManager.playNearSuccessVoice(),
        playCreative: () => voiceManager.playCreativeVoice(),
        playMilestone: () => voiceManager.playMilestoneVoice(),
        playFinalCelebration: () => voiceManager.playFinalCelebrationVoice(),
        playWelcome: () => voiceManager.playWelcomeVoice(),
        getStatus: () => voiceManager.getVoiceAlternationStatus(),
        testCategory: (category, times = 4) => {
          console.log(`🎵 Testing ${category} alternation ${times} times...`);
          let count = 0;
          const testInterval = setInterval(async () => {
            if (count >= times) {
              clearInterval(testInterval);
              console.log(`🎵 ${category} test completed!`);
              return;
            }
            count++;
            console.log(`🎵 ${category} test ${count}/${times}`);
            try {
              await window.testVoices[`play${category.charAt(0).toUpperCase() + category.slice(1)}`]();
              console.log(`✅ ${category} voice ${count} played successfully`);
            } catch (error) {
              console.error(`❌ ${category} voice ${count} failed:`, error);
            }
          }, 4000);
        },
        resetStartup: () => {
          sessionStorage.removeItem('hasPlayedStartupVoice');
          console.log('🎵 Startup voice flag reset - refresh to test again');
        },
        // Add MS-SSIM testing function
        testComparison: async () => {
          console.log('🧪 Testing MS-SSIM comparison with current images...');
          if (selectedImage && AIGeneratedimg) {
            try {
              const result = await handleComparison(AIGeneratedimg, selectedImage);
              console.log('🧪 Test comparison result:', result);
              return result;
            } catch (error) {
              console.error('🧪 Test comparison failed:', error);
              return { error: error.message };
            }
          } else {
            console.warn('🧪 No images available for testing. Generate an image first.');
            return { error: 'No images available' };
          }
        },
        
        testSimpleComparison: async () => {
          console.log('🧪 Testing with simple identical images...');
          
          // Create two identical simple images
          const canvas1 = document.createElement('canvas');
          canvas1.width = 100;
          canvas1.height = 100;
          const ctx1 = canvas1.getContext('2d');
          ctx1.fillStyle = 'red';
          ctx1.fillRect(0, 0, 100, 100);
          const dataUrl1 = canvas1.toDataURL();
          
          const canvas2 = document.createElement('canvas');
          canvas2.width = 100;
          canvas2.height = 100;
          const ctx2 = canvas2.getContext('2d');
          ctx2.fillStyle = 'red';
          ctx2.fillRect(0, 0, 100, 100);
          const dataUrl2 = canvas2.toDataURL();
          
          try {
            const result = await handleComparison(dataUrl1, dataUrl2);
            console.log('✅ Simple test result:', result);
            return result;
          } catch (error) {
            console.error('❌ Simple test failed:', error);
            return { error: error.message };
          }
        },
        
        // Add simple image loading test
        testImageLoading: async () => {
          console.log('🧪 Testing image loading functionality...');
          try {
            // Test with a simple image URL
            const testUrl = "https://image.pollinations.ai/prompt/red%20car";
            console.log('🧪 Testing with URL:', testUrl);
            
            const img = new Image();
            img.crossOrigin = "anonymous";
            
            return new Promise((resolve) => {
              img.onload = () => {
                console.log('✅ Test image loaded successfully:', img.width, 'x', img.height);
                resolve({ success: true, width: img.width, height: img.height });
              };
              img.onerror = (error) => {
                console.error('❌ Test image loading failed:', error);
                resolve({ success: false, error: error.message || 'Unknown error' });
              };
              img.src = testUrl;
              
              // Timeout after 10 seconds
              setTimeout(() => {
                console.warn('⏰ Test image loading timed out');
                resolve({ success: false, error: 'Timeout' });
              }, 10000);
            });
          } catch (error) {
            console.error('🧪 Image loading test failed:', error);
            return { error: error.message };
          }
        },
        // Add comprehensive debugging function
        fullDebugTest: async () => {
          console.log('🔬 Starting comprehensive debug test...');
          
          // Test 1: Environment check
          console.log('📋 Environment Check:');
          console.log('- selectedImage:', selectedImage);
          console.log('- AIGeneratedimg:', AIGeneratedimg);
          console.log('- Browser:', navigator.userAgent);
          console.log('- Date:', new Date().toISOString());
          
          // Test 2: Basic URL test
          console.log('🌐 Testing basic image URL...');
          try {
            const testResult = await window.testVoices.testImageLoading();
            console.log('✅ Basic URL test result:', testResult);
          } catch (error) {
            console.error('❌ Basic URL test failed:', error);
          }
          
          // Test 3: MS-SSIM import test
          console.log('📦 Testing MS-SSIM imports...');
          try {
            const { computeMSSSIM } = await import('../utils/imageComparison');
            console.log('✅ MS-SSIM import successful');
            
            // Test with two identical simple images
            const canvas1 = document.createElement('canvas');
            canvas1.width = 100;
            canvas1.height = 100;
            const ctx1 = canvas1.getContext('2d');
            ctx1.fillStyle = 'red';
            ctx1.fillRect(0, 0, 100, 100);
            const dataUrl1 = canvas1.toDataURL();
            
            const canvas2 = document.createElement('canvas');
            canvas2.width = 100;
            canvas2.height = 100;
            const ctx2 = canvas2.getContext('2d');
            ctx2.fillStyle = 'red';
            ctx2.fillRect(0, 0, 100, 100);
            const dataUrl2 = canvas2.toDataURL();
            
            console.log('🧪 Testing MS-SSIM with identical red squares...');
            const ssimResult = await computeMSSSIM(dataUrl1, dataUrl2, 3);
            console.log('✅ SSIM test result:', ssimResult);
            
            if (ssimResult.error) {
              console.error('❌ SSIM computation had errors:', ssimResult.error);
            } else {
              console.log('🎯 SSIM percentage:', ssimResult.percentage);
            }
            
          } catch (error) {
            console.error('❌ MS-SSIM import or computation failed:', error);
          }
          
          // Test 4: Full comparison test (if images available)
          if (selectedImage && AIGeneratedimg) {
            console.log('🔍 Testing full comparison with current images...');
            try {
              const comparisonResult = await window.testVoices.testComparison();
              console.log('✅ Full comparison result:', comparisonResult);
            } catch (error) {
              console.error('❌ Full comparison failed:', error);
            }
          } else {
            console.log('⚠️ Skipping full comparison test - no images available');
          }
          
          console.log('🔬 Comprehensive debug test completed');
        }
      };
      
      console.log('🎵 Voice testing functions added to window.testVoices');
      console.log('Usage: window.testVoices.testCategory("success", 4)');
      console.log('🧪 MS-SSIM testing: window.testVoices.testComparison()');
      console.log('🧪 Image loading test: window.testVoices.testImageLoading()');
      console.log('🔬 Full debug test: window.testVoices.fullDebugTest()');
    }
  }, [selectedImage, AIGeneratedimg]);

  const handleShapeClick = (image, index) => {
    if (unlockedShapes.includes(index)) {
      // Stop any ongoing voice
      if (isVoicePlaying) {
        voiceManager.stopCurrentAudio();
        setIsVoicePlaying(false);
      }
      
      setSelectedImage(image); // Set the target image
      setResult(null); // Clear previous comparison when selecting new target
      setResult(null); // Clear previous results
      setHasComparedCurrentGeneration(false); // Reset comparison flag for new target
      playClickSound(); // Play click sound when shape is successfully clicked
      
      console.log(`🎯 Shape ${shapes[index].name} clicked! Setting target image:`, image);
      console.log("📊 Target image set. Generate an image to start comparison.");
    } else {
      console.log("Shape is locked");
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
        console.log(`🔄 Trying URL format ${i + 1}/${urlFormats.length}:`, imageUrl);
        
        try {
          // Test if the URL is accessible
          const isAccessible = await new Promise((resolve) => {
            const testImg = new Image();
            testImg.crossOrigin = "anonymous";
            
            const timeout = setTimeout(() => {
              console.warn(`⏰ URL format ${i + 1} timed out`);
              resolve(false);
            }, 8000); // Increased to 8 seconds to allow for generation time
            
            testImg.onload = () => {
              clearTimeout(timeout);
              console.log(`✅ URL format ${i + 1} verified and accessible`);
              resolve(true);
            };
            
            testImg.onerror = (error) => {
              clearTimeout(timeout);
              console.warn(`❌ URL format ${i + 1} failed:`, error);
              resolve(false);
            };
            
            testImg.src = imageUrl;
          });
          
          if (isAccessible) {
            console.log("✅ Found working image URL:", imageUrl);
            return imageUrl;
          }
        } catch (error) {
          console.warn(`❌ Error testing URL format ${i + 1}:`, error);
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
    console.log("⚠️ Generation blocked - empty prompt or already generating");
    return false;
  }
  return true;
};

// Helper function to stop ongoing voice and cleanup
const stopOngoingVoice = (isVoicePlaying, voiceManager, setIsVoicePlaying) => {
  if (isVoicePlaying) {
    voiceManager.stopCurrentAudio();
    setIsVoicePlaying(false);
    console.log("🎵 Stopped voice for new generation");
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

// Helper function to play generation sound and voice safely
const playGenerationSoundAndVoice = async (playGenerationStartSound, voiceManager, voiceEnabled, setIsVoicePlaying) => {
  try {
    // Play the synthetic sound effect
    playGenerationStartSound();
    
    // Play generating voice if voice is enabled
    if (voiceEnabled) {
      setIsVoicePlaying(true);
      console.log('🎵 Starting generation voice with alternation...');
      
      setTimeout(async () => {
        try {
          await voiceManager.playGeneratingVoice();
          console.log("🎵 Generating voice played successfully");
          
          // Log current voice status after playing
          const status = voiceManager.getVoiceAlternationStatus();
          console.log('📊 Generating voice status:', status.generating);
        } catch (error) {
          console.warn("🎵 Generating voice failed:", error);
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
      console.log("📸 Generating with Pollinations AI...");
      imageUrl = await generate_img(prompt);
    } else if (selectedModel === "clipdrop") {
      console.log("📸 Generating with ClipDrop AI...");
      imageUrl = await generateWithClipDrop(prompt);
    } else {
      throw new Error(`Unknown model: ${selectedModel}`);
    }
    
    return imageUrl;
  } catch (error) {
    console.error(`❌ ${selectedModel} generation failed:`, error);
    
    // If Pollinations fails, automatically try ClipDrop as fallback
    if (selectedModel === "pollinations") {
      console.log("🔄 Pollinations failed, trying ClipDrop as fallback...");
      try {
        imageUrl = await generateWithClipDrop(prompt);
        console.log("✅ ClipDrop fallback successful!");
        return imageUrl;
      } catch (fallbackError) {
        console.error("❌ ClipDrop fallback also failed:", fallbackError);
        throw new Error("Both Pollinations and ClipDrop failed");
      }
    } else {
      // If ClipDrop fails, try Pollinations as fallback
      console.log("🔄 ClipDrop failed, trying Pollinations as fallback...");
      try {
        imageUrl = await generate_img(prompt);
        console.log("✅ Pollinations fallback successful!");
        return imageUrl;
      } catch (fallbackError) {
        console.error("❌ Pollinations fallback also failed:", fallbackError);
        throw new Error("Both ClipDrop and Pollinations failed");
      }
    }
  }
};

// Helper function to handle image loading and comparison
const handleImageLoadingAndComparison = (imageUrl, setters, comparisonParams) => {
  const { setAIGeneratedimg, setIsImageLoading, setHasComparedCurrentGeneration } = setters;
  const { selectedImage, handleComparison, setIsComparing, setResult, voiceEnabled, voiceManager, setIsVoicePlaying } = comparisonParams;
  
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
  const { selectedImage, handleComparison, setIsComparing, setResult, voiceEnabled, voiceManager, setIsVoicePlaying, shapes, unlockedShapes, setUnlockedShapes, setShowUnlockNotification } = comparisonParams;
  
  console.log("🔄 Waiting for image to load before comparison...");
  
  const img = new Image();
  img.onload = async () => {
    console.log("🖼️ Image fully loaded, starting comparison...");
    setIsImageLoading(false);
    await performComparison(imageUrl, selectedImage, handleComparison, setIsComparing, setResult, voiceEnabled, voiceManager, setIsVoicePlaying, shapes, unlockedShapes, setUnlockedShapes, setShowUnlockNotification);
  };
  
  img.onerror = () => {
    console.error("❌ Failed to load generated image for comparison");
    console.log("🔄 Attempting to skip comparison and display image anyway...");
    setResult({ error: "Failed to load image for comparison, but image may still be visible", combined: 0 });
    setIsComparing(false);
    setIsImageLoading(false);
  };
  
  img.src = imageUrl;
};

// Helper function to perform the actual comparison
const performComparison = async (imageUrl, selectedImage, handleComparison, setIsComparing, setResult, voiceEnabled, voiceManager, setIsVoicePlaying, shapes, unlockedShapes, setUnlockedShapes, setShowUnlockNotification) => {
  try {
    setIsComparing(true);
    const comparisonResult = await handleComparison(imageUrl, selectedImage);
    
    console.log("🔍 Raw comparison result:", comparisonResult);
    console.log("🔍 Comparison result type:", typeof comparisonResult);
    console.log("🔍 Comparison result keys:", Object.keys(comparisonResult || {}));
    
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
      
      console.log("🔍 Validation checks:", {
        hasValidPercentage,
        hasValidCombined, 
        hasValidMsSSIM,
        hasAnyResult,
        percentageValue: comparisonResult.percentage,
        combinedValue: comparisonResult.combined,
        msssimValue: comparisonResult.ms_ssim
      });
      
      if (hasValidPercentage || hasValidCombined || hasValidMsSSIM || hasAnyResult) {
        // Normalize the result structure for the UI
        const normalizedResult = {
          ...comparisonResult,
          // Ensure combined is available (0-1 scale for UI compatibility)
          combined: comparisonResult.combined || (comparisonResult.percentage / 100) || comparisonResult.ms_ssim || 0,
          // Ensure percentage is available (0-100 scale for display)
          percentage: comparisonResult.percentage || (comparisonResult.combined * 100) || (comparisonResult.ms_ssim * 100) || 0
        };
        
        console.log("✅ Comparison completed successfully:", normalizedResult);
        console.log("🎯 Setting result state with:", normalizedResult);
        setResult(normalizedResult);
        handleVoiceFeedback(normalizedResult, voiceEnabled, voiceManager, setIsVoicePlaying, selectedImage, shapes, unlockedShapes, setUnlockedShapes, setShowUnlockNotification);
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

// Helper function to handle voice feedback
const handleVoiceFeedback = async (comparisonResult, voiceEnabled, voiceManager, setIsVoicePlaying, selectedImage, shapes, unlockedShapes, setUnlockedShapes, setShowUnlockNotification) => {
  if (voiceEnabled) {
    try {
      setIsVoicePlaying(true);
      
      // Create challenge context for contextual voice selection
      const currentChallengeIndex = shapes.findIndex(shape => shape.image === selectedImage);
      
      // Get the score from the normalized result
      const score = comparisonResult.combined || comparisonResult.percentage / 100 || 0;
      const percentage = comparisonResult.percentage || score * 100 || 0;
      
      console.log(`🎵 Playing contextual voice for ${percentage.toFixed(1)}% similarity with alternation...`);
      
      // Determine if this will unlock next challenge
      const nextChallengeIndex = currentChallengeIndex + 1;
      const willUnlockNext = percentage >= 70 && 
        nextChallengeIndex < shapes.length && 
        !unlockedShapes.includes(nextChallengeIndex) && 
        unlockedShapes.includes(currentChallengeIndex);
      
      const challengeContext = {
        unlocksNext: willUnlockNext,
        isLastChallenge: currentChallengeIndex === shapes.length - 1,
        challengeIndex: currentChallengeIndex,
        totalChallenges: shapes.length
      };
      
      // Play contextual voice based on result
      await voiceManager.playContextualVoice(comparisonResult, challengeContext);
      
      // Log voice status after contextual voice
      const status = voiceManager.getVoiceAlternationStatus();
      console.log('📊 Voice status after contextual feedback:', {
        success: status.success,
        motivation: status.motivation,
        nearSuccess: status.nearSuccess,
        unlock: status.unlock
      });
      
      // Handle progression if success
      if (percentage >= 70 && willUnlockNext) {
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
        }, 2000); // Delay to let voice play first
      }
      
      setIsVoicePlaying(false);
    } catch (error) {
      console.warn("🎵 Voice feedback failed:", error);
      setIsVoicePlaying(false);
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
    // Image generation
    const imageUrl = await generateImageByModel(selectedModel, prompt, generate_img, generateWithClipDrop);
    
    if (imageUrl) {
      // Comparison parameters - updated to use voice system
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
        setUnlockedShapes,
        setShowUnlockNotification
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
            comparisonResult={result}
            voiceEnabled={voiceEnabled}
            setVoiceEnabled={setVoiceEnabled}
            isVoicePlaying={isVoicePlaying}
            setIsVoicePlaying={setIsVoicePlaying}
            voiceManager={voiceManager}
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
                          console.error("❌ Image display failed:", e);
                          console.log("🔄 Image URL that failed:", AIGeneratedimg);
                          setIsImageLoading(false);
                          // Keep the image state so users can see what URL was generated
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
                  {/* DEBUG: Log what's being passed to FeedbackComponent */}
                  {console.log("🎯 HangingShapes - Passing to FeedbackComponent:", {
                    selectedImage: !!selectedImage,
                    result,
                    isComparing
                  })}
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
    </div>
  );
}