// Utility for playing UI sound effects

class SoundManager {
  private static instance: SoundManager;
  private context: AudioContext | null = null;
  private enabled = true;

  private constructor() {
    // Initialize on first user interaction
    if (typeof window !== 'undefined') {
      const initAudio = () => {
        this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
        document.removeEventListener('click', initAudio);
        document.removeEventListener('touchstart', initAudio);
      };
      
      document.addEventListener('click', initAudio, { once: true });
      document.addEventListener('touchstart', initAudio, { once: true });
    }
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private createTone(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
    if (!this.context || !this.enabled) return;

    try {
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.context.destination);

      oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
      oscillator.type = type;

      // Create fade out effect
      gainNode.gain.setValueAtTime(0.1, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

      oscillator.start(this.context.currentTime);
      oscillator.stop(this.context.currentTime + duration);
    } catch (error) {
      // Fail silently if audio context is not available
      console.warn('Audio playback failed:', error);
    }
  }

  playMagicalPoof(): void {
    // Create a magical "poof" sound with ascending tones
    setTimeout(() => this.createTone(440, 0.1, 'sine'), 0);
    setTimeout(() => this.createTone(550, 0.1, 'sine'), 50);
    setTimeout(() => this.createTone(660, 0.15, 'sine'), 100);
    setTimeout(() => this.createTone(880, 0.2, 'triangle'), 150);
  }

  playSparkle(): void {
    // Create sparkly chime sounds
    const notes = [1047, 1319, 1568, 2093]; // C6, E6, G6, C7
    notes.forEach((note, index) => {
      setTimeout(() => this.createTone(note, 0.3, 'triangle'), index * 30);
    });
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const soundManager = SoundManager.getInstance();