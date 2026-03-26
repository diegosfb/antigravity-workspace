import { GoogleGenAI, Modality } from "@google/genai";
import { AUDIO_CONFIG } from "../audioConfig";

class WW2AudioService {
  private ai: GoogleGenAI;
  private audioContext: AudioContext | null = null;
  private voiceCache: Map<string, string> = new Map();
  private version: string = "1.0.2"; // Cache breaker

  private getAI() {
    // Use the Gemini API key provided by the environment
    let apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || "";
    
    // Sanitize the key - sometimes it might be stringified "undefined" or "null"
    if (apiKey === "undefined" || apiKey === "null") {
      apiKey = "";
    }

    if (!apiKey) {
      console.warn("No valid Gemini API key found. Voice commands will not work.");
    }
    return new GoogleGenAI({ apiKey });
  }

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

  private base64ToArrayBuffer(base64: string) {
    try {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (e) {
      console.error("Failed to decode base64 audio:", e);
      return new ArrayBuffer(0);
    }
  }

  async playVoice(text: string, voice: 'Kore' | 'Fenrir' | 'Zephyr' | 'Puck' | 'Charon' = 'Fenrir') {
    try {
      const audioContext = await this.getAudioContext();
      console.log(`Attempting to play voice: "${text}" with voice: ${voice}`);
      
      if (this.voiceCache.has(text)) {
        this.playFromUrl(this.voiceCache.get(text)!);
        return;
      }

      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say with a military general's authority: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const arrayBuffer = this.base64ToArrayBuffer(base64Audio);
        if (arrayBuffer.byteLength === 0) return;

        // PCM from Gemini TTS is 16-bit signed, mono, 24000Hz
        const pcmData = new Int16Array(arrayBuffer);
        const audioBuffer = audioContext.createBuffer(1, pcmData.length, 24000);
        const channelData = audioBuffer.getChannelData(0);
        
        for (let i = 0; i < pcmData.length; i++) {
          channelData[i] = pcmData[i] / 32768.0;
        }

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
        console.log("Voice playback started successfully");
      } else {
        console.warn("No audio data returned from Gemini TTS");
      }
    } catch (error) {
      console.error("Failed to play voice:", error);
    }
  }

  private async playFromUrl(url: string) {
    try {
      const audio = new Audio();
      // Use a timeout to avoid hanging on load
      const playPromise = new Promise((resolve, reject) => {
        audio.oncanplaythrough = () => {
          audio.play().then(resolve).catch(reject);
        };
        audio.onerror = (e) => reject(new Error(`Failed to load audio: ${url}`));
        audio.src = url;
        // Fallback timeout
        setTimeout(() => reject(new Error("Audio load timeout")), 5000);
      });
      
      await playPromise;
    } catch (e) {
      console.warn(`Audio play failed for ${url}:`, e);
      // Try a direct play as last resort
      try {
        const audio = new Audio(url);
        await audio.play();
      } catch (err) {
        console.error("Direct fallback failed:", err);
        this.resume().catch(rErr => console.error("Resume failed:", rErr));
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
      return;
    }
    const phrases = ["Dropping the bomb!", "Fire in the hole!"];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    await this.playVoice(phrase, 'Fenrir');
  }

  async playReceivingLines() {
    if (AUDIO_CONFIG.voices.receiving.length > 0) {
      const clip = AUDIO_CONFIG.voices.receiving[Math.floor(Math.random() * AUDIO_CONFIG.voices.receiving.length)];
      this.playFromUrl(clip);
      return;
    }
    const phrases = ["Incoming!", "Heavy fire!", "Machine gun fire!", "Take cover!"];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    await this.playVoice(phrase, 'Zephyr');
  }

  async playGeneralCommand() {
    if (AUDIO_CONFIG.voices.commands.length > 0) {
      const clip = AUDIO_CONFIG.voices.commands[Math.floor(Math.random() * AUDIO_CONFIG.voices.commands.length)];
      this.playFromUrl(clip);
      return;
    }
    const phrases = [
      "Move forward!",
      "Get the hell off the beach!",
      "Follow me!",
      "Get up and get moving!",
      "Stay low!",
      "Platoon, move out!"
    ];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    await this.playVoice(phrase, 'Fenrir');
  }
}

export const ww2AudioService = new WW2AudioService();
