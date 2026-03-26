import { AUDIO_CONFIG } from "../audioConfig";

class WW2AudioService {
  private audioContext: AudioContext | null = null;
  private version: string = "1.1.0"; // Cache breaker

  private async getAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log("AudioContext created:", this.audioContext.state);
    }
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log("AudioContext resumed:", this.audioContext.state);
      } catch (e) {
        console.warn("Failed to resume AudioContext:", e);
      }
    }
    return this.audioContext;
  }

  async resume() {
    await this.getAudioContext();
  }

  private async playFromUrl(url: string) {
    if (!url) return;
    console.log(`Attempting to play: ${url}`);
    try {
      const audio = new Audio(url);
      // Simpler play logic to avoid event-based hangs
      await audio.play();
      console.log(`Successfully playing: ${url}`);
    } catch (e) {
      console.warn(`Audio play failed for ${url}:`, e);
      // Try to resume context and play again
      try {
        await this.resume();
        const audio = new Audio(url);
        await audio.play();
      } catch (err) {
        console.error("Second attempt failed:", err);
      }
    }
  }

  async playExplosion() {
    this.playFromUrl(AUDIO_CONFIG.sfx.explosion);
  }

  async playSendingLines() {
    if (AUDIO_CONFIG.voices.sending.length > 0) {
      const clip = AUDIO_CONFIG.voices.sending[Math.floor(Math.random() * AUDIO_CONFIG.voices.sending.length)];
      this.playFromUrl(clip);
    }
  }

  async playReceivingLines() {
    if (AUDIO_CONFIG.voices.receiving.length > 0) {
      const clip = AUDIO_CONFIG.voices.receiving[Math.floor(Math.random() * AUDIO_CONFIG.voices.receiving.length)];
      this.playFromUrl(clip);
    }
  }

  async playGeneralCommand() {
    if (AUDIO_CONFIG.voices.commands.length > 0) {
      const clip = AUDIO_CONFIG.voices.commands[Math.floor(Math.random() * AUDIO_CONFIG.voices.commands.length)];
      this.playFromUrl(clip);
    }
  }
}

export const ww2AudioService = new WW2AudioService();
