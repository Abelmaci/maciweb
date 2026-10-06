'use strict';

// Crea cms/.env con claves aleatorias si no existe (p. ej. en un ordenador
// nuevo tras clonar el repo). Se ejecuta solo después de `npm install`.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');
fs.mkdirSync(path.join(root, '.tmp'), { recursive: true });
if (fs.existsSync(envPath)) process.exit(0);

const clave = () => crypto.randomBytes(16).toString('base64');
fs.writeFileSync(envPath, [
  '# Generado automáticamente. No se sube al repositorio.',
  'HOST=127.0.0.1',
  'PORT=1337',
  `APP_KEYS=${[clave(), clave(), clave(), clave()].join(',')}`,
  `API_TOKEN_SALT=${clave()}`,
  `ADMIN_JWT_SECRET=${clave()}`,
  `TRANSFER_TOKEN_SALT=${clave()}`,
  `JWT_SECRET=${clave()}`,
  `ENCRYPTION_KEY=${clave()}`,
  'DATABASE_CLIENT=sqlite',
  'DATABASE_FILENAME=.tmp/data.db',
  '',
].join('\n'));
console.log('cms/.env creado con claves nuevas.');
