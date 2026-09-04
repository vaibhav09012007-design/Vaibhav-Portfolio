/**
 * Vaibhav Tiwari — Portfolio Core Interactions
 * Exact reference implementation mechanics:
 * 1. Pull-cord theme toggle with WebAudio synthesized click & spring return
 * 2. Smooth spring-lagging cursor with velocity rotation & scale
 * 3. Theme color meta tag sync & localStorage persistence
 * 4. Responsive mobile drawer & keyboard accessibility
 * Zero console errors, pure standards-compliant JS.
 */

(function () {
  "use strict";

  // Preferences & Capabilities
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ==========================================================================
     1. WEBAUDIO MECHANICAL CLICK SYNTHESIZER (ZERO EXTERNAL AUDIO FILES)
     ========================================================================== */
  let audioCtx = null;

  function playClickSound() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioCtx) {
        audioCtx = new AudioContextClass();
      }

      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      const t = audioCtx.currentTime;

      // 1. High-frequency transient click burst
      const sampleRate = audioCtx.sampleRate;
      const bufferLength = Math.floor(sampleRate * 0.018); // ~18ms
      const noiseBuffer = audioCtx.createBuffer(1, bufferLength, sampleRate);
      const output = noiseBuffer.getChannelData(0);

      for (let i = 0; i < bufferLength; i++) {
        const decay = Math.exp(-i / (bufferLength * 0.22));
        output[i] = (Math.random() * 2 - 1) * decay;
      }

      const noiseSource = audioCtx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      // Bandpass filter to shape crisp mechanical snap
      const filter = audioCtx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1800, t);
      filter.Q.setValueAtTime(4.2, t);

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.024);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      noiseSource.start(t);
      noiseSource.stop(t + 0.025);

      // 2. Subtle low resonance body
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.02);

      oscGain.gain.setValueAtTime(0.16, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

      osc.connect(oscGain);
      oscGain.connect(audioCtx.destination);

      osc.start(t);
      osc.stop(t + 0.022);
    } catch (err) {
      // Audio autoplay blocked or unsupported — fail gracefully
    }
  }

  /* ==========================================================================
     2. THEME ENGINE (ZINC PALETTE & META THEME-COLOR)
     ========================================================================== */
  const META_THEME_COLORS = {
    light: "#ffffff",
    dark: "#09090b",
  };

  function getCurrentTheme() {
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  }

  function applyTheme(theme, playSound = false) {
    if (playSound) {
      playClickSound();
    }

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Update meta theme-color tag
    let metaTag = document.querySelector('meta[name="theme-color"]');
    if (!metaTag) {
      metaTag = document.createElement("meta");
      metaTag.name = "theme-color";
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute("content", META_THEME_COLORS[theme]);

    // Persist to localStorage
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {
      // LocalStorage quota or access denied
    }

    // Update buttons
    const cordBtn = document.getElementById("pullcord");
    if (cordBtn) {
      cordBtn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    }

    const mobileBtn = document.getElementById("mobile-theme-toggle");
    if (mobileBtn) {
      mobileBtn.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} theme`);
      updateMobileThemeIcon(mobileBtn, theme);
    }
  }

  function updateMobileThemeIcon(btn, theme) {
    if (theme === "dark") {
      // Sun icon
      btn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2v2"></path>
          <path d="M12 20v2"></path>
          <path d="m4.93 4.93 1.41 1.41"></path>
          <path d="m17.66 17.66 1.41 1.41"></path>
          <path d="M2 12h2"></path>
          <path d="M20 12h2"></path>
          <path d="m6.34 17.66-1.41 1.41"></path>
          <path d="m19.07 4.93-1.41 1.41"></path>
        </svg>
      `;
    } else {
      // Moon icon
      btn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
        </svg>
      `;
    }
  }

  function toggleTheme() {
    const current = getCurrentTheme();
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next, true);
  }

  /* ==========================================================================
     3. PULL-CORD THEME TOGGLE WITH SPRING PHYSICS & HINT
     ========================================================================== */
  function initPullCord() {
    const cordContainer = document.getElementById("pullcord");
    const cordLine = document.getElementById("pullcord-line");
    const cordKnobGroup = document.getElementById("pullcord-knob");
    const cordHint = document.getElementById("cord-hint");

    if (!cordContainer || !cordLine || !cordKnobGroup) return;

    const REST_Y = 172;
    const PULL_THRESHOLD = 50;
    let currentY = REST_Y;
    let isDragging = false;
    let startPointerY = 0;
    let didExceedThreshold = false;
    let springRaf = null;

    function setVisualY(y) {
      currentY = y;
      cordLine.setAttribute("y2", String(y));
      cordKnobGroup.setAttribute("transform", `translate(16, ${y})`);
    }

    // Set initial resting position
    setVisualY(REST_Y);

    function hideHint() {
      if (cordHint && !cordHint.classList.contains("is-hidden")) {
        cordHint.classList.add("is-hidden");
      }
    }

    function animateSpringReturn(onComplete) {
      if (springRaf) cancelAnimationFrame(springRaf);

      let pos = currentY;
      let vel = 0;
      const target = REST_Y;
      const k = 0.18; // spring stiffness
      const damping = 0.78; // oscillation damping

      function tick() {
        const force = -k * (pos - target);
        vel = (vel + force) * damping;
        pos += vel;

        setVisualY(pos);

        if (Math.abs(pos - target) < 0.12 && Math.abs(vel) < 0.12) {
          setVisualY(REST_Y);
          springRaf = null;
          if (onComplete) onComplete();
        } else {
          springRaf = requestAnimationFrame(tick);
        }
      }

      springRaf = requestAnimationFrame(tick);
    }

    // Pointer events on knob
    cordContainer.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 && e.button !== undefined) return;
      isDragging = true;
      startPointerY = e.clientY;
      didExceedThreshold = false;

      if (springRaf) {
        cancelAnimationFrame(springRaf);
        springRaf = null;
      }

      try {
        cordContainer.setPointerCapture(e.pointerId);
      } catch (err) {}
    });

    cordContainer.addEventListener("pointermove", (e) => {
      if (!isDragging) return;

      const delta = e.clientY - startPointerY;

      // Calculate downward pull with elastic resistance
      let pull = 0;
      if (delta > 0) {
        pull = delta < 60 ? delta : 60 + (delta - 60) * 0.45;
        pull = Math.min(130, pull);
      } else {
        pull = Math.max(-12, delta * 0.2);
      }

      const newY = REST_Y + pull;
      setVisualY(newY);

      if (pull >= PULL_THRESHOLD) {
        didExceedThreshold = true;
      }
    });

    function endDrag(e) {
      if (!isDragging) return;
      isDragging = false;

      try {
        cordContainer.releasePointerCapture(e.pointerId);
      } catch (err) {}

      const pulledDistance = currentY - REST_Y;

      if (pulledDistance >= PULL_THRESHOLD || didExceedThreshold) {
        toggleTheme();
        hideHint();
      }

      animateSpringReturn();
    }

    cordContainer.addEventListener("pointerup", endDrag);
    cordContainer.addEventListener("pointercancel", endDrag);

    // Click trigger (simple tap without dragging)
    cordContainer.addEventListener("click", () => {
      if (didExceedThreshold) return;
      hideHint();
      // Animate pull down and return
      let step = 0;
      function animateClickPull() {
        step++;
        if (step <= 6) {
          setVisualY(REST_Y + step * 8);
          requestAnimationFrame(animateClickPull);
        } else {
          toggleTheme();
          animateSpringReturn();
        }
      }
      animateClickPull();
    });

    // Keyboard support (Enter / Space)
    cordContainer.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        hideHint();
        let step = 0;
        function animateKeyPull() {
          step++;
          if (step <= 6) {
            setVisualY(REST_Y + step * 8);
            requestAnimationFrame(animateKeyPull);
          } else {
            toggleTheme();
            animateSpringReturn();
          }
        }
        animateKeyPull();
      }
    });

    // Mobile theme toggle button
    const mobileToggle = document.getElementById("mobile-theme-toggle");
    if (mobileToggle) {
      mobileToggle.addEventListener("click", () => {
        toggleTheme();
      });
    }
  }

  /* ==========================================================================
     4. SMOOTH SPRING CURSOR (FINE POINTERS ONLY, DISABLED ON TOUCH/REDUCED MOTION)
     ========================================================================== */
  function initSmoothCursor() {
    if (!isFinePointer || prefersReducedMotion) return;

    // Enable custom cursor mode
    document.body.classList.add("cursor-none", "has-smooth-cursor");

    // Create cursor DOM element
    const cursorEl = document.createElement("div");
    cursorEl.className = "smooth-cursor";
    cursorEl.setAttribute("aria-hidden", "true");

    // Exact SVG pointer arrow from reference
    cursorEl.innerHTML = `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="50"
        height="54"
        viewBox="0 0 50 54"
        fill="none"
        style="transform: scale(0.5); transform-origin: 0 0;"
      >
        <g filter="url(#cursor-shadow-filter)">
          <path
            d="M42.6817 41.1495L27.5103 6.79925C26.7269 5.02557 24.2082 5.02558 23.3927 6.79925L7.59814 41.1495C6.75833 42.9759 8.52712 44.8902 10.4125 44.1954L24.3757 39.0496C24.8829 38.8627 25.4385 38.8627 25.9422 39.0496L39.8121 44.1954C41.6849 44.8902 43.4884 42.9759 42.6817 41.1495Z"
            fill="black"
          />
          <path
            d="M43.7146 40.6933L28.5431 6.34306C27.3556 3.65428 23.5772 3.69516 22.3668 6.32755L6.57226 40.6778C5.3134 43.4156 7.97238 46.298 10.803 45.2549L24.7662 40.109C25.0221 40.0147 25.2999 40.0156 25.5494 40.1082L39.4193 45.254C42.2261 46.2953 44.9254 43.4347 43.7146 40.6933Z"
            stroke="white"
            stroke-width="2.25825"
          />
        </g>
        <defs>
          <filter
            id="cursor-shadow-filter"
            x="0.6"
            y="0.9"
            width="49"
            height="52.4"
            filterUnits="userSpaceOnUse"
            color-interpolation-filters="sRGB"
          >
            <feDropShadow dx="0" dy="2.25" stdDeviation="2.25" flood-opacity="0.25" />
          </filter>
        </defs>
      </svg>
    `;

    document.body.appendChild(cursorEl);

    // Spring state
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    let prevMouseX = targetX;
    let prevMouseY = targetY;
    let lastTime = performance.now();

    let targetRotation = 0;
    let currentRotation = 0;
    let previousAngle = 0;
    let accumulatedRotation = 0;

    let targetScale = 1;
    let currentScale = 1;
    let idleTimeout = null;

    function onMouseMove(e) {
      targetX = e.clientX;
      targetY = e.clientY;

      const now = performance.now();
      const dt = now - lastTime;

      if (dt > 0) {
        const vx = (targetX - prevMouseX) / dt;
        const vy = (targetY - prevMouseY) / dt;
        const speed = Math.hypot(vx, vy);

        if (speed > 0.08) {
          const rawAngle = Math.atan2(vy, vx) * (180 / Math.PI) + 90;
          let angleDiff = rawAngle - previousAngle;
          if (angleDiff > 180) angleDiff -= 360;
          if (angleDiff < -180) angleDiff += 360;

          accumulatedRotation += angleDiff;
          targetRotation = accumulatedRotation;
          previousAngle = rawAngle;

          targetScale = 0.95;

          if (idleTimeout) clearTimeout(idleTimeout);
          idleTimeout = setTimeout(() => {
            targetScale = 1;
          }, 140);
        }
      }

      prevMouseX = targetX;
      prevMouseY = targetY;
      lastTime = now;
    }

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    document.addEventListener("mouseleave", () => {
      cursorEl.style.opacity = "0";
    });

    document.addEventListener("mouseenter", () => {
      cursorEl.style.opacity = "1";
    });

    // Spring loop
    const POS_SMOOTH = 0.28;
    const ROT_SMOOTH = 0.22;
    const SCALE_SMOOTH = 0.25;

    function animateCursor() {
      currentX += (targetX - currentX) * POS_SMOOTH;
      currentY += (targetY - currentY) * POS_SMOOTH;
      currentRotation += (targetRotation - currentRotation) * ROT_SMOOTH;
      currentScale += (targetScale - currentScale) * SCALE_SMOOTH;

      cursorEl.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%) rotate(${currentRotation}deg) scale(${currentScale})`;

      requestAnimationFrame(animateCursor);
    }

    requestAnimationFrame(animateCursor);
  }

  /* ==========================================================================
     5. MOBILE DRAWER & KEYBOARD NAVIGATION
     ========================================================================== */
  function initMobileNav() {
    const toggleBtn = document.querySelector(".mobile-nav-toggle");
    const drawer = document.querySelector(".mobile-drawer");
    if (!toggleBtn || !drawer) return;

    function openDrawer() {
      drawer.classList.add("is-open");
      toggleBtn.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }

    function closeDrawer() {
      drawer.classList.remove("is-open");
      toggleBtn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }

    toggleBtn.addEventListener("click", () => {
      const isOpen = drawer.classList.contains("is-open");
      if (isOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    // Close on link click
    drawer.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        closeDrawer();
      });
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && drawer.classList.contains("is-open")) {
        closeDrawer();
      }
    });
  }

  /* ==========================================================================
     6. INITIALIZATION
     ========================================================================== */
  document.addEventListener("DOMContentLoaded", () => {
    // 1. Initial theme synchronization
    const savedTheme = localStorage.getItem("theme");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (systemDark ? "dark" : "light");
    applyTheme(initialTheme, false);

    // Listen for OS theme changes if user hasn't explicitly set one
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      if (!localStorage.getItem("theme")) {
        applyTheme(e.matches ? "dark" : "light", false);
      }
    });

    // 2. Initialize pull-cord theme toggle
    initPullCord();

    // 3. Initialize smooth cursor
    initSmoothCursor();

    // 4. Initialize mobile navigation
    initMobileNav();
  });
})();
