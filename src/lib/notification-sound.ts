'use client';

// Shared Web Audio helper for short UI sounds (incoming notifications, sent
// chat messages, etc). A single AudioContext is reused across calls; it is
// created lazily since browsers require it to happen in response to a user
// gesture (a click/keydown/send action satisfies that).
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.log('Audio context not supported:', e);
      return null;
    }
  }
  return audioContext;
}

async function playTone(freqStart: number, freqEnd: number, duration: number, volume: number) {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch (e) {
      console.log('Could not resume audio context:', e);
      return;
    }
  }

  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(freqStart, ctx.currentTime);
    oscillator.frequency.setValueAtTime(freqEnd, ctx.currentTime + duration * 0.25);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    console.log('Could not play sound:', e);
  }
}

// Descending two-tone chime for incoming notifications/messages.
export function playNotificationSound() {
  return playTone(800, 600, 0.4, 0.3);
}

// Short, quiet ascending blip for a message the user just sent.
export function playMessageSentSound() {
  return playTone(500, 700, 0.15, 0.15);
}

// Creates/resumes the shared AudioContext in response to a user gesture
// (click/keydown/touch) so later sound calls aren't blocked by autoplay
// restrictions.
export async function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      // ignore - will retry lazily on next play attempt
    }
  }
}
