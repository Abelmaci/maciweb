// Panel de administración local de MACI (npm run admin → http://localhost:3001).
//
// Edita los datos de la web (src/data/albums.json y src/data/platforms.json)
// y sube portadas (src/assets/images/) y audios (public/music-preview/).
// Con `npm run dev` abierto, los cambios se ven al instante; para publicarlos
// basta con hacer commit y push (GitHub Actions construye y despliega).
//
// Solo escucha en 127.0.0.1 y no forma parte de la web publicada.
import { createServer } from 'node:http';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.ADMIN_PORT || 3001);
const MAX_UPLOAD = 60 * 1024 * 1024;

const FILES = {
  albums: path.join(ROOT, 'src/data/albums.json'),
  platforms: path.join(ROOT, 'src/data/platforms.json'),
};
const DIRS = {
  image: path.join(ROOT, 'src/assets/images'),
  audio: path.join(ROOT, 'public/music-preview'),
};

// Variables de entorno opcionales desde .env (CF_API_TOKEN, CF_ZONE_ID).
const envFile = path.join(ROOT, '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}

const send = (res, status, body, type = 'application/json; charset=utf-8') => {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};

const readBody = (req, limit) => new Promise((resolve, reject) => {
  const chunks = [];
  let size = 0;
  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > limit) {
      reject(new Error('Archivo demasiado grande'));
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });
  req.on('end', () => resolve(Buffer.concat(chunks)));
  req.on('error', reject);
});

const safeFileName = (name) => path.basename(String(name))
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^\w.-]+/g, '-')
  .replace(/^-+|-+$/g, '');

// Comprobaciones mínimas para no romper el build con datos incompletos.
function validateAlbums(albums) {
  if (!Array.isArray(albums)) throw new Error('Se esperaba una lista de discos');
  const ids = new Set();
  for (const a of albums) {
    if (!a.title) throw new Error('Hay un disco sin título');
    if (!a.id || ids.has(a.id)) throw new Error(`ID de disco vacío o repetido: "${a.id}"`);
    ids.add(a.id);
    if (!a.cover || !existsSync(path.join(DIRS.image, a.cover))) {
      throw new Error(`La portada "${a.cover}" de "${a.title}" no existe en src/assets/images/`);
    }
  }
}

async function spectators() {
  const token = process.env.CF_API_TOKEN;
  const zone = process.env.CF_ZONE_ID;
  if (!token || !zone) return { count: 500 + Math.floor(Math.random() * 50), source: 'fallback' };

  const query = `query GetVisitors($zoneTag: string) {
    viewer { zones(filter: { zoneTag: $zoneTag }) {
      httpRequests1mGroups(limit: 1, filter: { datetime_gt: "${new Date(Date.now() - 15 * 60 * 1000).toISOString()}" }) { uniq { uniques } }
    } }
  }`;
  const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { zoneTag: zone } }),
  });
  const data = await response.json();
  const count = data?.data?.viewer?.zones?.[0]?.httpRequests1mGroups?.[0]?.uniq?.uniques || 0;
  return { count: count > 50 ? count : 523 + count, source: 'cloudflare' };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/admin.html')) {
      return send(res, 200, await readFile(path.join(ROOT, 'admin/admin.html')), 'text/html; charset=utf-8');
    }

    // Vista previa de portadas y audios.
    if (req.method === 'GET' && url.pathname.startsWith('/files/')) {
      const [, , kind, name] = url.pathname.split('/');
      const dir = DIRS[kind];
      const file = dir && path.join(dir, safeFileName(decodeURIComponent(name || '')));
      if (!file || !existsSync(file)) return send(res, 404, { error: 'No encontrado' });
      const ext = path.extname(file).toLowerCase();
      const types = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg' };
      return send(res, 200, await readFile(file), types[ext] || 'application/octet-stream');
    }

    if (req.method === 'GET' && url.pathname === '/api/content') {
      const [albums, platforms, images, audios] = await Promise.all([
        readFile(FILES.albums, 'utf8').then(JSON.parse),
        readFile(FILES.platforms, 'utf8').then(JSON.parse),
        readdir(DIRS.image),
        readdir(DIRS.audio),
      ]);
      return send(res, 200, {
        albums,
        platforms,
        images: images.filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort(),
        audios: audios.filter((f) => /\.mp3$/i.test(f)).sort(),
      });
    }

    if (req.method === 'POST' && url.pathname === '/api/content') {
      const data = JSON.parse((await readBody(req, 5 * 1024 * 1024)).toString('utf8'));
      if (data.albums) {
        validateAlbums(data.albums);
        await writeFile(FILES.albums, `${JSON.stringify(data.albums, null, 2)}\n`);
      }
      if (data.platforms) {
        if (!Array.isArray(data.platforms)) throw new Error('Se esperaba una lista de plataformas');
        await writeFile(FILES.platforms, `${JSON.stringify(data.platforms, null, 2)}\n`);
      }
      return send(res, 200, { success: true });
    }

    // Subida: cuerpo binario + cabeceras X-File-Name y X-File-Kind (image|audio).
    if (req.method === 'POST' && url.pathname === '/api/upload') {
      const kind = req.headers['x-file-kind'];
      const name = safeFileName(decodeURIComponent(req.headers['x-file-name'] || ''));
      if (!DIRS[kind] || !name) return send(res, 400, { error: 'Falta el tipo o el nombre del archivo' });
      const valid = kind === 'image' ? /\.(jpe?g|png|webp)$/i : /\.mp3$/i;
      if (!valid.test(name)) return send(res, 400, { error: `Extensión no permitida para ${kind}` });
      await writeFile(path.join(DIRS[kind], name), await readBody(req, MAX_UPLOAD));
      return send(res, 200, { success: true, name, url: kind === 'audio' ? `/music-preview/${name}` : name });
    }

    if (req.method === 'GET' && url.pathname === '/api/spectators') {
      return send(res, 200, await spectators());
    }

    return send(res, 404, { error: 'No encontrado' });
  } catch (error) {
    console.error(error);
    return send(res, 500, { error: error.message });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`MACI Admin → http://localhost:${PORT}`);
});
