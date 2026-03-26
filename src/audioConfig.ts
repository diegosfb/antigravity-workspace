/**
 * WW2 Audio Configuration
 * 
 * Replace these URLs with your own sound clips.
 * You can use absolute URLs (https://...) or local paths if you upload files to the project.
 * Version: 1.1.0 (Cache breaker)
 */
export const AUDIO_CONFIG = {
  music: {
    // Background music for the initial splash screen
    splash: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    // Background music for the lobby/waiting room
    lobby: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    // Background music during active gameplay
    game: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
  sfx: {
    // Sound played when a "bomb" is dropped
    explosion: "/assets/stages/sounds/explosion.mp3",
  },
  /**
   * Custom Voice Clips
   * 
   * If you add URLs to these arrays, the app will play them RANDOMLY 
   * instead of using the Gemini AI Voice.
   */
  voices: {
    // Clips played when YOU send a move
    sending: [
      "/assets/stages/sounds/AttackSend/AttackSend_clip0.mp3",
      "/assets/stages/sounds/AttackSend/AttackSend_clip1.mp3",
      "/assets/stages/sounds/AttackSend/AttackSend_clip2.mp3",
      "/assets/stages/sounds/AttackSend/AttackSend_clip3.mp3",
      "/assets/stages/sounds/AttackSend/AttackSend_clip4.mp3",
      "/assets/stages/sounds/AttackSend/AttackSend_clip5.mp3",
      "/assets/stages/sounds/AttackSend/AttackSend_clip6.mp3",
      "/assets/stages/sounds/AttackSend/AttackSend_clip7.mp3",
      "/assets/stages/sounds/AttackSend/AttackSend_clip8.mp3",
      "/assets/stages/sounds/AttackSend/AttackSend_clip9.mp3",
    ],
    // Clips played when YOU receive a move
    receiving: [
      "/assets/stages/sounds/AttackReceive/AttackReceive_clip0.mp3",
      "/assets/stages/sounds/AttackReceive/AttackReceive_clip1.mp3",
      "/assets/stages/sounds/AttackReceive/AttackReceive_clip2.mp3",
      "/assets/stages/sounds/AttackReceive/AttackReceive_clip3.mp3",
      "/assets/stages/sounds/AttackReceive/AttackReceive_clip4.mp3",
      "/assets/stages/sounds/AttackReceive/AttackReceive_clip5.mp3",
      "/assets/stages/sounds/AttackReceive/AttackReceive_clip6.mp3",
      "/assets/stages/sounds/AttackReceive/AttackReceive_clip7.mp3",
      "/assets/stages/sounds/AttackReceive/AttackReceive_clip8.mp3",
      "/assets/stages/sounds/AttackReceive/AttackReceive_clip9.mp3",
    ],
    // General military commands played during the match
    commands: [
      // "https://your-site.com/sounds/move-out.mp3",
    ]
  }
};
