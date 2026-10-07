'use strict';

// Optimización de imágenes al subirlas a Strapi.
//
// Solo actúa sobre imágenes grandes (más de LADO_MAXIMO px o de PESO_MAXIMO):
// las orienta según la cámara, las reduce a LADO_MAXIMO px como mucho y las
// recomprime con calidad alta, manteniendo el formato y el nombre. Las
// imágenes que ya son ligeras se guardan tal cual, sin pérdida.
//
// Es la copia "maestra" que se guarda en el repo; después Astro genera las
// versiones AVIF/WebP a la medida de cada pantalla.

const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const LADO_MAXIMO = 2000; // px: de sobra para portadas (se muestran a ≤1200 px)
const PESO_MAXIMO = 800 * 1024; // bytes
const FORMATOS = new Set(['jpeg', 'png', 'webp']);

const codificar = {
  jpeg: (s) => s.jpeg({ quality: 86, mozjpeg: true }),
  webp: (s) => s.webp({ quality: 86 }),
  png: (s) => s.png({ compressionLevel: 9, adaptiveFiltering: true }), // sin pérdida
};

// Optimiza `origen` y devuelve { ruta, info, formato } del resultado, o null
// si no hace falta o si el resultado no pesa menos. Con `permitirJpg`, un PNG
// grande sin transparencia (una foto) se convierte a JPG, mucho más ligero.
async function optimizarArchivo(origen, destinoDir = os.tmpdir(), { permitirJpg = false } = {}) {
  const sharp = require('sharp');
  const meta = await sharp(origen).metadata();
  const { size } = await fs.stat(origen);
  if (!FORMATOS.has(meta.format) || (meta.pages || 1) > 1) return null;

  const lado = Math.max(meta.width || 0, meta.height || 0);
  if (lado <= LADO_MAXIMO && size <= PESO_MAXIMO) return null;

  let formato = meta.format;
  if (permitirJpg && formato === 'png' && (!meta.hasAlpha || (await sharp(origen).stats()).isOpaque)) {
    formato = 'jpeg';
  }

  const destino = path.join(destinoDir, `maci-opt-${crypto.randomUUID()}.${formato === 'jpeg' ? 'jpg' : formato}`);
  const info = await codificar[formato](
    sharp(origen).rotate().resize({ width: LADO_MAXIMO, height: LADO_MAXIMO, fit: 'inside', withoutEnlargement: true }),
  ).toFile(destino);

  if (info.size >= size) {
    await fs.rm(destino, { force: true });
    return null;
  }
  return { ruta: destino, info, formato, antes: { size, width: meta.width, height: meta.height, formato: meta.format } };
}

// Sustituye el paso "optimize" del plugin de subida (lo usan la subida y el
// reemplazo de archivos en la biblioteca de medios).
function instalarOptimizacion(strapi) {
  const servicio = strapi.plugin('upload').service('image-manipulation');
  servicio.optimize = async (file) => {
    if (!file.filepath) return file;
    try {
      const r = await optimizarArchivo(file.filepath, file.tmpWorkingDirectory || os.tmpdir(), { permitirJpg: true });
      if (!r) return file;
      strapi.log.info(`[maci-sync] Imagen optimizada: ${file.name} ${r.antes.width}×${r.antes.height} ${Math.round(r.antes.size / 1024)} KB → ${r.info.width}×${r.info.height} ${Math.round(r.info.size / 1024)} KB`);
      // Si una foto PNG pasa a JPG, se actualizan extensión, tipo y nombre.
      const aJpg = r.formato !== r.antes.formato;
      return {
        ...file,
        ...(aJpg ? { ext: '.jpg', mime: 'image/jpeg', name: file.name.replace(/\.png$/i, '.jpg') } : {}),
        filepath: r.ruta,
        getStream: () => require('fs').createReadStream(r.ruta),
        width: r.info.width,
        height: r.info.height,
        size: Math.round((r.info.size / 1024) * 100) / 100,
        sizeInBytes: r.info.size,
      };
    } catch (e) {
      strapi.log.warn(`[maci-sync] No se pudo optimizar ${file.name}: ${e.message}`);
      return file;
    }
  };
}

module.exports = { optimizarArchivo, instalarOptimizacion, LADO_MAXIMO, PESO_MAXIMO };
