import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProgressTracker from "./ProgressTracker";
import { computeMSSSIM, getQualityDescription, formatDetailedScores } from "../utils/imageComparison";

const generateWithPollinations = async (prompt) => {
    const width = 1024;
    const height = 1024;
    const seed = Math.floor(Math.random() * 1000);
    const model = "flux";
    
    // Use the reliable Pollinations API endpoint
    const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=${model}`;
    
    console.log("🌐 Pollinations API URL:", imageUrl);
    
    // Create image with proper loading but don't test with CORS
    const img = new Image();
    // Don't set crossOrigin to avoid CORS issues
    
    const imageLoadPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Image load timeout'));
      }, 15000); // 15 second timeout
      
      img.onload = () => {
        clearTimeout(timeout);
        console.log("Pollinations image loaded successfully");
        resolve();
      };
      
      img.onerror = (error) => {
        clearTimeout(timeout);
        console.warn("Failed to load Pollinations image:", error);
        // Still resolve to return the URL for display
        resolve();
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
export { generateWithClipDrop, generateWithPollinations };