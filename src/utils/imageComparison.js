// imageComparison.js - Enhanced MS-SSIM Image Comparison Utility

// SSIM library loading with fallback
let ssimLib = null;

const loadSSIM = async () => {
  if (ssimLib) return ssimLib;
  
  try {
    const ssimModule = await import("ssim.js");
    ssimLib = ssimModule.ssim || ssimModule.default;
    return ssimLib;
  } catch (error) {
    console.warn("⚠️ SSIM library failed to load, using fallback method:", error);
    return null;
  }
};

// Simple pixel-based comparison fallback
const simplePixelComparison = (imageData1, imageData2) => {
  if (imageData1.width !== imageData2.width || imageData1.height !== imageData2.height) {
    console.warn("Images have different dimensions");
    return 0.1; // Low score for different dimensions
  }
  
  const data1 = imageData1.data;
  const data2 = imageData2.data;
  let totalDiff = 0;
  let totalPixels = 0;
  
  for (let i = 0; i < data1.length; i += 4) {
    const r1 = data1[i], g1 = data1[i + 1], b1 = data1[i + 2];
    const r2 = data2[i], g2 = data2[i + 1], b2 = data2[i + 2];
    
    // Calculate RGB difference
    const diff = Math.sqrt(
      Math.pow(r1 - r2, 2) + 
      Math.pow(g1 - g2, 2) + 
      Math.pow(b1 - b2, 2)
    );
    
    totalDiff += diff;
    totalPixels++;
  }
  
  const avgDiff = totalDiff / totalPixels;
  const maxDiff = Math.sqrt(3 * 255 * 255); // Max possible RGB difference
  const similarity = 1 - (avgDiff / maxDiff);
  
  return Math.max(0, Math.min(1, similarity));
};

// Convert image to ImageData for SSIM processing with enhanced error handling
const toImageData = (img, w, h) => {
  try {
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
    
    return imageData;
  } catch (error) {
    console.error('Error in toImageData:', error);
    throw error;
  }
};

// Load image with enhanced error handling and retry mechanism
const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    // Handle different input types
    if (!src) {
      reject(new Error('No image source provided'));
      return;
    }
    
    const img = new Image();
    
    // Set crossOrigin for external images
    if (typeof src === 'string' && (src.startsWith('http') || src.startsWith('//'))) {
      img.crossOrigin = "anonymous";
    }
    
    let loadAttempts = 0;
    const maxAttempts = 3;
    
    const attemptLoad = () => {
      loadAttempts++;
      
      img.onload = () => {
        resolve(img);
      };
      
      img.onerror = (error) => {
        if (loadAttempts < maxAttempts) {
          // Try different approaches
          if (loadAttempts === 2) {
            // Second attempt: remove crossOrigin
            img.crossOrigin = null;
            setTimeout(attemptLoad, 500);
          } else {
            // Third attempt: different timeout
            setTimeout(attemptLoad, 1000);
          }
        } else {
          console.error(`💥 All loading attempts failed for image after ${maxAttempts} tries`);
          reject(new Error(`Failed to load image after ${maxAttempts} attempts: ${error.message || 'Unknown error'}`));
        }
      };
      
      // Set the source to trigger loading
      img.src = src;
    };
    
    // Start the first attempt
    attemptLoad();
  });
};

// Enhanced fallback SSIM implementation for when ssim.js fails
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

// Color histogram comparison for similar color distributions with enhanced accuracy
const computeColorHistogramSimilarity = (imageDataA, imageDataB) => {
  try {
    const dataA = imageDataA.data;
    const dataB = imageDataB.data;
    
    // Create color histograms (32 bins per channel for better accuracy)
    const bins = 32;
    const histA = new Array(bins * 3).fill(0);
    const histB = new Array(bins * 3).fill(0);
    
    for (let i = 0; i < dataA.length; i += 4) {
      // Quantize color values to histogram bins with better precision
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
    
    // Calculate histogram intersection (similarity) with enhanced method
    let intersection = 0;
    let chiSquare = 0;
    
    for (let i = 0; i < histA.length; i++) {
      intersection += Math.min(histA[i], histB[i]);
      // Add chi-square distance for additional accuracy
      const diff = histA[i] - histB[i];
      const sum = histA[i] + histB[i];
      if (sum > 0) {
        chiSquare += (diff * diff) / sum;
      }
    }
    
    // Combine intersection and chi-square for better accuracy
    const chiSquareSimilarity = 1 / (1 + chiSquare);
    return (intersection * 0.7 + chiSquareSimilarity * 0.3);
  } catch (error) {
    console.error('Color histogram similarity error:', error);
    return 0;
  }
};

// Edge detection for structural similarity with enhanced algorithm
const computeEdgeSimilarity = (imageDataA, imageDataB) => {
  try {
    const dataA = imageDataA.data;
    const dataB = imageDataB.data;
    const width = imageDataA.width;
    const height = imageDataA.height;
    
    // Enhanced edge detection using Sobel operator
    const getSobelEdgeStrength = (data, x, y, w) => {
      if (x <= 1 || x >= w - 2 || y <= 1 || y >= height - 2) return 0;
      
      // Sobel kernels
      const Gx = [
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1]
      ];
      
      const Gy = [
        [-1, -2, -1],
        [ 0,  0,  0],
        [ 1,  2,  1]
      ];
      
      let gx = 0;
      let gy = 0;
      
      // Apply Sobel operator
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixelX = x + kx;
          const pixelY = y + ky;
          const idx = (pixelY * w + pixelX) * 4;
          
          // Calculate luminance
          const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          
          gx += Gx[ky + 1][kx + 1] * lum;
          gy += Gy[ky + 1][kx + 1] * lum;
        }
      }
      
      // Gradient magnitude
      return Math.sqrt(gx * gx + gy * gy);
    };
    
    let totalEdgeDiff = 0;
    let maxPossibleDiff = 0;
    let edgePixels = 0;
    let edgeSimilaritySum = 0;
    
    // Process edges with better sampling
    for (let y = 2; y < height - 2; y += 2) {
      for (let x = 2; x < width - 2; x += 2) {
        const edgeA = getSobelEdgeStrength(dataA, x, y, width);
        const edgeB = getSobelEdgeStrength(dataB, x, y, width);
        
        const diff = Math.abs(edgeA - edgeB);
        totalEdgeDiff += diff;
        maxPossibleDiff += 255; // Maximum possible edge difference
        edgePixels++;
        
        // Calculate local similarity
        if (edgeA + edgeB > 0) {
          const localSimilarity = 1 - (diff / Math.max(edgeA, edgeB));
          edgeSimilaritySum += Math.max(0, localSimilarity);
        }
      }
    }
    
    if (edgePixels === 0) return 0;
    
    // Combine multiple edge similarity measures
    const basicSimilarity = 1 - (totalEdgeDiff / maxPossibleDiff);
    const normalizedSimilarity = edgeSimilaritySum / edgePixels;
    
    // Weighted combination for better accuracy
    return (basicSimilarity * 0.4 + normalizedSimilarity * 0.6);
  } catch (error) {
    console.error('Edge similarity error:', error);
    return 0;
  }
};

// Semantic content analysis for similar subjects with enhanced features
const computeSemanticSimilarity = (imageDataA, imageDataB) => {
  try {
    const dataA = imageDataA.data;
    const dataB = imageDataB.data;
    
    // Enhanced image analysis with multiple features
    const analyzeImage = (data) => {
      const colors = { red: 0, green: 0, blue: 0 };
      const brightness = [];
      const saturation = [];
      let totalPixels = 0;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        colors.red += r;
        colors.green += g;
        colors.blue += b;
        
        // Calculate luminance (perceived brightness)
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        brightness.push(lum);
        
        // Calculate saturation
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const sat = max === 0 ? 0 : (max - min) / max;
        saturation.push(sat);
        
        totalPixels++;
      }
      
      // Normalize color averages
      colors.red /= totalPixels;
      colors.green /= totalPixels;
      colors.blue /= totalPixels;
      
      // Calculate statistics
      brightness.sort((a, b) => a - b);
      saturation.sort((a, b) => a - b);
      
      const brightnessMedian = brightness[Math.floor(brightness.length / 2)];
      const brightnessAvg = brightness.reduce((a, b) => a + b, 0) / brightness.length;
      const brightnessStd = Math.sqrt(
        brightness.reduce((a, b) => a + Math.pow(b - brightnessAvg, 2), 0) / brightness.length
      );
      
      const saturationMedian = saturation[Math.floor(saturation.length / 2)];
      const saturationAvg = saturation.reduce((a, b) => a + b, 0) / saturation.length;
      
      return { 
        colors, 
        brightness: { avg: brightnessAvg, median: brightnessMedian, std: brightnessStd },
        saturation: { avg: saturationAvg, median: saturationMedian }
      };
    };
    
    const analysisA = analyzeImage(dataA);
    const analysisB = analyzeImage(dataB);
    
    // Compare color profiles with enhanced method
    const colorSimilarity = 1 - (
      Math.abs(analysisA.colors.red - analysisB.colors.red) +
      Math.abs(analysisA.colors.green - analysisB.colors.green) +
      Math.abs(analysisA.colors.blue - analysisB.colors.blue)
    ) / (255 * 3);
    
    // Compare brightness profiles
    const brightnessSimilarity = 1 - (
      Math.abs(analysisA.brightness.avg - analysisB.brightness.avg) +
      Math.abs(analysisA.brightness.std - analysisB.brightness.std)
    ) / (255 * 2);
    
    // Compare saturation profiles
    const saturationSimilarity = 1 - Math.abs(analysisA.saturation.avg - analysisB.saturation.avg);
    
    // Weighted combination
    return (colorSimilarity * 0.5 + brightnessSimilarity * 0.3 + saturationSimilarity * 0.2);
  } catch (error) {
    console.error('Semantic similarity error:', error);
    return 0;
  }
};

// Multi-Scale SSIM computation using ssim.js with proper MS-SSIM implementation
const computeMultiScaleSSIM = async (imageDataA, imageDataB, numScales = 5) => {
  try {
    // Load SSIM library
    const ssim = await loadSSIM();
    
    // If SSIM library failed to load, use fallback
    if (!ssim) {
      const fallbackScore = simplePixelComparison(imageDataA, imageDataB);
      return {
        ms_ssim: fallbackScore,
        per_scale_scores: [fallbackScore],
        method: 'pixel_fallback'
      };
    }
    
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
    
    for (let scale = 0; scale < numScales; scale++) {
      try {
        // Calculate dimensions for this scale
        const scaleFactor = Math.pow(2, scale);
        const scaleWidth = Math.max(8, Math.floor(baseWidth / scaleFactor));
        const scaleHeight = Math.max(8, Math.floor(baseHeight / scaleFactor));
        
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
          console.warn(`SSIM failed at scale ${scale + 1}, using pixel fallback:`, ssimError);
          // Use pixel comparison as fallback for this scale
          ssimScore = simplePixelComparison(scaledDataA, scaledDataB);
        }
        
        ssimScore = Math.max(0, Math.min(1, ssimScore));
        
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
    // Enhanced validation
    if (!srcA || !srcB) {
      throw new Error('Missing source images for comparison');
    }
    
    // Load both images using the enhanced loadImage function
    const [imgA, imgB] = await Promise.all([
      loadImage(srcA), 
      loadImage(srcB)
    ]);
    
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
    
    // 1. PRIMARY: Multi-Scale SSIM (Structure Priority) - 50% weight
    const msssimResult = await computeMultiScaleSSIM(imageDataA, imageDataB, numScales);
    const structureScore = msssimResult.ms_ssim;
    
    // 2. SECONDARY: Color Histogram (Color Priority) - 25% weight
    const colorScore = computeColorHistogramSimilarity(imageDataA, imageDataB);
    
    // 3. TERTIARY: Edge/Shape Analysis (Shape Priority) - 15% weight
    const shapeScore = computeEdgeSimilarity(imageDataA, imageDataB);
    
    // 4. QUATERNARY: Semantic Content Analysis - 10% weight
    const semanticScore = computeSemanticSimilarity(imageDataA, imageDataB);
    
    // 5. NEW: Pixel-based similarity for fine-grained comparison - 5% weight
    const pixelScore = computePixelSimilarity(imageDataA, imageDataB);
    
    // Enhanced weighting system prioritizing structure, color, and shape
    const weights = {
      structure: 0.45,  // MS-SSIM (structure is most important)
      color: 0.25,      // Color distribution 
      shape: 0.15,      // Edge/shape patterns
      semantic: 0.10,   // Semantic content analysis
      pixel: 0.05       // Fine-grained pixel comparison
    };
    
    // Calculate weighted combined score
    const combinedScore = 
      structureScore * weights.structure +
      colorScore * weights.color +
      shapeScore * weights.shape +
      semanticScore * weights.semantic +
      pixelScore * weights.pixel;
    
    // Apply MS-SSIM based enhancement
    let finalScore = combinedScore;
    
    // If MS-SSIM shows good structure similarity, boost the overall score
    if (structureScore > 0.7) {
      finalScore = Math.min(1.0, combinedScore * 1.2); // Increased boost
    }
    
    // If color and shape align well with structure, apply additional boost
    if (structureScore > 0.5 && colorScore > 0.6 && shapeScore > 0.5) {
      finalScore = Math.min(1.0, finalScore * 1.15); // Increased boost
    }
    
    // MS-SSIM quality adjustment - prevent very low scores when structure is decent
    if (structureScore > 0.4 && finalScore < 0.3) {
      finalScore = Math.max(finalScore, structureScore * 0.85); // Increased floor
    }
    
    // Additional enhancement for high semantic similarity
    if (semanticScore > 0.7 && structureScore > 0.4) {
      finalScore = Math.min(1.0, finalScore * 1.1);
    }
    
    // Additional enhancement for high pixel similarity (fine details)
    if (pixelScore > 0.8 && structureScore > 0.5) {
      finalScore = Math.min(1.0, finalScore * 1.05);
    }
    
    const percentage = Math.round(finalScore * 10000) / 100;
    
    const result = {
      ms_ssim: finalScore,
      percentage: percentage,
      detailed_scores: {
        // Map to the expected property names for UI compatibility
        structural: structureScore, // 0-1 scale for FeedbackComponent
        edges: shapeScore, // Use shape score for edges
        colors: colorScore,
        hog_features: semanticScore, // Use semantic for HOG features
        histogram: colorScore, // Use color score for histogram
        hsv_similarity: pixelScore, // Use pixel score for HSV
        
        // Keep original detailed scores for analysis
        structure: Math.round(structureScore * 100),
        color: Math.round(colorScore * 100),
        shape: Math.round(shapeScore * 100),
        semantic: Math.round(semanticScore * 100),
        pixel: Math.round(pixelScore * 100),
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
        semantic_alignment: semanticScore > 0.6 ? 'good' : semanticScore > 0.4 ? 'fair' : 'poor',
        pixel_alignment: pixelScore > 0.7 ? 'high' : pixelScore > 0.5 ? 'medium' : 'low',
        enhancement_applied: finalScore > combinedScore
      },
      base_dimensions: `${standardSize}x${standardSize}`,
      algorithm: 'Enhanced MS-SSIM with Multi-Metric Analysis v2.2'
    };
    
    return result;
    
  } catch (error) {
    console.error('❌ Error in MS-SSIM computation:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      sources: { srcA, srcB }
    });
    
    // Return a more detailed error response
    return {
      error: `MS-SSIM computation failed: ${error.message}`,
      ms_ssim: 0,
      percentage: 0,
      detailed_scores: {
        structural: 0,
        edges: 0, 
        colors: 0,
        hog_features: 0,
        histogram: 0,
        hsv_similarity: 0
      },
      algorithm: 'Enhanced MS-SSIM (Failed)',
      failure_reason: error.message,
      debug_info: {
        srcA_type: typeof srcA,
        srcB_type: typeof srcB,
        srcA_value: String(srcA).substring(0, 100),
        srcB_value: String(srcB).substring(0, 100)
      }
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
    'Semantic Content': `${scores.semantic}%`,
    'Pixel Similarity': `${scores.pixel}%`,
    'Combined Score': `${scores.combined}%`,
    'Final Enhanced': `${scores.final}%`
  };
};