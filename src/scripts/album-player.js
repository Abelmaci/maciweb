// Previsualización de audio de los discos con scratch real
// (ScriptProcessorNode, ver scratch-processor.js). Antes vivía dentro de
// src/vanilla-app.js.
import { ScratchProcessor } from './scratch-processor.js';

const closestInteractive = (target) => (
  target && typeof target.closest === 'function' ? target.closest('a, button') : null
);

const resumeAudioContext = () => {
  if (window.audioCtx && window.audioCtx.state === 'suspended') {
    const resumePromise = window.audioCtx.resume();
    if (resumePromise && typeof resumePromise.catch === 'function') {
      resumePromise.catch(e => console.warn('AudioContext resume failed:', e));
    }
  }
};

const playAudioElement = (audioEl) => {
  const playPromise = audioEl.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(e => console.warn('Audio play error:', e));
  }
};

export function initAlbumPlayer() {
  const isSafari = Boolean(window.MACI_IS_SAFARI);

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

        if (isSafari && card.dataset.safariAudioGesture !== '1') {
          return;
        }

        if (!animFrameId) animFrameId = requestAnimationFrame(updateVinylRotation);

        if (!window.audioCtx) {
          window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        resumeAudioContext();

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
        playAudioElement(currentAudioEl);
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
        delete card.dataset.safariAudioGesture;

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

      // El navegador solo permite iniciar audio tras un gesto real del
      // usuario (clic/tap/tecla) — un simple hover (mouseenter) no cuenta,
      // así que el clic desbloquea el AudioContext y relanza la reproducción.
      card.addEventListener('click', (e) => {
        if (closestInteractive(e.target)) return;

        if (isSafari) {
          card.dataset.safariAudioGesture = '1';
          if (currentAudioEl && currentAudioEl.paused) {
            currentAudioEl = null;
          }
        }

        if (!window.audioCtx) {
          window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        resumeAudioContext();

        if (!currentScratchProcessor && !currentAudioEl) {
          handleEnter();
        }
      });

      // --- SCRATCH EFFECT ---
      // Eventos en `card` (no en disc) para evitar que info-overlay (z-20) intercepte
      const handlePointerDown = (e) => {
        if (!card.classList.contains('is-active') || !currentScratchProcessor) return;
        if (!e.isPrimary) return;
        if (closestInteractive(e.target)) return; // permite clics en Spotify, etc.

        isScratching = true;
        currentScratchProcessor.isScratching = true;
        currentScratchProcessor.speed = 0;
        lastX = e.clientX;
        lastY = e.clientY;
        lastScratchTimestamp = performance.now();

        if (card.setPointerCapture && e.pointerId != null) {
          try {
            card.setPointerCapture(e.pointerId);
          } catch (err) {
            console.warn('Pointer capture failed:', err);
          }
        }
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
          if (isSafari) card.dataset.safariAudioGesture = '1';
          if (card.classList.contains('is-active')) {
            handleLeave();
          } else {
            handleEnter();
          }
        });
      }
    });

    window.MACI_ALBUM_INTERACTIONS_READY = true;
  } catch (e) {
    console.warn('Audio preview logic error (non-critical):', e);
  }
}
