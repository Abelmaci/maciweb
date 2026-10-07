// Publica en macimusic.es los cambios de contenido hechos en Strapi.
//
//   npm run publicar
//
// 1. Exporta lo publicado en Strapi a src/data/ (si el CMS está instalado).
// 2. Comprueba que la web compila (si no, no se sube nada).
// 3. Hace commit SOLO del contenido: datos, portadas, audios y logos.
// 4. Hace push a main → GitHub Actions publica la web en ~2 minutos.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENIDO = ['src/data', 'src/assets/images', 'public/music-preview', 'public/images/platforms'];

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit', ...opts });
const out = (cmd, args) => execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8' }).trim();
const paso = (texto) => console.log(`\n▶ ${texto}`);

try {
  if (existsSync(path.join(ROOT, 'cms/node_modules')) && existsSync(path.join(ROOT, 'cms/.tmp/data.db'))) {
    paso('Exportando contenido desde Strapi…');
    run('npm', ['--prefix', 'cms', 'run', '--silent', 'exportar']);
  } else {
    paso('Strapi no está instalado aquí: se publica el contenido tal como está en src/data.');
  }

  run('git', ['add', '--', ...CONTENIDO]);
  const cambios = out('git', ['diff', '--cached', '--name-status', '--', ...CONTENIDO]);

  // Commits que quedaron sin subir (p. ej. si un push anterior falló).
  run('git', ['fetch', '--quiet', 'origin', 'main'], { stdio: ['ignore', 'ignore', 'inherit'] });
  const pendientes = out('git', ['log', '--oneline', 'origin/main..HEAD']);

  if (!cambios && !pendientes) {
    console.log('\n✔ No hay cambios de contenido que publicar.');
    process.exit(0);
  }
  if (cambios) console.log(`\nCambios a publicar:\n${cambios}`);
  if (pendientes) console.log(`\nCambios guardados que aún no se habían subido:\n${pendientes}`);

  paso('Comprobando que la web compila…');
  run('npm', ['run', '--silent', 'build'], { stdio: ['inherit', 'ignore', 'inherit'] });

  if (cambios) {
    const fecha = new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
    paso('Guardando el cambio (commit)…');
    run('git', ['commit', '-m', `Actualizar contenido de la web (${fecha})`, '--', ...CONTENIDO]);
  }

  paso('Subiendo a GitHub…');
  run('git', ['push', 'origin', 'HEAD:main']);

  console.log('\n✔ Publicado. La web se actualiza en unos 2 minutos: https://macimusic.es');
  console.log('  Progreso: https://github.com/Abelmaci/maciweb/actions');
} catch (error) {
  console.error('\n✖ No se ha podido publicar. Revisa el mensaje de arriba.');
  process.exit(1);
}
