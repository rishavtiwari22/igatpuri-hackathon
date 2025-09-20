import React from "react";

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
      
      return imageUrl;
    } catch (error) {
      console.error("Error generating with ClipDrop:", error);
      throw error;
    }
  };
export { generateWithClipDrop };