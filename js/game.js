/**
 * WordsMaster Game - Main Game Logic
 * A word unscrambling game with multiple difficulty levels
 */

class WordsMaster {
  constructor() {
    // Initialize core managers
    this.audioManager = new AudioManager();
    this.backgroundEffects = null;
    this.currentHintsUsed = {};
    this.isGameActive = false;

    // Game state
    this.game = {
      difficulty: "easy",
      totalWords: 5,
      timeLimit: 120,
      currentWord: 0,
      score: 0,
      lives: 3,
      hints: 3,
      streak: 0,
      longestStreak: 0,
      timer: null,
      startTime: null,
      selectedWords: [],
      solved: [],
      missed: [],
      wordsPlayed: 0,
      sessionId: GameUtils.generateId(),
    };

    // Configuration for different difficulty levels
    this.difficultyConfig = {
      easy: { words: 5, time: 120, minLen: 4, maxLen: 5 },
      medium: { words: 10, time: 150, minLen: 6, maxLen: 7 },
      hard: { words: 20, time: 180, minLen: 8, maxLen: 12 },
    };

    // High Score System with better error handling
    this.highScore = GameUtils.storage.get("wordGameHighScore", 0);

    this.init();
  }

  /**
   * Initialize the game
   */
  async init() {
    try {
      this.updateHighScoreDisplay();
      this.setupEventListeners();
      await this.initializeGame();
      // Sync rules modal controls with saved audio preferences on first load
      this.applySavedAudioPrefsToUI();
      this.setupKeyShortcuts();
    } catch (error) {
      console.error("Game initialization failed:", error);
      this.showError("Failed to initialize game. Please refresh the page.");
    }
  }

  /**
   * Show error message to user
   * @param {string} message - Error message to display
   */
  showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className =
      "alert alert-danger position-fixed top-0 start-50 translate-middle-x mt-3";
    errorDiv.style.zIndex = "9999";
    errorDiv.textContent = message;

    document.body.appendChild(errorDiv);

    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    // Enter key support for input
    const userInput = document.getElementById("userInput");
    if (userInput) {
      userInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.submitAnswer();
      });
    }

    // Sound toggle handler
    const soundToggle = document.getElementById("soundToggle");
    const volumePanel = document.getElementById("volumePanel");
    const musicVol = document.getElementById("musicVol");
    const sfxVol = document.getElementById("sfxVol");
    if (soundToggle) {
      soundToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        if (volumePanel) {
          const isHidden = volumePanel.classList.contains("hidden");
          if (isHidden) {
            // Sync slider values to current settings (0-100)
            if (musicVol)
              musicVol.value = Math.round(
                (this.audioManager.musicVolume || 0) * 100
              );
            if (sfxVol)
              sfxVol.value = Math.round(
                (this.audioManager.sfxVolume || 0) * 100
              );
            volumePanel.classList.remove("hidden");
          } else {
            volumePanel.classList.add("hidden");
          }
        }
      });
    }

    // Update volumes when sliders move
    if (musicVol) {
      musicVol.addEventListener("input", (e) => {
        const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
        this.audioManager.setMusicVolume(val / 100);
      });
    }
    if (sfxVol) {
      sfxVol.addEventListener("input", (e) => {
        const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
        this.audioManager.setSFXVolume(val / 100);
      });
    }

    // Hide the panel when clicking outside
    document.addEventListener("click", (e) => {
      if (!volumePanel || volumePanel.classList.contains("hidden")) return;
      const within =
        volumePanel.contains(e.target) || soundToggle.contains(e.target);
      if (!within) volumePanel.classList.add("hidden");
    });

    // Close popup handlers
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("close-popup")) {
        const popup = e.target.closest(".popup");
        if (popup) {
          popup.classList.add("hidden");
        }
      }
    });
  }

  /**
   * Initialize the game on page load
   */
  async initializeGame() {
    try {
      this.showLoader();
      // Defensive timeout: ensure loader hides even if resources stall
      const maxLoadMs = 4000;
      const hideTimeout = setTimeout(() => {
        try {
          this.hideLoader();
          this.showRulesModal();
          document.getElementById("startSection")?.classList.remove("hidden");
        } catch (_) {}
      }, maxLoadMs);

      // Initialize background effects
      if (typeof BackgroundEffects !== "undefined") {
        this.backgroundEffects = new BackgroundEffects();
      }

      // Load audio resources (don't block forever)
      await Promise.race([
        this.audioManager.loadAudioResources(),
        new Promise((resolve) => setTimeout(resolve, maxLoadMs)),
      ]);

      setTimeout(() => {
        this.hideLoader();
        this.showRulesModal();
        document.getElementById("startSection")?.classList.remove("hidden");
        this.closePopup("highscorePopup");
        this.closePopup("perfectPopup");
        clearTimeout(hideTimeout);
      }, 1500);
    } catch (error) {
      console.error("Game initialization failed:", error);
      this.hideLoader();
      this.showError(
        "Failed to load game resources. Some features may not work properly."
      );
    }
  }

  /**
   * Start the game with selected difficulty
   */
  startGame() {
    if (this.game.timer) {
      clearInterval(this.game.timer);
      this.game.timer = null;
    }

    // Get selected difficulty
    const difficulty = document.getElementById("difficulty").value;
    const config = this.difficultyConfig[difficulty];

    // Reset game state
    this.game = {
      difficulty,
      totalWords: config.words,
      timeLimit: config.time,
      currentWord: 0,
      score: 0,
      lives: 3,
      hints: 3,
      streak: 0,
      longestStreak: 0,
      timer: null,
      startTime: Date.now(),
      selectedWords: GameUtils.shuffleArray(
        (typeof SAFE_WORDS !== "undefined" ? SAFE_WORDS : WORDS).filter(
          (w) => w.length >= config.minLen && w.length <= config.maxLen
        )
      ).slice(0, config.words),
      solved: [],
      missed: [],
      wordsPlayed: 0,
    };

    this.currentHintsUsed = {};

    // Update UI and start game (animated)
    this.switchSection("startSection", "gameSection");
    this.updateWordCount();
    this.updateTimerDisplay(this.game.timeLimit);
    this.updateLivesDisplay();
    this.updateScoreDisplay();
    this.updateHintButton();

    this.game.timer = setInterval(() => this.updateGame(), 1000);
    this.isGameActive = true;
    this.showNextWord();

    // Update background effects
    if (this.backgroundEffects) {
      this.backgroundEffects.updateEffects("playing");
    }
  }

  /**
   * Handle rules modal and audio setup
   */
  startGameAfterRules() {
    try {
      // Get user preferences
      const musicEnabled =
        document.getElementById("musicCheck")?.checked ?? true;
      const soundEnabled = document.getElementById("sfxCheck")?.checked ?? true;
      const volume =
        (document.getElementById("volumeSlider")?.value ?? 50) / 100;

      // Apply audio settings
      this.audioManager.setMusicEnabled(musicEnabled);
      this.audioManager.setSFXEnabled(soundEnabled);
      // Set only music volume from the modal slider to avoid clobbering SFX preference
      this.audioManager.setMusicVolume(Math.max(0, Math.min(1, volume)));

      // Start background music if enabled
      if (musicEnabled) {
        this.audioManager.startBackgroundMusic();
      }

      // Close rules modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("rulesModal")
      );
      if (modal) modal.hide();

      // Show start section
      this.showOnly("startSection");

      // Update background effects
      if (this.backgroundEffects) {
        this.backgroundEffects.updateEffects("menu");
      }
      // Update sound icon to reflect current enable state
      this.syncSoundToggleIcon();
    } catch (error) {
      console.error("Error setting up audio preferences:", error);
      this.showError("Failed to apply audio settings");
    }
  }

  /**
   * Initialize rules modal fields from saved audio preferences
   */
  applySavedAudioPrefsToUI() {
    try {
      const saved = JSON.parse(localStorage.getItem("wm_audio_prefs") || "{}");
      const musicEnabled =
        typeof saved.musicEnabled === "boolean" ? saved.musicEnabled : true;
      const sfxEnabled =
        typeof saved.sfxEnabled === "boolean" ? saved.sfxEnabled : true;
      const musicVolume =
        typeof saved.musicVolume === "number"
          ? Math.max(0, Math.min(1, saved.musicVolume))
          : 0.5;

      const musicCheck = document.getElementById("musicCheck");
      const sfxCheck = document.getElementById("sfxCheck");
      const volumeSlider = document.getElementById("volumeSlider");

      if (musicCheck) musicCheck.checked = musicEnabled;
      if (sfxCheck) sfxCheck.checked = sfxEnabled;
      if (volumeSlider) volumeSlider.value = Math.round(musicVolume * 100);

      // Also initialize the floating volume panel sliders if present
      const musicVol = document.getElementById("musicVol");
      const sfxVol = document.getElementById("sfxVol");
      if (musicVol) musicVol.value = Math.round(musicVolume * 100);
      if (sfxVol) {
        const sfxVolume =
          typeof saved.sfxVolume === "number"
            ? Math.max(0, Math.min(1, saved.sfxVolume))
            : this.audioManager.sfxVolume || 0.5;
        sfxVol.value = Math.round(sfxVolume * 100);
      }

      this.syncSoundToggleIcon();
    } catch (_) {}
  }

  /**
   * Update the sound toggle button icon based on current enablement
   */
  syncSoundToggleIcon() {
    const soundToggle = document.getElementById("soundToggle");
    if (!soundToggle) return;
    const enabled =
      this.audioManager?.musicEnabled || this.audioManager?.sfxEnabled;
    soundToggle.innerHTML = `<i class="bi ${
      enabled ? "bi-volume-up" : "bi-volume-mute"
    }"></i>`;
  }

  /**
   * Update game timer and check for time expiration
   */
  updateGame() {
    const elapsed = Math.floor((Date.now() - this.game.startTime) / 1000);
    const remaining = this.game.timeLimit - elapsed;

    if (remaining <= 0) {
      this.endGame();
      return;
    }
    this.updateTimerDisplay(remaining);
  }

  /**
   * Display next word in the sequence
   */
  showNextWord() {
    if (this.game.currentWord >= this.game.totalWords) {
      this.endGame();
      return;
    }

    const word = this.game.selectedWords[this.game.currentWord];
    const scrambled = this.scrambleWord(word);
    const container = document.getElementById("scrambledWord");
    // Render as tiles
    if (container) {
      container.innerHTML = "";
      [...scrambled].forEach((ch, idx) => {
        const tile = document.createElement("div");
        tile.className = "tile flip-in";
        tile.textContent = ch.toUpperCase();
        tile.style.animationDelay = `${idx * 40}ms`;
        container.appendChild(tile);
      });
    }
    document.getElementById("userInput").value = "";
    document.getElementById("userInput").focus();
    document.getElementById("hintArea").textContent = "";
  }

  /**
   * Scramble a word randomly
   */
  scrambleWord(word) {
    return GameUtils.scrambleWord(word);
  }

  /**
   * Submit and check the user's answer
   */
  submitAnswer() {
    const userInput = document.getElementById("userInput");
    if (!userInput || !this.isGameActive) return;

    const guess = GameUtils.sanitizeInput(userInput.value);
    const correct =
      this.game.selectedWords[this.game.currentWord].toLowerCase();
    // Accept only dictionary words whose letters exactly match the puzzle letters
    // Rationale: prevent accepting non-words, but allow valid alternatives like
    // "sure" and "user" if both exist in the dictionary.
    const matchesLetters = GameUtils.sameLetters(guess, correct);
    // Accept alternates: extend dictionary with ALTERNATE_WORDS if present
    const baseDict =
      (typeof SAFE_WORDS !== "undefined" ? SAFE_WORDS : WORDS) || [];
    const alt = typeof ALTERNATE_WORDS !== "undefined" ? ALTERNATE_WORDS : [];
    const dictionary =
      Array.isArray(alt) && alt.length ? baseDict.concat(alt) : baseDict;
    const isInDictionary = dictionary.includes(guess);

    if (isInDictionary && matchesLetters && guess.length > 0) {
      // Treat as correct using the submitted word variant
      this.handleCorrectAnswer(guess);
      this.game.currentWord++;
      this.game.wordsPlayed++;
      this.updateWordCount();
      this.showNextWord();
    } else if (guess !== "") {
      // Wrong attempt: do not advance word or progress counter
      this.handleWrongAnswer(correct);
    }
  }

  /**
   * Handle correct answer logic
   */
  handleCorrectAnswer(correctWord) {
    this.game.score += 100;
    this.game.streak++;
    this.game.longestStreak = Math.max(
      this.game.streak,
      this.game.longestStreak
    );
    this.game.solved.push(correctWord);

    this.updateScoreDisplay();
    this.updateStreakBadge();

    const userInput = document.getElementById("userInput");
    if (userInput) {
      userInput.classList.add("correct");
      setTimeout(() => userInput.classList.remove("correct"), 500);
    }

    // Play sound effect
    this.audioManager.playSFX("correct");

    // Update background effects
    if (this.backgroundEffects) {
      this.backgroundEffects.updateEffects("correct");
    }
  }

  /**
   * Handle wrong answer logic
   */
  handleWrongAnswer(correctWord) {
    this.game.lives--;
    this.game.streak = 0;
    // Do not push to missed here to avoid duplicates; only add on skip or at game over

    this.updateLivesDisplay();
    this.updateStreakBadge();

    // Visual and haptic feedback
    if (GameUtils.device.supportsVibration()) {
      navigator.vibrate(200);
    }

    document.body.classList.add("vibrate");
    setTimeout(() => document.body.classList.remove("vibrate"), 300);

    // Play sound effect
    this.audioManager.playSFX("wrong");

    // Update background effects
    if (this.backgroundEffects) {
      this.backgroundEffects.updateEffects("wrong");
      this.backgroundEffects.screenShake(5, 200);
    }

    // End game if no lives left
    if (this.game.lives <= 0) {
      // Add current and remaining words to missed exactly once
      const startIdx = this.game.currentWord;
      for (let i = startIdx; i < this.game.totalWords; i++) {
        const w = this.game.selectedWords[i];
        if (!this.game.missed.includes(w) && !this.game.solved.includes(w)) {
          this.game.missed.push(w);
        }
      }
      this.endGame();
    }
  }

  /**
   * Use a hint for the current word
   */
  useHint() {
    if (this.game.hints > 0) {
      this.game.hints--;
      const word = this.game.selectedWords[this.game.currentWord];
      const hintCount = this.currentHintsUsed[this.game.currentWord] || 0;

      // Visual feedback
      const hintArea = document.getElementById("hintArea");
      hintArea.style.opacity = "0";
      setTimeout(() => {
        hintArea.style.opacity = "1";
      }, 50);

      // Build hint text
      let hint = `Starts with "${word[0]}"`;
      if (hintCount >= 1 && word.length > 1)
        hint += `, second letter "${word[1]}"`;
      if (hintCount >= 2 && word.length > 2)
        hint += `, third letter "${word[2]}"`;

      this.currentHintsUsed[this.game.currentWord] = hintCount + 1;
      hintArea.innerHTML = `<strong>Hint:</strong> ${hint}`;
      this.updateHintButton();
    }
  }

  /**
   * Skip the current word
   */
  skipWord() {
    this.game.missed.push(this.game.selectedWords[this.game.currentWord]);
    this.game.currentWord++;
    this.game.wordsPlayed++;
    this.updateWordCount();

    if (this.game.currentWord >= this.game.totalWords) {
      this.endGame();
    } else {
      this.showNextWord();
    }
  }

  /**
   * End the game and show results
   */
  async endGame() {
    this.isGameActive = false;
    clearInterval(this.game.timer);

    // Calculate bonuses
    const elapsed = Math.floor((Date.now() - this.game.startTime) / 1000);
    const remaining = Math.max(0, this.game.timeLimit - elapsed);

    let timeBonus = 0;
    let perfectBonus = 0;
    let streakBonus = this.game.longestStreak * 10;

    if (this.game.solved.length > 0) {
      timeBonus = remaining;
      if (this.game.solved.length === this.game.totalWords) {
        perfectBonus = 100;
      }
      this.game.score += timeBonus + streakBonus + perfectBonus;
    } else {
      this.game.score = 0;
    }

    // Check for perfect game
    if (
      this.game.solved.length === this.game.totalWords &&
      this.game.hints === 3
    ) {
      setTimeout(() => {
        this.showPopup("perfectPopup", "perfect");
        if (this.backgroundEffects) {
          this.backgroundEffects.createParticleEffect("perfect");
        }
      }, 500);
    }

    // Check for high score
    if (this.game.score > this.highScore) {
      setTimeout(() => {
        this.showPopup("highscorePopup", "highscore");
        if (this.backgroundEffects) {
          this.backgroundEffects.createParticleEffect("highscore");
        }
      }, 500);

      this.highScore = this.game.score;
      GameUtils.storage.set("wordGameHighScore", this.highScore);
      this.updateHighScoreDisplay();
      this.createConfetti();
    }

    // Update background effects
    if (this.backgroundEffects) {
      this.backgroundEffects.updateEffects("gameOver");
    }

    this.updateStatistics(timeBonus + streakBonus + perfectBonus);
    this.showStatsSection();
  }

  /**
   * Update the statistics display
   */
  updateStatistics(totalBonus) {
    document.getElementById("statTotal").textContent = this.game.totalWords;
    document.getElementById("statSolved").textContent = this.game.solved.length;
    document.getElementById("solvedWords").textContent =
      this.game.solved.join(", ") || "None";
    document.getElementById("statMissed").textContent = this.game.missed.length;
    document.getElementById("missedWords").textContent =
      this.game.missed.join(", ") || "None";
    document.getElementById("statPercentage").textContent = (
      (this.game.solved.length / this.game.totalWords) *
      100
    ).toFixed(1);
    document.getElementById("timeBonus").textContent = totalBonus;
    document.getElementById("statStreak").textContent = this.game.longestStreak;
    document.getElementById("finalScore").textContent = this.game.score;
  }

  /**
   * Show statistics section
   */
  showStatsSection() {
    this.switchSection("gameSection", "statsSection");
  }

  /**
   * Reset and play again
   */
  async playAgain() {
    if (this.game.timer) {
      clearInterval(this.game.timer);
      this.game.timer = null;
    }

    this.showLoader();
    await new Promise((resolve) => setTimeout(resolve, 500));

    this.switchSection("statsSection", "startSection");

    this.hideLoader();
    this.resetGameState();
  }

  /**
   * Reset game state to default
   */
  resetGameState() {
    this.game = {
      difficulty: "easy",
      totalWords: 5,
      timeLimit: 120,
      currentWord: 0,
      score: 0,
      lives: 3,
      hints: 3,
      streak: 0,
      longestStreak: 0,
      timer: null,
      startTime: null,
      selectedWords: [],
      solved: [],
      missed: [],
      wordsPlayed: 0,
    };
    this.currentHintsUsed = {};
  }

  // UI Update Methods
  updateWordCount() {
    const text = `${this.game.wordsPlayed}/${this.game.totalWords}`;
    const wc = document.getElementById("wordCount");
    if (wc) wc.textContent = text;
    // Progress bar
    const pct =
      this.game.totalWords > 0
        ? Math.max(
            0,
            Math.min(100, (this.game.wordsPlayed / this.game.totalWords) * 100)
          )
        : 0;
    const bar = document.getElementById("wordProgressBar");
    if (bar) bar.style.width = `${pct}%`;
  }

  updateTimerDisplay(seconds) {
    const timerElement = document.getElementById("timer");
    if (timerElement) {
      timerElement.textContent = GameUtils.formatTime(seconds);
    }
    // Update time bar
    const bar = document.getElementById("timeBar");
    if (bar && this.game.timeLimit) {
      const pct = Math.max(0, (seconds / this.game.timeLimit) * 100);
      bar.style.width = `${pct}%`;
      // Color shift
      bar.style.background =
        pct < 25
          ? `linear-gradient(90deg, var(--danger-color), #ff5b5b)`
          : pct < 50
          ? `linear-gradient(90deg, var(--warning-color), #ffb703)`
          : `linear-gradient(90deg, var(--accent-color), var(--accent-3))`;
    }
  }

  updateLivesDisplay() {
    const hearts = document.getElementById("lives");
    hearts.innerHTML =
      "❤️".repeat(this.game.lives) + "♡".repeat(3 - this.game.lives);
  }

  updateScoreDisplay() {
    document.getElementById("score").textContent = this.game.score;
  }

  updateStreakBadge() {
    const el = document.getElementById("streakBadge");
    if (!el) return;
    const x = this.game.streak;
    el.textContent = `x${x} Combo`;
    el.style.visibility = x > 0 ? "visible" : "hidden";
    // remove pulsing glow on badge
  }

  updateHintButton() {
    const hintButtonText = document.getElementById("hintButtonText");
    if (hintButtonText) {
      hintButtonText.textContent = `Hint (${this.game.hints} left)`;
    }
  }

  updateHighScoreDisplay() {
    document.getElementById("highScoreValue").textContent = this.highScore;
  }

  // Utility Methods
  showRulesModal() {
    const modal = new bootstrap.Modal(document.getElementById("rulesModal"));
    modal.show();
  }

  showLoader() {
    const loader = document.getElementById("loadingScreen");
    loader.style.display = "flex";
    loader.style.opacity = "1";
  }

  hideLoader() {
    const loader = document.getElementById("loadingScreen");
    loader.style.opacity = "0";
    setTimeout(() => {
      loader.style.display = "none";
    }, 300);
  }

  closePopup(popupId) {
    const popup = document.getElementById(popupId);
    if (popup) {
      popup.classList.add("hidden");
    }
  }

  showPopup(elementId, soundKey) {
    const popup = document.getElementById(elementId);
    if (popup) {
      popup.classList.remove("hidden");
      if (soundKey) this.audioManager.playSFX(soundKey);
      this.updatePopupStack();
    }
  }

  // Section transitions
  switchSection(fromId, toId) {
    const from = document.getElementById(fromId);
    const to = document.getElementById(toId);
    if (from && !from.classList.contains("hidden")) {
      from.classList.add("section-exit");
      requestAnimationFrame(() => from.classList.add("section-exit-active"));
      setTimeout(() => {
        from.classList.add("hidden");
        from.classList.remove("section-exit", "section-exit-active");
      }, 260);
    } else if (from) {
      from.classList.add("hidden");
    }
    if (to) {
      to.classList.remove("hidden");
      to.classList.add("section-enter");
      requestAnimationFrame(() => to.classList.add("section-enter-active"));
      setTimeout(
        () => to.classList.remove("section-enter", "section-enter-active"),
        320
      );
    }
  }

  showOnly(id) {
    ["startSection", "gameSection", "statsSection"].forEach((sec) => {
      const el = document.getElementById(sec);
      if (!el) return;
      if (sec === id) {
        el.classList.remove("hidden");
      } else {
        el.classList.add("hidden");
      }
    });
  }

  // Popup stacking to avoid overlap
  updatePopupStack() {
    const perfect = document.getElementById("perfectPopup");
    const high = document.getElementById("highscorePopup");
    const perfectVisible = perfect && !perfect.classList.contains("hidden");
    const highVisible = high && !high.classList.contains("hidden");
    if (perfectVisible && highVisible) {
      // Place perfect a bit higher and highscore lower
      perfect.style.transform = "translate(-50%, -60%)";
      high.style.transform = "translate(-50%, -10%)";
    } else {
      if (perfect) perfect.style.transform = "translate(-50%, -50%)";
      if (high) high.style.transform = "translate(-50%, -50%)";
    }
  }

  // Keyboard shortcuts
  setupKeyShortcuts() {
    document.addEventListener("keydown", (e) => {
      const target = e.target;
      const isTyping =
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
      const inGame = !document
        .getElementById("gameSection")
        ?.classList.contains("hidden");
      const key = e.key;

      if (key === "Enter") {
        if (inGame && !isTyping) {
          e.preventDefault();
          this.submitAnswer();
        }
      } else if (inGame) {
        // Do not trigger shortcuts while the user is typing in the input
        if (isTyping) return;
        const lower = key.toLowerCase();
        if (lower === "h") this.useHint();
        // Removed: 's' to skip shortcut per request
        if (lower === "m") this.toggleSound();
      }

      // visual feedback removed with controls-hint
    });
  }

  // glow loop removed

  toggleSound() {
    const wasEnabled =
      this.audioManager.musicEnabled || this.audioManager.sfxEnabled;

    this.audioManager.setMusicEnabled(!wasEnabled);
    this.audioManager.setSFXEnabled(!wasEnabled);

    const soundToggle = document.getElementById("soundToggle");
    if (soundToggle) {
      soundToggle.innerHTML = `<i class="bi ${
        wasEnabled ? "bi-volume-mute" : "bi-volume-up"
      }"></i>`;
    }
  }

  createConfetti() {
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement("div");
      confetti.className = "confetti";
      confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 60%)`;
      confetti.style.left = Math.random() * 100 + "vw";
      confetti.style.animationDuration = Math.random() * 3 + 2 + "s";
      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 5000);
    }
  }

  /**
   * Cleanup resources when game is destroyed
   */
  destroy() {
    this.isGameActive = false;
    if (this.game.timer) {
      clearInterval(this.game.timer);
    }

    if (this.audioManager) {
      this.audioManager.destroy();
    }

    if (this.backgroundEffects) {
      this.backgroundEffects.destroy();
    }
  }
}

// Global game instance
let game;

// Global functions for HTML onclick handlers
function startGame() {
  game.startGame();
}

function startGameAfterRules() {
  game.startGameAfterRules();
}

function submitAnswer() {
  game.submitAnswer();
}

function useHint() {
  game.useHint();
}

function skipWord() {
  game.skipWord();
}

function playAgain() {
  game.playAgain();
}

// Initialize game when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  game = new WordsMaster();
});
