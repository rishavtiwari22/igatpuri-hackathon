import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProgressTracker from "./ProgressTracker";
import { computeMSSSIM, getQualityDescription, formatDetailedScores } from "../utils/imageComparison";

const generateWithPollinations = async (prompt) => {
    const width = 1024;
    const height = 1024;
    const seed = 42;
    const model = "flux";
    
    // const encodedPrompt = encodeURIComponent(prompt);
    // const params = new URLSearchParams({
    //   width: width,
    //   height: height,
    //   seed: seed,
    //   model: model,
    //   nologo: 'true'
    // });
    
    const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=${model}`;    
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