// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Dominio público (GitHub Pages + CNAME). Lo usan las URLs absolutas de SEO.
  site: 'https://macimusic.es',

  // Astro colapsa por defecto los espacios entre elementos inline; en este
  // diseño esos espacios son significativos, así que se conservan.
  compressHTML: false,

  build: {
    // Una sola página: el CSS (~35 KB, ~7 KB gzip) va inline en el HTML y se
    // elimina la petición bloqueante de render.
    inlineStylesheets: 'always',
  },
});
