import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { readFileSync, writeFileSync } from 'fs';
import * as cheerio from 'cheerio';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, path.join(__dirname, 'music-preview'));
    } else if (file.mimetype.startsWith('image/')) {
      cb(null, path.join(__dirname, 'images'));
    } else {
      cb(null, __dirname);
    }
  },
  filename: function (req, file, cb) {
    // Mantener el nombre original per reemplazando espacios por guiones
    const safeName = file.originalname.replace(/\s+/g, '-').toLowerCase();
    cb(null, safeName);
  }
});
const upload = multer({ storage: storage });

const INDEX_PATH = path.join(__dirname, 'index.html');

// Template HTML para álbumes nuevos (creado basándonos en el diseño original)
function getBaseAlbumHtml(id) {
  return `
  <div class="embla__slide">
    <div class="album-card group relative aspect-square bg-surface cursor-pointer overflow-hidden shadow-2xl rounded-3xl" data-id="${id}" data-audio="" data-duration="30">
      <div class="vinyl-record absolute inset-0 flex items-center justify-center p-4 pointer-events-none opacity-0 transition-opacity duration-500">
        <div class="w-full h-full flex items-center justify-center">
          <div class="w-1/3 h-1/3 bg-surface border-4 border-white/10 rounded-full flex items-center justify-center relative overflow-hidden shadow-inner">
            <img src="" class="absolute inset-0 w-full h-full object-cover opacity-60" referrerpolicy="no-referrer">
            <div class="w-2 h-2 bg-background rounded-full z-10 shadow-[0_0_5px_rgba(255,255,255,0.5)]"></div>
          </div>
        </div>
      </div>
      <div class="album-cover absolute inset-0 transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1) z-10 group-hover:-translate-x-full">
        <img src="" class="w-full h-full object-cover shadow-[15px_0_30px_rgba(0,0,0,0.6)]" referrerpolicy="no-referrer">
      </div>
      <div class="info-overlay absolute inset-0 flex flex-col justify-end p-8 z-20 opacity-0 group-hover:opacity-100 translate-y-5 group-hover:translate-y-0 transition-all duration-500">
        <div class="flex items-center gap-3 mb-3 badge-container">
          <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span data-i18n-es="REPRODUCIENDO" data-i18n-en="NOW PLAYING" class="text-[0.65rem] font-bold text-white tracking-widest uppercase">REPRODUCIENDO</span>
        </div>
        <h3 class="text-3xl font-black uppercase tracking-tighter text-white drop-shadow-2xl title-target"></h3>
        <p class="text-xs text-white font-bold uppercase tracking-[0.3em] mt-2">
          <span data-i18n-es="NUEVO DISCO" data-i18n-en="NEW RECORD">NUEVO DISCO</span> // 2026
        </p>
        <p class="text-[0.65rem] text-white/60 mt-2 uppercase tracking-widest desc-target">Breve descripción</p>
        <div class="btn-container mt-4"></div>
      </div>
    </div>
  </div>`;
}

// API para leer el estado actual de index.html
app.get('/api/content', (req, res) => {
  try {
    const html = readFileSync(INDEX_PATH, 'utf8');
    const $ = cheerio.load(html);
    
    const data = {
      albums: [],
      platforms: [],
      texts: [],
      bannerUrl: $('#inicio .absolute.inset-0.z-0 img').first().attr('src') || '',
      bioImageUrl: $('#biografía img').first().attr('src') || ''
    };

    const textMap = [
      { id: 'bio_quote', label: 'Biografía - Cita Flotante', selector: '.bg-surface-container-highest div[data-i18n-es]' },
      { id: 'bio_p1', label: 'Biografía Párrafo 1', selector: '#biografía .space-y-6 p:nth-of-type(1)' },
      { id: 'bio_p2', label: 'Biografía Párrafo 2', selector: '#biografía .space-y-6 p:nth-of-type(2)' },
      { id: 'bio_p3', label: 'Biografía Párrafo 3', selector: '#biografía .space-y-6 p:nth-of-type(3)' },
      { id: 'bio_p4', label: 'Biografía Destacado', selector: '#biografía .space-y-6 p:nth-of-type(4)' },
      { id: 'bio_p5', label: 'Biografía Cierre', selector: '#biografía .space-y-6 p:nth-of-type(5)' },
      { id: 'disc_intro', label: 'Discografía Intro', selector: '#discografía > div > p' },
      { id: 'plat_intro', label: 'Plataformas Intro', selector: '#plataformas p.max-w-2xl' },
      { id: 'releases_intro', label: 'Lanzamientos Párrafos', selector: '#lanzamientos p.max-w-2xl' },
      { id: 'colab_p1', label: 'Colaboraciones Párrafo 1', selector: '#colaboraciones .space-y-8 p:nth-of-type(1)' },
      { id: 'colab_p2', label: 'Colaboraciones Párrafo 2', selector: '#colaboraciones .space-y-8 p:nth-of-type(2)' },
      { id: 'colab_p3', label: 'Colaboraciones Destacado', selector: '#colaboraciones .space-y-8 p:nth-of-type(3)' }
    ];

    // Extraer textos globales
    textMap.forEach(item => {
      const $el = $(item.selector);
      if ($el.length) {
        // En lanzamientos usa <br>, convertimos a n
        const rawEs = $el.attr('data-i18n-es') || $el.html().trim();
        const rawEn = $el.attr('data-i18n-en') || $el.html().trim();
        data.texts.push({
          id: item.id,
          label: item.label,
          es: rawEs.replace(/<br\s*\/?>/gi, '\n'),
          en: rawEn.replace(/<br\s*\/?>/gi, '\n')
        });
      }
    });

    // Extraer álbumes
    $('.embla__slide .album-card').each((i, el) => {
      const $card = $(el);
      const id = $card.attr('data-id');
      const audioUrl = $card.attr('data-audio') || '';
      const coverUrl = $card.find('.album-cover img').attr('src') || '';
      const title = $card.find('h3').first().text().trim();
      
      const $descEl = $card.find('p.text-white\\/60').first();
      const desc_es = $descEl.attr('data-i18n-es') || $descEl.text().trim();
      const desc_en = $descEl.attr('data-i18n-en') || $descEl.text().trim();
      
      const $highlightContainer = $card.find('p.text-xs').first();
      const $highlightEl = $highlightContainer.find('span').first();
      const highlight_es = $highlightEl.attr('data-i18n-es') || $highlightEl.text().trim();
      const highlight_en = $highlightEl.attr('data-i18n-en') || $highlightEl.text().trim();
      
      const yearText = $highlightContainer.contents().filter((_, node) => node.type === 'text').text().replace(/\/\//g, '').trim();
      const year = yearText || new Date().getFullYear().toString();
      
      // Chequear si tiene la etiqueta PRÓXIMAMENTE
      const hasBadge = $card.find('.bg-blue-600').length > 0;
      const status = hasBadge ? 'proximamente' : 'spotify';
      
      const spotifyUrl = $card.find('a[href*="spotify"]').attr('href') || '';
      
      data.albums.push({ id, title, desc_es, desc_en, highlight_es, highlight_en, year, coverUrl, audioUrl, status, spotifyUrl });
    });

    // Extraer plataformas parseando el bloque de script nativo en #plataformas
    const platformScript = $('#plataformas script').html();
    if (platformScript) {
      const match = platformScript.match(/const platforms = (\[[\s\S]*?\]);/);
      if (match && match[1]) {
        try {
          data.platforms = new Function('return ' + match[1])();
        } catch(e) { console.error("Error parsing platforms", e); }
      }
    }

    res.json(data);
  } catch (error) {
    console.error("Error reading content:", error);
    res.status(500).json({ error: error.message });
  }
});


// Cloudflare Analytics Integration
const CF_TOKEN = 'cfat_oyPFMShIFOiq2kEXuXQmDEpWmncODZs8ZlkdFRp4fcd7f2b4';
const CF_ACCOUNT_ID = '883c2614d7d543fe6b88d06eb7e8ae4b';
const CF_ZONE_ID = 'ed9a7f86bc8a0cbf3050dc8fd85cee5f'; 

app.get('/api/spectators', async (req, res) => {
  if (!CF_ZONE_ID) {
    // Fallback if Zone ID is missing: return a "live" feel random number
    const base = 500 + Math.floor(Math.random() * 50);
    return res.json({ count: base });
  }

  try {
    const query = `
      query GetVisitors($zoneTag: string) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
            httpRequests1mGroups(limit: 1, filter: { datetime_gt: "${new Date(Date.now() - 15 * 60 * 1000).toISOString()}" }) {
              uniq {
                uniques
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        variables: { zoneTag: CF_ZONE_ID }
      })
    });

    const data = await response.json();
    const count = data?.data?.viewer?.zones[0]?.httpRequests1mGroups[0]?.uniq?.uniques || 0;
    
    // Si Cloudflare devuelve 0 (por ejemplo en sitios muy nuevos), añadimos un "piso" de audiencia base
    const totalCount = count > 50 ? count : (523 + count); 

    res.json({ count: totalCount });
  } catch (error) {
    console.error("Cloudflare API Error:", error);
    res.json({ count: 523 + Math.floor(Math.random() * 10) }); // Fallback on error
  }
});


// API para guardar cambios en index.html
app.post('/api/content', (req, res) => {
  try {
    const newData = req.body;
    const html = readFileSync(INDEX_PATH, 'utf8');
    const $ = cheerio.load(html);

    // Mapeo inverso de textos
    const textMap = [
      { id: 'bio_quote', selector: '.bg-surface-container-highest div[data-i18n-es]' },
      { id: 'bio_p1', selector: '#biografía .space-y-6 p:nth-of-type(1)' },
      { id: 'bio_p2', selector: '#biografía .space-y-6 p:nth-of-type(2)' },
      { id: 'bio_p3', selector: '#biografía .space-y-6 p:nth-of-type(3)' },
      { id: 'bio_p4', selector: '#biografía .space-y-6 p:nth-of-type(4)' },
      { id: 'bio_p5', selector: '#biografía .space-y-6 p:nth-of-type(5)' },
      { id: 'disc_intro', selector: '#discografía > div > p' },
      { id: 'plat_intro', selector: '#plataformas p.max-w-2xl' },
      { id: 'releases_intro', selector: '#lanzamientos p.max-w-2xl' },
      { id: 'colab_p1', selector: '#colaboraciones .space-y-8 p:nth-of-type(1)' },
      { id: 'colab_p2', selector: '#colaboraciones .space-y-8 p:nth-of-type(2)' },
      { id: 'colab_p3', selector: '#colaboraciones .space-y-8 p:nth-of-type(3)' }
    ];

    if (newData.texts && Array.isArray(newData.texts)) {
      newData.texts.forEach(item => {
        const route = textMap.find(t => t.id === item.id);
        if (route) {
          const $el = $(route.selector);
          if($el.length) {
            const htmlEs = item.es.replace(/\n/g, '<br>');
            const htmlEn = item.en.replace(/\n/g, '<br>');
            $el.attr('data-i18n-es', item.es); // Mantenemos attr original
            $el.attr('data-i18n-en', item.en); // Mantenemos attr original
            $el.html(htmlEs); // Actualizamos texto visible base (Español)
          }
        }
      });
    }
    
    // Actualizar Banner Principal y Biografía
    if (newData.bannerUrl) {
      $('#inicio .absolute.inset-0.z-0 img').first().attr('src', newData.bannerUrl);
    }
    if (newData.bioImageUrl) {
      $('#biografía img').first().attr('src', newData.bioImageUrl);
    }

    // Actualizar álbumes
    if (newData.albums && Array.isArray(newData.albums)) {
      
      // Evitar borrar todo, simplemente iteramos.
      // Para limpiar borramos todos y los reinsertamos, pero mejor mutamos o añadimos.
      const existingIds = [];

      newData.albums.forEach(album => {
        existingIds.push(album.id);
        let $card = $(`.album-card[data-id="${album.id}"]`);
        
        // Si no existe, lo creamos
        if ($card.length === 0) {
          $('.embla__container').append(getBaseAlbumHtml(album.id));
          $card = $(`.album-card[data-id="${album.id}"]`);
        }

        // Actualizamos datos básicos
        $card.attr('data-audio', album.audioUrl);
        $card.find('img').attr('src', album.coverUrl); // Actualiza cover y vinilo
        $card.find('h3').first().text(album.title);
        
        const $descEl = $card.find('p.text-white\\/60').first();
        $descEl.attr('data-i18n-es', album.desc_es);
        $descEl.attr('data-i18n-en', album.desc_en);
        $descEl.text(album.desc_es);
        
        const $highlightContainer = $card.find('p.text-xs').first();
        $highlightContainer.empty();
        $highlightContainer.append(`<span data-i18n-es="${album.highlight_es}" data-i18n-en="${album.highlight_en}">${album.highlight_es}</span> // ${album.year}`);
        
        // Manejo de estado Proximamente vs Spotify
        const badge = $card.find('.bg-blue-600.absolute'); // La etiqueta de proximamente
        const spotifyBtn = $card.find('a[href*="spotify"]');

        if (album.status === 'proximamente') {
          // Aseguramos que tenga el badge
          if (badge.length === 0) {
            $card.prepend(`
            <div class="absolute top-6 left-6 z-30 bg-blue-600 text-white font-bold text-[0.55rem] tracking-[0.1em] px-3 py-1 uppercase shadow-xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
              PRÓXIMAMENTE
            </div>`);
          }
          // Eliminamos el botón de spotify si existe
          spotifyBtn.remove();
        } else {
          // Eliminamos el badge si existe
          badge.remove();
          
          // Aseguramos el botón de Spotify
          if (spotifyBtn.length > 0) {
            spotifyBtn.attr('href', album.spotifyUrl || '#');
          } else {
            // Buscamos donde insertarlo (ej. dentro de .info-overlay al final)
            // Si el bloque de btn-container existe, allí, sino al final de info-overlay
            const btnContainer = $card.find('.btn-container').length > 0 ? $card.find('.btn-container') : $card.find('.info-overlay');
            btnContainer.append(`
            <a href="${album.spotifyUrl || '#'}" target="_blank" data-i18n-es="Escuchar en Spotify" data-i18n-en="Listen on Spotify" class="inline-block bg-[#1DB954] text-white rounded-full px-4 py-2 text-[0.65rem] font-bold uppercase tracking-widest mt-4 hover:bg-[#1ed760] transition-colors">
              Escuchar en Spotify
            </a>`);
          }
        }
      });
      
      // Remover álbumes eliminados
      $('.embla__slide').each((i, el) => {
        const id = $(el).find('.album-card').attr('data-id');
        if (id && !existingIds.includes(id)) {
          $(el).remove();
        }
      });
      
      // Actualizar variables de audiosSources en el array de javascript del splash loader
      // Re-escribimos array de javascript parseando raw script tag
      // Esto es complejo con cheerio, mejor mantenerlo estático o parsearlo usando regex
    }
    
    // Guardar los cambios directamente
    let finalHtml = $.html();
    
    // Actualizar el array audioSources del Preloader
    if (newData.albums) {
      const audioArrayStr = newData.albums.map(a => `"${a.audioUrl}"`).filter(u => u !== '""').join(',\n        ');
      finalHtml = finalHtml.replace(/const audioSources = \[[\s\S]*?\];/, `const audioSources = [\n        ${audioArrayStr}\n      ];`);
    }

    // Actualizar el array platforms para la integración de redes/plataformas
    if (newData.platforms && Array.isArray(newData.platforms)) {
      const platformsJson = JSON.stringify(newData.platforms, null, 2);
      finalHtml = finalHtml.replace(/const platforms = \[[\s\S]*?\];/, `const platforms = ${platformsJson};`);
    }

    writeFileSync(INDEX_PATH, finalHtml, 'utf8');
    res.json({ success: true, message: 'Website updated successfully' });

  } catch (error) {
    console.error("Error saving content:", error);
    res.status(500).json({ error: error.message });
  }
});

// API para subir archivos
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // El archivo ya está guardado en images/ o music-preview/
  const folder = req.file.mimetype.startsWith('audio/') ? 'music-preview' : 'images';
  const fileUrl = `${folder}/${req.file.filename}`;
  
  res.json({ success: true, url: fileUrl });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`MACI Admin Server running at http://localhost:${PORT}/admin.html`);
});
