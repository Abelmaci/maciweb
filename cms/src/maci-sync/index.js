'use strict';

// Sincronización Strapi ⇄ web.
//
// La web (Astro) no habla con Strapi: se construye desde src/data/*.json y los
// archivos del repo. Este módulo hace de puente:
//
//   - importar() / importarTextos(): si Strapi está vacío, lo rellena desde
//     los JSON y archivos de la web (primer arranque o base de datos perdida).
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
    textos: path.join(web, 'src/data/textos.json'),
    banner: path.join(web, 'public/images/Banner-MACI-optimized'),
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

// ------------------------------------------------- textos de las secciones

// Clave en src/data/textos.json → tipo individual de Strapi.
const SECCIONES = {
  ajustes: 'api::seccion-ajustes.seccion-ajustes',
  portada: 'api::seccion-portada.seccion-portada',
  discografia: 'api::seccion-discografia.seccion-discografia',
  biografia: 'api::seccion-biografia.seccion-biografia',
  adela: 'api::seccion-adela.seccion-adela',
  plataformas: 'api::seccion-plataformas.seccion-plataformas',
  loQueViene: 'api::seccion-lo-que-viene.seccion-lo-que-viene',
  apps: 'api::seccion-apps.seccion-apps',
  colaboraciones: 'api::seccion-colaboraciones.seccion-colaboraciones',
  pie: 'api::seccion-pie.seccion-pie',
};

// Convierte una entrada de Strapi al formato de textos.json, siguiendo el
// orden de campos del esquema. Las fotos se copian a src/assets/images.
async function aWeb(strapi, schema, valor, archivos) {
  const out = {};
  for (const [campo, attr] of Object.entries(schema.attributes)) {
    if (!('type' in attr) || attr.private || ['id', 'documentId', 'createdAt', 'updatedAt', 'publishedAt', 'createdBy', 'updatedBy', 'locale', 'localizations'].includes(campo)) continue;
    const v = valor?.[campo];
    if (attr.type === 'component') {
      const comp = strapi.components[attr.component];
      out[campo] = attr.repeatable
        ? await Promise.all((v || []).map((item) => aWeb(strapi, comp, item, archivos)))
        : await aWeb(strapi, comp, v || {}, archivos);
    } else if (attr.type === 'media') {
      out[campo] = v ? await archivos.imagen(v) : '';
    } else if (attr.type === 'boolean') {
      out[campo] = Boolean(v);
    } else {
      out[campo] = v ?? '';
    }
  }
  return out;
}

// Al revés: de textos.json a datos de Strapi (subiendo las fotos).
async function aStrapi(strapi, schema, valor, subirImagen) {
  const out = {};
  for (const [campo, attr] of Object.entries(schema.attributes)) {
    if (!(campo in (valor || {}))) continue;
    const v = valor[campo];
    if (attr.type === 'component') {
      const comp = strapi.components[attr.component];
      out[campo] = attr.repeatable
        ? await Promise.all(v.map((item) => aStrapi(strapi, comp, item, subirImagen)))
        : await aStrapi(strapi, comp, v, subirImagen);
    } else if (attr.type === 'media') {
      out[campo] = v ? (await subirImagen(v)).id : null;
    } else {
      out[campo] = v;
    }
  }
  return out;
}

// Genera las dos versiones del banner que usa la web (máx. 1600 px de ancho).
async function generarBanner(origen, destinoSinExtension) {
  const sharp = require('sharp');
  const base = sharp(origen).rotate().resize({ width: 1600, withoutEnlargement: true });
  await base.clone().webp({ quality: 80 }).toFile(`${destinoSinExtension}.webp`);
  await base.clone().jpeg({ quality: 82, mozjpeg: true }).toFile(`${destinoSinExtension}.jpg`);
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

  // Textos de las secciones. Si falta alguna sección en Strapi se conserva la
  // que ya tenga la web.
  const textos = JSON.parse(await fs.readFile(r.textos, 'utf8').catch(() => '{}'));
  const archivos = {
    imagen: async (media) => {
      const nombre = nombreDe(media);
      if (await copiarSiCambia(archivoDe(media), path.join(r.imagenes, nombre))) cambios.push(`foto ${nombre}`);
      return nombre;
    },
  };
  const bannerAnterior = textos.portada?.banner;
  for (const [clave, uid] of Object.entries(SECCIONES)) {
    const entrada = await strapi.documents(uid).findFirst({ populate: '*' });
    if (!entrada) continue;
    textos[clave] = await aWeb(strapi, strapi.contentTypes[uid], entrada, archivos);
  }

  // Banner de la portada: la animación de partículas y Safari usan rutas fijas
  // (/images/Banner-MACI-optimized.webp y .jpg), que se regeneran solo cuando
  // se sube una imagen nueva.
  const banner = textos.portada?.banner;
  if (banner && (banner !== bannerAnterior || cambios.includes(`foto ${banner}`))) {
    await generarBanner(path.join(r.imagenes, banner), r.banner);
    cambios.push('banner de la portada (webp + jpg)');
  }
  if (await escribirSiCambia(r.textos, `${JSON.stringify(textos, null, 2)}\n`)) cambios.push('textos.json');

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

// Rellena las secciones que no existan todavía en Strapi desde textos.json.
async function importarTextos(strapi) {
  const r = rutas(strapi);
  const textos = JSON.parse(await fs.readFile(r.textos, 'utf8'));
  const subidas = new Map();
  const subirImagen = async (nombre) => {
    if (!subidas.has(nombre)) subidas.set(nombre, await subirArchivo(strapi, path.join(r.imagenes, nombre)));
    return subidas.get(nombre);
  };
  // Campos ya importados alguna vez: no se vuelven a rellenar aunque se
  // vacíen en el panel (se respeta lo que edites).
  const store = strapi.store({ type: 'plugin', name: 'maci-sync' });
  const importados = (await store.get({ key: 'campos-importados' })) || {};
  const vacio = (v) => v == null || v === '' || (Array.isArray(v) && v.length === 0);

  const creadas = [];
  const completadas = [];
  for (const [clave, uid] of Object.entries(SECCIONES)) {
    if (!textos[clave]) continue;
    const schema = strapi.contentTypes[uid];
    const campos = Object.keys(schema.attributes).filter((c) => c in textos[clave]);
    const existente = await strapi.documents(uid).findFirst({ populate: '*' });

    if (!existente) {
      const data = await aStrapi(strapi, schema, textos[clave], subirImagen);
      await strapi.documents(uid).create({ data });
      creadas.push(clave);
    } else {
      const ya = new Set(importados[uid] || []);
      const nuevos = campos.filter((c) => !ya.has(c) && vacio(existente[c]));
      if (nuevos.length) {
        const parcial = Object.fromEntries(nuevos.map((c) => [c, textos[clave][c]]));
        const data = await aStrapi(strapi, schema, parcial, subirImagen);
        await strapi.documents(uid).update({ documentId: existente.documentId, data });
        completadas.push(`${clave} (${nuevos.join(', ')})`);
      }
    }
    importados[uid] = campos;
  }
  await store.set({ key: 'campos-importados', value: importados });
  if (creadas.length) strapi.log.info(`[maci-sync] Textos importados: ${creadas.join(', ')}`);
  if (completadas.length) strapi.log.info(`[maci-sync] Campos nuevos rellenados: ${completadas.join('; ')}`);
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
  const UIDS = new Set([DISCO, PLATAFORMA, ...Object.values(SECCIONES)]);
  strapi.documents.use(async (ctx, next) => {
    const resultado = await next();
    if (UIDS.has(ctx.uid) && ACCIONES.has(ctx.action)) {
      programarExportacion(strapi);
    }
    return resultado;
  });
}

function activarExportacionAutomatica() {
  activo = true;
}

module.exports = { exportar, importar, importarTextos, registrarMiddleware, activarExportacionAutomatica };
