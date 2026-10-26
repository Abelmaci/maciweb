// Campaña de crowdfunding: datos en vivo desde la API pública de The Muxic y
// botones para compartir. El HTML ya trae los datos del momento del build;
// aquí se actualizan al cargar y cada 5 minutos.

const euros = (n) => `${new Intl.NumberFormat('es-ES', { useGrouping: 'always' }).format(n)} €`;

function pintar(seccion, datos) {
  const campo = (nombre) => seccion.querySelector(`[data-cf="${nombre}"]`);
  const objetivo = Number(datos.economic_objective) || Number(seccion.dataset.objetivo);
  const recaudado = Number(datos.amount_collected) || 0;
  const porcentaje = Math.min(100, Math.round((recaudado / objetivo) * 100));
  // Igual que The Muxic: días hasta el inicio del último día.
  const fecha = datos.final_date || seccion.dataset.fechaFinal;
  const dias = Math.max(0, Math.ceil((Date.parse(`${fecha}T00:00:00+01:00`) - Date.now()) / 86400000));

  if (campo('recaudado')) campo('recaudado').textContent = euros(recaudado);
  if (campo('objetivo')) campo('objetivo').textContent = euros(objetivo);
  if (campo('porcentaje')) campo('porcentaje').textContent = `${porcentaje}%`;
  if (campo('dias')) campo('dias').textContent = String(dias);
  if (campo('barra')) {
    campo('barra').style.width = `${porcentaje}%`;
    campo('barra').parentElement.setAttribute('aria-valuenow', String(porcentaje));
  }
}

async function actualizar(seccion) {
  const { api, id } = seccion.dataset;
  try {
    const [campana, aportaciones] = await Promise.all([
      fetch(`${api}/campaign/${id}/data/published/`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${api}/donation/${id}?page=1&size=1`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]);
    if (campana) pintar(seccion, campana);
    const total = seccion.querySelector('[data-cf="aportaciones"]');
    if (total && aportaciones) total.textContent = String(Number(aportaciones.total) || 0);
  } catch (e) {
    console.warn('Crowdfunding: no se pudieron actualizar los datos', e);
  }
}

function compartir(seccion) {
  const url = seccion.dataset.url;
  const texto = () => (document.documentElement.lang === 'en' ? seccion.dataset.textoEn : seccion.dataset.textoEs);
  const enlaces = {
    whatsapp: () => `https://wa.me/?text=${encodeURIComponent(`${texto()} ${url}`)}`,
    x: () => `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto())}&url=${encodeURIComponent(url)}`,
    facebook: () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    telegram: () => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(texto())}`,
  };
  const aviso = seccion.querySelector('[data-cf="copiado"]');

  seccion.querySelectorAll('[data-compartir]').forEach((boton) => {
    const red = boton.dataset.compartir;

    if (red === 'nativo') {
      if (!navigator.share) return;
      boton.classList.remove('hidden');
      boton.classList.add('flex');
      boton.addEventListener('click', () => {
        navigator.share({ title: seccion.dataset.titulo, text: texto(), url }).catch(() => {});
      });
      return;
    }

    if (red === 'instagram') {
      boton.addEventListener('click', () => abrirInstagram(seccion, texto));
      return;
    }

    if (red === 'copiar') {
      boton.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(url);
        } catch {
          window.prompt('Copia el enlace:', url);
          return;
        }
        if (aviso) {
          aviso.classList.remove('opacity-0');
          setTimeout(() => aviso.classList.add('opacity-0'), 2200);
        }
      });
      return;
    }

    boton.addEventListener('click', () => {
      window.open(enlaces[red](), '_blank', 'noopener,noreferrer,width=640,height=560');
      if (window.gtag) window.gtag('event', 'share', { method: red, content_type: 'crowdfunding', item_id: url });
    });
  });
}

// Instagram: ventana con la historia (1080×1920) generada por Strapi.
// En el móvil se comparte el archivo con el menú del sistema (aparece
// Instagram → Historias); en el ordenador se descarga. El enlace se copia
// para pegarlo en el sticker «Enlace».
const IMAGEN_HISTORIA = '/images/ig-story-crowdfunding.jpg';
let archivoHistoria = null;

async function obtenerArchivoHistoria() {
  if (!archivoHistoria) {
    const blob = await fetch(IMAGEN_HISTORIA).then((r) => r.blob());
    archivoHistoria = new File([blob], 'maci-quedate-historia.jpg', { type: 'image/jpeg' });
  }
  return archivoHistoria;
}

async function copiarEnlace(url) {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

function abrirInstagram(seccion, texto) {
  const dialogo = seccion.querySelector('[data-instagram]');
  if (!dialogo) return;
  const url = seccion.dataset.url;
  const puedeCompartir = Boolean(navigator.canShare && navigator.canShare({ files: [new File([''], 'x.jpg', { type: 'image/jpeg' })] }));

  // Modo móvil (compartir archivo) o escritorio (descargar).
  dialogo.querySelector('[data-ig="compartir"]').classList.toggle('hidden', !puedeCompartir);
  dialogo.querySelector('[data-ig="descargar"]').classList.toggle('hidden', puedeCompartir);
  dialogo.querySelector('[data-ig="descargar"]').classList.toggle('flex', !puedeCompartir);
  dialogo.querySelector('[data-ig-paso="movil"]').classList.toggle('hidden', !puedeCompartir);
  dialogo.querySelector('[data-ig-paso="escritorio"]').classList.toggle('hidden', puedeCompartir);

  if (!dialogo.dataset.listo) {
    dialogo.dataset.listo = '1';
    dialogo.querySelector('[data-ig="cerrar"]').addEventListener('click', () => dialogo.close());
    dialogo.addEventListener('click', (e) => { if (e.target === dialogo) dialogo.close(); });

    dialogo.querySelector('[data-ig="compartir"]').addEventListener('click', async () => {
      await copiarEnlace(url);
      try {
        const archivo = await obtenerArchivoHistoria();
        await navigator.share({ files: [archivo], text: `${texto()} ${url}` });
        if (window.gtag) window.gtag('event', 'share', { method: 'instagram', content_type: 'crowdfunding', item_id: url });
      } catch (e) {
        if (e && e.name !== 'AbortError') console.warn('Instagram: no se pudo compartir la imagen', e);
      }
    });

    dialogo.querySelector('[data-ig="descargar"]').addEventListener('click', () => {
      copiarEnlace(url);
      if (window.gtag) window.gtag('event', 'share', { method: 'instagram_descarga', content_type: 'crowdfunding', item_id: url });
    });

    const textoCopiar = dialogo.querySelector('[data-ig-copiar]');
    dialogo.querySelector('[data-ig="copiar"]').addEventListener('click', async () => {
      const original = textoCopiar.textContent;
      const ok = await copiarEnlace(url);
      if (!ok) { window.prompt('Copia el enlace:', url); return; }
      textoCopiar.textContent = document.documentElement.lang === 'en' ? 'Link copied!' : '¡Enlace copiado!';
      setTimeout(() => { textoCopiar.textContent = original; }, 2200);
    });
  }

  copiarEnlace(url);
  dialogo.showModal();
}

export function initCrowdfunding() {
  document.querySelectorAll('[data-crowdfunding]').forEach((seccion) => {
    compartir(seccion);
    // Analytics: clics hacia la campaña.
    seccion.querySelectorAll('a[href*="themuxic.club"]').forEach((a) => {
      a.addEventListener('click', () => {
        if (window.gtag) window.gtag('event', 'click_campana', { link_url: a.href });
      });
    });
    actualizar(seccion);
    setInterval(() => actualizar(seccion), 5 * 60 * 1000);
  });
}
