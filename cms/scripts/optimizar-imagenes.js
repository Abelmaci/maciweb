'use strict';

// Optimiza las imágenes grandes que ya están en la biblioteca de medios
// (las nuevas se optimizan solas al subirlas) y actualiza la web.
//   npm run optimizar-imagenes            (desde cms/)
const fs = require('fs/promises');
const path = require('path');
const { createStrapi, compileStrapi } = require('@strapi/strapi');
const { optimizarArchivo } = require('../src/maci-sync/optimizar-imagen');
const { exportar } = require('../src/maci-sync');

(async () => {
  process.env.MACI_SYNC_AUTO = 'false';
  const app = await createStrapi(await compileStrapi()).load();
  app.log.level = 'warn';
  try {
    const archivos = await app.db.query('plugin::upload.file').findMany({
      where: { mime: { $in: ['image/jpeg', 'image/png', 'image/webp'] } },
    });
    let ahorro = 0;
    for (const f of archivos) {
      const ruta = path.join(app.dirs.static.public, f.url);
      const r = await optimizarArchivo(ruta).catch(() => null);
      if (!r) continue;
      await fs.copyFile(r.ruta, ruta);
      await fs.rm(r.ruta, { force: true });
      await app.db.query('plugin::upload.file').update({
        where: { id: f.id },
        data: { width: r.info.width, height: r.info.height, size: Math.round((r.info.size / 1024) * 100) / 100 },
      });
      ahorro += r.antes.size - r.info.size;
      console.log(`✔ ${f.name}: ${r.antes.width}×${r.antes.height}, ${Math.round(r.antes.size / 1024)} KB → ${r.info.width}×${r.info.height}, ${Math.round(r.info.size / 1024)} KB`);
    }
    console.log(ahorro ? `Ahorro total: ${(ahorro / 1048576).toFixed(1)} MB` : 'No había imágenes grandes que optimizar.');
    const cambios = await exportar(app);
    if (cambios.length) console.log(`Web actualizada: ${cambios.join(', ')}`);
  } finally {
    await app.destroy();
  }
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
