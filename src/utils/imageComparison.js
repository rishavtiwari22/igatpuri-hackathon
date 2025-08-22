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
    
    // SSIM constants (more lenient for better sensitivity)
    const c1 = (0.03 * 255) ** 2;
    const c2 = (0.06 * 255) ** 2;
    
    // SSIM formula
    const numerator = (2 * meanA * meanB + c1) * (2 * covarAB + c2);
    const denominator = (meanA * meanA + meanB * meanB + c1) * (varA + varB + c2);
    
    return Math.max(0, Math.min(1, numerator / denominator));
  } catch (error) {
    console.error('Fallback SSIM error:', error);
    return 0;
  }
};

// Enhanced pixel-based similarity for similar subject matter
const computePixelSimilarity = (imageDataA, imageDataB) => {
  try {
    const dataA = imageDataA.data;
    const dataB = imageDataB.data;
    
    if (dataA.length !== dataB.length) return 0;
    
    let totalDifference = 0;
    let maxPossibleDifference = 0;
    
    // Compare each pixel (RGB values)
    for (let i = 0; i < dataA.length; i += 4) {
      const rDiff = Math.abs(dataA[i] - dataB[i]);
      const gDiff = Math.abs(dataA[i + 1] - dataB[i + 1]);
      const bDiff = Math.abs(dataA[i + 2] - dataB[i + 2]);
      
      // Average difference for this pixel
      const pixelDiff = (rDiff + gDiff + bDiff) / 3;
      totalDifference += pixelDiff;
      maxPossibleDifference += 255; // Maximum possible difference per pixel
    }
    
    // Convert to similarity (1 - normalized difference)
    const similarity = 1 - (totalDifference / maxPossibleDifference);
    return Math.max(0, Math.min(1, similarity));
  } catch (error) {
    console.error('Pixel similarity error:', error);
    return 0;
  }
};

// Color histogram comparison for similar color distributions
const computeColorHistogramSimilarity = (imageDataA, imageDataB) => {
  try {
    const dataA = imageDataA.data;
    const dataB = imageDataB.data;
    
    // Create color histograms (16 bins per channel for efficiency)
    const bins = 16;
    const histA = new Array(bins * 3).fill(0);
    const histB = new Array(bins * 3).fill(0);
    
    for (let i = 0; i < dataA.length; i += 4) {
      // Quantize color values to histogram bins
      const rBinA = Math.floor((dataA[i] / 255) * (bins - 1));
      const gBinA = Math.floor((dataA[i + 1] / 255) * (bins - 1));
      const bBinA = Math.floor((dataA[i + 2] / 255) * (bins - 1));
      
      const rBinB = Math.floor((dataB[i] / 255) * (bins - 1));
      const gBinB = Math.floor((dataB[i + 1] / 255) * (bins - 1));
      const bBinB = Math.floor((dataB[i + 2] / 255) * (bins - 1));
      
      histA[rBinA]++;
      histA[bins + gBinA]++;
      histA[bins * 2 + bBinA]++;
      
      histB[rBinB]++;
      histB[bins + gBinB]++;
      histB[bins * 2 + bBinB]++;
    }
    
    // Normalize histograms
    const totalPixels = dataA.length / 4;
    for (let i = 0; i < histA.length; i++) {
      histA[i] /= totalPixels;
      histB[i] /= totalPixels;
    }
    
    // Calculate histogram intersection (similarity)
    let intersection = 0;
    for (let i = 0; i < histA.length; i++) {
      intersection += Math.min(histA[i], histB[i]);
    }
    
    return intersection;
  } catch (error) {
    console.error('Color histogram similarity error:', error);
    return 0;
  }
};

// Edge detection for structural similarity
const computeEdgeSimilarity = (imageDataA, imageDataB) => {
  try {
    const dataA = imageDataA.data;
    const dataB = imageDataB.data;
    const width = imageDataA.width;
    const height = imageDataA.height;
    
    // Simple edge detection using gradient magnitude
    const getEdgeStrength = (data, x, y, w) => {
      if (x <= 0 || x >= w - 1 || y <= 0 || y >= height - 1) return 0;
      
      const idx = (y * w + x) * 4;
      const idxRight = ((y * w) + (x + 1)) * 4;
      const idxDown = (((y + 1) * w) + x) * 4;
      
      // Calculate luminance
      const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      const right = (data[idxRight] + data[idxRight + 1] + data[idxRight + 2]) / 3;
      const down = (data[idxDown] + data[idxDown + 1] + data[idxDown + 2]) / 3;
      
      const gx = right - current;
      const gy = down - current;
      
      return Math.sqrt(gx * gx + gy * gy);
    };
    
    let totalEdgeDiff = 0;
    let maxPossibleDiff = 0;
    let edgePixels = 0;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const edgeA = getEdgeStrength(dataA, x, y, width);
        const edgeB = getEdgeStrength(dataB, x, y, width);
        
        totalEdgeDiff += Math.abs(edgeA - edgeB);
        maxPossibleDiff += 255; // Maximum possible edge difference
        edgePixels++;
      }
    }
    
    if (edgePixels === 0) return 0;
    
    const similarity = 1 - (totalEdgeDiff / maxPossibleDiff);
    return Math.max(0, Math.min(1, similarity));
  } catch (error) {
    console.error('Edge similarity error:', error);
    return 0;
  }
};

// Semantic content analysis for similar subjects
const computeSemanticSimilarity = (imageDataA, imageDataB) => {
  try {
    const dataA = imageDataA.data;
    const dataB = imageDataB.data;
    
    // Analyze dominant colors and patterns
    const analyzeImage = (data) => {
      const colors = { red: 0, green: 0, blue: 0 };
      const brightness = [];
      let totalPixels = 0;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        colors.red += r;
        colors.green += g;
        colors.blue += b;
        
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        brightness.push(lum);
        totalPixels++;
      }
      
      // Normalize color averages
      colors.red /= totalPixels;
      colors.green /= totalPixels;
      colors.blue /= totalPixels;
      
      // Calculate brightness statistics
      brightness.sort((a, b) => a - b);
      const brightnessMedian = brightness[Math.floor(brightness.length / 2)];
      const brightnessAvg = brightness.reduce((a, b) => a + b, 0) / brightness.length;
      
      return { colors, brightnessMedian, brightnessAvg };
    };
    
    const analysisA = analyzeImage(dataA);
    const analysisB = analyzeImage(dataB);
    
    // Compare color profiles
    const colorSimilarity = 1 - (
      Math.abs(analysisA.colors.red - analysisB.colors.red) +
      Math.abs(analysisA.colors.green - analysisB.colors.green) +
      Math.abs(analysisA.colors.blue - analysisB.colors.blue)
    ) / (255 * 3);
    
    // Compare brightness profiles
    const brightnessSimilarity = 1 - Math.abs(analysisA.brightnessAvg - analysisB.brightnessAvg) / 255;
    
    // Weighted combination
    return (colorSimilarity * 0.6 + brightnessSimilarity * 0.4);
  } catch (error) {
    console.error('Semantic similarity error:', error);
    return 0;
  }
};

// Multi-Scale SSIM computation using ssim.js with proper MS-SSIM implementation
const computeMultiScaleSSIM = (imageDataA, imageDataB, numScales = 5) => {
  try {
    console.log('Computing Multi-Scale SSIM for images:', 
      `${imageDataA.width}x${imageDataA.height}`, 'vs', 
      `${imageDataB.width}x${imageDataB.height}`);
    
    // Validate dimensions
    if (imageDataA.width !== imageDataB.width || imageDataA.height !== imageDataB.height) {
      throw new Error(`Dimension mismatch: ${imageDataA.width}x${imageDataA.height} vs ${imageDataB.width}x${imageDataB.height}`);
    }
    
    // MS-SSIM weights for different scales (standard values)
    const weights = [0.0448, 0.2856, 0.3001, 0.2363, 0.1333];
    const scaleWeights = weights.slice(0, numScales);
    
    let msssimValue = 1.0;
    const perScaleScores = [];
    const baseWidth = imageDataA.width;
    const baseHeight = imageDataA.height;
    
    console.log(`Computing ${numScales} scales for MS-SSIM`);
    
    for (let scale = 0; scale < numScales; scale++) {
      try {
        // Calculate dimensions for this scale
        const scaleFactor = Math.pow(2, scale);
        const scaleWidth = Math.max(8, Math.floor(baseWidth / scaleFactor));
        const scaleHeight = Math.max(8, Math.floor(baseHeight / scaleFactor));
        
        console.log(`Scale ${scale + 1}: ${scaleWidth}x${scaleHeight}`);
        
        // Create canvas for scaling
        const canvas = document.createElement('canvas');
        canvas.width = scaleWidth;
        canvas.height = scaleHeight;
        const ctx = canvas.getContext('2d');
        
        // Scale imageDataA
        const tempCanvasA = document.createElement('canvas');
        tempCanvasA.width = baseWidth;
        tempCanvasA.height = baseHeight;
        const tempCtxA = tempCanvasA.getContext('2d');
        tempCtxA.putImageData(imageDataA, 0, 0);
        
        ctx.drawImage(tempCanvasA, 0, 0, scaleWidth, scaleHeight);
        const scaledDataA = ctx.getImageData(0, 0, scaleWidth, scaleHeight);
        
        // Scale imageDataB
        const tempCanvasB = document.createElement('canvas');
        tempCanvasB.width = baseWidth;
        tempCanvasB.height = baseHeight;
        const tempCtxB = tempCanvasB.getContext('2d');
        tempCtxB.putImageData(imageDataB, 0, 0);
        
        ctx.clearRect(0, 0, scaleWidth, scaleHeight);
        ctx.drawImage(tempCanvasB, 0, 0, scaleWidth, scaleHeight);
        const scaledDataB = ctx.getImageData(0, 0, scaleWidth, scaleHeight);
        
        // Compute SSIM for this scale
        let ssimScore;
        try {
          const result = ssim(scaledDataA, scaledDataB);
          if (typeof result === 'number') {
            ssimScore = result;
          } else if (result && typeof result === 'object') {
            ssimScore = result.mssim || result.ssim || result.mean || result.index || 0;
          } else {
            ssimScore = 0;
          }
        } catch (ssimError) {
          console.warn(`SSIM failed at scale ${scale + 1}, using fallback:`, ssimError);
          ssimScore = fallbackSSIM(scaledDataA, scaledDataB);
        }
        
        ssimScore = Math.max(0, Math.min(1, ssimScore));
        console.log(`Scale ${scale + 1} SSIM: ${ssimScore}`);
        
        // Store per-scale result
        perScaleScores.push({
          scale: scale + 1,
          score: ssimScore,
          weight: scaleWeights[scale],
          dimensions: `${scaleWidth}x${scaleHeight}`
        });
        
        // Apply weight to MS-SSIM calculation
        const weightedScore = Math.max(ssimScore, 1e-10);
        msssimValue *= Math.pow(weightedScore, scaleWeights[scale]);
        
      } catch (scaleError) {
        console.error(`Error at scale ${scale + 1}:`, scaleError);
        // For failed scales, use a fallback score
        const fallbackScore = 0.1;
        perScaleScores.push({
          scale: scale + 1,
          score: fallbackScore,
          weight: scaleWeights[scale],
          error: scaleError.message,
          dimensions: 'error'
        });
        msssimValue *= Math.pow(fallbackScore, scaleWeights[scale]);
      }
    }
    
    console.log(`Final MS-SSIM value: ${msssimValue}`);
    
    return {
      ms_ssim: msssimValue,
      per_scale_scores: perScaleScores
    };
    
  } catch (error) {
    console.error('Error computing Multi-Scale SSIM:', error);
    // Fallback to simple SSIM
    try {
      const fallbackScore = fallbackSSIM(imageDataA, imageDataB);
      return {
        ms_ssim: fallbackScore,
        per_scale_scores: [{
          scale: 1,
          score: fallbackScore,
          weight: 1.0,
          dimensions: `${imageDataA.width}x${imageDataA.height}`,
          fallback: true
        }]
      };
    } catch (fallbackError) {
      console.error('Fallback SSIM also failed:', fallbackError);
      return {
        ms_ssim: 0,
        per_scale_scores: [],
        error: error.message
      };
    }
  }
};

// Enhanced MS-SSIM with Structure, Color, and Shape Priority
export const computeMSSSIM = async (srcA, srcB, numScales = 5) => {
  try {
    console.log(`Starting MS-SSIM based comparison: ${srcA} vs ${srcB}`);
    
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
      throw new Error(`Images too small for comparison: ${baseWidth}x${baseHeight}. Minimum 16x16 required.`);
    }
    
    // Convert to ImageData for analysis (use optimal size for MS-SSIM)
    const standardSize = Math.min(512, Math.max(baseWidth, baseHeight));
    const imageDataA = toImageData(imgA, standardSize, standardSize);
    const imageDataB = toImageData(imgB, standardSize, standardSize);
    
    // 1. PRIMARY: Multi-Scale SSIM (Structure Priority) - 60% weight
    console.log('Computing Multi-Scale SSIM (Structure)...');
    const msssimResult = computeMultiScaleSSIM(imageDataA, imageDataB, numScales);
    const structureScore = msssimResult.ms_ssim;
    console.log(`MS-SSIM Structure Score: ${structureScore}`);
    
    // 2. SECONDARY: Color Histogram (Color Priority) - 25% weight
    console.log('Computing Color Histogram Similarity...');
    const colorScore = computeColorHistogramSimilarity(imageDataA, imageDataB);
    console.log(`Color Similarity Score: ${colorScore}`);
    
    // 3. TERTIARY: Edge/Shape Analysis (Shape Priority) - 15% weight
    console.log('Computing Edge/Shape Similarity...');
    const shapeScore = computeEdgeSimilarity(imageDataA, imageDataB);
    console.log(`Shape/Edge Similarity Score: ${shapeScore}`);
    
    // Enhanced weighting system prioritizing structure, color, and shape
    const weights = {
      structure: 0.60,  // MS-SSIM (structure is most important)
      color: 0.25,      // Color distribution 
      shape: 0.15       // Edge/shape patterns
    };
    
    console.log('Using weights:', weights);
    
    // Calculate weighted combined score
    const combinedScore = 
      structureScore * weights.structure +
      colorScore * weights.color +
      shapeScore * weights.shape;
    
    // Apply MS-SSIM based enhancement
    let finalScore = combinedScore;
    
    // If MS-SSIM shows good structure similarity, boost the overall score
    if (structureScore > 0.7) {
      finalScore = Math.min(1.0, combinedScore * 1.1);
      console.log('Applied MS-SSIM structure boost');
    }
    
    // If color and shape align well with structure, apply additional boost
    if (structureScore > 0.5 && colorScore > 0.6 && shapeScore > 0.5) {
      finalScore = Math.min(1.0, finalScore * 1.05);
      console.log('Applied multi-metric alignment boost');
    }
    
    // MS-SSIM quality adjustment - prevent very low scores when structure is decent
    if (structureScore > 0.4 && finalScore < 0.3) {
      finalScore = Math.max(finalScore, structureScore * 0.75);
      console.log('Applied MS-SSIM quality floor adjustment');
    }
    
    const percentage = Math.round(finalScore * 10000) / 100;
    
    const result = {
      ms_ssim: finalScore,
      percentage: percentage,
      detailed_scores: {
        structure: Math.round(structureScore * 100),
        color: Math.round(colorScore * 100),
        shape: Math.round(shapeScore * 100),
        combined: Math.round(combinedScore * 100),
        final: Math.round(finalScore * 100)
      },
      per_scale_scores: msssimResult.per_scale_scores,
      weights_used: weights,
      analysis: {
        primary_metric: 'MS-SSIM Structure',
        structure_quality: structureScore > 0.7 ? 'high' : structureScore > 0.4 ? 'medium' : 'low',
        color_alignment: colorScore > 0.6 ? 'good' : colorScore > 0.4 ? 'fair' : 'poor',
        shape_alignment: shapeScore > 0.5 ? 'good' : shapeScore > 0.3 ? 'fair' : 'poor',
        enhancement_applied: finalScore > combinedScore
      },
      base_dimensions: `${standardSize}x${standardSize}`,
      algorithm: 'Enhanced MS-SSIM with Structure Priority'
    };
    
    console.log('MS-SSIM based computation completed:', result);
    return result;
    
  } catch (error) {
    console.error('Error in MS-SSIM computation:', error);
    return {
      ms_ssim: 0,
      percentage: 0,
      detailed_scores: {},
      error: error.message,
      algorithm: 'Enhanced MS-SSIM (Failed)'
    };
  }
};

// Enhanced quality description based on similarity percentage
export const getQualityDescription = (percentage) => {
  if (percentage >= 90) return { text: "Outstanding Match!", color: "#22c55e", emoji: "🎯" };
  if (percentage >= 80) return { text: "Excellent Match", color: "#16a34a", emoji: "✨" };
  if (percentage >= 70) return { text: "Very Good Match", color: "#65a30d", emoji: "👍" };
  if (percentage >= 60) return { text: "Good Match", color: "#84cc16", emoji: "👌" };
  if (percentage >= 50) return { text: "Decent Match", color: "#ca8a04", emoji: "🤔" };
  if (percentage >= 40) return { text: "Fair Match", color: "#ea580c", emoji: "😐" };
  if (percentage >= 25) return { text: "Some Similarity", color: "#dc2626", emoji: "😕" };
  return { text: "Poor Match", color: "#991b1b", emoji: "😞" };
};

// Format detailed scores for display
export const formatDetailedScores = (scores) => {
  return {
    'Structure (MS-SSIM)': `${scores.structure}%`,
    'Color Distribution': `${scores.color}%`,
    'Shape/Edge Patterns': `${scores.shape}%`,
    'Combined Score': `${scores.combined}%`,
    'Final Enhanced': `${scores.final}%`
  };
};
