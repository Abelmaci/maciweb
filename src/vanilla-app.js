import { SandCanvas } from './vanilla-sand.js';
import { ScratchProcessor } from './scratch-processor.js';
import EmblaCarousel from 'https://esm.sh/embla-carousel@8.0.0?min';
import Autoplay from 'https://esm.sh/embla-carousel-autoplay@8.0.0?min';

document.addEventListener('DOMContentLoaded', () => {
  try {
    // --- Deferred Initialization for better LCP ---
    const initApp = () => {
      try {
        // --- Initialize Lucide Icons ---
        if (window.lucide) {
          const containers = ['nav', '#inicio', '.embla', 'footer'];
          containers.forEach(selector => {
            const el = document.querySelector(selector);
            if (el) window.lucide.createIcons({ props: {}, attrs: {}, root: el });
          });
        }

        // --- SandCanvas Initialization - DEFERRED ---
        const initSandCanvas = () => {
          const heroCanvas = document.getElementById('hero-canvas');
          if (heroCanvas) {
            const HERO_IMAGE = ['images', 'Banner-MACI-optimized', 'webp'].join('/').replace('/webp', '.webp');
            try {
              new SandCanvas(heroCanvas, HERO_IMAGE);
            } catch (e) {
              console.warn('SandCanvas initialization failed:', e);
            }
          }
        };
        
        if ('requestIdleCallback' in window) {
          requestIdleCallback(initSandCanvas, { timeout: 3000 });
        } else {
          setTimeout(initSandCanvas, 2500);
        }
      } catch (e) {
        console.warn('InitApp error (non-critical):', e);
      }
    };

    setTimeout(initApp, 800);

    // --- Navigation Scroll Effect ---
    try {
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
    } catch (e) {
      console.warn('Navigation scroll error (non-critical):', e);
    }

    // --- Embla Carousel Initialization ---
    try {
      const emblaNode = document.querySelector('.embla');
      const dotContainer = document.querySelector('.embla__dots');
      
      if (emblaNode && dotContainer) {
        const autoplay = Autoplay({ 
          delay: 5000, 
          stopOnInteraction: true, 
          stopOnMouseEnter: true
        });

        const emblaApi = EmblaCarousel(emblaNode, { 
          align: 'start',
          containScroll: 'trimSnaps',
          dragFree: false,
          loop: true,
          skipSnaps: false
        }, [autoplay]);

        let dotsCache = [];
        
        const updateDots = () => {
          const selectedIndex = emblaApi.selectedScrollSnap();
          dotsCache.forEach((dot, index) => {
            if (index === selectedIndex) {
              if (!dot.classList.contains('is-active')) {
                dot.classList.add('is-active');
              }
            } else {
              if (dot.classList.contains('is-active')) {
                dot.classList.remove('is-active');
              }
            }
          });
        };

        const createDots = () => {
          const scrollSnaps = emblaApi.scrollSnapList();
          dotContainer.innerHTML = scrollSnaps
            .map((_, index) => `<button class="embla__dot" aria-label="Go to snap ${index + 1}"></button>`)
            .join('');
          
          dotsCache = Array.from(dotContainer.querySelectorAll('.embla__dot'));
          
          dotsCache.forEach((dot, index) => {
            dot.addEventListener('click', () => {
              emblaApi.scrollTo(index);
              updateDots();
            });
          });
        };

        createDots();
        updateDots();
        
        let lastDotUpdate = 0;
        const throttledUpdateDots = () => {
          const now = Date.now();
          if (now - lastDotUpdate > 50) {
            updateDots();
            lastDotUpdate = now;
          }
        };
        
        emblaApi.on('select', throttledUpdateDots);
        emblaApi.on('reInit', () => {
          createDots();
          updateDots();
        });

        emblaNode.addEventListener('mouseenter', () => {
          autoplay.stop();
        });
        emblaNode.addEventListener('mouseleave', () => {
          autoplay.play();
        });
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
    } catch (e) {
      console.warn('Carousel initialization error (non-critical):', e);
    }

    // --- Audio Preview Logic with REAL Scratch (ScriptProcessorNode) ---
    try {
      let currentScratchProcessor = null;
      let currentAudioEl = null;
      let currentDisc = null;
      let animFrameId = null;

      const updateVinylRotation = () => {
        if (!currentScratchProcessor || !currentScratchProcessor.isPlaying || !currentDisc) {
          animFrameId = null;
          return;
        }
        const deg = currentScratchProcessor.getRotationDegrees();
        currentDisc.style.transform = `rotate(${deg}deg)`;
        animFrameId = requestAnimationFrame(updateVinylRotation);
      };

      const albumCards = document.querySelectorAll('.album-card');

      albumCards.forEach(card => {
        const audioUrl = card.dataset.audio;
        const previewDuration = Number(card.dataset.duration || 30);
        const id = card.dataset.id;
        const vinyl = card.querySelector('.vinyl-record');
        const overlay = card.querySelector('.info-overlay');
        const cover = card.querySelector('.album-cover');
        const disc = card.querySelector('.vinyl-disc');
        let previewTimeout = null;

        let lastX = 0;
        let lastY = 0;
        let lastScratchTimestamp = 0;
        let isScratching = false;
        const SENSITIVITY = 1.8 / (2 * Math.PI);

        const startScratchProcessor = () => {
          if (!window.audioBuffers || !window.audioBuffers[audioUrl]) return false;
          try {
            currentScratchProcessor = new ScratchProcessor(window.audioCtx, window.audioBuffers[audioUrl]);
            currentScratchProcessor.onended = () => {
              if (currentDisc === disc) {
                currentDisc = null;
                if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
                if (disc) disc.classList.add('is-stopping');
              }
            };
            // La rotación la controla JS vía playhead; quitamos la animación CSS
            if (disc) disc.classList.remove('animate-spin-vinyl');
            currentScratchProcessor.start();
            // Reiniciar el loop de rotación (puede haberse detenido durante la carga async)
            if (!animFrameId) animFrameId = requestAnimationFrame(updateVinylRotation);
            console.log(`🎵 [Card ${id}] ScratchProcessor started`);
            previewTimeout = setTimeout(() => {
              if (currentScratchProcessor) { currentScratchProcessor.stop(); currentScratchProcessor = null; }
              if (currentDisc === disc) {
                currentDisc = null;
                if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
              }
            }, previewDuration * 1000);
            return true;
          } catch (e) {
            console.warn(`ScratchProcessor failed for card ${id}:`, e);
            return false;
          }
        };

        const handleEnter = async () => {
          console.log(`🎵 [Card ${id}] Activating card`);

          if (currentScratchProcessor) { currentScratchProcessor.stop(); currentScratchProcessor = null; }
          if (currentAudioEl) { currentAudioEl.pause(); currentAudioEl.currentTime = 0; currentAudioEl = null; }
          if (previewTimeout) { clearTimeout(previewTimeout); previewTimeout = null; }

          currentDisc = disc;
          if (disc) {
            disc.classList.remove('is-stopping');
            disc.classList.add('animate-spin-vinyl');
          }
          vinyl.classList.remove('opacity-0', 'is-stopping');
          vinyl.classList.add('opacity-100');
          overlay.classList.add('opacity-100', 'translate-y-0');
          overlay.classList.remove('opacity-0', 'translate-y-5');
          cover.classList.add('-translate-x-full');
          card.classList.add('is-active');

          if (!animFrameId) animFrameId = requestAnimationFrame(updateVinylRotation);

          if (!window.audioCtx) {
            window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          }
          if (window.audioCtx.state === 'suspended') {
            window.audioCtx.resume().catch(e => console.warn('AudioContext resume failed:', e));
          }

          // Decodificar buffer si aún no está en caché
          window.audioBuffers = window.audioBuffers || {};
          if (!window.audioBuffers[audioUrl]) {
            try {
              const resp = await fetch(audioUrl);
              const arrayBuf = await resp.arrayBuffer();
              if (!card.classList.contains('is-active')) return;
              window.audioBuffers[audioUrl] = await new Promise((res, rej) =>
                window.audioCtx.decodeAudioData(arrayBuf, res, rej)
              );
            } catch (e) {
              console.warn(`[Card ${id}] Audio decode failed:`, e);
            }
          }

          if (!card.classList.contains('is-active')) return;

          if (startScratchProcessor()) return;

          // Fallback HTML5 Audio
          console.log(`⚠️ [Card ${id}] Falling back to HTML5 Audio`);
          currentAudioEl = new Audio(audioUrl);
          currentAudioEl.volume = 0.5;
          currentAudioEl.play().catch(e => console.warn('Audio play error:', e));
          previewTimeout = setTimeout(() => {
            if (currentAudioEl) { currentAudioEl.pause(); currentAudioEl.currentTime = 0; currentAudioEl = null; }
          }, previewDuration * 1000);
        };

        const handleLeave = () => {
          // Si hay un scratch activo (drag fuera del card), esperar al pointerup
          if (isScratching) return;

          console.log(`🎵 [Card ${id}] Deactivating card`);

          isScratching = false;

          if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
          if (currentScratchProcessor) { currentScratchProcessor.stop(); currentScratchProcessor = null; }
          if (currentAudioEl) { currentAudioEl.pause(); currentAudioEl.currentTime = 0; currentAudioEl = null; }
          if (previewTimeout) { clearTimeout(previewTimeout); previewTimeout = null; }

          currentDisc = null;

          if (disc) {
            disc.classList.remove('animate-spin-vinyl', 'is-stopping');
            disc.style.transform = '';
            disc.style.transition = '';
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

        // --- SCRATCH EFFECT ---
        // Eventos en `card` (no en disc) para evitar que info-overlay (z-20) intercepte
        const handlePointerDown = (e) => {
          if (!card.classList.contains('is-active') || !currentScratchProcessor) return;
          if (!e.isPrimary) return;
          if (e.target.closest('a, button')) return; // permite clics en Spotify, etc.

          isScratching = true;
          currentScratchProcessor.isScratching = true;
          currentScratchProcessor.speed = 0;
          lastX = e.clientX;
          lastY = e.clientY;
          lastScratchTimestamp = performance.now();

          card.setPointerCapture(e.pointerId);
          e.preventDefault();
        };

        const handlePointerMove = (e) => {
          if (!isScratching || !currentScratchProcessor) return;
          e.preventDefault();

          // El centro del disc coincide con el centro del card (disc es w-[94%] centrado)
          const cardRect = card.getBoundingClientRect();
          const cx = cardRect.left + cardRect.width / 2;
          const cy = cardRect.top + cardRect.height / 2;

          const angle1 = Math.atan2(lastY - cy, lastX - cx);
          const angle2 = Math.atan2(e.clientY - cy, e.clientX - cx);

          let angleDelta = angle2 - angle1;
          if (angleDelta > Math.PI) angleDelta -= 2 * Math.PI;
          if (angleDelta < -Math.PI) angleDelta += 2 * Math.PI;

          const now = performance.now();
          const dt = Math.max((now - lastScratchTimestamp) / 1000, 0.001);
          currentScratchProcessor.speed = (angleDelta / dt) * SENSITIVITY;
          currentScratchProcessor.isScratching = true;

          if (disc) disc.style.transform = `rotate(${currentScratchProcessor.getRotationDegrees()}deg)`;

          lastX = e.clientX;
          lastY = e.clientY;
          lastScratchTimestamp = now;
        };

        const handlePointerUp = () => {
          if (!isScratching || !currentScratchProcessor) return;
          isScratching = false;
          currentScratchProcessor.isScratching = false;
          // Si el ratón salió de la tarjeta mientras se rascaba, limpiamos ahora
          if (!card.matches(':hover')) handleLeave();
        };

        card.addEventListener('pointerdown', handlePointerDown);
        card.addEventListener('pointermove', handlePointerMove);
        card.addEventListener('pointerup', handlePointerUp);
        card.addEventListener('pointercancel', handlePointerUp);

        // --- MÓVIL: botón fingerprint activa/desactiva el vinilo ---
        const mobileBtn = card.querySelector('.mobile-touch-btn');
        if (mobileBtn) {
          mobileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (card.classList.contains('is-active')) {
              handleLeave();
            } else {
              handleEnter();
            }
          });
        }
      });

    } catch (e) {
      console.warn('Audio preview logic error (non-critical):', e);
    }

    // --- Intersection Observer for Animations ---
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
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

    // --- Optimized Scroll Handling ---
    let isScrollTicking = false;
    let parallaxEnabled = false;
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

    const enableParallax = () => {
      if (!parallaxEnabled) {
        parallaxEnabled = true;
        updateGeometricCache();
        bioItems.forEach(item => {
          item.element.style.willChange = 'transform';
        });
      }
    };
    
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => setTimeout(enableParallax, 1200), { timeout: 3000 });
    } else {
      setTimeout(enableParallax, 1500);
    }

  } catch (e) {
    console.error('Critical error in app initialization:', e);
  }
});
