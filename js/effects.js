/**
 * Background Effects for WordsMaster
 * Handles animated background and visual effects
 */

class BackgroundEffects {
  constructor() {
    this.vantaEffect = null;
    this.mode = "css-grid";
    this.init();
  }

  /**
   * Initialize background effects
   */
  init() {
    // Use CSS-driven neon grid background for consistency/perf
    // Create subtle candy layers for a light parallax effect (no idle animation)
    this.layers = [];
    const bg = document.getElementById("background");
    if (!bg) return;
    // Prefer user-provided background images with graceful fallback
    this._applyBackgroundImage(bg);
    const positions = [
      { cls: "l1", left: "10%", top: "25%", amp: 6 },
      { cls: "l2", left: "70%", top: "20%", amp: 8 },
      { cls: "l3", left: "40%", top: "70%", amp: 5 },
    ];
    positions.forEach((p) => {
      const el = document.createElement("div");
      el.className = `bg-layer ${p.cls}`;
      el.style.left = p.left;
      el.style.top = p.top;
      el.dataset.amp = p.amp;
      bg.appendChild(el);
      this.layers.push(el);
    });
    // Stickers disabled; only static background image with vignette
    const handleMove = (x, y) => {
      const rect = bg.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (x - cx) / rect.width;
      const dy = (y - cy) / rect.height;
      this.layers.forEach((el) => {
        const amp = parseFloat(el.dataset.amp || "6");
        el.style.transform = `translate(${(-dx * amp).toFixed(1)}px, ${(
          -dy * amp
        ).toFixed(1)}px)`;
      });
    };
    window.addEventListener("mousemove", (e) =>
      handleMove(e.clientX, e.clientY)
    );
    window.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches && e.touches[0])
          handleMove(e.touches[0].clientX, e.touches[0].clientY);
      },
      { passive: true }
    );
  }

  _applyBackgroundImage(bg) {
    const trySrcs = [
      "assets/img/background_with_name.png",
      "assets/img/background.jpg",
    ];
    const test = (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = () => resolve(null);
        img.src = src;
      });
    (async () => {
      for (const s of trySrcs) {
        // eslint-disable-next-line no-await-in-loop
        const ok = await test(s);
        if (ok) {
          bg.style.backgroundImage = `linear-gradient(rgba(247,247,251,0.55), rgba(247,247,251,0.55)), url("${ok}")`;
          bg.style.backgroundSize = "cover";
          bg.style.backgroundPosition = "center";
          bg.style.backgroundRepeat = "no-repeat";
          return;
        }
      }
      // If none load, keep CSS gradients or stickers
    })();
  }

  /**
   * Setup responsive behavior: use outlined word stickers on small screens, candies on larger.
   */
  _setupResponsiveStickerMode(bg) {
    /* stickers disabled intentionally */
  }

  /**
   * Replace layer images with themed outlined word stickers (mobile small screens).
   */
  _useWordStickers() {
    /* no-op */
  }

  _maybeInsertWordStickers(bg) {
    /* no-op */
  }

  /**
   * Initialize Vanta.js animated background
   */
  initVanta() {}

  applyCSSGridBackground() {
    // Background is static; no dynamic updates needed now
  }

  /**
   * Update background effects based on game state
   */
  updateEffects(gameState) {
    const bg = document.getElementById("background");
    if (!bg) return;
    // No dynamic updates needed for static background
  }

  /**
   * Create particle effects for special events
   */
  createParticleEffect(type, options = {}) {
    switch (type) {
      case "success":
        this.createSuccessParticles(options);
        break;
      case "perfect":
        this.createPerfectParticles(options);
        break;
      case "highscore":
        this.createHighscoreParticles(options);
        break;
    }
  }

  /**
   * Create success particles
   */
  createSuccessParticles(options) {
    const colors = ["#4CAF50", "#8BC34A", "#CDDC39"];
    this.createParticles(15, colors, options);
  }

  /**
   * Create perfect game particles
   */
  createPerfectParticles(options) {
    const colors = ["#FFD700", "#FFA500", "#FF6347"];
    this.createParticles(25, colors, options);
  }

  /**
   * Create high score particles
   */
  createHighscoreParticles(options) {
    const colors = ["#ff6b6b", "#a5d8dd", "#275e66"];
    this.createParticles(40, colors, options);
  }

  /**
   * Generic particle creation function
   */
  createParticles(count, colors, options = {}) {
    const {
      duration = 3000,
      size = { min: 5, max: 15 },
      speed = { min: 2, max: 5 },
    } = options;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";

      // Random properties
      const color = colors[Math.floor(Math.random() * colors.length)];
      const particleSize = Math.random() * (size.max - size.min) + size.min;
      const animDuration = Math.random() * (speed.max - speed.min) + speed.min;

      // Styling
      particle.style.cssText = `
                position: fixed;
                width: ${particleSize}px;
                height: ${particleSize}px;
                background-color: ${color};
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                left: ${Math.random() * 100}vw;
                animation: particleFall ${animDuration}s linear forwards;
            `;

      document.body.appendChild(particle);

      // Remove particle after animation
      setTimeout(() => {
        if (particle.parentNode) {
          particle.remove();
        }
      }, duration);
    }
  }

  /**
   * Add screen shake effect
   */
  screenShake(intensity = 10, duration = 300) {
    const container = document.querySelector(".container");
    if (!container) return;

    container.style.animation = `shake ${duration}ms ease-in-out`;

    setTimeout(() => {
      container.style.animation = "";
    }, duration);
  }

  /**
   * Flash effect for the screen
   */
  screenFlash(color = "rgba(255, 255, 255, 0.3)", duration = 200) {
    const flash = document.createElement("div");
    flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: ${color};
            z-index: 9998;
            pointer-events: none;
            animation: flashEffect ${duration}ms ease-out forwards;
        `;

    document.body.appendChild(flash);

    setTimeout(() => {
      flash.remove();
    }, duration);
  }

  /**
   * Cleanup effects when game is destroyed
   */
  destroy() {
    // CSS background has nothing to destroy
  }
}

// Add CSS animations for effects
const effectsCSS = `
    @keyframes particleFall {
        to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }

    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-${10}px); }
        20%, 40%, 60%, 80% { transform: translateX(${10}px); }
    }

    @keyframes flashEffect {
        0% { opacity: 1; }
        100% { opacity: 0; }
    }
`;

// Inject CSS if it doesn't exist
if (!document.getElementById("effects-css")) {
  const style = document.createElement("style");
  style.id = "effects-css";
  style.textContent = effectsCSS;
  document.head.appendChild(style);
}

// Export for use in other modules
if (typeof window !== "undefined") {
  window.BackgroundEffects = BackgroundEffects;
}
