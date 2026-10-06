# CMS de macimusic.es (Strapi)

Strapi local para editar los discos y plataformas de la web. Se arranca desde
la raíz del proyecto con `npm run cms` (http://localhost:1337/admin).

- `src/api/disco`, `src/api/plataforma`: tipos de contenido.
- `src/maci-sync/`: importa la web a Strapi si está vacío y exporta a
  `../src/data/*.json` (y copia portadas, audios y logos) tras cada cambio.
- `npm run exportar`: exportación manual sin abrir el panel.

Consulta el README de la raíz para el flujo completo.
