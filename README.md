# MACI · macimusic.es (Astro)

Web oficial de MACI migrada de HTML estático a [Astro](https://astro.build).
Mismo diseño, animaciones y comportamiento que la versión anterior
(`/Volumes/MyStuff/maciweb`), organizada en componentes y con los datos
separados del marcado.

## Uso

```bash
npm install
npm run dev       # desarrollo → http://localhost:4321
npm run build     # genera dist/
npm run preview   # sirve dist/ para revisarlo
npm run admin     # panel de contenidos → http://localhost:3001
```

Requiere Node 22.12 o superior.

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

admin/                        Panel local (no se publica)
recursos/                     Archivo: imágenes fuente y documentos antiguos (no se publica)
```

## Tareas habituales

**Añadir un disco:** `npm run admin` → "Añadir disco", subir portada y MP3,
rellenar los datos y guardar. También se puede editar `src/data/albums.json` a
mano (la portada va en `src/assets/images/` y el audio en `public/music-preview/`).

**Cuenta atrás de un lanzamiento:** en el disco, `"countdown": { "date":
"2026-12-01T00:00:00", "label": "LANZAMIENTO EN · 1 DIC" }`. Se oculta sola
cuando pasa la fecha.

**Textos de las secciones:** están en cada componente de `src/components/`.
Cada texto lleva sus versiones `data-i18n-es` / `data-i18n-en` para el
selector de idioma.

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
- El panel de administración edita los JSON en vez de reescribir el HTML, y el
  token de Cloudflare se lee de `.env` (ver `.env.example`).
