const AudioManager = require("../js/audioManager.js");

describe("Audio preferences persistence", () => {
  beforeEach(() => {
    // Simple localStorage mock
    global.localStorage = (function () {
      let store = {};
      return {
        getItem: (k) => (k in store ? store[k] : null),
        setItem: (k, v) => {
          store[k] = String(v);
        },
        removeItem: (k) => {
          delete store[k];
        },
        clear: () => {
          store = {};
        },
      };
    })();

    // Audio constructor mock
    global.Audio = function () {
      return {
        addEventListener: () => {},
        load: () => {},
        play: () => Promise.resolve(),
        pause: () => {},
        volume: 1,
      };
    };
  });

  test("saves and restores music/sfx volumes and toggles", () => {
    const am1 = new AudioManager();
    am1.setMusicEnabled(false);
    am1.setSFXEnabled(true);
    am1.setMusicVolume(0.3);
    am1.setSFXVolume(0.7);

    const raw = JSON.parse(localStorage.getItem("wm_audio_prefs"));
    expect(raw.musicEnabled).toBe(false);
    expect(raw.sfxEnabled).toBe(true);
    expect(raw.musicVolume).toBeCloseTo(0.3, 5);
    expect(raw.sfxVolume).toBeCloseTo(0.7, 5);

    // New instance should pick up preferences
    const am2 = new AudioManager();
    expect(am2.musicEnabled).toBe(false);
    expect(am2.sfxEnabled).toBe(true);
    expect(am2.musicVolume).toBeCloseTo(0.3, 5);
    expect(am2.sfxVolume).toBeCloseTo(0.7, 5);
  });
});
