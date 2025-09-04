// Voice Manager - Handles hardcoded voice files for user feedback
import creative01 from '../audio/creative_01.mp3';
import creative08 from '../audio/creative_08.mp3';
import finalCelebration01 from '../audio/final_celebration_01.mp3';
import finalCelebration04 from '../audio/final_celebration_04.mp3';
import generating02 from '../audio/generating_02.mp3';
import generating04 from '../audio/generating_04.mp3';
import milestone01 from '../audio/milestone_01.mp3';
import milestone06 from '../audio/milestone_06.mp3';
import motivation01 from '../audio/motivation_01.mp3';
import motivation10 from '../audio/motivation_10.mp3';
import nearSuccess01 from '../audio/near_success_01.mp3';
import nearSuccess08 from '../audio/near_success_08.mp3';
import startup01 from '../audio/startup_01.mp3';
import startup02 from '../audio/startup_02.mp3';
import success01 from '../audio/success_01.mp3';
import success08 from '../audio/success_08.mp3';
import unlock01 from '../audio/unlock_01.mp3';
import unlock08 from '../audio/unlock_08.mp3';
import welcome01 from '../audio/welcome_01.mp3';
import welcome02 from '../audio/welcome_02.mp3';

class VoiceManager {
  constructor() {
    this.currentAudio = null;
    this.isPlaying = false;
    this.audioQueue = [];
    
    // Organize voice files by category
    this.voiceCategories = {
      success: [success01, success08],
      unlock: [unlock01, unlock08],
      motivation: [motivation01, motivation10],
      nearSuccess: [nearSuccess01, nearSuccess08],
      milestone: [milestone01, milestone06],
      creative: [creative01, creative08],
      finalCelebration: [finalCelebration01, finalCelebration04],
      startup: [startup01, startup02],
      generating: [generating02, generating04],
      welcome: [welcome01, welcome02]
    };
    
    // Track last played audio in each category to ensure alternation
    this.lastPlayed = {};
    
    // Track voice index for each category to ensure proper alternation
    this.voiceIndex = {};
    
    // Initialize voice indices for all categories
    Object.keys(this.voiceCategories).forEach(category => {
      this.voiceIndex[category] = 0;
    });
  }

  // Stop any currently playing audio
  stopCurrentAudio() {
    if (this.currentAudio && this.isPlaying) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.isPlaying = false;
      console.log('🎵 Voice stopped');
    }
    
    // Clear any queued audio
    this.audioQueue = [];
  }

  // Get next voice file from category with proper alternation
  getNextVoice(category) {
    const voices = this.voiceCategories[category];
    if (!voices || voices.length === 0) {
      console.warn(`🎵 No voices found for category: ${category}`);
      return null;
    }
    
    // If only one voice, return it
    if (voices.length === 1) {
      return voices[0];
    }
    
    // Get current index for this category
    const currentIndex = this.voiceIndex[category] || 0;
    const selectedVoice = voices[currentIndex];
    
    // Move to next voice (cycle through all voices)
    this.voiceIndex[category] = (currentIndex + 1) % voices.length;
    
    console.log(`🎵 Selected ${category} voice ${currentIndex + 1}/${voices.length}`);
    
    return selectedVoice;
  }

  // Get a random voice file from a category (legacy method for backwards compatibility)
  getRandomVoice(category) {
    return this.getNextVoice(category);
  }

  // Play startup voice for app initialization
  async playStartupVoice(options = {}) {
    const voiceFile = this.getNextVoice('startup');
    if (voiceFile) {
      return this.playVoice(voiceFile, options);
    }
    return false;
  }

  // Play generating voice during image creation
  async playGeneratingVoice(options = {}) {
    const voiceFile = this.getNextVoice('generating');
    if (voiceFile) {
      return this.playVoice(voiceFile, options);
    }
    return false;
  }

  // Play welcome voice for user greeting
  async playWelcomeVoice(options = {}) {
    const voiceFile = this.getNextVoice('welcome');
    if (voiceFile) {
      return this.playVoice(voiceFile, options);
    }
    return false;
  }

  // Play a voice file with proper error handling
  async playVoice(voiceFile, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        // Stop any current audio first
        this.stopCurrentAudio();
        
        // Create new audio instance
        const audio = new Audio(voiceFile);
        this.currentAudio = audio;
        
        // Configure audio settings
        audio.volume = options.volume || 0.8;
        audio.playbackRate = options.playbackRate || 1.0;
        
        // Set up event listeners
        audio.onloadstart = () => {
          console.log('🎵 Voice loading...');
        };
        
        audio.oncanplaythrough = () => {
          console.log('🎵 Voice ready to play');
        };
        
        audio.onplay = () => {
          this.isPlaying = true;
          console.log('🎵 Voice started playing');
        };
        
        audio.onended = () => {
          this.isPlaying = false;
          this.currentAudio = null;
          console.log('🎵 Voice completed');
          resolve(true);
        };
        
        audio.onerror = (error) => {
          this.isPlaying = false;
          this.currentAudio = null;
          console.error('🎵 Voice playback error:', error);
          reject(error);
        };
        
        audio.onabort = () => {
          this.isPlaying = false;
          this.currentAudio = null;
          console.log('🎵 Voice playback aborted');
          resolve(false);
        };
        
        // Start playing
        audio.play().catch(error => {
          console.error('🎵 Failed to start voice playback:', error);
          this.isPlaying = false;
          this.currentAudio = null;
          reject(error);
        });
        
      } catch (error) {
        console.error('🎵 Voice manager error:', error);
        reject(error);
      }
    });
  }

  // Play success voice for challenge completion
  async playSuccessVoice(options = {}) {
    const voiceFile = this.getNextVoice('success');
    if (voiceFile) {
      return this.playVoice(voiceFile, options);
    }
    return false;
  }

  // Play unlock voice for new challenge availability
  async playUnlockVoice(options = {}) {
    const voiceFile = this.getNextVoice('unlock');
    if (voiceFile) {
      return this.playVoice(voiceFile, options);
    }
    return false;
  }

  // Play motivation voice for encouragement
  async playMotivationVoice(options = {}) {
    const voiceFile = this.getNextVoice('motivation');
    if (voiceFile) {
      return this.playVoice(voiceFile, options);
    }
    return false;
  }

  // Play near success voice for close attempts (70-89% similarity)
  async playNearSuccessVoice(options = {}) {
    const voiceFile = this.getNextVoice('nearSuccess');
    if (voiceFile) {
      return this.playVoice(voiceFile, options);
    }
    return false;
  }

  // Play milestone voice for progress achievements
  async playMilestoneVoice(challengeIndex, totalChallenges, options = {}) {
    const voiceFile = this.getNextVoice('milestone');
    if (voiceFile) {
      return this.playVoice(voiceFile, options);
    }
    return false;
  }

  // Play creative process encouragement
  async playCreativeVoice(options = {}) {
    const voiceFile = this.getNextVoice('creative');
    if (voiceFile) {
      return this.playVoice(voiceFile, options);
    }
    return false;
  }

  // Play final celebration for completing all challenges
  async playFinalCelebrationVoice(options = {}) {
    const voiceFile = this.getNextVoice('finalCelebration');
    if (voiceFile) {
      return this.playVoice(voiceFile, options);
    }
    return false;
  }

  // Smart voice selection based on comparison result
  async playContextualVoice(comparisonResult, challengeContext = {}) {
    if (!comparisonResult || comparisonResult.error) {
      return this.playMotivationVoice();
    }

    const score = comparisonResult.result?.combined || comparisonResult.combined || 0;
    const percentage = score > 1 ? Math.round(score) : Math.round(score * 100);
    
    console.log(`🎵 Playing contextual voice for ${percentage}% similarity`);
    
    // Determine appropriate voice based on score
    if (percentage >= 70) {
      // Success! Play success voice and potentially unlock voice
      await this.playSuccessVoice();
      
      // If this unlocks a new challenge, play unlock voice after success
      if (challengeContext.unlocksNext) {
        setTimeout(() => {
          this.playUnlockVoice();
        }, 2000); // Wait 2 seconds after success voice
      }
      
      // If this completes all challenges, play final celebration
      if (challengeContext.isLastChallenge) {
        setTimeout(() => {
          this.playFinalCelebrationVoice();
        }, 3000); // Wait 3 seconds for final celebration
      }
      
    } else if (percentage >= 50) {
      // Close attempt, encourage to continue
      return this.playNearSuccessVoice();
      
    } else {
      // Lower score, provide motivation
      return this.playMotivationVoice();
    }
  }

  // Check if any voice is currently playing
  getPlayingStatus() {
    return {
      isPlaying: this.isPlaying,
      hasCurrentAudio: !!this.currentAudio
    };
  }

  // Get available voice categories
  getAvailableCategories() {
    return Object.keys(this.voiceCategories);
  }

  // Reset startup voice flag (for testing or manual reset)
  resetStartupVoiceFlag() {
    sessionStorage.removeItem('hasPlayedStartupVoice');
    console.log('🎵 Startup voice flag reset');
  }

  // Play welcome sequence (startup + welcome voice)
  async playWelcomeSequence(options = {}) {
    try {
      await this.playStartupVoice(options);
      
      // Wait a bit before playing welcome voice
      setTimeout(async () => {
        await this.playWelcomeVoice(options);
      }, 2000); // 2 second delay between voices
      
      return true;
    } catch (error) {
      console.error('🎵 Welcome sequence failed:', error);
      return false;
    }
  }

  // Test voice system
  async testVoiceSystem() {
    console.log('🎵 Testing voice system...');
    try {
      await this.playMotivationVoice();
      console.log('🎵 Voice system test successful');
      return true;
    } catch (error) {
      console.error('🎵 Voice system test failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const voiceManager = new VoiceManager();

// Export the instance and individual methods
export default voiceManager;

export const {
  playSuccessVoice,
  playUnlockVoice,
  playMotivationVoice,
  playNearSuccessVoice,
  playMilestoneVoice,
  playCreativeVoice,
  playFinalCelebrationVoice,
  playStartupVoice,
  playGeneratingVoice,
  playWelcomeVoice,
  playWelcomeSequence,
  playContextualVoice,
  stopCurrentAudio,
  getPlayingStatus,
  resetStartupVoiceFlag,
  testVoiceSystem
} = voiceManager;