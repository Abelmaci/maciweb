// Núcleo de la página (antes src/main.js): splash de carga, contadores del
// hero, onda sonora, menú móvil, cambio de idioma, cuenta atrás de
// lanzamientos y registro del service worker.

let currentLang = 'es';

function initSplashLoader() {
  const splash = document.getElementById('splash-loader');
  const pctText = document.getElementById('load-pct');
  const statusText = document.getElementById('load-status');
  const stop1 = document.getElementById('fill-stop-1');
  const stop2 = document.getElementById('fill-stop-2');

  if (!splash || !pctText || !statusText || !stop1 || !stop2) {
    return;
  }

  const images = Array.from(document.images);
  const audioSources = [...new Set([...document.querySelectorAll('.album-card')].map((card) => card.dataset.audio))].filter(Boolean);

  const totalAssets = images.length;
  let loadedCount = 0;
  let audioLoaded = 0;
  let assetsReady = false;
  let animationComplete = false;
  let isDismissed = false;

  const animationDuration = 2500;
  const startTime = performance.now();

  const checkDismiss = () => {
    if (!isDismissed && assetsReady && animationComplete) {
      isDismissed = true;
      splash.classList.add('fade-out');
      document.querySelectorAll('.hero-reveal').forEach((el) => {
        el.classList.remove('opacity-0');
        el.classList.add('animate-in');
      });
    }
  };

  const updateProgress = (isAudio) => {
    if (isAudio) {
      audioLoaded += 1;
    } else {
      loadedCount += 1;
    }

    if (audioLoaded > 0 && audioLoaded < audioSources.length) {
      statusText.innerText = `DECODING AUDIO ${audioLoaded}/${audioSources.length}`;
    }

    if (loadedCount >= totalAssets && audioLoaded >= audioSources.length) {
      assetsReady = true;
      statusText.innerText = 'SOUND SYSTEM READY';
      checkDismiss();
    }
  };

  const animateLoader = (timestamp) => {
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / animationDuration, 1);
    const percent = Math.round(progress * 100);

    pctText.innerText = `${percent}%`;
    stop1.setAttribute('offset', `${percent}%`);
    stop2.setAttribute('offset', `${percent}%`);

    if (progress < 1) {
      requestAnimationFrame(animateLoader);
    } else {
      animationComplete = true;
      checkDismiss();
    }
  };

  requestAnimationFrame(animateLoader);

  if (images.length === 0 && audioSources.length === 0) {
    assetsReady = true;
    updateProgress(false);
  }

  images.forEach((img) => {
    if (img.complete) {
      updateProgress(false);
      return;
    }

    img.addEventListener('load', () => updateProgress(false));
    img.addEventListener('error', () => updateProgress(false));
  });

  window.audioBuffers = window.audioBuffers || {};

  const preloadedAudioContainer = document.createElement('div');
  preloadedAudioContainer.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;';
  document.body.appendChild(preloadedAudioContainer);

  audioSources.forEach((src) => {
    const audio = document.createElement('audio');
    audio.preload = 'auto';
    audio.muted = true;
    audio.playsInline = true;
    audio.src = src;
    audio.style.display = 'none';

    const finish = () => updateProgress(true);
    audio.addEventListener('canplaythrough', finish, { once: true });
    audio.addEventListener('loadedmetadata', finish, { once: true });
    audio.addEventListener('error', finish, { once: true });

    preloadedAudioContainer.appendChild(audio);
  });

  const initAudioContextOnce = (() => {
    let initialized = false;

    return () => {
      if (!initialized && !window.audioCtx) {
        try {
          window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          initialized = true;
        } catch (error) {
          console.warn('AudioContext not available:', error);
        }
      }

      if (window.audioCtx && window.audioCtx.state === 'suspended') {
        window.audioCtx.resume().catch((error) => console.warn('AudioContext resume failed:', error));
      }
    };
  })();

  ['click', 'touchstart', 'keydown'].forEach((eventName) => {
    document.addEventListener(eventName, initAudioContextOnce, { once: true, passive: true });
  });

  setTimeout(() => {
    assetsReady = true;
    checkDismiss();
  }, 3000);
}

function initCounters() {
  const bpmCounter = document.getElementById('bpm-counter');
  const timeCounter = document.getElementById('time-counter');
  const audienceCounter = document.getElementById('audience-counter');

  if (!bpmCounter || !timeCounter || !audienceCounter) {
    return;
  }

  let bpm = 120;
  let seconds = 0;
  let audience = 523;

  setInterval(() => {
    bpm = Math.floor(118 + Math.random() * 4);
    bpmCounter.innerText = String(bpm);
  }, 2000);

  setInterval(() => {
    seconds += 1;
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    timeCounter.innerText = `${mins}:${secs}`;
  }, 1000);

  const updateAudience = () => {
    audience += Math.floor(Math.random() * 5) - 2;
    if (audience < 500) {
      audience = 500;
    }
    audienceCounter.innerText = String(audience);
  };

  updateAudience();
  setInterval(updateAudience, 120000);
}

function initWaveBars() {
  const container = document.getElementById('waveContainer');
  if (!container) {
    return;
  }

  const barCount = 45;
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < barCount; i += 1) {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.animationDelay = `${Math.random() * 2}s`;
    bar.style.animationDuration = `${0.5 + Math.random() * 1.5}s`;
    const centerDistance = Math.abs(i - barCount / 2);
    const scale = 1 - (centerDistance / (barCount / 2));
    bar.style.opacity = String(0.2 + (scale * 0.6));
    fragment.appendChild(bar);
  }

  container.replaceChildren(fragment);
}

function initMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const closeBtn = document.getElementById('close-menu-btn');
  const menu = document.getElementById('mobile-menu');

  if (!menuBtn || !closeBtn || !menu) {
    return;
  }

  const toggleMenu = (show) => {
    if (show) {
      menu.classList.remove('hidden');
      void menu.offsetWidth;
      menu.classList.remove('opacity-0', 'translate-x-full');
      menu.classList.add('opacity-100', 'translate-x-0');
      menu.querySelectorAll('a').forEach((link) => {
        link.classList.add('animate-in');
        link.classList.remove('tracking-tighter');
        link.classList.add('tracking-[0.1em]');
      });
      return;
    }

    menu.classList.add('opacity-0', 'translate-x-full');
    menu.classList.remove('opacity-100', 'translate-x-0');
    menu.querySelectorAll('a').forEach((link) => {
      link.classList.remove('animate-in');
      link.classList.add('tracking-tighter');
      link.classList.remove('tracking-[0.1em]');
    });
    setTimeout(() => menu.classList.add('hidden'), 500);
  };

  menuBtn.addEventListener('click', () => toggleMenu(true));
  closeBtn.addEventListener('click', () => toggleMenu(false));
  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => toggleMenu(false));
  });
}

// Escribe el texto letra a letra. Se usa texto plano (no HTML) para que los
// saltos de línea de los textos largos se mantengan con whitespace-pre-line.
function typeWriter(element, text, index = 0) {
  if (index === 0) {
    element.textContent = '';
  }

  if (index < text.length) {
    element.textContent += text.charAt(index);
    setTimeout(() => typeWriter(element, text, index + 1), 5);
  }
}

function changeLanguageTo(lang) {
  if (lang === currentLang) {
    return;
  }

  const circle = document.getElementById('toggle-circle');
  const labelEs = document.getElementById('label-es');
  const labelEn = document.getElementById('label-en');

  if (!circle || !labelEs || !labelEn) {
    return;
  }

  currentLang = lang;
  document.documentElement.lang = lang;

  if (lang === 'en') {
    circle.style.transform = 'translateX(24px)';
    labelEn.classList.add('text-white');
    labelEn.classList.remove('text-white/40');
    labelEs.classList.remove('text-white');
    labelEs.classList.add('text-white/40');
  } else {
    circle.style.transform = 'translateX(0)';
    labelEs.classList.add('text-white');
    labelEs.classList.remove('text-white/40');
    labelEn.classList.remove('text-white');
    labelEn.classList.add('text-white/40');
  }

  document.querySelectorAll('[data-i18n-es]').forEach((el) => {
    const targetText = lang === 'en' ? el.getAttribute('data-i18n-en') : el.getAttribute('data-i18n-es');
    typeWriter(el, targetText || '');
  });
}

function initLanguageToggle() {
  const toggle = document.getElementById('language-toggle');
  if (!toggle) {
    return;
  }

  const handleToggle = () => {
    const nextLang = currentLang === 'es' ? 'en' : 'es';
    changeLanguageTo(nextLang);
  };

  toggle.addEventListener('click', handleToggle);
  toggle.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  });
}

function initServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(() => console.log('Service Worker registered'))
      .catch((error) => console.log('Service Worker failed', error));
  });
}

// Cuenta atrás de lanzamientos: cada bloque [data-countdown="<fecha ISO>"]
// (se define en albums.json → countdown.date) se rellena cada segundo y se
// oculta cuando la fecha ya ha pasado.
function initLaunchCountdown() {
  const pad = (n) => String(n).padStart(2, '0');

  const targets = Array.from(document.querySelectorAll('[data-countdown]')).map((wrap) => ({
    wrap,
    launch: new Date(wrap.dataset.countdown),
    parts: Object.fromEntries(
      Array.from(wrap.querySelectorAll('[data-countdown-part]')).map((el) => [el.dataset.countdownPart, el]),
    ),
  }));

  if (!targets.length) {
    return;
  }

  const tick = () => {
    const now = new Date();
    let anyActive = false;

    targets.forEach(({ wrap, launch, parts }) => {
      const diff = launch - now;

      if (diff <= 0) {
        wrap.style.display = 'none';
        return;
      }

      anyActive = true;
      const total = Math.floor(diff / 1000);
      const values = {
        days: Math.floor(total / 86400),
        hours: Math.floor((total % 86400) / 3600),
        mins: Math.floor((total % 3600) / 60),
        secs: total % 60,
      };

      Object.entries(values).forEach(([key, value]) => {
        if (parts[key]) parts[key].textContent = pad(value);
      });
    });

    if (anyActive) setTimeout(tick, 1000);
  };

  tick();
}

export function initCore() {
  const safeRun = (fn) => {
    try {
      fn();
    } catch (e) {
      console.warn(`${fn.name} failed:`, e);
    }
  };

  safeRun(initSplashLoader);
  safeRun(initCounters);
  safeRun(initWaveBars);
  safeRun(initMenu);
  safeRun(initLanguageToggle);
  safeRun(initServiceWorker);
  safeRun(initLaunchCountdown);

  window.MACI_CORE_READY = true;
}
