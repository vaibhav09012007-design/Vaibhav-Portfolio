/**
 * Deep Space Portfolio - Main Script v2.0
 * Handles the Starfield background, page transitions, and interactions.
 */

class Starfield {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.stars = [];
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.animationFrame = null;
    this.isWarping = false;
    this.warpProgress = 0;
    this.warpDuration = 400;
    this.warpStartTime = null;

    this.init();
  }

  init() {
    this.setupCanvas();
    this.createStars();
    this.animate();

    // Debounced resize to improve performance
    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => this.handleResize(), 200);
    });
  }

  setupCanvas() {
    this.canvas.style.position = "fixed";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.zIndex = "-1";
    this.canvas.style.pointerEvents = "none";

    // Replace the CSS background with this canvas
    const oldBg = document.querySelector(".space-background");
    if (oldBg) oldBg.replaceWith(this.canvas);
    else document.body.prepend(this.canvas);

    this.resizeCanvas();
  }

  resizeCanvas() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  handleResize() {
    this.resizeCanvas();
    this.stars = [];
    this.createStars();
  }

  createStars() {
    const starCount = Math.floor((this.width * this.height) / 3000);

    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 1.5,
        opacity: Math.random(),
        baseOpacity: Math.random() * 0.5 + 0.5,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        twinkleOffset: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.2 + 0.05,
      });
    }
  }

  warp() {
    this.isWarping = true;
    this.warpStartTime = performance.now();
  }

  // Easing function for smooth acceleration
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw background gradient (Deep Space)
    const gradient = this.ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      0,
      this.width / 2,
      this.height / 2,
      this.width
    );
    gradient.addColorStop(0, "#030014");
    gradient.addColorStop(1, "#000000");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Update and draw stars
    this.ctx.fillStyle = "#FFFFFF";

    // Calculate warp multiplier with easing
    let warpMultiplier = 1;
    if (this.isWarping && this.warpStartTime) {
      const elapsed = performance.now() - this.warpStartTime;
      const progress = Math.min(elapsed / this.warpDuration, 1);
      warpMultiplier = 1 + this.easeInOutCubic(progress) * 49;
    }

    const time = performance.now() * 0.001;

    this.stars.forEach((star) => {
      // Twinkling effect
      const twinkle =
        Math.sin(time * star.twinkleSpeed * 100 + star.twinkleOffset) * 0.3 +
        0.7;
      this.ctx.globalAlpha = star.baseOpacity * twinkle;
      this.ctx.beginPath();

      // Vertical stretch for warp effect
      if (this.isWarping) {
        const stretchFactor = 1 + (warpMultiplier - 1) * 0.4;
        this.ctx.rect(star.x, star.y, star.size, star.size * stretchFactor);
      } else {
        this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      }
      this.ctx.fill();

      // Move star upward with warp multiplier
      const currentSpeed = star.speed * warpMultiplier;
      star.y -= currentSpeed;

      // Reset if out of bounds
      if (star.y < 0) {
        star.y = this.height;
        star.x = Math.random() * this.width;
      }
    });

    this.animationFrame = requestAnimationFrame(() => this.animate());
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // 1. Loading State
  initLoadingState();

  // 2. Starfield
  if (
    !window.matchMedia ||
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    window.starfield = new Starfield();
  }

  // 3. Page Transitions
  initPageTransitions();

  // 4. Scroll Indicator
  initScrollIndicator();

  // 5. Project Modals
  initProjectModals();

  // 6. Mobile Navigation
  initMobileMenu();

  // 7. Scroll Reveal
  initScrollReveal();

  // 8. Planet Interactions
  initPlanetInteractions();

  // 9. Footer Year
  initFooterYear();

  // 10. Back to Top Button
  initBackToTop();

  // 11. Active Nav Highlighter
  initActiveNavHighlighter();

  // Console Welcome
  console.log(
    "%c :: SYSTEM ONLINE :: ",
    "background: #030014; color: #00F0FF; padding: 10px; border: 1px solid #00F0FF; border-radius: 4px; font-family: monospace;"
  );
});

/**
 * Loading State
 * Handles the initial loading screen.
 */
function initLoadingState() {
  const loader = document.getElementById("loading-screen");
  if (!loader) return;

  // Simulate loading or wait for window load
  window.addEventListener("load", () => {
    setTimeout(() => {
      loader.classList.add("hidden");
      // Clean up from DOM after transition
      setTimeout(() => {
        loader.style.display = "none";
      }, 500);
    }, 800);
  });
}

/**
 * Scroll Reveal Animation
 */
function initScrollReveal() {
  const elements = document.querySelectorAll(".reveal-on-scroll");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -50px 0px",
    }
  );

  elements.forEach((el) => observer.observe(el));
}

/**
 * Scroll Indicator
 */
function initScrollIndicator() {
  const indicator = document.querySelector(".scroll-indicator");
  if (!indicator) return;

  let hasScrolled = false;

  window.addEventListener(
    "scroll",
    () => {
      if (!hasScrolled && window.scrollY > 100) {
        hasScrolled = true;
        indicator.classList.add("hidden");
      } else if (hasScrolled && window.scrollY <= 100) {
        hasScrolled = false;
        indicator.classList.remove("hidden");
      }
    },
    { passive: true }
  );
}

/**
 * Back to Top Button
 */
function initBackToTop() {
  const btn = document.getElementById("back-to-top");
  if (!btn) return;

  const toggleBtn = () => {
    if (window.scrollY > 500) {
      btn.removeAttribute("hidden");
    } else {
      btn.setAttribute("hidden", "");
    }
  };

  window.addEventListener("scroll", toggleBtn, { passive: true });

  btn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

/**
 * Active Nav Highlighter
 * Highlights the current section in the nav.
 */
function initActiveNavHighlighter() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link");

  // Only run on home page
  if (window.location.pathname !== "/" && !window.location.pathname.endsWith("index.html")) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          navLinks.forEach((link) => {
            link.classList.remove("active");
            if (link.getAttribute("href").includes(`#${id}`)) {
              link.classList.add("active");
            }
          });
        }
      });
    },
    {
      threshold: 0.5
    }
  );

  sections.forEach((section) => observer.observe(section));
}

/**
 * Smooth Page Transitions
 */
function initPageTransitions() {
  const links = document.querySelectorAll("a[href]");

  links.forEach((link) => {
    const href = link.getAttribute("href");

    if (href && href.startsWith("#")) return;

    const isInternal =
      href &&
      !href.startsWith("mailto") &&
      !href.startsWith("tel") &&
      !href.startsWith("http") &&
      !link.hasAttribute("target");

    if (isInternal) {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        if (window.starfield) window.starfield.warp();
        document.body.classList.add("page-exit");
        setTimeout(() => {
          window.location.href = href;
        }, 400);
      });
    }
  });
}

/**
 * Project Modals
 */
function initProjectModals() {
  const modal = document.getElementById("project-modal");
  // Only proceed if modal exists on this page
  if (!modal) return;

  const modalTitle = document.getElementById("modal-title");
  const modalStack = document.getElementById("modal-stack");
  const modalBody = document.getElementById("modal-body");
  const modalLinks = document.getElementById("modal-links");
  const closeBtn = modal.querySelector(".modal-close");

  const projectData = {
    "Mind-Sync": {
      stack: "REACT • NODE.JS • AI • WELLNESS",
      description: `
        <p><strong>Overview:</strong> An AI-powered mental wellness and productivity application designed to help users maintain mental clarity and work-life balance.</p>
        <br>
        <p><strong>Key Features:</strong></p>
        <ul style="margin-left: 20px; margin-top: 10px;">
          <li>Mood tracking and analysis</li>
          <li>Personalized AI insights</li>
          <li>Guided meditation sessions</li>
          <li>Smart scheduling and productivity tools</li>
        </ul>
      `,
      links: [
        { text: "GitHub", url: "https://github.com/vaibhav09012007-design/Mind-Sync" }
      ]
    },
    Nexus: {
      stack: "GAMING • COMMUNITY • WEB3",
      description: `
        <p><strong>Overview:</strong> A next-generation gaming hub connecting players and developers with real-time tournaments and asset trading.</p>
        <br>
        <p><strong>Key Features:</strong></p>
        <ul style="margin-left: 20px; margin-top: 10px;">
          <li>Real-time multiplayer matchmaking</li>
          <li>Community engagement tools</li>
          <li>Digital asset marketplace</li>
        </ul>
      `,
      status: "coming-soon",
    }
  };

  // Click handler delegation for better performance
  const projectsContainer = document.querySelector(".projects-grid");
  if (projectsContainer) {
    projectsContainer.addEventListener("click", (e) => {
      const card = e.target.closest(".card");
      if (!card || e.target.tagName === "A") return;

      const projectKey = card.dataset.project;
      const data = projectData[projectKey];

      if (data) {
        modalTitle.textContent = projectKey;
        modalStack.textContent = data.stack;
        modalBody.innerHTML = data.description;

        // Build links
        let linksHtml = "";
        if (data.links) {
          data.links.forEach(link => {
            linksHtml += `<a href="${link.url}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">${link.text} &rarr;</a>`;
          });
        }
        modalLinks.innerHTML = linksHtml;

        modal.classList.add("active");
        document.body.style.overflow = "hidden";

        // Trap focus inside modal for accessibility
        closeBtn.focus();
      }
    });
  }

  // Close modal logic
  const closeModal = () => {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  };

  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

/**
 * Mobile Navigation Menu
 */
function initMobileMenu() {
  const menuToggle = document.querySelector(".mobile-menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (!menuToggle || !navLinks) return;

  menuToggle.addEventListener("click", () => {
    const isActive = menuToggle.classList.toggle("active");
    navLinks.classList.toggle("active");
    menuToggle.setAttribute("aria-expanded", isActive);
    document.body.style.overflow = isActive ? "hidden" : "";
  });

  navLinks.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.classList.remove("active");
      navLinks.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });

  document.addEventListener("click", (e) => {
    if (!menuToggle.contains(e.target) && !navLinks.contains(e.target) && navLinks.classList.contains("active")) {
      menuToggle.classList.remove("active");
      navLinks.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
  });
}

/**
 * Planet Interactions
 */
function initPlanetInteractions() {
  const planets = document.querySelectorAll('.planet');
  const skillsSection = document.getElementById('skills');

  if (!planets.length || !skillsSection) return;

  planets.forEach(planet => {
    planet.addEventListener('click', (e) => {
      e.stopPropagation();
      skillsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

      const cards = skillsSection.querySelectorAll('.skill-card');
      cards.forEach(card => {
        card.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
        const originalBorder = card.style.borderColor;
        const originalShadow = card.style.boxShadow;

        card.style.borderColor = 'var(--accent-cyan)';
        card.style.boxShadow = '0 0 30px rgba(0, 240, 255, 0.3)';

        setTimeout(() => {
            card.style.borderColor = originalBorder;
            card.style.boxShadow = originalShadow;
        }, 1500);
      });
    });
  });
}

/**
 * Dynamic Footer Year
 */
function initFooterYear() {
    const footer = document.querySelector('footer');
    if (!footer) return;

    const yearEl = footer.querySelector('time') || footer.querySelector('p');
    if (yearEl) {
        const currentYear = new Date().getFullYear();
        if (yearEl.tagName === 'TIME') {
            yearEl.dateTime = currentYear;
            yearEl.textContent = currentYear;
        } else if (yearEl.textContent.includes('2026')) {
             yearEl.innerHTML = yearEl.innerHTML.replace(/\d{4}/, currentYear);
        }
    }
}
