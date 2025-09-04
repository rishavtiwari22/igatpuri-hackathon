// Voice Testing Utility
// Use this in browser console to test all voice categories

import voiceManager from './voiceManager.js';

// Test all voice categories
export const testAllVoices = async () => {
  console.log('🎵 Testing all voice categories...');
  
  const categories = voiceManager.getAvailableCategories();
  console.log('Available categories:', categories);
  
  for (const category of categories) {
    console.log(`\n🎵 Testing ${category} voices...`);
    
    try {
      switch (category) {
        case 'success':
          await voiceManager.playSuccessVoice();
          break;
        case 'unlock':
          await voiceManager.playUnlockVoice();
          break;
        case 'motivation':
          await voiceManager.playMotivationVoice();
          break;
        case 'nearSuccess':
          await voiceManager.playNearSuccessVoice();
          break;
        case 'milestone':
          await voiceManager.playMilestoneVoice();
          break;
        case 'creative':
          await voiceManager.playCreativeVoice();
          break;
        case 'finalCelebration':
          await voiceManager.playFinalCelebrationVoice();
          break;
        case 'startup':
          await voiceManager.playStartupVoice();
          break;
        case 'generating':
          await voiceManager.playGeneratingVoice();
          break;
        case 'welcome':
          await voiceManager.playWelcomeVoice();
          break;
      }
      
      console.log(`✅ ${category} voice played successfully`);
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error(`❌ ${category} voice failed:`, error);
    }
  }
  
  console.log('🎵 All voice tests completed!');
};

// Test voice alternation
export const testVoiceAlternation = async (category, times = 3) => {
  console.log(`🎵 Testing ${category} voice alternation ${times} times...`);
  
  for (let i = 0; i < times; i++) {
    console.log(`\n🎵 Playing ${category} voice ${i + 1}/${times}...`);
    
    try {
      switch (category) {
        case 'success':
          await voiceManager.playSuccessVoice();
          break;
        case 'motivation':
          await voiceManager.playMotivationVoice();
          break;
        case 'startup':
          await voiceManager.playStartupVoice();
          break;
        case 'generating':
          await voiceManager.playGeneratingVoice();
          break;
        default:
          console.warn(`Category ${category} not supported in alternation test`);
          return;
      }
      
      // Wait between alternations
      await new Promise(resolve => setTimeout(resolve, 4000));
      
    } catch (error) {
      console.error(`❌ ${category} voice ${i + 1} failed:`, error);
    }
  }
  
  console.log(`🎵 ${category} alternation test completed!`);
};

// Quick test function to use in browser console
export const quickTest = async () => {
  console.log('🎵 Quick voice test starting...');
  
  try {
    await voiceManager.playStartupVoice();
    console.log('✅ Startup voice test passed');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await voiceManager.playGeneratingVoice();
    console.log('✅ Generating voice test passed');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await voiceManager.playSuccessVoice();
    console.log('✅ Success voice test passed');
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
  }
  
  console.log('🎵 Quick test completed!');
};

// Reset startup voice for testing
export const resetStartupVoice = () => {
  voiceManager.resetStartupVoiceFlag();
  console.log('🎵 Startup voice flag reset - refresh page to test startup voice again');
};

// Usage instructions for browser console:
console.log(`
🎵 Voice Testing Utility Loaded!

Usage in browser console:
- import('./src/utils/testVoices.js').then(test => test.quickTest())
- import('./src/utils/testVoices.js').then(test => test.testAllVoices())
- import('./src/utils/testVoices.js').then(test => test.testVoiceAlternation('success', 3))
- import('./src/utils/testVoices.js').then(test => test.resetStartupVoice())
`);