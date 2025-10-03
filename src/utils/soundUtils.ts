/**
 * Utility functions for sound notifications
 */

// Keep track of audio context to avoid creating multiple instances
let audioContext: AudioContext | null = null;

// Initialize audio context safely
const getAudioContext = (): AudioContext | null => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
  } catch (error) {
    // Silently fail - no console output
    return null;
  }
};

/**
 * Play a notification sound using Web Audio API
 * Creates a pleasant "ding" sound with harmonics
 */
export const playNotificationSound = () => {
  // Check if the user has sound notifications enabled
  const soundEnabled = localStorage.getItem('soundNotifications') !== 'false'
  if (!soundEnabled) return
  
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    // Resume audio context if suspended (required for some browsers)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    // Create multiple oscillators for a richer sound
    const oscillator1 = ctx.createOscillator();
    const oscillator2 = ctx.createOscillator();
    const gainNode1 = ctx.createGain();
    const gainNode2 = ctx.createGain();
    const masterGain = ctx.createGain();
    
    // Connect oscillators to gain nodes
    oscillator1.connect(gainNode1);
    oscillator2.connect(gainNode2);
    
    // Connect gain nodes to master gain
    gainNode1.connect(masterGain);
    gainNode2.connect(masterGain);
    
    // Connect master gain to destination
    masterGain.connect(ctx.destination);
    
    // Configure the first oscillator (main tone)
    oscillator1.type = 'sine';
    oscillator1.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    gainNode1.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    
    // Configure the second oscillator (harmonic)
    oscillator2.type = 'sine';
    oscillator2.frequency.setValueAtTime(1320, ctx.currentTime); // E6 note (fifth above A5)
    gainNode2.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode2.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.4);
    
    // Configure master gain for overall volume control
    masterGain.gain.setValueAtTime(0.8, ctx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    
    // Start oscillators
    oscillator1.start(ctx.currentTime);
    oscillator2.start(ctx.currentTime);
    
    // Stop oscillators after duration
    oscillator1.stop(ctx.currentTime + 0.4);
    oscillator2.stop(ctx.currentTime + 0.4);
    
    // Clean up resources
    oscillator1.addEventListener('ended', () => {
      oscillator1.disconnect();
      oscillator2.disconnect();
      gainNode1.disconnect();
      gainNode2.disconnect();
      masterGain.disconnect();
    });
  } catch (error) {
    // Silently fail - no console output
  }
};

/**
 * Play a sound when the user sends a message
 * Creates a subtle "click" sound
 */
export const playMessageSentSound = () => {
  // Check if the user has sound notifications enabled
  const soundEnabled = localStorage.getItem('soundNotifications') !== 'false'
  if (!soundEnabled) return
  
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    // Resume audio context if suspended (required for some browsers)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    // Create oscillator for a subtle click sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Connect oscillator to gain node and then to destination
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Configure the oscillator for a short click
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    // Start and stop oscillator
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
    
    // Clean up resources
    oscillator.addEventListener('ended', () => {
      oscillator.disconnect();
      gainNode.disconnect();
    });
  } catch (error) {
    // Silently fail - no console output
  }
};

/**
 * Play a test sound for verification
 */
export const playTestSound = () => {
  playNotificationSound();
};