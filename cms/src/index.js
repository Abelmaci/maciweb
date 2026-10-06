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

// Etiquetas de los campos de texto de las secciones (tipos individuales).
const CAMPOS_SECCION = {
  seoTitulo: ['Título SEO', 'Título de la pestaña y de Google.'],
  seoDescripcion: ['Descripción SEO', 'Resumen que muestran Google y las redes al compartir.'],
  enlaceSpotifyArtista: ['Spotify (artista)', 'Enlace del botón «Explorar» de la portada.'],
  enlaceInstagram: ['Instagram', 'Icono del pie de página.'],
  enlaceYoutube: ['YouTube', 'Icono del pie de página.'],
  enlaceTiktok: ['TikTok', 'Icono del pie de página.'],
  coordenadas: ['Coordenadas', 'Etiqueta roja sobre el título.'],
  titulo: ['Título', ''],
  subtitulo: ['Subtítulo', ''],
  claim: ['Claim', 'Frase roja grande.'],
  lema: ['Lema', 'Línea corta en mayúsculas.'],
  intro: ['Introducción', ''],
  boton: ['Texto del botón', ''],
  firma: ['Firma vertical', 'Texto vertical a la derecha (solo en escritorio).'],
  cierre: ['Texto final', 'Línea roja bajo el carrusel.'],
  marcaAgua: ['Marca de agua', 'Palabra gigante semitransparente detrás de la foto.'],
  foto: ['Foto', 'Vertical (4:5). Se sube en calidad original.'],
  fotoAlt: ['Texto alternativo de la foto', 'Describe la foto (SEO y accesibilidad).'],
  cita: ['Cita sobre la foto', 'Sin comillas: se añaden solas.'],
  parrafos: ['Párrafos', 'Arrastra para cambiar el orden. «Destacado» lo pone en negrita y blanco.'],
  etiqueta: ['Etiqueta', 'Texto pequeño rojo sobre el título.'],
  texto: ['Texto', 'Los saltos de línea se respetan (una línea en blanco = separación de párrafo).'],
  tarjetaTitulo: ['Título de la tarjeta', ''],
  tarjetaTexto: ['Texto de la tarjeta', 'Los saltos de línea se respetan.'],
  appEtiqueta: ['App: etiqueta', ''],
  appNombre: ['App: nombre', ''],
  appDescripcion: ['App: descripción', ''],
  appCaracteristicas: ['App: características', 'Una por línea; cada una se muestra como una pastilla.'],
  appBoton: ['App: texto del botón', ''],
  appEnlace: ['App: enlace', ''],
  botonEnlace: ['Enlace del botón', 'Adónde lleva el botón de contacto.'],
  nombre: ['Nombre', ''],
  descripcion: ['Descripción', ''],
  copyright: ['Copyright', ''],
  siguemeTexto: ['Texto «Sígueme en»', ''],
};

const CAMPOS_COMPONENTE = {
  es: ['Español', ''],
  en: ['Inglés', ''],
  destacado: ['Destacado', 'En negrita y blanco.'],
};

const aplicarEtiquetas = (conf, campos) => {
  for (const [campo, [label, description]] of Object.entries(campos)) {
    const meta = conf.metadatas[campo];
    if (!meta) continue;
    meta.edit = { ...meta.edit, label, description };
    meta.list = { ...meta.list, label };
  }
};

// Cada vista se configura una sola vez; después se respetan los cambios
// hechos desde «Configurar la vista» en el panel.
async function configurarVistas(strapi) {
  const store = strapi.store({ type: 'plugin', name: 'maci-sync' });
  const hecho = (await store.get({ key: 'vistas' })) || {};
  // Compatibilidad con la primera versión (discos y plataformas ya configurados).
  if (await store.get({ key: 'vistas-configuradas' })) Object.keys(VISTAS).forEach((uid) => { hecho[uid] = true; });

  const tipos = strapi.plugin('content-manager').service('content-types');
  const componentes = strapi.plugin('content-manager').service('components');
  const guardar = async (servicio, modelo, conf) => servicio.updateConfiguration(modelo, {
    settings: conf.settings, metadatas: conf.metadatas, layouts: conf.layouts,
  });

  for (const [uid, vista] of Object.entries(VISTAS)) {
    if (hecho[uid]) continue;
    const tipo = tipos.findContentType(uid);
    const conf = await tipos.findConfiguration(tipo);
    aplicarEtiquetas(conf, vista.campos);
    conf.settings = { ...conf.settings, mainField: vista.mainField, defaultSortBy: 'orden', defaultSortOrder: 'ASC' };
    conf.layouts = { ...conf.layouts, list: vista.list };
    await guardar(tipos, tipo, conf);
    hecho[uid] = true;
  }

  for (const uid of Object.keys(strapi.contentTypes).filter((u) => u.startsWith('api::seccion-'))) {
    if (hecho[uid]) continue;
    const tipo = tipos.findContentType(uid);
    const conf = await tipos.findConfiguration(tipo);
    aplicarEtiquetas(conf, CAMPOS_SECCION);
    await guardar(tipos, tipo, conf);
    hecho[uid] = true;
  }

  for (const uid of Object.keys(strapi.components).filter((u) => u.startsWith('textos.'))) {
    if (hecho[uid]) continue;
    const comp = componentes.findComponent(uid);
    const conf = await componentes.findConfiguration(comp);
    aplicarEtiquetas(conf, CAMPOS_COMPONENTE);
    await guardar(componentes, comp, conf);
    hecho[uid] = true;
  }

  await store.set({ key: 'vistas', value: hecho });
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
    await sync.importarTextos(strapi);

    // A partir de aquí, cada cambio en el panel actualiza la web.
    if (process.env.MACI_SYNC_AUTO !== 'false') {
      sync.activarExportacionAutomatica();
    }
  },
};
