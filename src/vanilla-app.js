
import { SandCanvas } from './vanilla-sand.js';
import EmblaCarousel from 'embla-carousel';
import Autoplay from 'embla-carousel-autoplay';

document.addEventListener('DOMContentLoaded', () => {
  // --- Deferred Initialization for better LCP ---
  const initApp = () => {
    // --- Initialize Lucide Icons ---
    if (window.lucide) {
      // Targeted icon creation instead of full-DOM scan to save Main Thread work
      const containers = ['nav', '#inicio', '.embla', 'footer'];
      containers.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) window.lucide.createIcons({ props: {}, attrs: {}, root: el });
      });
    }

    // --- SandCanvas Initialization ---
    const heroCanvas = document.getElementById('hero-canvas');
    if (heroCanvas) {
      const HERO_IMAGE = "images/Banner-MACI-optimized.webp";
      new SandCanvas(heroCanvas, HERO_IMAGE);
    }
  };

  // Run initializations ONLY after the splash screen is fully faded (e.g. 800ms)
  // this prevents the heavy particle engine from competing with the splash animation.
  setTimeout(initApp, 800);

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
    const autoplay = Autoplay({ 
      delay: 5000, 
      stopOnInteraction: true, 
      stopOnMouseEnter: false 
    });

    const emblaApi = EmblaCarousel(emblaNode, { 
      align: 'start',
      containScroll: 'trimSnaps',
      dragFree: false, // Changed to false for better snapping on mobile
      loop: true,
      skipSnaps: false
    }, [autoplay]);

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
      
      // Ensure AudioContext is ready before playback (fail-safe resumption)
      if (window.audioCtx) {
        if (window.audioCtx.state === 'suspended') {
          window.audioCtx.resume().catch(e => console.warn('AudioContext resume failed:', e));
        }
        
        // Try Web Audio API first (lower latency, better control)
        if (window.audioBuffers && window.audioBuffers[audioUrl]) {
          try {
            currentAudio = window.audioCtx.createBufferSource();
            currentAudio.buffer = window.audioBuffers[audioUrl];
            
            // Volume control
            const gainNode = window.audioCtx.createGain();
            gainNode.gain.value = 0.5;
            
            currentAudio.connect(gainNode);
            gainNode.connect(window.audioCtx.destination);
            
            currentAudio.onended = () => {
              const disc = card.querySelector('.vinyl-disc');
              if (disc) {
                disc.classList.remove('animate-spin-vinyl');
                requestAnimationFrame(() => {
                  disc.classList.add('is-stopping');
                });
              }
            };
            
            currentAudio.start(0);
            
            // Update UI for Web Audio success
            const disc = card.querySelector('.vinyl-disc');
            if (disc) {
              disc.classList.remove('is-stopping');
              disc.classList.add('animate-spin-vinyl');
            }
            vinyl.classList.remove('is-stopping');
            vinyl.classList.add('opacity-100');
            vinyl.classList.remove('opacity-0');
            overlay.classList.add('opacity-100', 'translate-y-0');
            overlay.classList.remove('opacity-0', 'translate-y-5');
            cover.classList.add('-translate-x-full');
            card.classList.add('is-active');
            return; // Web Audio success, exit early
          } catch (e) {
            console.warn('Web Audio playback failed, falling back to HTML Audio:', e);
            // Fall through to HTML Audio fallback
          }
        }
      }
      
      // Fallback to HTML5 Audio
      currentAudio = new Audio(audioUrl);
      currentAudio.volume = 0.5;
      currentAudio.onended = () => {
        const disc = card.querySelector('.vinyl-disc');
        if (disc) {
          disc.classList.remove('animate-spin-vinyl');
          requestAnimationFrame(() => {
            disc.classList.add('is-stopping');
          });
        }
      };
      const playPromise = currentAudio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Only update UI if still active (not interrupted by handleLeave)
            if (currentAudio && currentAudio.src === audioUrl) {
              const disc = card.querySelector('.vinyl-disc');
              if (disc) {
                disc.classList.remove('is-stopping');
                disc.classList.add('animate-spin-vinyl');
              }
              vinyl.classList.remove('is-stopping');
              vinyl.classList.add('opacity-100');
              vinyl.classList.remove('opacity-0');
              overlay.classList.add('opacity-100', 'translate-y-0');
              overlay.classList.remove('opacity-0', 'translate-y-5');
              cover.classList.add('-translate-x-full');
              card.classList.add('is-active');
            }
          })
          .catch(e => {
            // Only log if it's not a suspended context or abort error (those are expected)
            if (e.name !== 'NotAllowedError' && e.name !== 'AbortError') {
              console.warn('Audio playback error:', e);
            }
          });
      } else {
        // Fallback for browsers that don't return a promise
        const disc = card.querySelector('.vinyl-disc');
        if (disc) {
          disc.classList.remove('is-stopping');
          disc.classList.add('animate-spin-vinyl');
        }
        vinyl.classList.remove('is-stopping');
        vinyl.classList.add('opacity-100');
        vinyl.classList.remove('opacity-0');
        overlay.classList.add('opacity-100', 'translate-y-0');
        overlay.classList.remove('opacity-0', 'translate-y-5');
        cover.classList.add('-translate-x-full');
        card.classList.add('is-active');
      }
    };

    const handleLeave = () => {
      if (currentAudio) {
        try { 
          currentAudio.stop(); 
        } catch(e) {}
        try { 
          currentAudio.disconnect(); 
        } catch(e) {}
        try {
          // Safely abort playback without triggering AbortError warning
          currentAudio.src = ''; // Clear source to prevent playback
          currentAudio.load(); // Reset to initial state
        } catch(e) {}
        currentAudio = null;
      }
      const disc = card.querySelector('.vinyl-disc');
      if (disc) {
        disc.classList.remove('animate-spin-vinyl', 'is-stopping');
      }
      vinyl.classList.remove('opacity-100');
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
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        // Faster reveal on mobile
        const delay = isMobile ? 0 : 20;
        setTimeout(() => {
          entry.target.classList.add('animate-in');
        }, delay); 
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal').forEach((el) => {
    observer.observe(el);
  });

  // --- Optimized Scroll Handling with geometric caching and lazy parallax initialization ---
  let isScrollTicking = false;
  let parallaxEnabled = false; // Defer parallax until after LCP
  const isMobileDevice = window.matchMedia('(max-width: 768px)').matches;
  const bioItems = Array.from(document.querySelectorAll('.bio-data-text')).map(el => ({
    element: el,
    parent: el.parentElement,
    top: 0,
    height: 0
  }));

  const updateGeometricCache = () => {
    bioItems.forEach(item => {
      item.top = item.parent.offsetTop;
      item.height = item.parent.offsetHeight;
    });
  };

  // Enable parallax after LCP (1500ms safe window)
  const enableParallax = () => {
    if (!parallaxEnabled) {
      parallaxEnabled = true;
      updateGeometricCache();
      // Only add will-change AFTER parallax is enabled and cached
      bioItems.forEach(item => {
        item.element.style.willChange = 'transform';
      });
    }
  };
  
  // Defer parallax initialization if requestIdleCallback available
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => setTimeout(enableParallax, 1200), { timeout: 3000 });
  } else {
    setTimeout(enableParallax, 1500);
  }

  window.addEventListener('resize', () => {
    if (parallaxEnabled) updateGeometricCache();
  }, { passive: true });
  
  window.addEventListener('scroll', () => {
    if (!parallaxEnabled || !isScrollTicking) {
      window.requestAnimationFrame(() => {
        if (!parallaxEnabled) {
          isScrollTicking = false;
          return;
        }
        
        const scrolled = window.scrollY || window.pageYOffset;
        
        // Hero Parallax - Reduced effect on mobile
        const heroContent = document.querySelector('#inicio .max-w-7xl');
        if (heroContent) {
          const parallaxStrength = isMobileDevice ? 0.15 : 0.3;
          heroContent.style.transform = `translate3d(0, ${scrolled * parallaxStrength}px, 0)`;
          heroContent.style.opacity = 1 - (scrolled / 700);
        }

        // Bio Parallax - Using Memory Cache (ZERO READS to DOM)
        // Reduced parallax range on mobile for better performance
        const viewportBottom = scrolled + window.innerHeight;
        const parallaxRange = isMobileDevice ? 100 : 200;
        bioItems.forEach(item => {
          if (viewportBottom > item.top && scrolled < item.top + item.height) {
            const progress = (viewportBottom - item.top) / (window.innerHeight + item.height);
            item.element.style.transform = `translate3d(0, ${(progress - 0.5) * parallaxRange}px, 0)`;
          }
        });

        isScrollTicking = false;
      });
      isScrollTicking = true;
    }
  }, { passive: true });
});
