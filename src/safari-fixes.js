(function () {
  'use strict';

  var ua = navigator.userAgent || '';
  var isSafari = window.MACI_IS_SAFARI || /^((?!chrome|android|crios|fxios|edg|opr|opera).)*safari/i.test(ua);

  if (!isSafari) return;

  var doc = document;
  var root = doc.documentElement;
  window.MACI_IS_SAFARI = true;
  window.MACI_HERO_IMAGE = window.MACI_HERO_IMAGE || 'images/Banner-MACI-optimized.jpg';
  addClass(root, 'is-safari');

  function ready(fn) {
    if (doc.readyState === 'loading') {
      doc.addEventListener('DOMContentLoaded', fn);
      return;
    }

    fn();
  }

  function addClass(el, className) {
    if (!el) return;
    if (el.classList) {
      el.classList.add(className);
      return;
    }

    if ((' ' + el.className + ' ').indexOf(' ' + className + ' ') === -1) {
      el.className += ' ' + className;
    }
  }

  function removeClass(el, className) {
    if (!el) return;
    if (el.classList) {
      el.classList.remove(className);
      return;
    }

    el.className = (' ' + el.className + ' ').replace(' ' + className + ' ', ' ');
  }

  function hasClass(el, className) {
    if (!el) return false;
    if (el.classList) return el.classList.contains(className);
    return (' ' + el.className + ' ').indexOf(' ' + className + ' ') > -1;
  }

  function toArray(list) {
    return Array.prototype.slice.call(list || []);
  }

  function applyHeroFallback() {
    var heroLayer = doc.querySelector('#inicio [style*="Banner-MACI-optimized.webp"]');
    var canvas = doc.getElementById('hero-canvas');

    if (heroLayer) {
      heroLayer.style.backgroundImage = "url('images/Banner-MACI-optimized.jpg')";
    }

    if (canvas) {
      canvas.setAttribute('data-safari-image', 'images/Banner-MACI-optimized.jpg');
    }
  }

  function revealElement(el, index) {
    window.setTimeout(function () {
      addClass(el, 'safari-visible');
      addClass(el, 'animate-in');
      removeClass(el, 'opacity-0');
    }, Math.min(index * 30, 360));
  }

  function revealHero() {
    toArray(doc.querySelectorAll('.hero-reveal')).forEach(revealElement);
  }

  function ensureSplashDismissal() {
    window.setTimeout(function () {
      var splash = doc.getElementById('splash-loader');

      if (splash && !hasClass(splash, 'fade-out')) {
        addClass(splash, 'fade-out');
      }

      revealHero();
    }, 4200);
  }

  function ensureReveals() {
    var nodes = toArray(doc.querySelectorAll('.reveal'));

    if (!nodes.length) return;

    if (!('IntersectionObserver' in window)) {
      nodes.forEach(revealElement);
      addClass(doc.body, 'safari-force-visible');
      window.MACI_REVEAL_READY = true;
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        revealElement(entry.target, 0);
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.05,
      rootMargin: '0px 0px -35px 0px'
    });

    nodes.forEach(function (node) {
      observer.observe(node);
    });

    window.setTimeout(function () {
      nodes.forEach(function (node, index) {
        var rect = node.getBoundingClientRect();
        var isStillHidden = window.getComputedStyle(node).opacity === '0';

        if (isStillHidden && rect.top < window.innerHeight * 1.2) {
          revealElement(node, index);
        }
      });
    }, 1800);

    window.MACI_REVEAL_READY = true;
  }

  function ensureCoreFallbacks() {
    if (window.MACI_CORE_READY) return;
    initMenuFallback();
    initWaveFallback();
    initPlatformsFallback();
    initLanguageFallback();
    initCounterFallbacks();
    window.MACI_CORE_READY = true;
  }

  function initMenuFallback() {
    var menuBtn = doc.getElementById('mobile-menu-btn');
    var closeBtn = doc.getElementById('close-menu-btn');
    var menu = doc.getElementById('mobile-menu');

    if (!menuBtn || !closeBtn || !menu || menu.getAttribute('data-safari-menu') === '1') return;
    menu.setAttribute('data-safari-menu', '1');

    function toggle(show) {
      if (show) {
        removeClass(menu, 'hidden');
        window.setTimeout(function () {
          removeClass(menu, 'opacity-0');
          removeClass(menu, 'translate-x-full');
          addClass(menu, 'opacity-100');
          addClass(menu, 'translate-x-0');
        }, 16);
        return;
      }

      addClass(menu, 'opacity-0');
      addClass(menu, 'translate-x-full');
      removeClass(menu, 'opacity-100');
      removeClass(menu, 'translate-x-0');
      window.setTimeout(function () {
        addClass(menu, 'hidden');
      }, 500);
    }

    menuBtn.addEventListener('click', function () {
      toggle(true);
    });
    closeBtn.addEventListener('click', function () {
      toggle(false);
    });
    toArray(menu.querySelectorAll('a')).forEach(function (link) {
      link.addEventListener('click', function () {
        toggle(false);
      });
    });
  }

  function initWaveFallback() {
    var container = doc.getElementById('waveContainer');
    var i;
    var bar;

    if (!container || container.children.length) return;

    for (i = 0; i < 45; i += 1) {
      bar = doc.createElement('div');
      bar.className = 'bar';
      bar.style.animationDelay = (Math.random() * 2) + 's';
      bar.style.animationDuration = (0.5 + Math.random() * 1.5) + 's';
      container.appendChild(bar);
    }
  }

  function initPlatformsFallback() {
    var grid = doc.getElementById('platform-grid');
    var platforms;

    if (!grid || grid.children.length) return;

    platforms = [
      ['Spotify', 'spotify'],
      ['Amazon Music', 'amazonmusic'],
      ['Tidal', 'tidal'],
      ['Apple Music', 'apple'],
      ['Shazam', 'shazam'],
      ['Instagram', 'instagram'],
      ['Snapchat', 'snapchat'],
      ['TikTok', 'tiktok'],
      ['Musixmatch', 'musixmatch'],
      ['YouTube Music', 'youtubemusic'],
      ['QQ Music', 'qqmusic'],
      ['iTunes', 'itunes'],
      ['CapCut', 'capcut'],
      ['Audiomack', 'audiomack']
    ];

    platforms.forEach(function (platform) {
      var card = doc.createElement('div');
      var logo = doc.createElement('div');
      var image = doc.createElement('img');
      var label = doc.createElement('span');

      card.className = 'reveal safari-visible animate-in flex flex-col items-center justify-center p-8 bg-surface border border-outline-variant/10 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/5 group cursor-pointer';
      logo.className = 'w-12 h-12 mb-4 flex items-center justify-center transition-all duration-300';
      image.src = 'https://cdn.simpleicons.org/' + platform[1];
      image.alt = platform[0];
      image.className = 'w-full h-full object-contain transition-all duration-500 opacity-40 group-hover:opacity-100';
      image.referrerPolicy = 'no-referrer';
      label.className = 'text-[0.7rem] font-bold uppercase tracking-widest text-white/70 group-hover:text-primary transition-colors';
      label.appendChild(doc.createTextNode(platform[0]));

      logo.appendChild(image);
      card.appendChild(logo);
      card.appendChild(label);
      grid.appendChild(card);
    });
  }

  function initLanguageFallback() {
    var toggle = doc.getElementById('language-toggle');
    var circle = doc.getElementById('toggle-circle');
    var labelEs = doc.getElementById('label-es');
    var labelEn = doc.getElementById('label-en');
    var currentLang = 'es';

    if (!toggle || !circle || !labelEs || !labelEn || toggle.getAttribute('data-safari-lang') === '1') return;
    toggle.setAttribute('data-safari-lang', '1');

    function setText(el, lang) {
      var text = el.getAttribute(lang === 'en' ? 'data-i18n-en' : 'data-i18n-es');
      if (text !== null) el.textContent = text;
    }

    function changeLanguage(lang) {
      currentLang = lang;
      circle.style.transform = lang === 'en' ? 'translateX(24px)' : 'translateX(0)';
      if (lang === 'en') {
        addClass(labelEn, 'text-white');
        removeClass(labelEn, 'text-white/40');
        removeClass(labelEs, 'text-white');
        addClass(labelEs, 'text-white/40');
      } else {
        addClass(labelEs, 'text-white');
        removeClass(labelEs, 'text-white/40');
        removeClass(labelEn, 'text-white');
        addClass(labelEn, 'text-white/40');
      }
      toArray(doc.querySelectorAll('[data-i18n-es]')).forEach(function (el) {
        setText(el, lang);
      });
    }

    toggle.addEventListener('click', function () {
      changeLanguage(currentLang === 'es' ? 'en' : 'es');
    });
  }

  function initCounterFallbacks() {
    var bpmCounter = doc.getElementById('bpm-counter');
    var timeCounter = doc.getElementById('time-counter');
    var audienceCounter = doc.getElementById('audience-counter');
    var seconds = 0;

    if (!bpmCounter || !timeCounter || !audienceCounter) return;

    window.setInterval(function () {
      bpmCounter.textContent = String(Math.floor(118 + Math.random() * 4));
    }, 2000);

    window.setInterval(function () {
      var mins;
      var secs;

      seconds += 1;
      mins = String(Math.floor(seconds / 60));
      secs = String(seconds % 60);
      if (mins.length < 2) mins = '0' + mins;
      if (secs.length < 2) secs = '0' + secs;
      timeCounter.textContent = mins + ':' + secs;
    }, 1000);
  }

  function ensureCarouselFallback() {
    var embla = doc.querySelector('.embla');
    var dots = doc.querySelector('.embla__dots');
    var slides;
    var ticking = false;

    if (!embla || !dots || window.MACI_EMBLA_READY || dots.children.length) return;

    slides = toArray(embla.querySelectorAll('.embla__slide'));
    if (!slides.length) return;

    addClass(embla, 'safari-carousel-fallback');
    dots.innerHTML = '';

    function setActive(index) {
      toArray(dots.querySelectorAll('.embla__dot')).forEach(function (dot, dotIndex) {
        if (dotIndex === index) {
          addClass(dot, 'is-active');
        } else {
          removeClass(dot, 'is-active');
        }
      });
    }

    function getCurrentIndex() {
      var closest = 0;
      var closestDistance = Infinity;

      slides.forEach(function (slide, index) {
        var distance = Math.abs(slide.offsetLeft - embla.scrollLeft);
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = index;
        }
      });

      return closest;
    }

    function scrollToSlide(index) {
      var left = slides[index].offsetLeft;

      try {
        embla.scrollTo({ left: left, behavior: 'smooth' });
      } catch (e) {
        embla.scrollLeft = left;
      }

      setActive(index);
    }

    slides.forEach(function (_, index) {
      var dot = doc.createElement('button');
      dot.className = 'embla__dot';
      dot.setAttribute('aria-label', 'Go to snap ' + (index + 1));
      dot.addEventListener('click', function () {
        scrollToSlide(index);
      });
      dots.appendChild(dot);
    });

    embla.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        setActive(getCurrentIndex());
        ticking = false;
      });
    }, false);

    setActive(0);
    window.MACI_EMBLA_READY = true;
  }

  function ensureAlbumFallback() {
    var cards;
    var activeCard = null;
    var activeAudio = null;
    var activeTimer = null;
    var canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;

    if (window.MACI_ALBUM_INTERACTIONS_READY) return;

    cards = toArray(doc.querySelectorAll('.album-card'));
    if (!cards.length) return;

    function stopAudio() {
      if (activeTimer) {
        window.clearTimeout(activeTimer);
        activeTimer = null;
      }

      if (activeAudio) {
        activeAudio.pause();
        activeAudio.currentTime = 0;
        activeAudio = null;
      }
    }

    function setVisual(card, active) {
      var vinyl = card.querySelector('.vinyl-record');
      var overlay = card.querySelector('.info-overlay');
      var cover = card.querySelector('.album-cover');
      var disc = card.querySelector('.vinyl-disc');

      if (active) {
        addClass(card, 'is-active');
        if (vinyl) {
          removeClass(vinyl, 'opacity-0');
          addClass(vinyl, 'opacity-100');
        }
        if (overlay) {
          removeClass(overlay, 'opacity-0');
          removeClass(overlay, 'translate-y-5');
          addClass(overlay, 'opacity-100');
          addClass(overlay, 'translate-y-0');
        }
        if (cover) addClass(cover, '-translate-x-full');
        if (disc) addClass(disc, 'animate-spin-vinyl');
        return;
      }

      removeClass(card, 'is-active');
      if (vinyl) {
        removeClass(vinyl, 'opacity-100');
        addClass(vinyl, 'opacity-0');
      }
      if (overlay) {
        removeClass(overlay, 'opacity-100');
        removeClass(overlay, 'translate-y-0');
        addClass(overlay, 'opacity-0');
        addClass(overlay, 'translate-y-5');
      }
      if (cover) removeClass(cover, '-translate-x-full');
      if (disc) {
        removeClass(disc, 'animate-spin-vinyl');
        disc.style.transform = '';
      }
    }

    function deactivate() {
      if (activeCard) setVisual(activeCard, false);
      stopAudio();
      activeCard = null;
    }

    function activate(card, withAudio) {
      var src;
      var duration;

      if (activeCard && activeCard !== card) deactivate();
      activeCard = card;
      setVisual(card, true);

      if (!withAudio) return;

      stopAudio();
      src = card.getAttribute('data-audio');
      duration = Number(card.getAttribute('data-duration') || 30);
      if (!src) return;

      activeAudio = new Audio(src);
      activeAudio.volume = 0.5;

      var playPromise = activeAudio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {});
      }
      activeTimer = window.setTimeout(deactivate, duration * 1000);
    }

    cards.forEach(function (card) {
      if (card.getAttribute('data-safari-card') === '1') return;
      card.setAttribute('data-safari-card', '1');

      if (canHover) {
        card.addEventListener('mouseenter', function () {
          activate(card, false);
        });
        card.addEventListener('mouseleave', function () {
          if (activeCard === card && !activeAudio) deactivate();
        });
      }

      card.addEventListener('click', function (event) {
        if (event.target.closest && event.target.closest('a, button')) return;

        if (activeCard === card && activeAudio) {
          deactivate();
          return;
        }

        activate(card, true);
      });
    });

    window.MACI_ALBUM_INTERACTIONS_READY = true;
  }

  ready(function () {
    addClass(root, 'safari-dom-ready');
    applyHeroFallback();
    ensureSplashDismissal();
    ensureReveals();

    window.setTimeout(ensureCoreFallbacks, 900);
    window.setTimeout(ensureAlbumFallback, 1200);
    window.setTimeout(ensureCarouselFallback, 2600);
  });
})();
