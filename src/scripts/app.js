// Interacciones visuales (antes src/vanilla-app.js): partículas del hero,
// barra de navegación al hacer scroll, carrusel Embla, animaciones de
// aparición y parallax de los textos de fondo.
import { SandCanvas } from './sand-canvas.js';
import { initAlbumPlayer } from './album-player.js';

const HERO_IMAGE = '/images/Banner-MACI-optimized.webp';

function initHeroCanvas() {
  // Diferido para no competir con el primer render.
  const initSandCanvas = () => {
    const heroCanvas = document.getElementById('hero-canvas');
    if (heroCanvas) {
      try {
        new SandCanvas(heroCanvas, window.MACI_HERO_IMAGE || HERO_IMAGE);
      } catch (e) {
        console.warn('SandCanvas initialization failed:', e);
      }
    }
  };

  setTimeout(() => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(initSandCanvas, { timeout: 3000 });
    } else {
      setTimeout(initSandCanvas, 2500);
    }
  }, 800);
}

function initNavScroll() {
  const nav = document.querySelector('nav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.classList.add('bg-surface/95', 'backdrop-blur-md', 'py-3', 'shadow-lg');
      nav.classList.remove('bg-transparent', 'py-6');
    } else {
      nav.classList.remove('bg-surface/95', 'backdrop-blur-md', 'py-3', 'shadow-lg');
      nav.classList.add('bg-transparent', 'py-6');
    }
  }, { passive: true });
}

// Embla se empaqueta con la web (antes se importaba de esm.sh en runtime) y
// se carga en un chunk aparte: si fallara, el resto de la página sigue.
async function initCarousel() {
  try {
    const emblaNode = document.querySelector('.embla');
    const dotContainer = document.querySelector('.embla__dots');

    if (!emblaNode || !dotContainer) return;

    const [{ default: EmblaCarousel }, { default: Autoplay }] = await Promise.all([
      import('embla-carousel'),
      import('embla-carousel-autoplay'),
    ]);

    const autoplay = Autoplay({
      delay: 5000,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
    });

    const emblaApi = EmblaCarousel(emblaNode, {
      align: 'start',
      containScroll: 'trimSnaps',
      dragFree: false,
      loop: true,
      skipSnaps: false,
    }, [autoplay]);

    let dotsCache = [];

    const updateDots = () => {
      const selectedIndex = emblaApi.selectedScrollSnap();
      dotsCache.forEach((dot, index) => {
        dot.classList.toggle('is-active', index === selectedIndex);
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

    window.MACI_EMBLA_READY = true;
  } catch (e) {
    console.warn('Carousel initialization error (non-critical):', e);
  }
}

function initReveal() {
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const revealItems = Array.from(document.querySelectorAll('.reveal'));

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = isMobile ? 0 : 20;
          setTimeout(() => {
            entry.target.classList.add('animate-in');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    });

    revealItems.forEach((el) => observer.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add('animate-in'));
  }

  window.MACI_REVEAL_READY = true;
}

function initParallax() {
  const bioItems = Array.from(document.querySelectorAll('.bio-data-text'));

  const enableParallax = () => {
    bioItems.forEach((el) => {
      el.style.willChange = 'transform';
    });
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => setTimeout(enableParallax, 1200), { timeout: 3000 });
  } else {
    setTimeout(enableParallax, 1500);
  }
}

export function initApp() {
  const safeRun = (fn) => {
    try {
      fn();
    } catch (e) {
      console.warn(`${fn.name} failed (non-critical):`, e);
    }
  };

  safeRun(initHeroCanvas);
  safeRun(initNavScroll);
  initCarousel();
  safeRun(initAlbumPlayer);
  safeRun(initReveal);
  safeRun(initParallax);
}
