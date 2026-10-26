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

    if (red === 'instagram' || red === 'tiktok') {
      boton.addEventListener('click', () => abrirRedImagen(seccion, texto, red));
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

// Instagram y TikTok: ventana con una imagen vertical (la genera Strapi).
// En el móvil se comparte el archivo con el menú del sistema (aparecen
// Instagram y TikTok); en el ordenador se descarga. Se copia el enlace
// (sticker «Enlace» de Instagram) o una descripción con enlace y hashtags
// (TikTok, donde los enlaces no son clicables).
const archivos = new Map();

async function obtenerArchivo(ruta, nombre) {
  if (!archivos.has(ruta)) {
    const blob = await fetch(ruta).then((r) => r.blob());
    archivos.set(ruta, new File([blob], nombre, { type: 'image/jpeg' }));
  }
  return archivos.get(ruta);
}

async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

const HASHTAGS = {
  es: '#MACI #Quédate #crowdfunding #música #músicacubana',
  en: '#MACI #Quédate #crowdfunding #music #cubanmusic',
};

function abrirRedImagen(seccion, texto, red) {
  const dialogo = seccion.querySelector(`[data-dialogo-red="${red}"]`);
  if (!dialogo) return;
  const url = seccion.dataset.url;
  const lang = () => (document.documentElement.lang === 'en' ? 'en' : 'es');
  const aCopiar = () => (dialogo.dataset.copiar === 'descripcion'
    ? `${texto()}\n\n👉 ${url}\n\n${HASHTAGS[lang()]}`
    : url);
  const puedeCompartir = Boolean(navigator.canShare && navigator.canShare({ files: [new File([''], 'x.jpg', { type: 'image/jpeg' })] }));
  const el = (sel) => dialogo.querySelector(sel);

  // Modo móvil (compartir archivo) o escritorio (descargar).
  el('[data-accion="compartir"]').classList.toggle('hidden', !puedeCompartir);
  el('[data-accion="descargar"]').classList.toggle('hidden', puedeCompartir);
  el('[data-accion="descargar"]').classList.toggle('flex', !puedeCompartir);
  el('[data-paso="movil"]').classList.toggle('hidden', !puedeCompartir);
  el('[data-paso="escritorio"]').classList.toggle('hidden', puedeCompartir);

  if (!dialogo.dataset.listo) {
    dialogo.dataset.listo = '1';
    const evento = (method) => {
      if (window.gtag) window.gtag('event', 'share', { method, content_type: 'crowdfunding', item_id: url });
    };
    el('[data-accion="cerrar"]').addEventListener('click', () => dialogo.close());
    dialogo.addEventListener('click', (e) => { if (e.target === dialogo) dialogo.close(); });

    el('[data-accion="compartir"]').addEventListener('click', async () => {
      await copiarTexto(aCopiar());
      try {
        const archivo = await obtenerArchivo(dialogo.dataset.imagen, dialogo.dataset.descarga);
        await navigator.share({ files: [archivo], text: aCopiar() });
        evento(red);
      } catch (e) {
        if (e && e.name !== 'AbortError') console.warn(`${red}: no se pudo compartir la imagen`, e);
      }
    });

    el('[data-accion="descargar"]').addEventListener('click', () => {
      copiarTexto(aCopiar());
      evento(`${red}_descarga`);
    });

    const textoBoton = el('[data-texto-copiar]');
    el('[data-accion="copiar"]').addEventListener('click', async () => {
      const original = textoBoton.textContent;
      if (!(await copiarTexto(aCopiar()))) { window.prompt('Copia el texto:', aCopiar()); return; }
      textoBoton.textContent = lang() === 'en' ? 'Copied!' : '¡Copiado!';
      setTimeout(() => { textoBoton.textContent = original; }, 2200);
    });
  }

  copiarTexto(aCopiar());
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
