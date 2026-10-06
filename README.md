# MACI · macimusic.es (Astro)

Web oficial de MACI migrada de HTML estático a [Astro](https://astro.build).
Mismo diseño, animaciones y comportamiento que la versión anterior
(`/Volumes/MyStuff/maciweb`), organizada en componentes y con los datos
separados del marcado.

## Uso

```bash
npm install
npm run dev       # web en desarrollo → http://localhost:4321
npm run build     # genera dist/
npm run preview   # sirve dist/ para revisarlo

npm run cms:instalar   # solo la primera vez: instala Strapi
npm run cms            # CMS → http://localhost:1337/admin
npm run publicar       # sube los cambios de contenido a macimusic.es
```

Requiere Node 22.12 o superior.

## Editar contenido con Strapi

La web está en GitHub Pages, que solo sirve archivos estáticos, así que Strapi
funciona **en local** y la web no depende de él:

```
Strapi (local)  ──guardar──▶  src/data/*.json + portadas/audios/logos  ──npm run publicar──▶  GitHub  ──Actions──▶  macimusic.es
```

1. Abre dos terminales en esta carpeta: `npm run cms` y `npm run dev`.
2. Edita en http://localhost:1337/admin → *Gestor de contenidos*:
   - **Disco** y **Plataforma** (colecciones): discos del carrusel y logos.
   - **0 · Ajustes generales … 9 · Pie de página** (tipos individuales): todos
     los textos de la web en español e inglés, las fotos de Biografía y Adela,
     el SEO y los enlaces a redes. Están numerados en el orden de la página.

   Al guardar o publicar, los cambios se copian solos a la web y se ven al
   momento en http://localhost:4321.
3. Cuando esté a tu gusto: `npm run publicar`. Comprueba que la web compila,
   sube solo el contenido y en ~2 minutos está en macimusic.es.

Notas:

- Los discos tienen **borrador / publicado**: solo los publicados salen en la
  web, así que puedes preparar un lanzamiento sin que aparezca.
- El **orden** del carrusel y de las plataformas lo marca el campo *Orden*
  (de menor a mayor; usa 10, 20, 30… para poder intercalar).
- Las portadas se suben en calidad original: Astro genera las versiones
  optimizadas al construir la web.
- La base de datos de Strapi (`cms/.tmp/`) y sus subidas (`cms/public/uploads/`)
  no se suben al repositorio (es público). Si se pierden o cambias de
  ordenador, Strapi se rellena solo desde los JSON de la web al arrancar.
- El primer arranque pide crear un usuario administrador (solo existe en tu Mac).
- En los textos largos los saltos de línea se respetan; una línea en blanco
  separa párrafos.
- Lo que sigue en el código: el banner del hero (lo usa la animación de
  partículas), la navegación y los datos estructurados (`src/data/site.ts`).

## Estructura

```
src/
├── pages/index.astro         Página principal (monta las secciones)
├── layouts/BaseLayout.astro  <head>: SEO, Open Graph, analytics, JSON-LD, rescate Safari
├── components/               Una pieza por sección
│   ├── Nav, Hero, Discography, AlbumCard, Bio, Adela, Platforms,
│   ├── Releases, Apps, Collaborations, Footer
│   └── SplashLoader, BrowserNotice, LanguageSwitcher, Icon
├── data/
│   ├── albums.json           Discos del carrusel (orden = orden en pantalla)
│   ├── platforms.json        Plataformas de streaming
│   ├── textos.json           Textos de las secciones, SEO y redes (ES/EN)
│   └── site.ts               Metadatos, navegación, redes, datos estructurados
├── scripts/                  JavaScript del navegador
│   ├── main.js               Punto de entrada
│   ├── core.js               Splash, contadores, onda, menú, idioma, cuenta atrás, SW
│   ├── app.js                Partículas del hero, nav, carrusel, apariciones
│   ├── album-player.js       Preview de audio + scratch del vinilo
│   ├── scratch-processor.js  Motor de scratch (Web Audio)
│   └── sand-canvas.js        Partículas de arena del hero
├── styles/global.css         Tailwind + estilos propios
└── assets/images/            Portadas y fotos (Astro las optimiza en el build)

public/                       Se publica tal cual
├── images/                   Logo, banner del hero, Open Graph, logos de plataformas
├── music-preview/            Audios de preview
├── app/                      MACI EasyPrompt (app independiente, sin cambios)
├── safari/                   Capa de rescate para Safari (solo se carga en Safari)
├── service-worker.js, CNAME, robots.txt, sitemap.xml, verificación de Google

cms/                          Strapi (CMS local, no se publica)
├── src/api/disco, plataforma Tipos de contenido
└── src/maci-sync/            Sincronización Strapi ⇄ src/data (importar/exportar)
scripts/publicar.mjs          Exporta, comprueba, hace commit del contenido y push
recursos/                     Archivo: imágenes fuente y documentos antiguos (no se publica)
```

## Tareas habituales

**Añadir un disco:** en Strapi, *Disco* → *Crear nueva entrada*: título,
orden, portada, audio MP3, subtítulos ES/EN, enlace de Spotify → *Publicar*.

**Cuenta atrás de un lanzamiento:** en el disco, rellena *Cuenta atrás: fecha*
y *Cuenta atrás: texto* (ej. "LANZAMIENTO EN · 1 DIC"). Se oculta sola cuando
pasa la fecha.

**Textos de las secciones:** en Strapi, en la sección correspondiente
(«3 · Biografía», «6 · Lo que viene»…). Cada texto tiene versión en español e
inglés para el selector de idioma.

**Cambiar algo del service worker:** sube `CACHE_NAME` en
`public/service-worker.js` para que los visitantes descarten la caché vieja.

## Publicación

GitHub Pages con GitHub Actions (`.github/workflows/deploy.yml`): cada push a
`main` construye y publica `dist/`. En el repositorio hay que activar una vez
Settings → Pages → Source: **GitHub Actions**. El dominio sale de
`public/CNAME`.

## Qué cambió respecto a la versión HTML

- Discos y plataformas se generan desde JSON en lugar de HTML repetido.
- Portadas y fotos en AVIF/WebP a varios tamaños (antes se servían JPG de
  hasta 2,6 MB por portada).
- Embla Carousel, iconos Lucide y la fuente Inter se empaquetan con la web; ya
  no dependen de esm.sh, unpkg ni Google Fonts en cada visita.
- Logos de plataformas servidos en local (Musixmatch y CapCut salían rotos).
- El CSS va inline en el HTML (una petición bloqueante menos).
- El contenido se edita con Strapi en local en lugar de reescribir el HTML.
