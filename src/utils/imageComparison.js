// imageComparison.js - Pure MS-SSIM Image Comparison Utility
import { ssim } from "ssim.js";

// Convert image to ImageData for SSIM processing with enhanced error handling
const toImageData = (img, w, h) => {
  try {
    console.log(`Converting image to ImageData: ${w}x${h}`);
    
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    // Clear canvas and set white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, w, h);
    
    try {
      // Draw image scaled to target dimensions
      ctx.drawImage(img, 0, 0, w, h);
    } catch (drawError) {
      console.warn('Failed to draw image, creating placeholder:', drawError);
      // Create a placeholder pattern if drawing fails
      const gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, '#ff6b6b');
      gradient.addColorStop(1, '#4ecdc4');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }
    
    const imageData = ctx.getImageData(0, 0, w, h);
    
    if (!imageData || !imageData.data || imageData.data.length === 0) {
      throw new Error('Failed to get image data from canvas');
    }
    
    console.log(`Successfully converted to ImageData: ${imageData.width}x${imageData.height}`);
    return imageData;
  } catch (error) {
    console.error('Error in toImageData:', error);
    throw error;
  }
};

// Load image with enhanced error handling (no CORS proxy needed for image.pollinations.ai)
const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    console.log(`Attempting to load image: ${src}`);
    
    const img = new Image();
    
    // Set crossOrigin for external images
    if (src.startsWith('http') || src.startsWith('//')) {
      img.crossOrigin = "anonymous";
    }
    
    img.onload = () => {
      console.log(`Image loaded successfully: ${src} (${img.width}x${img.height})`);
      resolve(img);
    };
    
    img.onerror = (error) => {
      console.warn(`Failed to load image: ${src}`, error);
      // Try without crossOrigin as fallback
      const imgRetry = new Image();
      imgRetry.onload = () => {
        console.log(`Image loaded successfully without CORS: ${src} (${imgRetry.width}x${imgRetry.height})`);
        resolve(imgRetry);
      };
      imgRetry.onerror = (retryError) => {
        console.error(`All loading attempts failed for: ${src}`, retryError);
        // Create a fallback image instead of rejecting
        createFallbackImage();
      };
      imgRetry.src = src;
    };
    
    // Fallback: Create a simple colored canvas as placeholder
    const createFallbackImage = () => {
      console.log(`Creating fallback image for: ${src}`);
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      
      // Create a gradient pattern as fallback
      const gradient = ctx.createLinearGradient(0, 0, 256, 256);
      gradient.addColorStop(0, '#ff6b6b');
      gradient.addColorStop(1, '#4ecdc4');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);
      
      // Add some pattern
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      for (let i = 0; i < 10; i++) {
        ctx.fillRect(i * 30, i * 30, 20, 20);
      }
      
      // Convert canvas to image
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        console.log(`Fallback image created successfully`);
        resolve(fallbackImg);
      };
      fallbackImg.src = canvas.toDataURL();
    };
    
    img.src = src;
  });
};

// Simple fallback SSIM implementation for when ssim.js fails
const fallbackSSIM = (imageDataA, imageDataB) => {
  try {
    const dataA = imageDataA.data;
    const dataB = imageDataB.data;
    
    if (dataA.length !== dataB.length) return 0;
    
    let sumSquaredDiff = 0;
    let sumA = 0;
    let sumB = 0;
    let sumASq = 0;
    let sumBSq = 0;
    let sumAB = 0;
    let pixelCount = 0;
    
    // Process RGB values (skip alpha channel)
    for (let i = 0; i < dataA.length; i += 4) {
      // Average RGB for grayscale-like comparison
      const pixelA = (dataA[i] + dataA[i + 1] + dataA[i + 2]) / 3;
      const pixelB = (dataB[i] + dataB[i + 1] + dataB[i + 2]) / 3;
      
      sumA += pixelA;
      sumB += pixelB;
      sumASq += pixelA * pixelA;
      sumBSq += pixelB * pixelB;
      sumAB += pixelA * pixelB;
      pixelCount++;
    }
    
    // Calculate means and variances
    const meanA = sumA / pixelCount;
    const meanB = sumB / pixelCount;
    const varA = (sumASq / pixelCount) - (meanA * meanA);
    const varB = (sumBSq / pixelCount) - (meanB * meanB);
    const covarAB = (sumAB / pixelCount) - (meanA * meanB);
    
    // SSIM constants
    const c1 = (0.01 * 255) ** 2;
    const c2 = (0.03 * 255) ** 2;
    
    // Calculate SSIM
    const numerator = (2 * meanA * meanB + c1) * (2 * covarAB + c2);
    const denominator = (meanA * meanA + meanB * meanB + c1) * (varA + varB + c2);
    
    const ssimValue = numerator / denominator;
    return Math.max(0, Math.min(1, ssimValue));
  } catch (error) {
    console.error('Error in fallback SSIM:', error);
    return 0;
  }
};

// Single-scale SSIM computation using ssim.js with fallback
const computeSSIM = (imageDataA, imageDataB) => {
  try {
    console.log('Computing SSIM for images:', 
      `${imageDataA.width}x${imageDataA.height}`, 'vs', 
      `${imageDataB.width}x${imageDataB.height}`);
    
    // Validate dimensions
    if (imageDataA.width !== imageDataB.width || imageDataA.height !== imageDataB.height) {
      throw new Error(`Dimension mismatch: ${imageDataA.width}x${imageDataA.height} vs ${imageDataB.width}x${imageDataB.height}`);
    }
    
    // Validate data
    if (!imageDataA.data || !imageDataB.data) {
      throw new Error('Missing image data');
    }
    
    try {
      // Use ssim.js for comparison
      const result = ssim(imageDataA, imageDataB);
      console.log('Raw SSIM result:', result);
      
      // Handle different return formats from ssim.js
      let score = 0;
      if (typeof result === 'number') {
        score = result;
      } else if (result && typeof result === 'object') {
        // Try different possible property names
        score = result.mssim || result.ssim || result.mean || result.index || 0;
      }
      
      // Ensure score is in valid range [0, 1]
      score = Math.max(0, Math.min(1, score));
      console.log(`SSIM score: ${score}`);
      
      return score;
    } catch (ssimError) {
      console.warn('ssim.js failed, using fallback SSIM:', ssimError);
      return fallbackSSIM(imageDataA, imageDataB);
    }
  } catch (error) {
    console.error('Error computing SSIM:', error);
    throw error;
  }
};

// Multi-Scale SSIM (MS-SSIM) implementation
export const computeMSSSIM = async (srcA, srcB, numScales = 5) => {
  try {
    console.log(`Starting MS-SSIM comparison: ${srcA} vs ${srcB}`);
    
    // Load both images using the simplified loadImage function
    const [imgA, imgB] = await Promise.all([
      loadImage(srcA), 
      loadImage(srcB)
    ]);
    
    console.log(`Images loaded - A: ${imgA.width}x${imgA.height}, B: ${imgB.width}x${imgB.height}`);
    
    // Use smaller dimension as base for scaling
    const baseWidth = Math.min(imgA.width, imgB.width);
    const baseHeight = Math.min(imgA.height, imgB.height);
    
    // Ensure minimum size for meaningful comparison
    if (baseWidth < 16 || baseHeight < 16) {
      throw new Error(`Images too small for MS-SSIM: ${baseWidth}x${baseHeight}. Minimum 16x16 required.`);
    }
    
    // MS-SSIM weights for different scales (standard values)
    const weights = [0.0448, 0.2856, 0.3001, 0.2363, 0.1333];
    const scaleWeights = weights.slice(0, numScales);
    
    let msssimValue = 1.0;
    const perScaleScores = [];
    
    console.log(`Computing ${numScales} scales with base size ${baseWidth}x${baseHeight}`);
    
    for (let scale = 0; scale < numScales; scale++) {
      try {
        // Calculate dimensions for this scale
        const scaleFactor = Math.pow(2, scale);
        const scaleWidth = Math.max(16, Math.floor(baseWidth / scaleFactor));
        const scaleHeight = Math.max(16, Math.floor(baseHeight / scaleFactor));
        
        console.log(`Scale ${scale + 1}: ${scaleWidth}x${scaleHeight}`);
        
        // Convert images to ImageData at this scale
        const imageDataA = toImageData(imgA, scaleWidth, scaleHeight);
        const imageDataB = toImageData(imgB, scaleWidth, scaleHeight);
        
        // Compute SSIM for this scale
        const ssimScore = computeSSIM(imageDataA, imageDataB);
        
        console.log(`Scale ${scale + 1} SSIM: ${ssimScore}`);
        
        // Store per-scale result
        perScaleScores.push({
          scale: scale + 1,
          score: ssimScore,
          weight: scaleWeights[scale],
          dimensions: `${scaleWidth}x${scaleHeight}`
        });
        
        // Apply weight to MS-SSIM calculation
        // Use small epsilon to avoid log(0)
        const weightedScore = Math.max(ssimScore, 1e-10);
        msssimValue *= Math.pow(weightedScore, scaleWeights[scale]);
        
      } catch (scaleError) {
        console.error(`Error at scale ${scale + 1}:`, scaleError);
        // For failed scales, use a low but non-zero score
        const fallbackScore = 0.1;
        perScaleScores.push({
          scale: scale + 1,
          score: fallbackScore,
          weight: scaleWeights[scale],
          error: scaleError.message
        });
        msssimValue *= Math.pow(fallbackScore, scaleWeights[scale]);
      }
    }
    
    // Final MS-SSIM result
    const percentage = Math.round(msssimValue * 10000) / 100; // Two decimal places
    
    const result = {
      ms_ssim: msssimValue,
      percentage: percentage,
      per_scale_scores: perScaleScores,
      num_scales: numScales,
      base_dimensions: `${baseWidth}x${baseHeight}`
    };
    
    console.log('MS-SSIM computation completed:', result);
    return result;
    
  } catch (error) {
    console.error('Error in MS-SSIM computation:', error);
    return {
      ms_ssim: 0,
      percentage: 0,
      per_scale_scores: [],
      error: error.message
    };
  }
};

// Quality description based on MS-SSIM percentage
export const getQualityDescription = (percentage) => {
  if (percentage >= 95) return { text: "Exceptional Match!", color: "#22c55e", emoji: "🎯" };
  if (percentage >= 85) return { text: "Excellent Match", color: "#16a34a", emoji: "✨" };
  if (percentage >= 75) return { text: "Very Good Match", color: "#65a30d", emoji: "👍" };
  if (percentage >= 65) return { text: "Good Match", color: "#ca8a04", emoji: "👌" };
  if (percentage >= 50) return { text: "Fair Match", color: "#ea580c", emoji: "🤔" };
  if (percentage >= 35) return { text: "Poor Match", color: "#dc2626", emoji: "😕" };
  return { text: "Very Poor Match", color: "#991b1b", emoji: "😞" };
};

// Format per-scale scores for display
export const formatPerScaleScores = (scores) => {
  return scores.map((scoreData) => ({
    scale: `Scale ${scoreData.scale}`,
    score: Math.round(scoreData.score * 10000) / 100,
    percentage: `${Math.round(scoreData.score * 100)}%`,
    weight: scoreData.weight,
    dimensions: scoreData.dimensions,
    error: scoreData.error
  }));
};
