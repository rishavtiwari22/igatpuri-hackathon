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
  // Enhanced progress tracking with scores and timestamps - INITIALIZE FIRST
  const [progressData, setProgressData] = useState(() => {
    // For testing - uncomment the next line to reset progress
    // localStorage.removeItem("challengeProgress");
    const savedData = localStorage.getItem("challengeProgress");
    const initialProgress = savedData ? JSON.parse(savedData) : {};
    console.log("🔄 Initializing progressData from localStorage:", Object.keys(initialProgress));
    return initialProgress;
  });

  const [unlockedShapes, setUnlockedShapes] = useState(() => {
    // For testing - uncomment the next line to reset progress
    // localStorage.removeItem("unlockedShapes");
    // localStorage.removeItem("challengeProgress");
    
    // Get both stored values
    const savedProgress = localStorage.getItem("challengeProgress");
    const savedUnlocked = localStorage.getItem("unlockedShapes");
    
    let reconstructedUnlocked = [0]; // Always start with first challenge unlocked
    
    if (savedProgress) {
      const progressData = JSON.parse(savedProgress);
      console.log("🔍 Reconstructing unlocked shapes from progress data:", progressData);
      
      // Reconstruct unlocked shapes from completed challenges
      for (const [challengeIndex, data] of Object.entries(progressData)) {
        const index = parseInt(challengeIndex);
        if (data.completed && !reconstructedUnlocked.includes(index)) {
          reconstructedUnlocked.push(index);
          
          // If this challenge is completed, also unlock the next one
          const nextIndex = index + 1;
          if (nextIndex < shapes.length && !reconstructedUnlocked.includes(nextIndex)) {
            reconstructedUnlocked.push(nextIndex);
            console.log(`✅ Challenge ${index} completed - unlocking next challenge ${nextIndex}`);
          }
        }
      }
      
      // Sort the unlocked array
      reconstructedUnlocked.sort((a, b) => a - b);
      console.log("🔄 Reconstructed unlocked shapes from progress:", reconstructedUnlocked);
    }
    
    // Use saved unlocked shapes if available, otherwise use reconstructed
    let finalUnlocked = reconstructedUnlocked;
    if (savedUnlocked) {
      const parsedSaved = JSON.parse(savedUnlocked);
      // Use whichever has more unlocked challenges (prevent regression)
      if (parsedSaved.length > reconstructedUnlocked.length) {
        finalUnlocked = parsedSaved;
        console.log("🔄 Using saved unlocked shapes (had more progress):", finalUnlocked);
      } else {
        console.log("🔄 Using reconstructed unlocked shapes (more accurate):", finalUnlocked);
      }
    }
    
    console.log("🔄 Final initialized unlockedShapes:", finalUnlocked);
    return finalUnlocked;
  });
  const [showUnlockNotification, setShowUnlockNotification] = useState(false);
  const [unlockNotificationData, setUnlockNotificationData] = useState({
    type: 'normal', // 'normal', 'auto', 'final'
    score: 0,
    challengeName: ''
  });
  const [isAutoProgressing, setIsAutoProgressing] = useState(false); // Auto-progression loading state


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

  // Save detailed progress data to localStorage whenever progressData changes
  useEffect(() => {
    localStorage.setItem("challengeProgress", JSON.stringify(progressData));
    console.log("Challenge progress data saved:", progressData);
  }, [progressData]);

  // Set initial target image to the first unlocked shape
  // Fixed: Now properly depends on unlockedShapes to ensure restoration works
  useEffect(() => {
    console.log("🔄 Initial setup - unlockedShapes:", unlockedShapes);
    
    if (unlockedShapes.length > 0) {
      const firstUnlockedIndex = unlockedShapes[0];
      console.log("🎯 Setting initial target to first unlocked shape:", firstUnlockedIndex, shapes[firstUnlockedIndex]?.name);
      
      if (shapes[firstUnlockedIndex]) {
        setSelectedImage(shapes[firstUnlockedIndex].image);
        console.log("✅ Initial target image set to:", shapes[firstUnlockedIndex].name);
      }
    } else {
      console.warn("⚠️ No unlocked shapes found during initialization");
    }
  }, [unlockedShapes]); // Fixed: Now depends on unlockedShapes

  // Add localStorage restoration debugging and verification
  useEffect(() => {
    console.log("🔍 localStorage restoration check:");
    console.log("  - unlockedShapes from state:", unlockedShapes);
    console.log("  - progressData from state:", Object.keys(progressData));
    
    // Verify localStorage contents
    const storedUnlocked = localStorage.getItem("unlockedShapes");
    const storedProgress = localStorage.getItem("challengeProgress");
    
    console.log("  - localStorage unlockedShapes:", storedUnlocked);
    console.log("  - localStorage challengeProgress:", storedProgress ? Object.keys(JSON.parse(storedProgress)) : "none");
    
    // Check for any mismatches
    if (storedUnlocked) {
      const parsedUnlocked = JSON.parse(storedUnlocked);
      const mismatch = JSON.stringify(parsedUnlocked) !== JSON.stringify(unlockedShapes);
      if (mismatch) {
        console.warn("⚠️ MISMATCH: localStorage unlockedShapes doesn't match state!");
        console.log("  - localStorage:", parsedUnlocked);
        console.log("  - State:", unlockedShapes);
      } else {
        console.log("✅ localStorage and state unlockedShapes are synchronized");
      }
    }
  }, [unlockedShapes, progressData]);

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
        },
        
        // NEW: Test auto-progression with different score ranges
        testAutoProgression: async (mockScore) => {
          console.log(`🧪 Testing auto-progression with mock score: ${mockScore}%`);
          
          if (!selectedImage) {
            console.warn('⚠️ No selected image for progression test');
            return;
          }
          
          // Create mock comparison result
          const mockResult = {
            percentage: mockScore,
            combined: mockScore / 100,
            ms_ssim: mockScore / 100,
            detailed_scores: {
              structural: mockScore * 0.9,
              edges: mockScore * 0.8,
              colors: mockScore * 1.1,
              hog_features: mockScore * 0.95,
              histogram: mockScore * 0.85,
              hsv_similarity: mockScore * 0.92
            },
            method: 'test_mock'
          };
          
          console.log('🎭 Mock result created:', mockResult);
          console.log('🎵 Testing voice feedback and progression...');
          
          // Test the progression logic
          try {
            await handleVoiceFeedback(
              mockResult,
              voiceEnabled,
              voiceManager,
              setIsVoicePlaying,
              selectedImage,
              shapes,
              unlockedShapes,
              setUnlockedShapes,
              setShowUnlockNotification,
              setSelectedImage,
              AIGeneratedimg
            );
            
            console.log('✅ Auto-progression test completed');
          } catch (error) {
            console.error('❌ Auto-progression test failed:', error);
          }
        },
        
        // NEW: Test reset progress functionality
        testResetProgress: () => {
          console.log('🧪 Testing reset progress functionality...');
          console.log('Current state before reset:');
          console.log('- Unlocked shapes:', unlockedShapes);
          console.log('- Progress data keys:', Object.keys(progressData));
          console.log('- Current selected image:', selectedImage ? 'Set' : 'None');
          console.log('- Generated image:', AIGeneratedimg ? 'Set' : 'None');
          console.log('🔄 You can now test the reset button in the UI');
        }
      };
      
      console.log('🎵 Voice testing functions added to window.testVoices');
      console.log('Usage: window.testVoices.testCategory("success", 4)');
      console.log('🧪 MS-SSIM testing: window.testVoices.testComparison()');
      console.log('🧪 Image loading test: window.testVoices.testImageLoading()');
      console.log('🔬 Full debug test: window.testVoices.fullDebugTest()');
      console.log('🎯 Auto-progression test: window.testVoices.testAutoProgression(65) // Test with 65% score');
      console.log('🔄 Reset progress test: window.testVoices.testResetProgress() // Check current state');
      console.log('   - Try: testAutoProgression(75) for success, testAutoProgression(50) for near-success, testAutoProgression(30) for retry');
    }
  }, [selectedImage, AIGeneratedimg]);

  const handleShapeClick = (image, index) => {
    if (unlockedShapes.includes(index)) {
      // Stop any ongoing voice
      if (isVoicePlaying) {
        voiceManager.stopCurrentAudio();
        setIsVoicePlaying(false);
      }
      
      const shape = shapes[index];
      setSelectedImage(image); // Set the target image
      setHasComparedCurrentGeneration(false); // Reset comparison flag for new target
      playClickSound(); // Play click sound when shape is successfully clicked
      
      // Restore stored generated image and comparison result if available
      const storedProgress = progressData[index];
      if (storedProgress && storedProgress.generatedImage) {
        console.log(`🖼️ Restoring generated image for ${shape.name}:`, storedProgress.generatedImage);
        setAIGeneratedimg(storedProgress.generatedImage);
        
        // Also restore the comparison result/feedback if available
        if (storedProgress.lastComparisonResult) {
          console.log(`📊 Restoring comparison result for ${shape.name}:`, storedProgress.lastComparisonResult);
          setResult(storedProgress.lastComparisonResult);
          // Set flag to indicate this generation has been compared
          setHasComparedCurrentGeneration(true);
        } else {
          // Clear result if no stored comparison result
          setResult(null);
        }
      } else {
        // Clear generated image and result for clean slate
        setAIGeneratedimg(null);
        setResult(null);
      }
      setPrompt("");
      
      console.log(`🎯 Hanging shape ${shape.name} clicked! Setting target image:`, image);
      console.log(`📊 Challenge switched to: ${shape.name}.`);
      
      // Show progress data if available
      if (progressData[index]) {
        const data = progressData[index];
        console.log(`📈 Progress for ${shape.name}:`, {
          bestScore: `${data.bestScore.toFixed(1)}%`,
          attempts: data.attempts,
          completed: data.completed,
          lastAttempt: new Date(data.lastAttemptAt).toLocaleString(),
          hasStoredImage: !!data.generatedImage,
          hasStoredResult: !!data.lastComparisonResult
        });
      }
    } else {
      console.log("Shape is locked");
    }
  };

  // Handle shape navigation from progress tracker
  const handleProgressShapeClick = (index) => {
    if (unlockedShapes.includes(index)) {
      // Stop any ongoing voice
      if (isVoicePlaying) {
        voiceManager.stopCurrentAudio();
        setIsVoicePlaying(false);
      }
      
      const shape = shapes[index];
      setSelectedImage(shape.image);
      setHasComparedCurrentGeneration(false);
      playClickSound();
      
      // Restore stored generated image and comparison result if available
      const storedProgress = progressData[index];
      if (storedProgress && storedProgress.generatedImage) {
        console.log(`🖼️ Restoring generated image for ${shape.name}:`, storedProgress.generatedImage);
        setAIGeneratedimg(storedProgress.generatedImage);
        
        // Also restore the comparison result/feedback if available
        if (storedProgress.lastComparisonResult) {
          console.log(`📊 Restoring comparison result for ${shape.name}:`, storedProgress.lastComparisonResult);
          setResult(storedProgress.lastComparisonResult);
          // Set flag to indicate this generation has been compared
          setHasComparedCurrentGeneration(true);
        } else {
          // Clear result if no stored comparison result
          setResult(null);
        }
      } else {
        // Clear generated image and result for clean slate
        setAIGeneratedimg(null);
        setResult(null);
      }
      setPrompt("");
      
      console.log(`🎯 Progress shape ${shape.name} (${index}) clicked! Navigating to challenge:`, shape.image);
      console.log(`📊 Challenge switched to: ${shape.name}.`);
      
      // Show progress data if available
      if (progressData[index]) {
        const data = progressData[index];
        console.log(`📈 Progress for ${shape.name}:`, {
          bestScore: `${data.bestScore.toFixed(1)}%`,
          attempts: data.attempts,
          completed: data.completed,
          lastAttempt: new Date(data.lastAttemptAt).toLocaleString(),
          hasStoredImage: !!data.generatedImage,
          hasStoredResult: !!data.lastComparisonResult
        });
      }
    } else {
      console.log(`🔒 Shape ${shapes[index].name} is locked`);
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
  const { selectedImage, handleComparison, setIsComparing, setResult, voiceEnabled, voiceManager, setIsVoicePlaying, shapes, unlockedShapes, setUnlockedShapes, setShowUnlockNotification, setSelectedImage: setSelectedImageFunc, setProgressData, setPrompt, setAIGeneratedimg, setHasComparedCurrentGeneration, setIsAutoProgressing, setUnlockNotificationData } = comparisonParams;
  
  console.log("🔄 Waiting for image to load before comparison...");
  
  const img = new Image();
  img.onload = async () => {
    console.log("🖼️ Image fully loaded, starting comparison...");
    setIsImageLoading(false);
    await performComparison(imageUrl, selectedImage, handleComparison, setIsComparing, setResult, voiceEnabled, voiceManager, setIsVoicePlaying, shapes, unlockedShapes, setUnlockedShapes, setShowUnlockNotification, setSelectedImageFunc, setProgressData, setPrompt, setAIGeneratedimg, setHasComparedCurrentGeneration, setIsAutoProgressing, setUnlockNotificationData);
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
const performComparison = async (imageUrl, selectedImage, handleComparison, setIsComparing, setResult, voiceEnabled, voiceManager, setIsVoicePlaying, shapes, unlockedShapes, setUnlockedShapes, setShowUnlockNotification, setSelectedImageFunc, setProgressData, setPrompt, setAIGeneratedimg, setHasComparedCurrentGeneration, setIsAutoProgressing, setUnlockNotificationData) => {
  try {
    setIsComparing(true);
    const comparisonResult = await handleComparison(imageUrl, selectedImage);
    
    console.log("🔍 Raw comparison result:", comparisonResult);
    console.log("🔍 Comparison result type:", typeof comparisonResult);
    console.log("🔍 Comparison result keys:", Object.keys(comparisonResult || {}));
    
    // Save progress data for ALL attempts (not just successful auto-progression)
    const currentChallengeIndex = shapes.findIndex(shape => shape.image === selectedImage);
    const saveProgressData = (challengeIndex, percentage, generatedImageUrl = null, comparisonResultData = null) => {
      setProgressData(prev => ({
        ...prev,
        [challengeIndex]: {
          challengeName: shapes[challengeIndex].name,
          bestScore: Math.max(prev[challengeIndex]?.bestScore || 0, percentage),
          latestScore: percentage,
          attempts: (prev[challengeIndex]?.attempts || 0) + 1,
          completed: percentage >= 60,
          firstCompletedAt: prev[challengeIndex]?.firstCompletedAt || (percentage >= 60 ? new Date().toISOString() : null),
          lastAttemptAt: new Date().toISOString(),
          // Store the generated image URL (keep the best performing one or latest)
          generatedImage: generatedImageUrl || prev[challengeIndex]?.generatedImage,
          // Store the full comparison result for restoring feedback
          lastComparisonResult: comparisonResultData || prev[challengeIndex]?.lastComparisonResult
        }
      }));
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
        
        // Save progress data for this attempt with generated image
        if (currentChallengeIndex >= 0) {
          // Store the generated image URL when saving progress
          const currentGeneratedImage = imageUrl || AIGeneratedimg;
          saveProgressData(currentChallengeIndex, normalizedResult.percentage, currentGeneratedImage, normalizedResult);
        }
        
        console.log("✅ Comparison completed successfully:", normalizedResult);
        console.log("🎯 Setting result state with:", normalizedResult);
        setResult(normalizedResult);
        
        // Check for auto-progression FIRST (regardless of voice)
        await handleAutoProgression(normalizedResult, currentChallengeIndex, shapes, unlockedShapes, setUnlockedShapes, setShowUnlockNotification, setSelectedImageFunc, setPrompt, setResult, setAIGeneratedimg, setHasComparedCurrentGeneration, setIsAutoProgressing, setUnlockNotificationData);
        
        // Then handle voice feedback
        handleVoiceFeedback(normalizedResult, voiceEnabled, voiceManager, setIsVoicePlaying, selectedImage, shapes, unlockedShapes, setUnlockedShapes, setShowUnlockNotification, setSelectedImageFunc, AIGeneratedimg);
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
const handleAutoProgression = async (comparisonResult, currentChallengeIndex, shapes, unlockedShapes, setUnlockedShapes, setShowUnlockNotification, setSelectedImage, setPrompt, setResult, setAIGeneratedimg, setHasComparedCurrentGeneration, setIsAutoProgressing, setUnlockNotificationData) => {
  const percentage = comparisonResult.percentage || 0;
  const nextChallengeIndex = currentChallengeIndex + 1;
  const hasNextChallenge = nextChallengeIndex < shapes.length;
  const isCurrentUnlocked = unlockedShapes.includes(currentChallengeIndex);
  const isNextAlreadyUnlocked = unlockedShapes.includes(nextChallengeIndex);
  
  console.log(`🔍 Auto-progression check: Score ${percentage}%, Current: ${currentChallengeIndex}, Next: ${nextChallengeIndex}, Has next: ${hasNextChallenge}, Next unlocked: ${isNextAlreadyUnlocked}`);
  
  // AUTO-UNLOCK: Score >= 60% - Immediately unlock next challenge
  if (percentage >= 60 && hasNextChallenge && isCurrentUnlocked && !isNextAlreadyUnlocked) {
    console.log(`🎉 AUTO-UNLOCK TRIGGERED! Score ${percentage.toFixed(1)}% >= 60% - Processing unlock...`);
    
    // Step 1: Unlock the next challenge immediately
    setUnlockedShapes(prev => {
      const newUnlocked = [...prev, nextChallengeIndex];
      console.log("✅ Unlocked shapes updated:", newUnlocked);
      return newUnlocked;
    });
    
    // Step 2: Show notification
    setUnlockNotificationData({
      type: 'auto',
      score: percentage,
      challengeName: shapes[nextChallengeIndex].name
    });
    setShowUnlockNotification(true);
    
    console.log(`🔓 Challenge "${shapes[nextChallengeIndex].name}" unlocked! Notification shown.`);
    
    // Step 3: Auto-progress after 3 seconds
    setTimeout(() => {
      console.log(`🎯 Starting auto-progression to: ${shapes[nextChallengeIndex].name}`);
      
      // Switch to next challenge
      setSelectedImage(shapes[nextChallengeIndex].image);
      
      // Clear state for fresh start
      setPrompt("");
      setResult(null);
      setAIGeneratedimg(null);
      setHasComparedCurrentGeneration(false);
      
      console.log(`✅ Auto-progressed to challenge: ${shapes[nextChallengeIndex].name}`);
      console.log(`🎯 Target image set to:`, shapes[nextChallengeIndex].image);
      
      // Hide notification
      setShowUnlockNotification(false);
      
    }, 3000); // 3 second delay for auto-progression
    
  } else if (percentage >= 60 && !hasNextChallenge) {
    console.log(`🏆 FINAL CHALLENGE COMPLETED! Score ${percentage.toFixed(1)}% - No more challenges`);
  } else if (percentage >= 60 && isNextAlreadyUnlocked) {
    console.log(`✅ Great score ${percentage.toFixed(1)}% but next challenge already unlocked`);
  } else {
    console.log(`📊 Score ${percentage.toFixed(1)}% - Need 60%+ to unlock next challenge`);
  }
};

// Helper function to handle voice feedback and automatic progression
const handleVoiceFeedback = async (comparisonResult, voiceEnabled, voiceManager, setIsVoicePlaying, selectedImage, shapes, unlockedShapes, setUnlockedShapes, setShowUnlockNotification, setSelectedImage, AIGeneratedimg) => {
  if (voiceEnabled) {
    try {
      setIsVoicePlaying(true);
      
      // Create challenge context for contextual voice selection
      const currentChallengeIndex = shapes.findIndex(shape => shape.image === selectedImage);
      
      // Get the score from the normalized result
      const score = comparisonResult.combined || comparisonResult.percentage / 100 || 0;
      const percentage = comparisonResult.percentage || score * 100 || 0;
      
      // Save challenge progress data
      const saveProgressData = (challengeIndex, score, percentage, generatedImageUrl = null, comparisonResultData = null) => {
        setProgressData(prev => ({
          ...prev,
          [challengeIndex]: {
            challengeName: shapes[challengeIndex].name,
            bestScore: Math.max(prev[challengeIndex]?.bestScore || 0, percentage),
            latestScore: percentage,
            attempts: (prev[challengeIndex]?.attempts || 0) + 1,
            completed: percentage >= 60,
            firstCompletedAt: prev[challengeIndex]?.firstCompletedAt || (percentage >= 60 ? new Date().toISOString() : null),
            lastAttemptAt: new Date().toISOString(),
            // Store the generated image URL (keep the best performing one or latest)
            generatedImage: generatedImageUrl || prev[challengeIndex]?.generatedImage,
            // Store the full comparison result for restoring feedback
            lastComparisonResult: comparisonResultData || prev[challengeIndex]?.lastComparisonResult
          }
        }));
      };
      
      // Save progress for current challenge
      saveProgressData(currentChallengeIndex, score, percentage, AIGeneratedimg, comparisonResult);
      
      console.log(`🎵 Playing contextual voice for ${percentage.toFixed(1)}% similarity with alternation...`);
      
      // Determine progression logic
      const nextChallengeIndex = currentChallengeIndex + 1;
      const hasNextChallenge = nextChallengeIndex < shapes.length;
      const isCurrentUnlocked = unlockedShapes.includes(currentChallengeIndex);
      const isNextAlreadyUnlocked = unlockedShapes.includes(nextChallengeIndex);
      
      // SUCCESS: Score >= 60% - Auto unlock and progress
      if (percentage >= 60 && hasNextChallenge && isCurrentUnlocked && !isNextAlreadyUnlocked) {
        console.log(`🎉 SUCCESS! Score ${percentage.toFixed(1)}% >= 60% - Auto-unlocking next challenge`);
        
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
          console.log(`🔓 Auto-unlocking challenge ${nextChallengeIndex + 1}: ${shapes[nextChallengeIndex].name}`);
          
          setIsAutoProgressing(true); // Start auto-progression loading
          
          setUnlockedShapes(prev => {
            const newUnlocked = [...prev, nextChallengeIndex];
            console.log("✅ New unlocked shapes:", newUnlocked);
            return newUnlocked;
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
            console.log(`🎯 Auto-selecting next challenge: ${shapes[nextChallengeIndex].name}`);
            setSelectedImage(shapes[nextChallengeIndex].image);
            
            // Clear prompt field for fresh start on new challenge
            setPrompt("");
            
            // Clear any previous results and generated images for clean slate
            setResult(null);
            setAIGeneratedimg(null);
            setHasComparedCurrentGeneration(false);
            
            console.log(`🧹 Cleared prompt and results for fresh start on ${shapes[nextChallengeIndex].name}`);
            
            setIsAutoProgressing(false); // End auto-progression loading
            
            // Play welcome voice for new challenge
            setTimeout(async () => {
              try {
                setIsVoicePlaying(true);
                console.log('🎵 Playing welcome voice for new challenge...');
                await voiceManager.playWelcomeVoice();
                setIsVoicePlaying(false);
              } catch (error) {
                console.warn('Welcome voice failed:', error);
                setIsVoicePlaying(false);
              }
            }, 500);
            
          }, 2000);
        }, 2500);
        
      } 
      // NEAR SUCCESS: Score 40-59% - Motivational feedback
      else if (percentage >= 40 && percentage < 60) {
        console.log(`🔥 NEAR SUCCESS! Score ${percentage.toFixed(1)}% (40-59%) - Playing motivation`);
        
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
        console.log('🎵 Near success voice played - user encouraged to try again');
        
      }
      // LOW SCORE: Score < 40% - Motivational retry feedback  
      else if (percentage < 40) {
        console.log(`🔄 LOW SCORE! Score ${percentage.toFixed(1)}% < 40% - Playing retry motivation`);
        
        await voiceManager.playMotivationVoice();
        console.log('🎵 Motivation voice played - encouraging user to try different approach');
        
      }
      // ALREADY AT FINAL CHALLENGE or ALREADY UNLOCKED
      else if (!hasNextChallenge || isNextAlreadyUnlocked) {
        if (!hasNextChallenge && percentage >= 60) {
          console.log(`🏆 FINAL CHALLENGE COMPLETED! Score ${percentage.toFixed(1)}% - Playing final celebration`);
          await voiceManager.playFinalCelebrationVoice();
        } else {
          console.log(`✅ Challenge completed (already unlocked or final) - Playing success voice`);
          await voiceManager.playSuccessVoice();
        }
      }
      
      setIsVoicePlaying(false);
      
      // Log voice status after contextual voice
      const status = voiceManager.getVoiceAlternationStatus();
      console.log('📊 Voice status after contextual feedback:', {
        success: status.success,
        motivation: status.motivation,
        nearSuccess: status.nearSuccess,
        unlock: status.unlock
      });
      
    } catch (error) {
      console.warn("🎵 Voice feedback failed:", error);
      setIsVoicePlaying(false);
    }
  } else {
    // Handle progression without voice
    const currentChallengeIndex = shapes.findIndex(shape => shape.image === selectedImage);
    const score = comparisonResult.combined || comparisonResult.percentage / 100 || 0;
    const percentage = comparisonResult.percentage || score * 100 || 0;
    const nextChallengeIndex = currentChallengeIndex + 1;
    const hasNextChallenge = nextChallengeIndex < shapes.length;
    const isCurrentUnlocked = unlockedShapes.includes(currentChallengeIndex);
    const isNextAlreadyUnlocked = unlockedShapes.includes(nextChallengeIndex);
    
    // Auto-progression even without voice
    if (percentage >= 60 && hasNextChallenge && isCurrentUnlocked && !isNextAlreadyUnlocked) {
      console.log(`🎉 Silent auto-progression: Score ${percentage.toFixed(1)}% >= 60%`);
      
      // Save progress data for silent mode too
      const saveProgressData = (challengeIndex, score, percentage, generatedImageUrl = null, comparisonResultData = null) => {
        setProgressData(prev => ({
          ...prev,
          [challengeIndex]: {
            challengeName: shapes[challengeIndex].name,
            bestScore: Math.max(prev[challengeIndex]?.bestScore || 0, percentage),
            latestScore: percentage,
            attempts: (prev[challengeIndex]?.attempts || 0) + 1,
            completed: percentage >= 60,
            firstCompletedAt: prev[challengeIndex]?.firstCompletedAt || (percentage >= 60 ? new Date().toISOString() : null),
            lastAttemptAt: new Date().toISOString(),
            // Store the generated image URL (keep the best performing one or latest)
            generatedImage: generatedImageUrl || prev[challengeIndex]?.generatedImage,
            // Store the full comparison result for restoring feedback
            lastComparisonResult: comparisonResultData || prev[challengeIndex]?.lastComparisonResult
          }
        }));
      };
      
      // Save progress for current challenge
      saveProgressData(currentChallengeIndex, score, percentage, AIGeneratedimg, comparisonResult);
      
      setTimeout(() => {
        setUnlockedShapes(prev => [...prev, nextChallengeIndex]);
        setUnlockNotificationData({
          type: 'auto',
          score: percentage,
          challengeName: shapes[nextChallengeIndex].name
        });
        setShowUnlockNotification(true);
        setTimeout(() => setShowUnlockNotification(false), 4000);
        
        setTimeout(() => {
          console.log(`🎯 Silent auto-selecting next challenge: ${shapes[nextChallengeIndex].name}`);
          
          setIsAutoProgressing(true); // Start auto-progression loading
          
          setSelectedImage(shapes[nextChallengeIndex].image);
          
          // Clear prompt field for fresh start on new challenge
          setPrompt("");
          
          // Clear any previous results and generated images for clean slate
          setResult(null);
          setAIGeneratedimg(null);
          setHasComparedCurrentGeneration(false);
          
          console.log(`🧹 Silent mode: Cleared prompt and results for fresh start on ${shapes[nextChallengeIndex].name}`);
          
          setIsAutoProgressing(false); // End auto-progression loading
        }, 2000);
      }, 1000);
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
        setUnlockedShapes,
        setShowUnlockNotification,
        setSelectedImage,
        setProgressData,
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
    handleGenerationError(error, stateSetters);
  } finally {
    console.log("Image generation complete");
    setIsGenerating(false);
  }
};

// Helper function to reset all progress
const handleResetProgress = () => {
  // Show confirmation dialog
  const confirmReset = window.confirm(
    "Are you sure you want to reset ALL progress?\n\n" +
    "This will:\n" +
    "• Clear all unlocked challenges\n" +
    "• Remove all generated images\n" +
    "• Delete all progress data\n" +
    "• Reset to the beginning\n\n" +
    "This action cannot be undone!"
  );
  
  if (confirmReset) {
    console.log("🔄 Resetting all progress...");
    
    // Stop any ongoing voice
    if (isVoicePlaying) {
      voiceManager.stopCurrentAudio();
      setIsVoicePlaying(false);
    }
    
    // Clear localStorage
    localStorage.removeItem("unlockedShapes");
    localStorage.removeItem("challengeProgress");
    console.log("🧹 Cleared localStorage");
    
    // Reset all state to initial values
    setUnlockedShapes([0]); // Only first challenge unlocked
    setProgressData({});
    setSelectedImage(shapes[0].image); // Reset to first challenge
    setAIGeneratedimg(null);
    setResult(null);
    setPrompt("");
    setHasComparedCurrentGeneration(false);
    setIsComparing(false);
    setIsGenerating(false);
    setIsImageLoading(false);
    setShowUnlockNotification(false);
    setIsAutoProgressing(false);
    
    console.log("✅ Progress reset complete! Back to the beginning.");
    
    // Show reset confirmation
    setUnlockNotificationData({
      type: 'reset',
      score: 0,
      challengeName: 'Progress Reset Complete!'
    });
    setShowUnlockNotification(true);
    setTimeout(() => setShowUnlockNotification(false), 3000);
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
                : unlockNotificationData.type === 'reset'
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
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
                {unlockNotificationData.type === 'auto' ? '🎉' : 
                 unlockNotificationData.type === 'reset' ? '🔄' : '🔓'}
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
                ) : unlockNotificationData.type === 'reset' ? (
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: '700' }}>
                      {unlockNotificationData.challengeName}
                    </div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '2px' }}>
                      All progress cleared. Starting fresh!
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
                Moving to next challenge automatically...
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
            onResetProgress={handleResetProgress}
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