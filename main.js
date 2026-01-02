/**
 * Deep Space Portfolio - Main Script
 * Handles the Starfield background, page transitions, and interactions.
 */

class Starfield {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
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
    
    window.addEventListener('resize', () => this.handleResize());
  }

  setupCanvas() {
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.zIndex = '-1';
    this.canvas.style.pointerEvents = 'none';
    
    // Replace the CSS background with this canvas
    const oldBg = document.querySelector('.space-background');
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
        speed: Math.random() * 0.2 + 0.05
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
      this.width / 2, this.height / 2, 0,
      this.width / 2, this.height / 2, this.width
    );
    gradient.addColorStop(0, '#030014');
    gradient.addColorStop(1, '#000000');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Update and draw stars
    this.ctx.fillStyle = '#FFFFFF';
    
    // Calculate warp multiplier with easing
    let warpMultiplier = 1;
    if (this.isWarping && this.warpStartTime) {
      const elapsed = performance.now() - this.warpStartTime;
      const progress = Math.min(elapsed / this.warpDuration, 1);
      warpMultiplier = 1 + this.easeInOutCubic(progress) * 49;
    }
    
    const time = performance.now() * 0.001;
    
    this.stars.forEach(star => {
      // Twinkling effect
      const twinkle = Math.sin(time * star.twinkleSpeed * 100 + star.twinkleOffset) * 0.3 + 0.7;
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
document.addEventListener('DOMContentLoaded', () => {
  // Store instance globally so page transitions can trigger warp
  window.starfield = new Starfield();
  
  // Page Transition Handler
  initPageTransitions();
  
  // Scroll Indicator Handler
  initScrollIndicator();
  
  // Project Modals
  initProjectModals();
  
  // Mobile Navigation Menu
  initMobileMenu();
  
  // Console Welcome Message
  console.log(
    '%c :: SYSTEM ONLINE :: ',
    'background: #030014; color: #00F0FF; padding: 10px; border: 1px solid #00F0FF; border-radius: 4px; font-family: monospace;'
  );
});

/**
 * Scroll Indicator
 * Hides the scroll indicator once the user scrolls down.
 */
function initScrollIndicator() {
  const indicator = document.querySelector('.scroll-indicator');
  if (!indicator) return;
  
  let hasScrolled = false;
  
  window.addEventListener('scroll', () => {
    if (!hasScrolled && window.scrollY > 100) {
      hasScrolled = true;
      indicator.classList.add('hidden');
    } else if (hasScrolled && window.scrollY <= 100) {
      hasScrolled = false;
      indicator.classList.remove('hidden');
    }
  }, { passive: true });
}

/**
 * Smooth Page Transitions
 * Intercepts internal link clicks and adds a fade-out animation before navigating.
 */
function initPageTransitions() {
  const links = document.querySelectorAll('a[href]');
  
  links.forEach(link => {
    const href = link.getAttribute('href');
    
    // Skip anchor links - let browser handle smooth scrolling
    if (href && href.startsWith('#')) {
      return;
    }
    
    const isInternal = href && 
      !href.startsWith('mailto') && 
      !href.startsWith('tel') &&
      !href.startsWith('http') &&
      !link.hasAttribute('target');
    
    if (isInternal) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // 1. Engage Warp Drive
        if (window.starfield) window.starfield.warp();
        
        // 2. Add exit animation class (Fade out content)
        document.body.classList.add('page-exit');
        
        // 3. Navigate after animation completes
        setTimeout(() => {
          window.location.href = href;
        }, 400);
      });
    }
  });
}

/**
 * Project Modals
 * Clicking project cards opens a modal with expanded project details.
 */
function initProjectModals() {
  const modal = document.getElementById('project-modal');
  if (!modal) return;
  
  const modalTitle = document.getElementById('modal-title');
  const modalStack = document.getElementById('modal-stack');
  const modalBody = document.getElementById('modal-body');
  const modalLinks = document.getElementById('modal-links');
  const closeBtn = modal.querySelector('.modal-close');
  
  // Project data
  const projectData = {
    'Nexus': {
      stack: 'GAMING • COMMUNITY • WEB3',
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
      status: 'coming-soon'
    },
    'AI File Converter': {
      stack: 'PYTHON • REACT • FILE PROCESSING',
      description: `
        <p><strong>Overview:</strong> Intelligent file transformation tool capable of high-fidelity format conversions.</p>
        <br>
        <p><strong>Key Features:</strong></p>
        <ul style="margin-left: 20px; margin-top: 10px;">
          <li>Supports multiple document formats</li>
          <li>Preserves formatting and layout</li>
          <li>Clean, intuitive user interface</li>
        </ul>
      `,
      status: 'coming-soon'
    },
    'Crypto Wallet': {
      stack: 'BLOCKCHAIN • NODE.JS • SECURITY',
      description: `
        <p><strong>Overview:</strong> Secure digital wallet for managing cryptocurrency assets with multi-chain support.</p>
        <br>
        <p><strong>Key Features:</strong></p>
        <ul style="margin-left: 20px; margin-top: 10px;">
          <li>Multi-chain cryptocurrency support</li>
          <li>Biometric security authentication</li>
          <li>Intuitive asset management dashboard</li>
        </ul>
      `,
      status: 'coming-soon'
    }
  };
  
  // Make project cards clickable
  const projectCards = document.querySelectorAll('#projects .card');
  projectCards.forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
      // Don't open modal if clicking a link inside the card
      if (e.target.tagName === 'A') return;
      
      const projectKey = card.dataset.project;
      const data = projectData[projectKey];
      
      if (data) {
        modalTitle.textContent = projectKey;
        modalStack.textContent = data.stack;
        modalBody.innerHTML = data.description;
        
        // Build links
        let linksHtml = '';
        if (data.demo) linksHtml += `<a href="${data.demo}" class="btn btn-primary" target="_blank">Live Demo →</a>`;
        if (data.github) linksHtml += `<a href="${data.github}" class="btn btn-secondary" target="_blank">GitHub →</a>`;
        modalLinks.innerHTML = linksHtml;
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });
  
  // Close modal
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
  
  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/**
 * Mobile Navigation Menu
 * Handles the hamburger menu toggle for mobile/tablet screens.
 */
function initMobileMenu() {
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (!menuToggle || !navLinks) return;
  
  // Toggle mobile menu
  menuToggle.addEventListener('click', () => {
    const isActive = menuToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
    menuToggle.setAttribute('aria-expanded', isActive);
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = isActive ? 'hidden' : '';
  });
  
  // Close menu when clicking a nav link
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      navLinks.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
      menuToggle.classList.remove('active');
      navLinks.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
  
  // Close menu on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('active')) {
      menuToggle.classList.remove('active');
      navLinks.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
}
