// Web Speech API utility for voice feedback
class SpeechSynthesisService {
  constructor() {
    this.synth = window.speechSynthesis;
    this.isSupported = 'speechSynthesis' in window;
    this.isSpeaking = false;
    this.currentUtterance = null;
    
    // Initialize voices
    this.voices = [];
    this.loadVoices();
    
    // Listen for voice changes
    if (this.synth) {
      this.synth.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  loadVoices() {
    if (!this.isSupported) return;
    
    this.voices = this.synth.getVoices();
    console.log('🎤 Available voices loaded:', this.voices.length);
  }

  // Get the best available voice (prefer English)
  getBestVoice() {
    if (!this.voices.length) return null;
    
    // Try to find English voices first
    const englishVoices = this.voices.filter(voice => 
      voice.lang.startsWith('en-') && !voice.name.includes('Google')
    );
    
    // Prefer female voices for better user experience
    const femaleVoice = englishVoices.find(voice => 
      voice.name.toLowerCase().includes('female') || 
      voice.name.toLowerCase().includes('zira') ||
      voice.name.toLowerCase().includes('hazel') ||
      voice.name.toLowerCase().includes('samantha')
    );
    
    if (femaleVoice) return femaleVoice;
    
    // Fallback to any English voice
    if (englishVoices.length > 0) return englishVoices[0];
    
    // Last resort: use any available voice
    return this.voices[0];
  }

  // Generate speech message based on comparison result
  generateFeedbackMessage(comparisonResult) {
    if (!comparisonResult || comparisonResult.error) {
      return "Analysis complete. There was an error processing the comparison.";
    }

    const score = comparisonResult.result?.combined || comparisonResult.combined || 0;
    const percentage = score > 1 ? Math.round(score) : Math.round(score * 100);
    
    let message = "";
    let tone = "";

    if (percentage >= 85) {
      tone = "Excellent work! ";
      message = `${tone}Your generated image achieved ${percentage}% similarity. Outstanding match!`;
    } else if (percentage >= 70) {
      tone = "Great job! ";
      message = `${tone}You scored ${percentage}% similarity. Very close to the target!`;
    } else if (percentage >= 50) {
      tone = "Good effort! ";
      message = `${tone}You achieved ${percentage}% similarity. Keep refining your prompt.`;
    } else if (percentage >= 30) {
      tone = "Nice try! ";
      message = `${tone}You got ${percentage}% similarity. Try adjusting your description.`;
    } else {
      tone = "Keep practicing! ";
      message = `${tone}You scored ${percentage}% similarity. Consider a different approach.`;
    }

    // Add specific feedback if detailed scores are available
    if (comparisonResult.result) {
      const scores = comparisonResult.result;
      const structural = Math.round((scores.structural || 0) * 100);
      const colors = Math.round((scores.colors || 0) * 100);
      
      if (structural < 40) {
        message += " Focus on the overall structure and shape.";
      } else if (colors < 40) {
        message += " Pay attention to colors and lighting.";
      }
    }

    return message;
  }

  // Speak the feedback message
  async speakFeedback(comparisonResult, options = {}) {
    if (!this.isSupported) {
      console.warn('🎤 Speech synthesis not supported in this browser');
      return false;
    }

    // Stop any current speech
    this.stopSpeaking();

    // Ensure voices are loaded
    if (this.voices.length === 0) {
      console.log('🎤 Waiting for voices to load...');
      await new Promise(resolve => {
        if (this.synth.getVoices().length > 0) {
          this.loadVoices();
          resolve();
        } else {
          this.synth.onvoiceschanged = () => {
            this.loadVoices();
            resolve();
          };
        }
      });
    }

    const message = this.generateFeedbackMessage(comparisonResult);
    console.log('🎤 Speaking feedback:', message);

    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(message);
        
        // Configure voice settings
        const voice = this.getBestVoice();
        if (voice) {
          utterance.voice = voice;
        }
        
        utterance.rate = options.rate || 0.9; // Slightly slower for clarity
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 0.8;
        
        // Event handlers
        utterance.onstart = () => {
          this.isSpeaking = true;
          console.log('🎤 Speech started');
        };
        
        utterance.onend = () => {
          this.isSpeaking = false;
          this.currentUtterance = null;
          console.log('🎤 Speech completed');
          resolve(true);
        };
        
        utterance.onerror = (event) => {
          this.isSpeaking = false;
          this.currentUtterance = null;
          console.error('🎤 Speech error:', event);
          reject(event);
        };
        
        // Store current utterance for potential cancellation
        this.currentUtterance = utterance;
        
        // Speak the message
        this.synth.speak(utterance);
        
      } catch (error) {
        console.error('🎤 Speech synthesis error:', error);
        reject(error);
      }
    });
  }

  // Stop current speech
  stopSpeaking() {
    if (this.synth && this.isSpeaking) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
      console.log('🎤 Speech stopped');
    }
  }

  // Pause current speech
  pauseSpeaking() {
    if (this.synth && this.isSpeaking) {
      this.synth.pause();
      console.log('🎤 Speech paused');
    }
  }

  // Resume paused speech
  resumeSpeaking() {
    if (this.synth) {
      this.synth.resume();
      console.log('🎤 Speech resumed');
    }
  }

  // Get speech synthesis status
  getStatus() {
    return {
      isSupported: this.isSupported,
      isSpeaking: this.isSpeaking,
      isPaused: this.synth ? this.synth.paused : false,
      voicesCount: this.voices.length,
      currentVoice: this.getBestVoice()?.name || 'Default'
    };
  }

  // Test speech functionality
  testSpeech() {
    if (!this.isSupported) {
      console.warn('🎤 Speech synthesis not supported');
      return false;
    }

    const testMessage = "Speech synthesis is working correctly.";
    const utterance = new SpeechSynthesisUtterance(testMessage);
    
    const voice = this.getBestVoice();
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.rate = 0.9;
    utterance.volume = 0.8;
    
    this.synth.speak(utterance);
    console.log('🎤 Test speech initiated');
    return true;
  }
}

// Create and export singleton instance
const speechService = new SpeechSynthesisService();

// Export individual functions for easy use
export const speakFeedback = (comparisonResult, options) => 
  speechService.speakFeedback(comparisonResult, options);

export const stopSpeech = () => speechService.stopSpeaking();
export const pauseSpeech = () => speechService.pauseSpeaking();
export const resumeSpeech = () => speechService.resumeSpeaking();
export const getSpeechStatus = () => speechService.getStatus();
export const testSpeech = () => speechService.testSpeech();

export default speechService;