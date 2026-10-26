'use strict';

// Imagen Open Graph (1200×630) de la campaña de crowdfunding, con el estilo
// de la web: fondo oscuro, portada a la izquierda y textos en Inter.
// Es la que muestran WhatsApp, X, Facebook, Telegram… al compartir
// https://macimusic.es/crowdfunding/.
//
// El texto se convierte en trazos vectoriales con opentype.js (leyendo los
// WOFF de @fontsource/inter), así el resultado no depende de las fuentes
// instaladas en el sistema.

const path = require('path');
const opentype = require('opentype.js');

const W = 1200;
const H = 630;
const ROJO = '#FF4444';

const cacheFuentes = new Map();
function fuente(dir, peso) {
  const ruta = path.join(dir, `inter-latin-${peso}-normal.woff`);
  if (!cacheFuentes.has(ruta)) cacheFuentes.set(ruta, opentype.loadSync(ruta));
  return cacheFuentes.get(ruta);
}

// Ancho de una línea con espaciado entre letras (en px).
function anchoLinea(f, texto, tamano, espaciado) {
  return f.getAdvanceWidth(texto, tamano) + Math.max(0, [...texto].length - 1) * espaciado;
}

// Parte el texto en líneas que quepan en `ancho`.
function lineas(f, texto, tamano, espaciado, ancho) {
  if (!ancho) return [texto];
  const resultado = [];
  let actual = '';
  for (const palabra of texto.split(/\s+/)) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (actual && anchoLinea(f, prueba, tamano, espaciado) > ancho) {
      resultado.push(actual);
      actual = palabra;
    } else {
      actual = prueba;
    }
  }
  if (actual) resultado.push(actual);
  return resultado;
}

// Devuelve { svg, alto, ancho } de un bloque de texto con la línea base
// superior en `y`.
function bloque(dir, { texto, peso, tamano, color, x, y, ancho, espaciado = 0, interlineado = 1.25 }) {
  const f = fuente(dir, peso);
  const asc = (f.ascender / f.unitsPerEm) * tamano;
  const desc = (-f.descender / f.unitsPerEm) * tamano;
  const filas = lineas(f, texto, tamano, espaciado, ancho);
  let svg = '';
  let maxAncho = 0;
  filas.forEach((fila, i) => {
    let cx = x;
    const base = y + asc + i * tamano * interlineado;
    const trazos = [];
    for (const ch of fila) {
      trazos.push(f.getPath(ch, cx, base, tamano).toPathData(2));
      cx += f.getAdvanceWidth(ch, tamano) + espaciado;
    }
    maxAncho = Math.max(maxAncho, cx - espaciado - x);
    svg += `<path fill="${color}" d="${trazos.join(' ')}"/>`;
  });
  const alto = asc + desc + (filas.length - 1) * tamano * interlineado;
  return { svg, alto, ancho: maxAncho };
}

// datos: { imagen (ruta), etiqueta, titulo, subtitulo, lema, boton, dominio }
async function generarOgCampana(datos, dirFuentes) {
  const sharp = require('sharp');

  const lado = 510;
  const radio = 28;
  const mascara = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}"><rect width="${lado}" height="${lado}" rx="${radio}" fill="#fff"/></svg>`);
  const portada = await sharp(datos.imagen).rotate().resize(lado, lado, { fit: 'cover' })
    .composite([{ input: mascara, blend: 'dest-in' }]).png().toBuffer();

  const x = 640;
  const ancho = W - x - 60;
  const medir = (o) => bloque(dirFuentes, { ...o, x, y: 0 });

  // Primero se mide todo para centrar el bloque de texto en vertical.
  const piezas = [
    { texto: datos.etiqueta, peso: 700, tamano: 20, color: ROJO, espaciado: 5, hueco: 22 },
    { texto: datos.titulo, peso: 900, tamano: 92, color: '#ffffff', espaciado: -2, ancho, interlineado: 1, hueco: 10 },
    { texto: datos.subtitulo, peso: 700, tamano: 30, color: '#ffffffcc', ancho, hueco: 16 },
    { texto: datos.lema, peso: 400, tamano: 24, color: '#8E9299', ancho, hueco: 34 },
  ];
  const botonMedida = medir({ texto: datos.boton, peso: 700, tamano: 20, color: '#000', espaciado: 2.5 });
  const pillW = Math.round(botonMedida.ancho + 64);
  const pillH = 58;
  const alto = piezas.reduce((a, p) => a + medir(p).alto + p.hueco, 0) + pillH;

  let y = Math.round((H - alto) / 2) - 8;
  let texto = '';
  for (const p of piezas) {
    const b = bloque(dirFuentes, { ...p, x, y });
    texto += b.svg;
    y += b.alto + p.hueco;
  }
  const boton = bloque(dirFuentes, { texto: datos.boton, peso: 700, tamano: 20, color: '#000000', espaciado: 2.5, x: x + 32, y: y + (pillH - botonMedida.alto) / 2 });
  const dominioMedida = medir({ texto: datos.dominio, peso: 700, tamano: 18, color: '#fff', espaciado: 3 });
  const dominio = bloque(dirFuentes, { texto: datos.dominio, peso: 700, tamano: 18, color: '#ffffff66', espaciado: 3, x: W - 60 - dominioMedida.ancho, y: H - 56 });

  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#2b2e38"/><stop offset="1" stop-color="#0e0e0f"/>
      </linearGradient>
      <linearGradient id="b" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${ROJO}" stop-opacity="0.3"/><stop offset="0.5" stop-color="${ROJO}"/><stop offset="1" stop-color="${ROJO}" stop-opacity="0.3"/>
      </linearGradient>
      <linearGradient id="p" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${ROJO}"/><stop offset="1" stop-color="#CC0000"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <rect y="${H - 10}" width="${W}" height="10" fill="url(#b)"/>
    <rect x="${x}" y="${y}" width="${pillW}" height="${pillH}" rx="${pillH / 2}" fill="url(#p)"/>
    ${texto}${boton.svg}${dominio.svg}
  </svg>`);

  return sharp(svg)
    .composite([{ input: portada, left: 60, top: Math.round((H - lado) / 2) - 5 }])
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
}

module.exports = { generarOgCampana };
