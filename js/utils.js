/**
 * Utility functions for WordsMaster game
 * Provides common helper functions used throughout the application
 */

class GameUtils {
  /**
   * Shuffle an array using Fisher-Yates algorithm
   * @param {Array} array - Array to shuffle
   * @returns {Array} - New shuffled array
   */
  static shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Format time in MM:SS format
   * @param {number} seconds - Time in seconds
   * @returns {string} - Formatted time string
   */
  static formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }

  /**
   * Scramble a word ensuring it's different from the original
   * @param {string} word - Word to scramble
   * @returns {string} - Scrambled word
   */
  static scrambleWord(word) {
    if (word.length <= 1) return word;

    let scrambled = word
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
    let attempts = 0;

    // Ensure scrambled word is different from original
    while (scrambled === word && attempts < 10) {
      scrambled = word
        .split("")
        .sort(() => Math.random() - 0.5)
        .join("");
      attempts++;
    }

    return scrambled;
  }

  /**
   * Calculate score based on word length, time taken, and difficulty
   * @param {Object} params - Score calculation parameters
   * @returns {number} - Calculated score
   */
  static calculateScore({ wordLength, timeTaken, difficulty, hintsUsed = 0 }) {
    const baseScoringConfig = {
      easy: { baseScore: 50, lengthMultiplier: 10 },
      medium: { baseScore: 75, lengthMultiplier: 15 },
      hard: { baseScore: 100, lengthMultiplier: 20 },
    };

    const config = baseScoringConfig[difficulty] || baseScoringConfig.easy;
    let score = config.baseScore + wordLength * config.lengthMultiplier;

    // Time bonus (faster = higher score)
    const timeBonus = Math.max(0, 30 - timeTaken);
    score += timeBonus;

    // Penalty for hints
    score -= hintsUsed * 10;

    return Math.max(10, score); // Minimum score of 10
  }

  /**
   * Validate if a string contains only letters
   * @param {string} str - String to validate
   * @returns {boolean} - True if string contains only letters
   */
  static isValidWord(str) {
    return /^[a-zA-Z]+$/.test(str.trim());
  }

  /**
   * Sanitize user input
   * @param {string} input - User input to sanitize
   * @returns {string} - Sanitized input
   */
  static sanitizeInput(input) {
    return input
      .trim()
      .toLowerCase()
      .replace(/[^a-z]/g, "");
  }

  /**
   * Build a canonical signature of a word's letters (sorted lowercase letters)
   * @param {string} str
   * @returns {string}
   */
  static lettersSignature(str) {
    return (str || "").toLowerCase().split("").sort().join("");
  }

  /**
   * Check if two words consist of exactly the same letters (anagrams)
   * @param {string} a
   * @param {string} b
   * @returns {boolean}
   */
  static sameLetters(a, b) {
    return this.lettersSignature(a) === this.lettersSignature(b);
  }

  /**
   * Generate a random ID
   * @returns {string} - Random ID string
   */
  static generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Deep clone an object
   * @param {Object} obj - Object to clone
   * @returns {Object} - Cloned object
   */
  static deepClone(obj) {
    if (obj === null || typeof obj !== "object") return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map((item) => this.deepClone(item));

    if (typeof obj === "object") {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  }

  /**
   * Debounce function calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} - Debounced function
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function calls
   * @param {Function} func - Function to throttle
   * @param {number} limit - Limit in milliseconds
   * @returns {Function} - Throttled function
   */
  static throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * Local storage wrapper with error handling
   */
  static storage = {
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.warn("Failed to save to localStorage:", error);
        return false;
      }
    },

    get(key, defaultValue = null) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        console.warn("Failed to read from localStorage:", error);
        return defaultValue;
      }
    },

    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.warn("Failed to remove from localStorage:", error);
        return false;
      }
    },

    clear() {
      try {
        localStorage.clear();
        return true;
      } catch (error) {
        console.warn("Failed to clear localStorage:", error);
        return false;
      }
    },
  };

  /**
   * Performance monitoring utilities
   */
  static performance = {
    timers: new Map(),

    start(label) {
      this.timers.set(label, performance.now());
    },

    end(label) {
      const startTime = this.timers.get(label);
      if (startTime) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        this.timers.delete(label);
        return duration;
      }
      return null;
    },

    measure(label, fn) {
      this.start(label);
      const result = fn();
      const duration = this.end(label);
      console.log(`${label} took ${duration?.toFixed(2)}ms`);
      return result;
    },
  };

  /**
   * Device and browser detection
   */
  static device = {
    isMobile: () =>
      window.innerWidth <= 768 ||
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ),
    isTablet: () => window.innerWidth > 768 && window.innerWidth <= 1024,
    isDesktop: () => window.innerWidth > 1024,
    hasTouch: () => "ontouchstart" in window || navigator.maxTouchPoints > 0,
    supportsVibration: () => "vibrate" in navigator,
    supportsAudio: () => typeof Audio !== "undefined",
  };

  /**
   * Animation frame utilities
   */
  static animation = {
    requestFrame: (callback) => {
      return requestAnimationFrame(callback);
    },

    cancelFrame: (id) => {
      cancelAnimationFrame(id);
    },

    delay: (ms) => {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },
  };
}

// Export for use in other modules
if (typeof window !== "undefined") {
  window.GameUtils = GameUtils;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = GameUtils;
}
