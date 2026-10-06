'use strict';

const sync = require('./maci-sync');

// Etiquetas y ayudas que ve quien edita en el panel. Se aplican una sola vez
// (después se respetan los cambios que se hagan desde "Configurar la vista").
const VISTAS = {
  'api::disco.disco': {
    mainField: 'titulo',
    list: ['portada', 'titulo', 'orden', 'etiqueta', 'anio'],
    campos: {
      titulo: ['Título', 'Nombre del disco tal como se ve en la tarjeta.'],
      slug: ['Identificador', 'Se genera desde el título. Uso interno.'],
      orden: ['Orden', 'Posición en el carrusel: los números más bajos van primero (10, 20, 30…).'],
      portada: ['Portada', 'Imagen cuadrada (mínimo 1200×1200). La web genera las versiones optimizadas.'],
      audio: ['Audio de preview', 'MP3 que suena al pasar por el disco y con el que se hace scratch.'],
      duracionPreview: ['Duración del preview (segundos)', 'Cuánto suena el audio antes de pararse.'],
      etiqueta: ['Etiqueta', '"nuevo_lanzamiento" (punto rojo) o "reproduciendo" (punto verde).'],
      subtituloEs: ['Subtítulo (ES)', 'Ej.: Single destacado, EP · 3 canciones.'],
      subtituloEn: ['Subtítulo (EN)', 'Versión en inglés del subtítulo.'],
      anio: ['Año', 'Se muestra tras el subtítulo: "Single destacado // 2026". Opcional.'],
      descripcionEs: ['Descripción (ES)', 'Frase corta bajo el subtítulo. Opcional.'],
      descripcionEn: ['Descripción (EN)', 'Versión en inglés de la descripción.'],
      palabrasClave: ['Palabras clave', 'Línea pequeña, ej.: misterio · memoria · emoción. Opcional.'],
      enlaceSpotify: ['Enlace de Spotify', 'URL del álbum o single en Spotify.'],
      textoAccesibleSpotify: ['Texto accesible del botón Spotify', 'Para lectores de pantalla. Si se deja vacío se genera solo.'],
      textoAlternativoPortada: ['Texto alternativo de la portada', 'Describe la imagen (SEO y accesibilidad). Si se deja vacío se genera solo.'],
      textoAlternativoVinilo: ['Texto alternativo de la etiqueta del vinilo', 'Opcional.'],
      cuentaAtrasFecha: ['Cuenta atrás: fecha de lanzamiento', 'Si se rellena, aparece una cuenta atrás en la tarjeta hasta esa fecha.'],
      cuentaAtrasTexto: ['Cuenta atrás: texto', 'Ej.: LANZAMIENTO EN · 12 JUN'],
      tituloEnMayusculas: ['Título en mayúsculas', ''],
      subtituloCompacto: ['Subtítulo compacto en móvil', 'Para subtítulos largos que no caben en pantallas pequeñas.'],
      resaltarAlPasar: ['Resaltar tarjeta al pasar', ''],
    },
  },
  'api::plataforma.plataforma': {
    mainField: 'nombre',
    list: ['logo', 'nombre', 'orden', 'invertirColor'],
    campos: {
      nombre: ['Nombre', ''],
      orden: ['Orden', 'Posición en la cuadrícula: los números más bajos van primero.'],
      logo: ['Logo', 'SVG o PNG. Se muestra en gris y toma color al pasar el ratón.'],
      invertirColor: ['Invertir color', 'Actívalo si el logo es negro, para que se vea blanco sobre el fondo oscuro.'],
      tamano: ['Tamaño del logo', 'Para logos que se ven pequeños dentro de su caja.'],
    },
  },
};

async function configurarVistas(strapi) {
  const store = strapi.store({ type: 'plugin', name: 'maci-sync' });
  if (await store.get({ key: 'vistas-configuradas' })) return;

  const servicio = strapi.plugin('content-manager').service('content-types');
  for (const [uid, vista] of Object.entries(VISTAS)) {
    const tipo = servicio.findContentType(uid);
    const conf = await servicio.findConfiguration(tipo);
    for (const [campo, [label, description]] of Object.entries(vista.campos)) {
      const meta = conf.metadatas[campo];
      if (!meta) continue;
      meta.edit = { ...meta.edit, label, description };
      meta.list = { ...meta.list, label };
    }
    conf.settings = { ...conf.settings, mainField: vista.mainField, defaultSortBy: 'orden', defaultSortOrder: 'ASC' };
    conf.layouts = { ...conf.layouts, list: vista.list };
    await servicio.updateConfiguration(tipo, {
      settings: conf.settings,
      metadatas: conf.metadatas,
      layouts: conf.layouts,
    });
  }
  await store.set({ key: 'vistas-configuradas', value: true });
}

module.exports = {
  register({ strapi }) {
    sync.registrarMiddleware(strapi);
  },

  async bootstrap({ strapi }) {
    // Los archivos subidos son los originales de la web: Strapi no debe
    // recomprimirlos ni redimensionarlos (Astro ya los optimiza al construir).
    await strapi.plugin('upload').service('upload').setSettings({
      sizeOptimization: false,
      responsiveDimensions: false,
      autoOrientation: false,
    });

    try {
      await configurarVistas(strapi);
    } catch (e) {
      strapi.log.warn(`[maci-sync] No se pudieron configurar las vistas: ${e.message}`);
    }

    // Primer arranque (o base de datos borrada): traer el contenido de la web.
    await sync.importar(strapi);

    // A partir de aquí, cada cambio en el panel actualiza la web.
    if (process.env.MACI_SYNC_AUTO !== 'false') {
      sync.activarExportacionAutomatica();
    }
  },
};
