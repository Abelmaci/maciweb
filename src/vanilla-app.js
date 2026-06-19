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
      let lastAngularVel = 0;
      let lastVelTimestamp = 0;
      
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
        
        // Variables para el scratch
        let lastX = 0;
        let lastY = 0;
        let lastScratchTimestamp = 0;

        const handleEnter = () => {
          console.log(`🎵 [Card ${id}] Hovering, starting playback`);
          
          // Limpiar reproductor anterior
          if (currentScratchProcessor) {
            currentScratchProcessor.stop();
            currentScratchProcessor = null;
          }
          if (previewTimeout) {
            clearTimeout(previewTimeout);
            previewTimeout = null;
          }
          
          // UI
          if (disc) {
            disc.classList.remove('is-stopping');
            disc.classList.add('animate-spin-vinyl');
            disc.style.transform = '';
          }
          vinyl.classList.remove('opacity-0', 'is-stopping');
          vinyl.classList.add('opacity-100');
          overlay.classList.add('opacity-100', 'translate-y-0');
          overlay.classList.remove('opacity-0', 'translate-y-5');
          cover.classList.add('-translate-x-full');
          card.classList.add('is-active');
          
          // Inicializar AudioContext si es necesario
          if (!window.audioCtx) {
            window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          }
          
          if (window.audioCtx.state === 'suspended') {
            window.audioCtx.resume().catch(e => console.warn('AudioContext resume failed:', e));
          }
          
          // Crear ScratchProcessor si tenemos el buffer
          if (window.audioBuffers && window.audioBuffers[audioUrl]) {
            try {
              currentScratchProcessor = new ScratchProcessor(window.audioCtx, window.audioBuffers[audioUrl]);
              
              // Callback cuando termina la canción
              currentScratchProcessor.onended = () => {
                if (disc) {
                  disc.classList.remove('animate-spin-vinyl');
                  disc.classList.add('is-stopping');
                }
              };
              
              currentScratchProcessor.start();
              console.log(`🎵 [Card ${id}] ScratchProcessor started`);
              
              // Auto-stop después de duration
              previewTimeout = setTimeout(() => {
                if (currentScratchProcessor) {
                  currentScratchProcessor.stop();
                  currentScratchProcessor = null;
                }
              }, previewDuration * 1000);
              
              return;
            } catch (e) {
              console.warn(`ScratchProcessor failed for card ${id}:`, e);
            }
          }
          
          // Fallback: HTML5 Audio si no hay Web Audio API
          console.log(`⚠️ [Card ${id}] Falling back to HTML5 Audio`);
          const audioEl = new Audio(audioUrl);
          audioEl.volume = 0.5;
          audioEl.play().catch(e => console.warn('Audio play error:', e));
          
          previewTimeout = setTimeout(() => {
            audioEl.pause();
            audioEl.currentTime = 0;
          }, previewDuration * 1000);
        };

        const handleLeave = () => {
          console.log(`🎵 [Card ${id}] Left card`);
          
          if (currentScratchProcessor) {
            currentScratchProcessor.stop();
            currentScratchProcessor = null;
          }
          if (previewTimeout) {
            clearTimeout(previewTimeout);
            previewTimeout = null;
          }
          
          // UI reset
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
        
        // --- SCRATCH EFFECT: Circular drag con atan2 ---
        const handleMouseDown = (e) => {
          if (!card.classList.contains('is-active') || !currentScratchProcessor) return;
          
          lastX = e.clientX;
          lastY = e.clientY;
          lastScratchTimestamp = performance.now();
          
          if (disc) {
            disc.classList.remove('animate-spin-vinyl');
            disc.classList.add('will-change-transform');
          }
          
          e.preventDefault();
          e.stopPropagation();
          console.log('🎛️ SCRATCH: Started');
        };

        const handleMouseMove = (e) => {
          if (!currentScratchProcessor || !lastScratchTimestamp) return;
          
          e.preventDefault();
          e.stopPropagation();
          
          const now = performance.now();
          const timeDelta = Math.max((now - lastScratchTimestamp) / 1000, 0.001);
          
          // Calcular velocidad angular (atan2)
          const discRect = disc.getBoundingClientRect();
          const cx = discRect.left + discRect.width / 2;
          const cy = discRect.top + discRect.height / 2;
          
          const dx1 = lastX - cx;
          const dy1 = lastY - cy;
          const dx2 = e.clientX - cx;
          const dy2 = e.clientY - cy;
          
          const angle1 = Math.atan2(dy1, dx1);
          const angle2 = Math.atan2(dy2, dx2);
          
          let angleDelta = angle2 - angle1;
          // Normalizar a [-π, π]
          if (angleDelta > Math.PI) angleDelta -= 2 * Math.PI;
          if (angleDelta < -Math.PI) angleDelta += 2 * Math.PI;
          
          const angularVelocity = angleDelta / timeDelta; // rad/s
          
          // Aplicar al scratch
          currentScratchProcessor.setScratchSpeed(angularVelocity * 0.5); // Escala ajustable
          
          // Actualizar rotación visual del disco
          if (disc) {
            const rotation = currentScratchProcessor.getRotationDegrees();
            disc.style.transform = `rotate(${rotation}deg)`;
          }
          
          lastX = e.clientX;
          lastY = e.clientY;
          lastScratchTimestamp = now;
          
          console.log(`🎛️ SCRATCH: AngVel=${angularVelocity.toFixed(2)} rad/s, Rotation=${currentScratchProcessor.getRotationDegrees().toFixed(0)}°`);
        };

        const handleMouseUp = (e) => {
          if (!currentScratchProcessor) return;
          
          // Aplicar fricción: el audio se "congela" y desacelera
          currentScratchProcessor.applyFriction();
          
          // Después de 500ms, liberar para que motor vuelva a 1.0x
          setTimeout(() => {
            if (currentScratchProcessor) {
              currentScratchProcessor.release();
              // Reanudar rotación del disco
              if (disc && card.classList.contains('is-active')) {
                disc.classList.add('animate-spin-vinyl');
                disc.classList.remove('will-change-transform');
              }
            }
          }, 500);
          
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          
          lastScratchTimestamp = 0;
          console.log('🎛️ SCRATCH: Released (friction applied)');
        };

        card.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove, true);
        document.addEventListener('mouseup', handleMouseUp);
        
        // Touch support
        card.addEventListener('touchstart', handleMouseDown);
        document.addEventListener('touchmove', handleMouseMove, true);
        document.addEventListener('touchend', handleMouseUp);
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
