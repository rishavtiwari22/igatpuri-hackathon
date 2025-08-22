// Sound generation functions
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProgressTracker from "./ProgressTracker";
import { computeMSSSIM, getQualityDescription, formatDetailedScores } from "../utils/imageComparison";
  const createVictorySound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Victory melody sequence - more triumphant
    const notes = [
      { freq: 523.25, duration: 0.15 }, // C5
      { freq: 659.25, duration: 0.15 }, // E5
      { freq: 783.99, duration: 0.15 }, // G5
      { freq: 1046.50, duration: 0.3 }, // C6
      { freq: 1174.66, duration: 0.15 }, // D6
      { freq: 1318.51, duration: 0.4 }, // E6
    ];
    
    let time = audioContext.currentTime;
    
    notes.forEach((note, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(note.freq, time);
      oscillator.type = 'triangle';
      
      // Add some sparkle with filtering
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(note.freq * 2, time);
      filter.Q.setValueAtTime(1, time);
      
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(0.4, time + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + note.duration);
      
      oscillator.start(time);
      oscillator.stop(time + note.duration);
      
      time += note.duration * 0.8; // Slight overlap for smoother melody
    });
  };

  const createCheerSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create multiple oscillators for a rich celebratory sound
    const frequencies = [150, 300, 450, 600, 750];
    const duration = 1.2;
    
    frequencies.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Add some vibrato for celebration effect
      const lfo = audioContext.createOscillator();
      const lfoGain = audioContext.createGain();
      lfo.connect(lfoGain);
      lfoGain.connect(oscillator.frequency);
      
      lfo.frequency.setValueAtTime(6, audioContext.currentTime); // 6Hz vibrato
      lfoGain.gain.setValueAtTime(freq * 0.1, audioContext.currentTime);
      
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
      oscillator.type = 'sawtooth';
      
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq * 1.5, audioContext.currentTime);
      filter.Q.setValueAtTime(5, audioContext.currentTime);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      lfo.start(audioContext.currentTime);
      oscillator.start(audioContext.currentTime + index * 0.05);
      
      lfo.stop(audioContext.currentTime + duration);
      oscillator.stop(audioContext.currentTime + duration);
    });
    
    // Add some high-frequency sparkle
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const sparkle = audioContext.createOscillator();
        const sparkleGain = audioContext.createGain();
        
        sparkle.connect(sparkleGain);
        sparkleGain.connect(audioContext.destination);
        
        sparkle.frequency.setValueAtTime(2000 + Math.random() * 1000, audioContext.currentTime);
        sparkle.type = 'sine';
        
        sparkleGain.gain.setValueAtTime(0, audioContext.currentTime);
        sparkleGain.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
        sparkleGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
        
        sparkle.start(audioContext.currentTime);
        sparkle.stop(audioContext.currentTime + 0.2);
      }, i * 200);
    }
  };

  const playSuccessSound = () => {
    try {
      // Show visual sound wave effect
      setShowSoundWave(true);
      setTimeout(() => {
        setShowSoundWave(false);
      }, 2000);
      
      createVictorySound();
      setTimeout(() => {
        createCheerSound();
      }, 800); // Play cheer sound after victory sound
    } catch (error) {
      console.log('Audio not supported or blocked by browser:', error);
    }
  };

  const createClickSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const playClickSound = () => {
    try {
      createClickSound();
    } catch (error) {
      console.log('Audio not supported or blocked by browser:', error);
    }
  };

  const createGenerationStartSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // More sophisticated chord progression with harmony
    const chordProgression = [
      // First chord: F major (warm, inviting)
      { notes: [174.61, 220, 261.63], duration: 0.25, volume: 0.15 }, // F3, A3, C4
      // Second chord: C major (bright, optimistic)
      { notes: [261.63, 329.63, 392], duration: 0.25, volume: 0.18 }, // C4, E4, G4
      // Third chord: Am (contemplative)
      { notes: [220, 261.63, 329.63], duration: 0.25, volume: 0.16 }, // A3, C4, E4
      // Final chord: G major (resolution, confidence)
      { notes: [196, 246.94, 293.66, 369.99], duration: 0.4, volume: 0.2 } // G3, B3, D4, F#4
    ];
    
    let time = audioContext.currentTime;
    
    chordProgression.forEach((chord, chordIndex) => {
      chord.notes.forEach((freq, noteIndex) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        const reverb = audioContext.createConvolver();
        
        // Create a simple reverb impulse response
        const impulseLength = audioContext.sampleRate * 0.3;
        const impulse = audioContext.createBuffer(1, impulseLength, audioContext.sampleRate);
        const impulseData = impulse.getChannelData(0);
        for (let i = 0; i < impulseLength; i++) {
          impulseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 2);
        }
        reverb.buffer = impulse;
        
        // Audio routing with reverb
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(reverb);
        reverb.connect(audioContext.destination);
        // Also connect dry signal
        gainNode.connect(audioContext.destination);
        
        // Use a warmer oscillator type
        oscillator.type = noteIndex === 0 ? 'triangle' : 'sine';
        oscillator.frequency.setValueAtTime(freq, time);
        
        // Gentle low-pass filter for warmth
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 4, time);
        filter.frequency.exponentialRampToValueAtTime(freq * 2, time + chord.duration);
        filter.Q.setValueAtTime(0.8, time);
        
        // Smooth volume envelope
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(chord.volume, time + 0.05);
        gainNode.gain.linearRampToValueAtTime(chord.volume * 0.7, time + chord.duration * 0.7);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + chord.duration);
        
        oscillator.start(time);
        oscillator.stop(time + chord.duration);
      });
      time += chord.duration * 0.8; // Slight overlap for smooth transitions
    });

    // Add magical sparkle effects
    setTimeout(() => {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const sparkle = audioContext.createOscillator();
          const sparkleGain = audioContext.createGain();
          const sparkleFilter = audioContext.createBiquadFilter();
          
          sparkle.connect(sparkleFilter);
          sparkleFilter.connect(sparkleGain);
          sparkleGain.connect(audioContext.destination);
          
          // Higher frequencies for sparkle (pentatonic scale)
          const sparkleFreqs = [523.25, 587.33, 659.25, 783.99, 880]; // C5, D5, E5, G5, A5
          sparkle.frequency.setValueAtTime(
            sparkleFreqs[Math.floor(Math.random() * sparkleFreqs.length)], 
            audioContext.currentTime
          );
          sparkle.type = 'sine';
          
          // High-pass filter for brightness
          sparkleFilter.type = 'highpass';
          sparkleFilter.frequency.setValueAtTime(1000, audioContext.currentTime);
          sparkleFilter.Q.setValueAtTime(2, audioContext.currentTime);
          
          sparkleGain.gain.setValueAtTime(0, audioContext.currentTime);
          sparkleGain.gain.linearRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
          sparkleGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
          
          sparkle.start(audioContext.currentTime);
          sparkle.stop(audioContext.currentTime + 0.15);
        }, i * 150 + Math.random() * 100); // Slightly randomized timing
      }
    }, 600);

    // Add a gentle "whoosh" effect for AI activation
    setTimeout(() => {
      const whoosh = audioContext.createOscillator();
      const whooshGain = audioContext.createGain();
      const whooshFilter = audioContext.createBiquadFilter();
      
      whoosh.connect(whooshFilter);
      whooshFilter.connect(whooshGain);
      whooshGain.connect(audioContext.destination);
      
      whoosh.type = 'sawtooth';
      whoosh.frequency.setValueAtTime(60, audioContext.currentTime);
      whoosh.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
      
      whooshFilter.type = 'bandpass';
      whooshFilter.frequency.setValueAtTime(100, audioContext.currentTime);
      whooshFilter.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.3);
      whooshFilter.Q.setValueAtTime(8, audioContext.currentTime);
      
      whooshGain.gain.setValueAtTime(0, audioContext.currentTime);
      whooshGain.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 0.1);
      whooshGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
      
      whoosh.start(audioContext.currentTime);
      whoosh.stop(audioContext.currentTime + 0.3);
    }, 1000);
  };

  const playGenerationStartSound = () => {
    try {
      createGenerationStartSound();
    } catch (error) {
      console.log('Audio not supported or blocked by browser:', error);
    }
  };

export {playClickSound,playGenerationStartSound,playSuccessSound,createCheerSound,createVictorySound,createClickSound,createGenerationStartSound}