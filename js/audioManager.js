/**
 * Audio Manager for WordsMaster game
 * Handles all audio operations with proper error handling and fallbacks
 */

class AudioManager {
  constructor() {
    this.sounds = new Map();
    this.musicEnabled = true;
    this.sfxEnabled = true;
    // Backwards-compatible master volume; used to initialize per-channel volumes
    this.volume = 0.5;
    this.musicVolume = 0.5; // independent music volume (0-1)
    this.sfxVolume = 0.5; // independent sfx volume (0-1)
    this.isInitialized = false;
    this.loadingPromises = new Map();

    // Audio context for better audio control (if available)
    this.audioContext = null;
    this.initAudioContext();

    // Load saved preferences if available
    try {
      const saved = JSON.parse(localStorage.getItem("wm_audio_prefs") || "{}");
      if (typeof saved.musicEnabled === "boolean")
        this.musicEnabled = saved.musicEnabled;
      if (typeof saved.sfxEnabled === "boolean")
        this.sfxEnabled = saved.sfxEnabled;
      if (typeof saved.volume === "number")
        this.volume = Math.min(1, Math.max(0, saved.volume));
      if (typeof saved.musicVolume === "number")
        this.musicVolume = Math.min(1, Math.max(0, saved.musicVolume));
      if (typeof saved.sfxVolume === "number")
        this.sfxVolume = Math.min(1, Math.max(0, saved.sfxVolume));
      // If individual volumes not stored, initialize them from master volume for backward compatibility
      if (saved.musicVolume == null)
        this.musicVolume = this.volume * 0.5 + 0.15; // keep bgm a bit lower by default
      if (saved.sfxVolume == null) this.sfxVolume = this.volume;
    } catch (_) {}
  }

  /**
   * Initialize Web Audio API context
   */
  initAudioContext() {
    try {
      const AudioContext =
        typeof window !== "undefined" &&
        (window.AudioContext || window.webkitAudioContext);
      if (AudioContext) {
        this.audioContext = new AudioContext();
      }
    } catch (error) {
      console.warn("Web Audio API not supported:", error);
    }
  }

  /**
   * Load all game audio files
   * @returns {Promise} - Promise that resolves when all audio is loaded
   */
  async loadAudioResources() {
    const audioFiles = {
      bgm: "assets/audio/bgm.mp3",
      correct: "assets/audio/correct-sfx.mp3",
      wrong: "assets/audio/wrong-sfx.mp3",
      highscore: "assets/audio/highscore-sfx.mp3",
      perfect: "assets/audio/perfect-sfx.mp3",
    };

    const loadPromises = Object.entries(audioFiles).map(([key, url]) =>
      this.loadSound(key, url)
    );

    try {
      await Promise.all(loadPromises);
      this.isInitialized = true;
      this.setupBackgroundMusic();
    } catch (error) {
      console.warn("Some audio files failed to load:", error);
      this.isInitialized = true; // Continue without audio
    }
  }

  /**
   * Load a single sound file
   * @param {string} key - Sound identifier
   * @param {string} url - Audio file URL
   * @returns {Promise} - Promise that resolves when sound is loaded
   */
  loadSound(key, url) {
    // Return existing promise if already loading
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key);
    }

    const promise = new Promise((resolve, reject) => {
      const audio = new Audio();

      // Set up event listeners
      audio.addEventListener(
        "canplaythrough",
        () => {
          this.sounds.set(key, audio);
          resolve(audio);
        },
        { once: true }
      );

      audio.addEventListener(
        "error",
        (error) => {
          console.warn(`Failed to load audio: ${key}`, error);
          // Create a silent fallback
          this.sounds.set(key, this.createSilentAudio());
          resolve(null); // Don't reject, just resolve with null
        },
        { once: true }
      );

      // Configure audio properties
      audio.preload = "auto";
      audio.volume = this.volume;

      // Start loading
      audio.src = url;
      audio.load();

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!this.sounds.has(key)) {
          console.warn(`Audio loading timeout: ${key}`);
          this.sounds.set(key, this.createSilentAudio());
          resolve(null);
        }
      }, 10000);
    });

    this.loadingPromises.set(key, promise);
    return promise;
  }

  /**
   * Create a silent audio object as fallback
   * @returns {Object} - Silent audio object
   */
  createSilentAudio() {
    return {
      play: () => Promise.resolve(),
      pause: () => {},
      stop: () => {},
      volume: 0,
      loop: false,
      muted: true,
    };
  }

  /**
   * Set up background music with proper loop handling
   */
  setupBackgroundMusic() {
    const bgm = this.sounds.get("bgm");
    if (bgm && bgm.play) {
      bgm.loop = true;
      bgm.volume = Math.min(1, Math.max(0, this.musicVolume));

      // Handle audio interruptions
      bgm.addEventListener("ended", () => {
        if (this.musicEnabled && bgm.loop) {
          bgm.currentTime = 0;
          bgm.play().catch(() => {});
        }
      });
    }
  }

  /**
   * Play a sound effect
   * @param {string} soundKey - Sound identifier
   * @param {Object} options - Playback options
   */
  async playSFX(soundKey, options = {}) {
    if (!this.sfxEnabled || !this.isInitialized) return;

    const audio = this.sounds.get(soundKey);
    if (!audio || !audio.play) return;

    try {
      // Reset audio to beginning
      audio.currentTime = 0;

      // Apply options
      if (options.volume !== undefined) {
        audio.volume = Math.min(1, Math.max(0, options.volume));
      } else {
        audio.volume = Math.min(1, Math.max(0, this.sfxVolume));
      }

      if (options.playbackRate !== undefined) {
        audio.playbackRate = options.playbackRate;
      }

      await audio.play();
    } catch (error) {
      console.warn(`Failed to play sound: ${soundKey}`, error);
    }
  }

  /**
   * Start background music
   */
  async startBackgroundMusic() {
    if (!this.musicEnabled || !this.isInitialized) return;

    const bgm = this.sounds.get("bgm");
    if (!bgm || !bgm.play) return;

    try {
      await bgm.play();
    } catch (error) {
      console.warn("Failed to start background music:", error);

      // Try to play on user interaction
      this.setupUserInteractionAudio();
    }
  }

  /**
   * Set up audio to play on first user interaction (for autoplay policies)
   */
  setupUserInteractionAudio() {
    const playOnInteraction = async () => {
      try {
        if (this.musicEnabled) {
          await this.startBackgroundMusic();
        }
        // Resume audio context if suspended
        if (this.audioContext && this.audioContext.state === "suspended") {
          await this.audioContext.resume();
        }

        // Remove listener after first interaction
        document.removeEventListener("click", playOnInteraction);
        document.removeEventListener("keydown", playOnInteraction);
        document.removeEventListener("touchstart", playOnInteraction);
      } catch (error) {
        console.warn("Failed to start audio on user interaction:", error);
      }
    };

    document.addEventListener("click", playOnInteraction, { once: true });
    document.addEventListener("keydown", playOnInteraction, { once: true });
    document.addEventListener("touchstart", playOnInteraction, { once: true });
  }

  /**
   * Stop background music
   */
  stopBackgroundMusic() {
    const bgm = this.sounds.get("bgm");
    if (bgm && bgm.pause) {
      bgm.pause();
      bgm.currentTime = 0;
    }
  }

  /**
   * Pause background music
   */
  pauseBackgroundMusic() {
    const bgm = this.sounds.get("bgm");
    if (bgm && bgm.pause) {
      bgm.pause();
    }
  }

  /**
   * Resume background music
   */
  async resumeBackgroundMusic() {
    if (!this.musicEnabled) return;

    const bgm = this.sounds.get("bgm");
    if (bgm && bgm.play) {
      try {
        await bgm.play();
      } catch (error) {
        console.warn("Failed to resume background music:", error);
      }
    }
  }

  /**
   * Set music enabled/disabled
   * @param {boolean} enabled - Whether music should be enabled
   */
  setMusicEnabled(enabled) {
    this.musicEnabled = enabled;

    const bgm = this.sounds.get("bgm");
    if (bgm) {
      bgm.muted = !enabled;

      if (enabled) {
        this.startBackgroundMusic();
      } else {
        this.pauseBackgroundMusic();
      }
    }

    // Persist preferences
    this.savePrefs();
  }

  /**
   * Set sound effects enabled/disabled
   * @param {boolean} enabled - Whether SFX should be enabled
   */
  setSFXEnabled(enabled) {
    this.sfxEnabled = enabled;
    this.savePrefs();
  }

  /**
   * Set master volume (backward compatibility)
   * @param {number} volume - Volume level (0-1)
   */
  setVolume(volume) {
    this.volume = Math.min(1, Math.max(0, volume));
    // For backward compatibility, also set per-channel volumes sensibly
    this.setMusicVolume(Math.min(1, Math.max(0, volume * 0.6)));
    this.setSFXVolume(volume);
  }

  /**
   * Set independent music volume
   * @param {number} volume (0-1)
   */
  setMusicVolume(volume) {
    this.musicVolume = Math.min(1, Math.max(0, volume));
    const bgm = this.sounds.get("bgm");
    if (bgm && typeof bgm.volume !== "undefined") {
      bgm.volume = this.musicVolume;
    }
    this.savePrefs();
  }

  /**
   * Set independent SFX volume
   * @param {number} volume (0-1)
   */
  setSFXVolume(volume) {
    this.sfxVolume = Math.min(1, Math.max(0, volume));
    // Update currently loaded non-bgm sounds
    this.sounds.forEach((audio, key) => {
      if (key !== "bgm" && audio && typeof audio.volume !== "undefined") {
        audio.volume = this.sfxVolume;
      }
    });
    // Persist preferences
    this.savePrefs();
  }

  /**
   * Fade in audio
   * @param {string} soundKey - Sound identifier
   * @param {number} duration - Fade duration in milliseconds
   */
  fadeIn(soundKey, duration = 1000) {
    const audio = this.sounds.get(soundKey);
    if (!audio) return;

    const targetVolume = soundKey === "bgm" ? this.musicVolume : this.sfxVolume;
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = targetVolume / steps;

    audio.volume = 0;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      currentStep++;
      audio.volume = Math.min(targetVolume, volumeStep * currentStep);

      if (currentStep >= steps) {
        clearInterval(fadeInterval);
      }
    }, stepDuration);
  }

  /**
   * Fade out audio
   * @param {string} soundKey - Sound identifier
   * @param {number} duration - Fade duration in milliseconds
   */
  fadeOut(soundKey, duration = 1000) {
    const audio = this.sounds.get(soundKey);
    if (!audio) return;

    const startVolume = audio.volume;
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = startVolume / steps;

    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      currentStep++;
      audio.volume = Math.max(0, startVolume - volumeStep * currentStep);

      if (currentStep >= steps) {
        clearInterval(fadeInterval);
        if (audio.pause) audio.pause();
      }
    }, stepDuration);
  }

  /**
   * Get audio loading status
   * @returns {Object} - Loading status for each audio file
   */
  getLoadingStatus() {
    const status = {};
    this.sounds.forEach((audio, key) => {
      status[key] = {
        loaded: !!audio,
        canPlay: audio && audio.readyState >= 2,
      };
    });
    return status;
  }

  /**
   * Save preferences to localStorage
   */
  savePrefs() {
    try {
      localStorage.setItem(
        "wm_audio_prefs",
        JSON.stringify({
          musicEnabled: this.musicEnabled,
          sfxEnabled: this.sfxEnabled,
          volume: this.volume,
          musicVolume: this.musicVolume,
          sfxVolume: this.sfxVolume,
        })
      );
    } catch (_) {}
  }

  /**
   * Cleanup all audio resources
   */
  destroy() {
    this.sounds.forEach((audio) => {
      if (audio && audio.pause) {
        audio.pause();
        audio.src = "";
      }
    });

    this.sounds.clear();
    this.loadingPromises.clear();

    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

// Export for use in other modules
if (typeof window !== "undefined") {
  window.AudioManager = AudioManager;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = AudioManager;
}
