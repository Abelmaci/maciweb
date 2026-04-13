
import { SandCanvas } from './vanilla-sand.js';
import EmblaCarousel from 'embla-carousel';

document.addEventListener('DOMContentLoaded', () => {
  // --- Deferred Initialization for better LCP ---
  const initApp = () => {
    // --- Initialize Lucide Icons ---
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // --- SandCanvas Initialization ---
    const heroCanvas = document.getElementById('hero-canvas');
    if (heroCanvas) {
      const HERO_IMAGE = "images/Banner-MACI-optimized.jpg";
      new SandCanvas(heroCanvas, HERO_IMAGE);
    }
  };

  // Run initializations after splash screen is done or idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => initApp());
  } else {
    setTimeout(initApp, 100);
  }

  // --- Navigation Scroll Effect ---
  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.classList.add('bg-surface/95', 'backdrop-blur-md', 'py-3', 'shadow-lg');
      nav.classList.remove('bg-transparent', 'py-6');
    } else {
      nav.classList.remove('bg-surface/95', 'backdrop-blur-md', 'py-3', 'shadow-lg');
      nav.classList.add('bg-transparent', 'py-6');
    }
  });

  // --- Embla Carousel Initialization ---
  const emblaNode = document.querySelector('.embla');
  const dotContainer = document.querySelector('.embla__dots');
  
  if (emblaNode) {
    const emblaApi = EmblaCarousel(emblaNode, { 
      align: 'start',
      containScroll: 'trimSnaps',
      dragFree: false, // Changed to false for better snapping on mobile
      loop: true,
      skipSnaps: false
    });

    const updateDots = () => {
      const selectedIndex = emblaApi.selectedScrollSnap();
      const dots = dotContainer.querySelectorAll('.embla__dot');
      dots.forEach((dot, index) => {
        if (index === selectedIndex) {
          dot.classList.add('is-active');
        } else {
          dot.classList.remove('is-active');
        }
      });
    };

    const createDots = () => {
      const scrollSnaps = emblaApi.scrollSnapList();
      dotContainer.innerHTML = scrollSnaps
        .map((_, index) => `<button class="embla__dot" aria-label="Go to snap ${index + 1}"></button>`)
        .join('');
      
      const dots = dotContainer.querySelectorAll('.embla__dot');
      dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
          emblaApi.scrollTo(index);
          updateDots();
        });
      });
    };

    createDots();
    updateDots();
    
    // Smooth real-time tracking
    emblaApi.on('select', updateDots);
    emblaApi.on('scroll', updateDots);
    emblaApi.on('reInit', () => {
      createDots();
      updateDots();
    });

    // Auto Scroll removed as requested

    // Add horizontal scroll control for mouse wheel
    emblaNode.addEventListener('wheel', (event) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        event.preventDefault();
        if (event.deltaX > 0) {
          emblaApi.scrollNext();
        } else {
          emblaApi.scrollPrev();
        }
      }
    });
  }

  // --- Audio Preview Logic ---
  let currentAudio = null;
  const albumCards = document.querySelectorAll('.album-card');
  
  albumCards.forEach(card => {
    const audioUrl = card.dataset.audio;
    const id = card.dataset.id;
    const vinyl = card.querySelector('.vinyl-record');
    const overlay = card.querySelector('.info-overlay');
    const cover = card.querySelector('.album-cover');

    const handleEnter = () => {
      console.log("Entering card", id);
      
      // Stop and clean up any currently playing source
      if (currentAudio) {
        try { currentAudio.stop(); } catch(e) {}
        try { currentAudio.disconnect(); } catch(e) {}
        try { currentAudio.pause(); currentAudio.currentTime = 0; } catch(e) {}
        currentAudio = null;
      }
      
      // Wake up Web Audio Context if browser suspended it (e.g. Safari policy)
      if (window.audioCtx && window.audioCtx.state === 'suspended') {
        window.audioCtx.resume();
      }
      
      // Play directly from decoded memory buffer for 0ms latency
      if (window.audioCtx && window.audioBuffers && window.audioBuffers[audioUrl]) {
        currentAudio = window.audioCtx.createBufferSource();
        currentAudio.buffer = window.audioBuffers[audioUrl];
        
        // Volume control
        const gainNode = window.audioCtx.createGain();
        gainNode.gain.value = 0.5;
        
        currentAudio.connect(gainNode);
        gainNode.connect(window.audioCtx.destination);
        
        currentAudio.onended = () => {
          const vinyl = card.querySelector('.vinyl-record');
          if (vinyl) {
            vinyl.classList.remove('animate-spin-vinyl');
            void vinyl.offsetWidth; // Force reflow
            vinyl.classList.add('is-stopping');
          }
        };
        
        currentAudio.start(0);
      } else {
        // Bulletproof Fallback
        currentAudio = new Audio(audioUrl);
        currentAudio.volume = 0.5;
        currentAudio.onended = () => {
          const vinyl = card.querySelector('.vinyl-record');
          if (vinyl) {
            vinyl.classList.remove('animate-spin-vinyl');
            void vinyl.offsetWidth;
            vinyl.classList.add('is-stopping');
          }
        };
        const playPromise = currentAudio.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => console.error("Audio fallback play failed", e));
        }
      }
      
      vinyl.classList.remove('is-stopping');
      vinyl.classList.add('opacity-100', 'animate-spin-vinyl');
      vinyl.classList.remove('opacity-0');
      overlay.classList.add('opacity-100', 'translate-y-0');
      overlay.classList.remove('opacity-0', 'translate-y-5');
      cover.classList.add('-translate-x-full');
      card.classList.add('is-active'); // To hide touch hint
    };

    const handleLeave = () => {
      if (currentAudio) {
        try { currentAudio.stop(); } catch(e) {}
        try { currentAudio.disconnect(); } catch(e) {}
        try { currentAudio.pause(); currentAudio.currentTime = 0; } catch(e) {}
        currentAudio = null;
      }
      vinyl.classList.remove('opacity-100', 'animate-spin-vinyl', 'is-stopping');
      vinyl.classList.add('opacity-0');
      overlay.classList.remove('opacity-100', 'translate-y-0');
      overlay.classList.add('opacity-0', 'translate-y-5');
      cover.classList.remove('-translate-x-full');
      card.classList.remove('is-active');
    };

    card.addEventListener('mouseenter', handleEnter);
    card.addEventListener('mouseleave', handleLeave);
    
    // Mobile Support: Only trigger when clicking the specific touch hint button
    const touchBtn = card.querySelector('.mobile-touch-btn');
    if (touchBtn) {
      touchBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card-level events
        if (!card.classList.contains('is-active')) {
          handleEnter();
        } else {
          handleLeave();
        }
      });
    }

    // Also toggle off if clicking the overlay while active
    overlay.addEventListener('click', () => {
      if (card.classList.contains('is-active')) {
        handleLeave();
      }
    });
  });



  // --- Intersection Observer for Animations ---
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        // Add a slight staggered delay based on appearance order
        setTimeout(() => {
          entry.target.classList.add('animate-in');
        }, 100); 
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // --- Parallax Effects (Simple Version) ---
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    
    // Hero Parallax
    const heroContent = document.querySelector('#inicio .max-w-7xl');
    if (heroContent) {
      heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
      heroContent.style.opacity = 1 - (scrolled / 700);
    }

    // Bio Parallax
    document.querySelectorAll('.bio-data-text').forEach(bioData => {
      const bioRect = bioData.parentElement.getBoundingClientRect();
      if (bioRect.top < window.innerHeight && bioRect.bottom > 0) {
        const progress = (window.innerHeight - bioRect.top) / (window.innerHeight + bioRect.height);
        bioData.style.transform = `translateY(${(progress - 0.5) * 200}px)`;
      }
    });
  });
});
