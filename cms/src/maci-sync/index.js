'use strict';

// Sincronización Strapi ⇄ web.
//
// La web (Astro) no habla con Strapi: se construye desde src/data/*.json y los
// archivos del repo. Este módulo hace de puente:
//
//   - importar(): si Strapi está vacío, lo rellena desde los JSON y archivos
//     de la web (primer arranque o base de datos perdida).
//   - exportar(): vuelca lo publicado en Strapi a los JSON de la web y copia
//     portadas, audios y logos a su sitio. Se ejecuta solo tras cada cambio.

const fs = require('fs/promises');
const fss = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const DISCO = 'api::disco.disco';
const PLATAFORMA = 'api::plataforma.plataforma';

const BADGE_A_WEB = { ninguna: null, nuevo_lanzamiento: 'new', reproduciendo: 'playing' };
const BADGE_A_CMS = { null: 'ninguna', new: 'nuevo_lanzamiento', playing: 'reproduciendo' };
const TAMANO_A_WEB = { normal: undefined, grande_110: 'scale-110', grande_125: 'scale-125', grande_150: 'scale-150' };
const TAMANO_A_CMS = { 'scale-110': 'grande_110', 'scale-125': 'grande_125', 'scale-150': 'grande_150' };

const MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg',
};

function rutas(strapi) {
  const web = path.resolve(strapi.dirs.app.root, '..');
  return {
    web,
    albums: path.join(web, 'src/data/albums.json'),
    platforms: path.join(web, 'src/data/platforms.json'),
    imagenes: path.join(web, 'src/assets/images'),
    audios: path.join(web, 'public/music-preview'),
    logos: path.join(web, 'public/images/platforms'),
    publicWeb: path.join(web, 'public'),
    uploads: strapi.dirs.static.public,
  };
}

const nombreSeguro = (name) => path.basename(String(name))
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^\w.-]+/g, '-')
  .replace(/^-+|-+$/g, '');

const hash = async (file) => crypto.createHash('sha1').update(await fs.readFile(file)).digest('hex');

// Escribe solo si cambia, para no disparar recargas de Astro sin motivo.
async function escribirSiCambia(file, contenido) {
  const actual = await fs.readFile(file, 'utf8').catch(() => null);
  if (actual === contenido) return false;
  await fs.writeFile(file, contenido);
  return true;
}

async function copiarSiCambia(origen, destino) {
  if (fss.existsSync(destino) && (await hash(origen)) === (await hash(destino))) return false;
  await fs.mkdir(path.dirname(destino), { recursive: true });
  await fs.copyFile(origen, destino);
  return true;
}

// ---------------------------------------------------------------- exportar

async function exportar(strapi) {
  const r = rutas(strapi);
  const cambios = [];

  const archivoDe = (media) => path.join(r.uploads, decodeURIComponent(media.url));
  // Nombre estable en la web: el nombre original del archivo subido.
  const nombreDe = (media) => nombreSeguro(`${path.parse(media.name).name}${media.ext}`);

  const discos = await strapi.documents(DISCO).findMany({
    status: 'published',
    sort: ['orden:asc', 'id:asc'],
    populate: ['portada', 'audio'],
  });

  const albums = [];
  for (const d of discos) {
    if (!d.portada || !d.audio) {
      strapi.log.warn(`[maci-sync] "${d.titulo}" sin portada o audio: no se exporta`);
      continue;
    }
    const portada = nombreDe(d.portada);
    const audio = nombreDe(d.audio);
    if (await copiarSiCambia(archivoDe(d.portada), path.join(r.imagenes, portada))) cambios.push(`portada ${portada}`);
    if (await copiarSiCambia(archivoDe(d.audio), path.join(r.audios, audio))) cambios.push(`audio ${audio}`);

    const descripcion = d.descripcionEs || d.descripcionEn
      ? { es: d.descripcionEs || '', en: d.descripcionEn || '' }
      : null;

    albums.push({
      id: d.slug,
      title: d.titulo,
      uppercaseTitle: Boolean(d.tituloEnMayusculas),
      ...(d.resaltarAlPasar ? { highlightOnHover: true } : {}),
      ...(d.subtituloCompacto ? { compactKicker: true } : {}),
      cover: portada,
      coverAlt: d.textoAlternativoPortada || `Portada de ${d.titulo}`,
      labelAlt: d.textoAlternativoVinilo || '',
      audio: `/music-preview/${audio}`,
      duration: d.duracionPreview || 30,
      badge: BADGE_A_WEB[d.etiqueta] ?? null,
      kicker: { es: d.subtituloEs, en: d.subtituloEn },
      year: d.anio || null,
      description: descripcion,
      tags: d.palabrasClave || null,
      countdown: d.cuentaAtrasFecha
        ? { date: new Date(d.cuentaAtrasFecha).toISOString(), label: d.cuentaAtrasTexto || 'LANZAMIENTO EN' }
        : null,
      spotify: d.enlaceSpotify,
      spotifyLabel: d.textoAccesibleSpotify || `Escuchar ${d.titulo} en Spotify`,
    });
  }

  const plataformas = await strapi.documents(PLATAFORMA).findMany({
    sort: ['orden:asc', 'id:asc'],
    populate: ['logo'],
  });

  const platforms = [];
  for (const p of plataformas) {
    if (!p.logo) continue;
    const logo = nombreDe(p.logo);
    if (await copiarSiCambia(archivoDe(p.logo), path.join(r.logos, logo))) cambios.push(`logo ${logo}`);
    platforms.push({
      name: p.nombre,
      logo: `/images/platforms/${logo}`,
      ...(p.invertirColor ? { isDark: true } : {}),
      ...(TAMANO_A_WEB[p.tamano] ? { scale: TAMANO_A_WEB[p.tamano] } : {}),
    });
  }

  // Nunca dejar la web vacía por un error: si no hay nada publicado, no se toca.
  if (albums.length && await escribirSiCambia(r.albums, `${JSON.stringify(albums, null, 2)}\n`)) cambios.push('albums.json');
  if (platforms.length && await escribirSiCambia(r.platforms, `${JSON.stringify(platforms, null, 2)}\n`)) cambios.push('platforms.json');

  strapi.log.info(cambios.length
    ? `[maci-sync] Web actualizada: ${cambios.join(', ')}`
    : '[maci-sync] Web ya al día');
  return cambios;
}

// ----------------------------------------------------------------- importar

async function subirArchivo(strapi, origen, alt) {
  const ext = path.extname(origen).toLowerCase();
  const nombre = path.basename(origen);
  // El servicio de subida puede mover el archivo temporal: se trabaja con una copia.
  const tmp = path.join(os.tmpdir(), `maci-${crypto.randomUUID()}${ext}`);
  await fs.copyFile(origen, tmp);
  const { size } = await fs.stat(tmp);
  const [archivo] = await strapi.plugin('upload').service('upload').upload({
    data: { fileInfo: { name: nombre, alternativeText: alt || null } },
    files: { filepath: tmp, originalFilename: nombre, mimetype: MIME[ext] || 'application/octet-stream', size },
  });
  await fs.rm(tmp, { force: true });
  return archivo;
}

async function importar(strapi) {
  const hayDiscos = await strapi.documents(DISCO).count({});
  const hayPlataformas = await strapi.documents(PLATAFORMA).count({});
  if (hayDiscos || hayPlataformas) return false;

  const r = rutas(strapi);
  strapi.log.info('[maci-sync] Strapi vacío: importando el contenido actual de la web…');

  const albums = JSON.parse(await fs.readFile(r.albums, 'utf8'));
  for (const [i, a] of albums.entries()) {
    const portada = await subirArchivo(strapi, path.join(r.imagenes, a.cover), a.coverAlt);
    const audio = await subirArchivo(strapi, path.join(r.publicWeb, a.audio));
    await strapi.documents(DISCO).create({
      status: 'published',
      data: {
        titulo: a.title,
        slug: nombreSeguro(a.title.toLowerCase()) || `disco-${i + 1}`,
        orden: (i + 1) * 10,
        portada: portada.id,
        audio: audio.id,
        duracionPreview: a.duration,
        etiqueta: BADGE_A_CMS[a.badge] || 'ninguna',
        subtituloEs: a.kicker.es,
        subtituloEn: a.kicker.en,
        anio: a.year,
        descripcionEs: a.description?.es || null,
        descripcionEn: a.description?.en || null,
        palabrasClave: a.tags,
        enlaceSpotify: a.spotify,
        textoAccesibleSpotify: a.spotifyLabel,
        textoAlternativoPortada: a.coverAlt,
        textoAlternativoVinilo: a.labelAlt || null,
        cuentaAtrasFecha: a.countdown ? new Date(a.countdown.date).toISOString() : null,
        cuentaAtrasTexto: a.countdown?.label || null,
        tituloEnMayusculas: Boolean(a.uppercaseTitle),
        subtituloCompacto: Boolean(a.compactKicker),
        resaltarAlPasar: Boolean(a.highlightOnHover),
      },
    });
  }

  const platforms = JSON.parse(await fs.readFile(r.platforms, 'utf8'));
  for (const [i, p] of platforms.entries()) {
    const local = p.logo.startsWith('/') ? path.join(r.publicWeb, p.logo) : null;
    if (!local || !fss.existsSync(local)) {
      strapi.log.warn(`[maci-sync] Logo de ${p.name} no encontrado en local (${p.logo}): se omite`);
      continue;
    }
    const logo = await subirArchivo(strapi, local, p.name);
    await strapi.documents(PLATAFORMA).create({
      data: {
        nombre: p.name,
        orden: (i + 1) * 10,
        logo: logo.id,
        invertirColor: Boolean(p.isDark),
        tamano: TAMANO_A_CMS[p.scale] || 'normal',
      },
    });
  }

  strapi.log.info(`[maci-sync] Importados ${albums.length} discos y ${platforms.length} plataformas`);
  return true;
}

// ------------------------------------------------- exportación automática

let activo = false;
let timer = null;

function programarExportacion(strapi) {
  if (!activo) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    exportar(strapi).catch((e) => strapi.log.error(`[maci-sync] Error al exportar: ${e.message}`));
  }, 600);
}

// Se registra en register(): reacciona a cualquier cambio en discos o plataformas.
function registrarMiddleware(strapi) {
  const ACCIONES = new Set(['create', 'update', 'delete', 'publish', 'unpublish', 'discardDraft']);
  strapi.documents.use(async (ctx, next) => {
    const resultado = await next();
    if ((ctx.uid === DISCO || ctx.uid === PLATAFORMA) && ACCIONES.has(ctx.action)) {
      programarExportacion(strapi);
    }
    return resultado;
  });
}

function activarExportacionAutomatica() {
  activo = true;
}

module.exports = { exportar, importar, registrarMiddleware, activarExportacionAutomatica };
