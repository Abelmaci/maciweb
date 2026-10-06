'use strict';

// Exporta el contenido publicado en Strapi a la web sin abrir el panel:
//   npm run exportar            (desde cms/)
//   npm run cms:exportar        (desde la raíz)
const { createStrapi, compileStrapi } = require('@strapi/strapi');
const { exportar } = require('../src/maci-sync');

(async () => {
  process.env.MACI_SYNC_AUTO = 'false';
  const app = await createStrapi(await compileStrapi()).load();
  app.log.level = 'warn';
  try {
    const cambios = await exportar(app);
    console.log(cambios.length ? `Web actualizada: ${cambios.join(', ')}` : 'La web ya estaba al día.');
  } finally {
    await app.destroy();
  }
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
