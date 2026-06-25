// ─── DONATE CONFIG ───────────────────────────────────────────────────
// Cambia esto por tu enlace público de PayPal.me o Buy Me a Coffee.
// Ejemplos seguros (no exponen datos sensibles):
//   'https://www.paypal.me/TU_USUARIO'
//   'https://buymeacoffee.com/TU_USUARIO'
//   'https://ko-fi.com/TU_USUARIO'
const DONATE_URL = 'https://www.paypal.me/abelmaci'

// ─── STATE ───────────────────────────────────────────────────────────
const S = {
  genres: [],          // [{name, role:'principal'|'fusion'|'influence'}]
  instruments: [],     // [string] (English descriptors)
  leadInstrument: null,// the "lead" instrument (string)
  orchestration: 5,
  sound: 50,           // 0 acoustic … 100 electronic
  bpm: 120, useBpm: false, tempoPreset: 'Medio',
  lead: { type: 'female', styles: ['clean'] },  // voz líder
  second: { on: false, type: 'male' },          // segunda voz
  choir: { on: false, type: 'mixed' },          // coros
  moods: [],           // max 3
  prod: 'indie',
  extra: '',
  lyrics: '',
  coverMode: false
}

// flatten instruments with group labels
const INSTRUMENT_GROUPS = [
  { label: 'Acústicos / orgánicos', items: INSTRUMENT_SUGGESTIONS.acoustic },
  { label: 'Electrónicos / sintéticos', items: INSTRUMENT_SUGGESTIONS.electronic },
  { label: 'Eléctricos / híbridos', items: INSTRUMENT_SUGGESTIONS.hybrid }
]

const $ = id => document.getElementById(id)

// ─── PERSISTENCE: custom genres / rhythms ────────────────────────────
const LS_KEY = 'suno_custom_genres'
let CUSTOM_GENRES = (() => { try { return JSON.parse(localStorage.getItem(LS_KEY)) || [] } catch (e) { return [] } })()
function saveCustom() { try { localStorage.setItem(LS_KEY, JSON.stringify(CUSTOM_GENRES)) } catch (e) {} }
function existsInData(name) { return GENRES.some(c => c.genres.some(g => g.toLowerCase() === name.toLowerCase())) }
function addCustomGenre(name) {
  name = name.trim()
  if (!name) return false
  if (!existsInData(name) && !CUSTOM_GENRES.some(g => g.toLowerCase() === name.toLowerCase())) {
    CUSTOM_GENRES.push(name); saveCustom(); return true
  }
  return false
}
function deleteCustomGenre(name) {
  CUSTOM_GENRES = CUSTOM_GENRES.filter(g => g !== name); saveCustom()
  S.genres = S.genres.filter(g => g.name !== name)
  if (!S.genres.some(g => g.role === 'principal') && S.genres[0]) S.genres[0].role = 'principal'
}

// ─── PERSISTENCE: custom instruments ─────────────────────────────────
const LS_INST = 'suno_custom_instruments'
let CUSTOM_INSTRUMENTS = (() => { try { return JSON.parse(localStorage.getItem(LS_INST)) || [] } catch (e) { return [] } })()
function saveCustomInst() { try { localStorage.setItem(LS_INST, JSON.stringify(CUSTOM_INSTRUMENTS)) } catch (e) {} }
function instExists(name) {
  return INSTRUMENT_GROUPS.some(g => g.items.some(i => i.toLowerCase() === name.toLowerCase()))
    || CUSTOM_INSTRUMENTS.some(i => i.toLowerCase() === name.toLowerCase())
}
function addCustomInstrument(name) {
  name = name.trim()
  if (!name) return
  if (!instExists(name)) { CUSTOM_INSTRUMENTS.push(name); saveCustomInst() }
}
function deleteCustomInstrument(name) {
  CUSTOM_INSTRUMENTS = CUSTOM_INSTRUMENTS.filter(i => i !== name); saveCustomInst()
  S.instruments = S.instruments.filter(i => i !== name)
  if (S.leadInstrument === name) S.leadInstrument = null
}

// ─── PERSISTENCE: custom ad-libs / tags ──────────────────────────────
const LS_PAL = 'maci_custom_palette'
let CUSTOM_PALETTE = (() => { try { return JSON.parse(localStorage.getItem(LS_PAL)) || [] } catch (e) { return [] } })()
function savePalette() { try { localStorage.setItem(LS_PAL, JSON.stringify(CUSTOM_PALETTE)) } catch (e) {} }
function wrapToken(word, type) {
  const bare = word.trim().replace(/^[\(\[\s]+|[\)\]\s]+$/g, '')
  return type === 'tag' ? `[${bare}]` : `(${bare})`
}
function addCustomToken(word, type) {
  if (!word.trim()) return false
  const text = wrapToken(word, type)
  if (CUSTOM_PALETTE.some(p => p.text.toLowerCase() === text.toLowerCase())) return false
  CUSTOM_PALETTE.push({ text, type }); savePalette(); return true
}
function deleteCustomToken(text) {
  CUSTOM_PALETTE = CUSTOM_PALETTE.filter(p => p.text !== text); savePalette()
}

// ─── I18N (UI language only — prompt stays in English) ───────────────
let LANG = (() => { try { return localStorage.getItem('maci_lang') || 'es' } catch (e) { return 'es' } })()
const I18N = {
  es: {
    reset: 'Reiniciar', reset_tip: 'Borra todas las selecciones y la letra (no afecta a los géneros/instrumentos guardados)',
    lang_tip: 'Idioma de la interfaz (el prompt siempre se genera en inglés)',
    style_title: 'Estilo', copy: 'Copiar', style_ph: 'Configura los parámetros abajo…',
    neg_tag: 'Negativo', avoid_title: 'Evitar', neg_ph: 'Se genera automáticamente…',
    genre_title: 'Género / ritmo', multi_hint: 'selección múltiple',
    genre_help: 'Toca varios géneros. En la bandeja marca uno como Principal y los demás como Fusión o Influencia para controlar la mezcla.',
    genre_search_ph: 'Buscar género o ritmo…', genre_tray_empty: 'Toca un género para añadirlo',
    genre_custom_ph: '¿No está en la lista? Escríbelo y pulsa Enter — se guarda para el futuro',
    inst_title: 'Instrumentos', inst_help: 'Elige los instrumentos. Marca uno con ★ como líder (el que destaca). Si falta alguno, escríbelo abajo y se guardará.',
    inst_custom_ph: '¿Falta un instrumento? Escríbelo y pulsa Enter — se guarda para el futuro',
    orch_title: 'Orquestación', orch_help: 'Cuántos instrumentos suenan a la vez: desde un solo instrumento hasta una gran orquesta sinfónica.',
    sound_title: 'Carácter del sonido', sound_help: "Define si el sonido es orgánico (instrumentos reales) o tecnológico (sintetizadores). También ajusta el prompt negativo (ej: acústico → 'no synthesizers').",
    sound_left: 'Acústico · orgánico', sound_right: 'Electrónico · tecnológico',
    sound_slider_tip: 'Arrastra: izquierda = acústico/orgánico, derecha = electrónico/tecnológico',
    tempo_title: 'Tempo', bpm_label: 'BPM exacto', bpm_tip: 'Activa para fijar un tempo exacto en vez de un preset', bpm_input_tip: 'Pulsaciones por minuto (20–300)',
    voices_title: 'Voces', vstyle_label: 'Estilo vocal · múltiple',
    voices_help: 'La 1ª selección es la voz líder. Opcionalmente añade una segunda voz (dúo/armonías) y coros, eligiendo qué tipo de voz para el coro.',
    lead_voice: 'Voz líder', lead_style: 'Estilo de la voz líder · múltiple',
    second_add: 'Añadir segunda voz', choir_add: 'Añadir coros',
    inst_lead_hint: 'Toca la estrella ★ de un instrumento ya seleccionado para marcarlo como líder (el protagonista).',
    mood_title: 'Estado de ánimo', mood_hint: 'hasta 3',
    prod_title: 'Producción',
    extra_title: 'Descriptores extra', extra_hint: 'en inglés, opcional',
    extra_help: 'Palabras clave libres que se añaden al final del prompt. Suno responde mejor en inglés (ej: vintage, sun-drenched).',
    extra_ph: 'vintage, 1970s aesthetic, sun-drenched…',
    lyrics_title: 'Letra', lyrics_hint: 'campo único · coloca el cursor e inserta tags o ad-libs',
    cover_tip: 'Crea una versión de la letra con cambios fonéticos (que→ke, c→s, v→b…) que suena igual pero evita coincidir con el texto original.',
    cover_label: 'Generar versión Cover (cambio fonético)',
    cover_lang_note: '⚠️ El cambio fonético usa reglas del español, así que solo funciona bien con letras en español.',
    lyr_left_title: 'Tu letra (para Suno)', lyr_copy_tip: 'Copiar tu letra al portapapeles',
    lyr_ph: 'Escribe o pega tu letra aquí.\n\nUsa la paleta de arriba para insertar [Verse 1], [Chorus] o ad-libs como (yeah) justo donde tengas el cursor.\n\nEjemplo:\n[Verse 1]\nCaminando por la ciudad (oh)\n[Chorus]\nEsta es mi canción',
    cover_pane_title: 'Versión Cover', cover_copy_tip: 'Copiar la versión cover',
    cover_help_tip: 'Cambios fonéticos: que→ke, ce/ci→se/si, z→s, v→b, ll→y, h muda eliminada. Mantiene tags [..] y ad-libs (..) intactos.',
    cover_empty: 'Activa “Generar versión Cover” para ver aquí la letra con cambios fonéticos y compararla.',
    cover_empty2: 'Escribe tu letra a la izquierda para generar la versión cover.',
    pal_struct: 'Estructura · inserta en su propia línea', pal_adlibs: 'Ad-libs del género', pal_voice: 'Tags de voz',
    pal_add_ph: 'Nueva palabra (p.ej. skrrt, guitar solo)…', pal_type_adlib: 'Ad-lib ( )', pal_type_tag: 'Tag [ ]', pal_add_btn: 'Añadir',
    custom_saved: '⭐ PERSONALIZADOS (guardados)', del_saved: 'Eliminar de guardados', remove_genre: 'Quitar este género',
    role_principal: 'Principal', role_fusion: 'Fusión', role_influence: 'Influencia',
    role_principal_tip: 'Género dominante de la canción (solo uno)', role_fusion_tip: 'Se mezcla a partes iguales con el principal', role_influence_tip: 'Aporta matices sin dominar el sonido',
    lead_tip: 'Marcar como instrumento líder (el protagonista)',
    donate_btn: 'Invítame a un café', donate_title: '¿Te sirve MACI?',
    donate_text: 'Si esta app te ahorra tiempo, puedes invitarme a un café. ¡Gracias por el apoyo!',
    donate_go: 'Apoyar con PayPal', donate_secure: 'Pago seguro vía PayPal. La app solo abre un enlace público; no recibe ni guarda ninguno de tus datos.',
    close: 'Cerrar'
  },
  en: {
    reset: 'Reset', reset_tip: 'Clears all selections and lyrics (saved genres/instruments are kept)',
    lang_tip: 'Interface language (the prompt is always generated in English)',
    style_title: 'Style', copy: 'Copy', style_ph: 'Set the parameters below…',
    neg_tag: 'Negative', avoid_title: 'Avoid', neg_ph: 'Generated automatically…',
    genre_title: 'Genre / rhythm', multi_hint: 'multiple selection',
    genre_help: 'Tap several genres. In the tray mark one as Lead and the rest as Fusion or Influence to control the blend.',
    genre_search_ph: 'Search genre or rhythm…', genre_tray_empty: 'Tap a genre to add it',
    genre_custom_ph: "Not in the list? Type it and press Enter — it's saved for next time",
    inst_title: 'Instruments', inst_help: 'Pick instruments. Mark one with ★ as the lead. Missing one? Type it below and it gets saved.',
    inst_custom_ph: "Missing an instrument? Type it and press Enter — it's saved for next time",
    orch_title: 'Orchestration', orch_help: 'How many instruments play at once: from a single instrument to a grand symphonic orchestra.',
    sound_title: 'Sound character', sound_help: "Whether the sound is organic (real instruments) or technological (synths). Also tunes the negative prompt (e.g. acoustic → 'no synthesizers').",
    sound_left: 'Acoustic · organic', sound_right: 'Electronic · technological',
    sound_slider_tip: 'Drag: left = acoustic/organic, right = electronic/technological',
    tempo_title: 'Tempo', bpm_label: 'Exact BPM', bpm_tip: 'Enable to set an exact tempo instead of a preset', bpm_input_tip: 'Beats per minute (20–300)',
    voices_title: 'Vocals', vstyle_label: 'Vocal style · multiple',
    voices_help: 'The 1st pick is the lead voice. Optionally add a second voice (duet/harmonies) and a choir, choosing the choir voice type.',
    lead_voice: 'Lead voice', lead_style: 'Lead voice style · multiple',
    second_add: 'Add second voice', choir_add: 'Add choir / backing',
    inst_lead_hint: 'Tap the ★ on an already-selected instrument to make it the lead (the one that stands out).',
    mood_title: 'Mood', mood_hint: 'up to 3',
    prod_title: 'Production',
    extra_title: 'Extra descriptors', extra_hint: 'in English, optional',
    extra_help: 'Free keywords appended at the end of the prompt. Suno works best in English (e.g. vintage, sun-drenched).',
    extra_ph: 'vintage, 1970s aesthetic, sun-drenched…',
    lyrics_title: 'Lyrics', lyrics_hint: 'single field · place the cursor and insert tags or ad-libs',
    cover_tip: 'Creates a phonetically altered version (que→ke, c→s, v→b…) that sounds the same but avoids matching the original copyrighted text.',
    cover_label: 'Generate Cover version (phonetic change)',
    cover_lang_note: '⚠️ The phonetic change uses Spanish rules, so it only works well with Spanish lyrics.',
    lyr_left_title: 'Your lyrics (for Suno)', lyr_copy_tip: 'Copy your lyrics to the clipboard',
    lyr_ph: 'Write or paste your lyrics here.\n\nUse the palette above to insert [Verse 1], [Chorus] or ad-libs like (yeah) right where the cursor is.\n\nExample:\n[Verse 1]\nWalking down the city (oh)\n[Chorus]\nThis is my song',
    cover_pane_title: 'Cover version', cover_copy_tip: 'Copy the cover version',
    cover_help_tip: 'Phonetic changes: que→ke, ce/ci→se/si, z→s, v→b, ll→y, silent h removed. Keeps [..] tags and (..) ad-libs intact.',
    cover_empty: 'Enable “Generate Cover version” to see the phonetically changed lyrics here and compare.',
    cover_empty2: 'Write your lyrics on the left to generate the cover version.',
    pal_struct: 'Structure · inserts on its own line', pal_adlibs: 'Genre ad-libs', pal_voice: 'Voice tags',
    pal_add_ph: 'New word (e.g. skrrt, guitar solo)…', pal_type_adlib: 'Ad-lib ( )', pal_type_tag: 'Tag [ ]', pal_add_btn: 'Add',
    custom_saved: '⭐ CUSTOM (saved)', del_saved: 'Remove from saved', remove_genre: 'Remove this genre',
    role_principal: 'Lead', role_fusion: 'Fusion', role_influence: 'Influence',
    role_principal_tip: "Song's dominant genre (only one)", role_fusion_tip: 'Blends equally with the lead', role_influence_tip: 'Adds nuance without dominating',
    lead_tip: 'Mark as the lead instrument (the one that stands out)',
    donate_btn: 'Buy me a coffee', donate_title: 'Is MACI useful?',
    donate_text: 'If this app saves you time, you can buy me a coffee. Thanks for the support!',
    donate_go: 'Support via PayPal', donate_secure: 'Secure payment via PayPal. The app only opens a public link; it never receives or stores any of your data.',
    close: 'Close'
  }
}
function t(k) { return (I18N[LANG] && I18N[LANG][k] != null) ? I18N[LANG][k] : (I18N.es[k] != null ? I18N.es[k] : k) }

// ES→EN map for data-driven labels (UI display only)
const EN = {
  // orchestration labels
  'Solo instrumento': 'Solo instrument', 'Dúo': 'Duo', 'Trío': 'Trio', 'Cuarteto / Quinteto': 'Quartet / Quintet',
  'Banda completa': 'Full band', 'Banda + metales': 'Band + brass', 'Orquesta de cámara': 'Chamber orchestra',
  'Orquesta completa': 'Full orchestra', 'Gran orquesta sinfónica': 'Grand symphonic orchestra',
  '1 instrumento': '1 instrument', '2 instrumentos': '2 instruments', '3 instrumentos': '3 instruments',
  '4-5 instrumentos': '4-5 instruments', 'guitarra, bajo, batería, teclado': 'guitar, bass, drums, keys',
  'con sección de vientos': 'with horn section', '20-40 músicos': '20-40 players', '60-80 músicos': '60-80 players', '80-120 músicos': '80-120 players',
  // production
  'Pulido / Radio': 'Polished / Radio', 'Cinematográfico': 'Cinematic',
  'Cassette, bedroom, crudo': 'Cassette, bedroom, raw', 'Cálido, orgánico, íntimo': 'Warm, organic, intimate',
  'Limpio, profesional': 'Clean, professional', 'Épico, amplio, dramático': 'Epic, wide, dramatic',
  // tempo
  'Muy lento': 'Very slow', 'Lento': 'Slow', 'Moderado': 'Moderate', 'Medio': 'Medium', 'Animado': 'Upbeat', 'Rápido': 'Fast', 'Muy rápido': 'Very fast',
  // vocal types (lead / second / choir)
  'Instrumental': 'Instrumental', 'Rap': 'Rap', 'Hablado': 'Spoken',
  'Femenina': 'Female', 'Masculina': 'Male', 'Andrógina': 'Androgynous',
  'Femeninos': 'Female', 'Masculinos': 'Male', 'Niños': 'Children', 'Femeninos + Masculinos': 'Female + Male',
  // vocal styles
  'Limpio / Clean': 'Clean', 'Rasposo / Raspy': 'Raspy', 'Con aire / Breathy': 'Breathy', 'Falsete / Falsetto': 'Falsetto',
  'Operístico': 'Operatic', 'Auto-tune': 'Auto-tune', 'Gutural / Growl': 'Growl', 'Hablado / Spoken word': 'Spoken word',
  'Melismático (runs)': 'Melismatic (runs)', 'Monotonal': 'Monotone',
  // genre categories
  'Clásica / Orquestal': 'Classical / Orchestral', 'Ambiental / Cinematográfica': 'Ambient / Cinematic', 'Africana / World': 'African / World',
  // instrument groups
  'Acústicos / orgánicos': 'Acoustic / organic', 'Electrónicos / sintéticos': 'Electronic / synth', 'Eléctricos / híbridos': 'Electric / hybrid'
}
function L(es) { return (LANG === 'en' && EN[es]) ? EN[es] : es }

function setLang(lang) {
  LANG = lang
  try { localStorage.setItem('maci_lang', lang) } catch (e) {}
  applyLang()
}
function applyLang() {
  document.documentElement.lang = LANG
  document.querySelectorAll('[data-i18n]').forEach(el => { const k = el.getAttribute('data-i18n'); if (I18N[LANG][k] != null) el.textContent = I18N[LANG][k] })
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { const k = el.getAttribute('data-i18n-ph'); if (I18N[LANG][k] != null) el.placeholder = I18N[LANG][k] })
  document.querySelectorAll('[data-i18n-tip]').forEach(el => { const k = el.getAttribute('data-i18n-tip'); if (I18N[LANG][k] != null) el.setAttribute('data-tip', I18N[LANG][k]) })
  document.querySelectorAll('#lang-switch button').forEach(b => b.classList.toggle('on', b.dataset.lang === LANG))
  $('sound-lbl').textContent = soundLabel(S.sound)
  renderAll()
}

// ─── PROMPT ENGINE ───────────────────────────────────────────────────
function genreString() {
  const principal = S.genres.find(g => g.role === 'principal')
  const fusions = S.genres.filter(g => g.role === 'fusion').map(g => g.name.toLowerCase())
  const influences = S.genres.filter(g => g.role === 'influence').map(g => g.name.toLowerCase())
  const parts = []
  let head = principal ? principal.name.toLowerCase() : (fusions.length ? fusions.shift() : '')
  if (head && fusions.length) head = `${head}-${fusions.slice(0, 2).join('-')} fusion`
  if (head) parts.push(head)
  influences.slice(0, 2).forEach(i => parts.push(`${i} influence`))
  return parts.join(', ')
}

function orchDescriptor() {
  const lvl = ORCHESTRATION_LEVELS[S.orchestration - 1]
  if (S.sound <= 45) return lvl.descriptor_acoustic
  if (S.sound >= 55) return lvl.descriptor_electronic
  return `${lvl.descriptor_acoustic}, hybrid with electronics`
}

function soundDescriptor() {
  const s = S.sound
  if (s <= 10) return 'pure acoustic, organic instruments only, natural reverb'
  if (s <= 25) return 'acoustic instruments, live recording, minimal processing'
  if (s <= 40) return 'acoustic-forward, warm analog sound'
  if (s <= 60) return 'hybrid acoustic-electric, balanced mix'
  if (s <= 75) return 'electric instruments with electronic elements'
  if (s <= 88) return 'electronic production, synthesizers dominant, programmed drums'
  return 'fully electronic, all synthesized, digital production'
}

function vocalDescriptor() {
  if (S.lead.type === 'none') return 'no vocals, instrumental'
  const TW = { female: 'female', male: 'male', androgynous: 'androgynous', rap: 'rap', spoken: 'spoken' }
  const parts = []
  const hasExtra = S.second.on || S.choir.on
  const lw = TW[S.lead.type] || 'female'
  let leadStr
  if (S.lead.type === 'rap') leadStr = 'rap vocals'
  else if (S.lead.type === 'spoken') leadStr = 'spoken word'
  else leadStr = hasExtra ? `${lw} lead vocals` : `${lw} vocals`
  parts.push(leadStr)
  S.lead.styles.forEach(id => { const v = VOCAL_STYLES.find(v => v.id === id); if (v) parts.push(v.en) })
  if (S.second.on) parts.push(`${TW[S.second.type] || 'male'} second vocals`, 'duet harmonies')
  if (S.choir.on) {
    const cmap = { female: 'female choir', male: 'male choir', children: "children's choir", mixed: 'mixed male and female choir' }
    parts.push(`${cmap[S.choir.type] || 'choir'} backing vocals`)
  }
  return parts.join(', ')
}

function prodDescriptor() {
  const p = PRODUCTION_SCALES.find(p => p.id === S.prod)
  return p ? p.descriptor : ''
}

function buildStyle() {
  const parts = []
  const g = genreString(); if (g) parts.push(g)
  if (S.useBpm && S.bpm) parts.push(`${S.bpm} BPM`)
  parts.push(orchDescriptor())
  if (S.instruments.length) {
    const lead = S.leadInstrument && S.instruments.includes(S.leadInstrument) ? S.leadInstrument : null
    const ordered = lead ? [lead, ...S.instruments.filter(i => i !== lead)] : S.instruments
    parts.push(ordered.slice(0, 8).map((i, idx) => (idx === 0 && lead) ? 'lead ' + i.toLowerCase() : i.toLowerCase()).join(', '))
  }
  parts.push(soundDescriptor())
  parts.push(prodDescriptor())
  parts.push(vocalDescriptor())
  S.moods.slice(0, 2).forEach(m => parts.push(MOOD_EN[m] || m.toLowerCase()))
  if (S.extra.trim()) parts.push(S.extra.trim())
  let p = parts.filter(Boolean).join(', ')
  if (p.length > 1000) p = p.slice(0, 997) + '...'
  return p
}

function buildNegative() {
  const n = []
  const s = S.sound
  if (s <= 20) { n.push('no synthesizers', 'no drum machine', 'no autotune', 'no digital effects'); if (s <= 10) n.push('no electric instruments') }
  else if (s <= 35) n.push('no synthesizers', 'no drum machine', 'no autotune')
  else if (s >= 80) { n.push('no acoustic instruments'); if (s >= 92) n.push('no live recording', 'no organic sounds') }

  if (S.lead.type === 'none') n.push('no vocals', 'no singing')
  else {
    if (!S.lead.styles.includes('autotune')) n.push('no autotune')
    if (!S.second.on && !S.choir.on) {
      if (S.lead.type === 'male') n.push('no female vocals')
      else if (S.lead.type === 'female') n.push('no male vocals')
    }
  }
  if (S.orchestration <= 2) n.push('no full band', 'no orchestra')
  if (S.prod === 'lofi') n.push('no overproduction', 'no studio polish')
  else if (S.prod === 'cinematic') n.push('no minimal arrangement', 'no lo-fi')
  else if (S.prod === 'polished') n.push('no lo-fi', 'no tape noise')

  const out = []
  for (const x of [...new Set(n)].slice(0, 7)) {
    const c = out.length ? out.join(', ') + ', ' + x : x
    if (c.length <= 250) out.push(x)
  }
  return out.join(', ')
}

function adlibsFor() {
  const all = [S.genres.find(g => g.role === 'principal'), ...S.genres].filter(Boolean).map(g => g.name.toLowerCase())
  for (const name of all) for (const k of Object.keys(ADLIBS_BY_GENRE)) if (name.includes(k)) return ADLIBS_BY_GENRE[k]
  return ADLIBS_BY_GENRE['default']
}

function buildLyrics() { return S.lyrics }

// ─── COVER: phonetic respelling (Spanish) ────────────────────────────
// Keeps the sung sound while changing the written text, so a cover does
// not reproduce the copyrighted lyric verbatim. Tags [..] and ad-libs
// (..) are preserved untouched.
function phoneticWord(word) {
  const isUpper = word.length > 1 && word === word.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(word)
  const firstUpper = /^[A-ZÁÉÍÓÚÑ]/.test(word)
  let w = word.toLowerCase()
  w = w.replace(/ch/g, '\u0001')          // protect "ch"
  w = w.replace(/qu(?=[eiéí])/g, 'k')     // que→ke, qui→ki
  w = w.replace(/gu(?=[eiéí])/g, 'g')     // gue→ge, gui→gi
  w = w.replace(/c(?=[eiéí])/g, 's')      // ce→se, ci→si
  w = w.replace(/c/g, 'k')                // remaining c → k
  w = w.replace(/z/g, 's')                // z → s
  w = w.replace(/v/g, 'b')                // v → b
  w = w.replace(/ll/g, 'y')               // ll → y
  w = w.replace(/h/g, '')                 // silent h removed
  w = w.replace(/\u0001/g, 'ch')          // restore "ch"
  if (isUpper) return w.toUpperCase()
  if (firstUpper) return w.replace(/^([a-záéíóúñ])/, (m, c) => c.toUpperCase())
  return w
}
function phoneticLyrics(text) {
  if (!text) return ''
  return text.split('\n').map(line =>
    // keep [tags] and (ad-libs) intact; transform the rest
    line.split(/(\[[^\]]*\]|\([^)]*\))/g).map(seg => {
      if (/^\[.*\]$/.test(seg) || /^\(.*\)$/.test(seg)) return seg
      return seg.replace(/[A-Za-zÀ-ÿ]+/g, phoneticWord)
    }).join('')
  ).join('\n')
}

// ─── RENDER OUTPUTS ──────────────────────────────────────────────────
function grow(el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' }

function refresh() {
  const style = buildStyle(), neg = buildNegative()
  $('o-style').value = style; $('o-neg').value = neg
  grow($('o-style')); grow($('o-neg'))
  setCount('c-style', style.length, 1000)
  setCount('c-neg', neg.length, 250)
  refreshLyrics()
}
function setCount(id, n, max) {
  const el = $(id); el.textContent = `${n}/${max}`
  el.className = 'count' + (n >= max ? ' err' : n > max * 0.9 ? ' warn' : '')
}
function refreshLyrics() {
  $('lyr-count').textContent = S.lyrics.length
  updateCover()
}
function updateCover() {
  const pane = $('cover-pane'), out = $('lyr-output')
  pane.classList.toggle('cover-off', !S.coverMode)
  if (!S.coverMode) {
    out.className = 'empty'
    out.textContent = t('cover_empty')
    return
  }
  const cover = phoneticLyrics(S.lyrics)
  if (cover.trim()) { out.className = ''; out.textContent = cover }
  else { out.className = 'empty'; out.textContent = t('cover_empty2') }
}

// ─── LYRICS PALETTE (insert at cursor) ───────────────────────────────
function insertAtCursor(text, blockLevel) {
  const ta = $('lyr-input')
  const start = ta.selectionStart, end = ta.selectionEnd, v = ta.value
  let ins = text
  const before = v.slice(0, start)
  if (blockLevel) {
    const needNlBefore = before.length && !before.endsWith('\n')
    ins = (needNlBefore ? '\n' : '') + text + '\n'
  } else if (before.length && !/[\s(]$/.test(before)) {
    ins = ' ' + text   // separate inline ad-lib/tag from preceding word
  }
  ta.value = v.slice(0, start) + ins + v.slice(end)
  const caret = start + ins.length
  ta.focus(); ta.setSelectionRange(caret, caret)
  S.lyrics = ta.value; refreshLyrics()
}
function renderPalette() {
  const wrap = $('lyr-palette'); wrap.innerHTML = ''
  const mk = (labelText, items, cls, isBlock, titleFn) => {
    const g = document.createElement('div'); g.className = 'pal-group'
    const lbl = document.createElement('div'); lbl.className = 'cat-label'; lbl.textContent = labelText
    g.appendChild(lbl)
    const chips = document.createElement('div'); chips.className = 'chips'
    items.forEach(it => {
      const txt = typeof it === 'string' ? it : it.tag
      const b = document.createElement('button'); b.className = 'adlib ' + cls; b.textContent = txt
      b.setAttribute('data-tip', titleFn ? titleFn(it) : (LANG === 'en' ? `Insert ${txt} at the cursor` : `Insertar ${txt} en la posición del cursor`))
      b.onclick = () => insertAtCursor(txt, isBlock)
      chips.appendChild(b)
    })
    g.appendChild(chips); wrap.appendChild(g)
  }
  const structTags = [...new Set([...SECTION_TAGS.map(s => s.tag), ...EXTRA_SECTION_TAGS])]
  mk(t('pal_struct'), structTags, 'struct', true,
     tag => LANG === 'en' ? `Insert ${tag} on a new line (song section)` : `Inserta ${tag} en una línea nueva (sección de la canción)`)
  mk(t('pal_adlibs'), adlibsFor(), 'adlib', false)
  mk(t('pal_voice'), INLINE_VOCAL_TAGS, 'voice', false, x => x.desc)

  // Custom / saved ad-libs & tags
  if (CUSTOM_PALETTE.length) {
    const g = document.createElement('div'); g.className = 'pal-group'
    const lbl = document.createElement('div'); lbl.className = 'cat-label'; lbl.textContent = t('custom_saved')
    g.appendChild(lbl)
    const chips = document.createElement('div'); chips.className = 'chips'
    CUSTOM_PALETTE.forEach(p => {
      const b = document.createElement('button'); b.className = 'adlib ' + (p.type === 'tag' ? 'voice' : 'adlib')
      const span = document.createElement('span'); span.textContent = p.text; b.appendChild(span)
      const del = document.createElement('span'); del.className = 'chip-del'; del.textContent = '×'; del.style.marginLeft = '5px'
      del.setAttribute('data-tip', t('del_saved'))
      del.onclick = (e) => { e.stopPropagation(); deleteCustomToken(p.text); renderPalette() }
      b.appendChild(del)
      b.setAttribute('data-tip', LANG === 'en' ? `Insert ${p.text} at the cursor` : `Insertar ${p.text} en la posición del cursor`)
      b.onclick = () => insertAtCursor(p.text, false)
      chips.appendChild(b)
    })
    g.appendChild(chips); wrap.appendChild(g)
  }
}

// ─── GENRES ──────────────────────────────────────────────────────────
let gSearch = ''
function renderGenres() {
  const list = $('g-list'); list.innerHTML = ''

  // Custom / saved genres first
  const customMatches = CUSTOM_GENRES.filter(g => !gSearch || g.toLowerCase().includes(gSearch.toLowerCase()))
  if (customMatches.length) {
    const lbl = document.createElement('div'); lbl.className = 'cat-label'; lbl.textContent = t('custom_saved')
    list.appendChild(lbl)
    const chips = document.createElement('div'); chips.className = 'chips'
    customMatches.forEach(name => {
      const on = S.genres.some(g => g.name === name)
      const c = document.createElement('button'); c.className = 'chip custom' + (on ? ' on' : '')
      const txt = document.createElement('span'); txt.textContent = name; c.appendChild(txt)
      const del = document.createElement('span'); del.className = 'chip-del'; del.textContent = '×'; del.setAttribute('data-tip', t('del_saved'))
      del.onclick = (e) => { e.stopPropagation(); deleteCustomGenre(name); renderGenres(); renderTray(); refresh() }
      c.appendChild(del)
      c.onclick = () => { toggleGenre(name); renderGenres(); renderTray(); refresh() }
      chips.appendChild(c)
    })
    list.appendChild(chips)
  }

  GENRES.forEach(cat => {
    const items = cat.genres.filter(g => !gSearch || g.toLowerCase().includes(gSearch.toLowerCase()))
    if (!items.length) return
    const lbl = document.createElement('div'); lbl.className = 'cat-label'; lbl.textContent = `${cat.icon} ${L(cat.category)}`
    list.appendChild(lbl)
    const chips = document.createElement('div'); chips.className = 'chips'
    items.forEach(name => {
      const on = S.genres.some(g => g.name === name)
      const c = document.createElement('button'); c.className = 'chip' + (on ? ' on' : ''); c.textContent = name
      c.onclick = () => { toggleGenre(name); renderGenres(); renderTray(); refresh() }
      chips.appendChild(c)
    })
    list.appendChild(chips)
  })
}
function toggleGenre(name) {
  const i = S.genres.findIndex(g => g.name === name)
  if (i >= 0) { S.genres.splice(i, 1); if (!S.genres.some(g => g.role === 'principal') && S.genres[0]) S.genres[0].role = 'principal' }
  else { const hasP = S.genres.some(g => g.role === 'principal'); S.genres.push({ name, role: hasP ? 'fusion' : 'principal' }) }
}
function renderTray() {
  const tray = $('g-tray')
  if (!S.genres.length) { tray.className = 'tray empty'; tray.innerHTML = `<span>${t('genre_tray_empty')}</span>`; return }
  tray.className = 'tray'; tray.innerHTML = ''
  S.genres.forEach(g => {
    const row = document.createElement('div'); row.className = 'tray-row'
    const name = document.createElement('span'); name.className = 'tray-name'; name.textContent = g.name
    const seg = document.createElement('div'); seg.className = 'seg'
    const roleTips = { principal: t('role_principal_tip'), fusion: t('role_fusion_tip'), influence: t('role_influence_tip') }
    ;[['principal', t('role_principal')], ['fusion', t('role_fusion')], ['influence', t('role_influence')]].forEach(([role, txt]) => {
      const b = document.createElement('button'); b.textContent = txt
      b.className = (g.role === role ? 'on ' + role : '')
      b.setAttribute('data-tip', roleTips[role])
      b.onclick = () => { setRole(g.name, role); renderTray(); refresh() }
      seg.appendChild(b)
    })
    const x = document.createElement('button'); x.className = 'x'; x.textContent = '×'; x.setAttribute('data-tip', t('remove_genre'))
    x.onclick = () => { S.genres = S.genres.filter(z => z.name !== g.name); if (!S.genres.some(z => z.role === 'principal') && S.genres[0]) S.genres[0].role = 'principal'; renderGenres(); renderTray(); refresh() }
    row.append(name, seg, x); tray.appendChild(row)
  })
}
function setRole(name, role) {
  if (role === 'principal') S.genres.forEach(g => { if (g.role === 'principal') g.role = 'fusion' })
  const g = S.genres.find(g => g.name === name); if (g) g.role = role
}

// ─── INSTRUMENTS (multi) ─────────────────────────────────────────────
function renderInstruments() {
  const wrap = $('inst-list'); wrap.innerHTML = ''

  // build a chip with selection + (when selected) a lead ★ toggle
  const instChip = (name, extraCls, onDelete) => {
    const sel = S.instruments.includes(name)
    const isLead = S.leadInstrument === name
    const c = document.createElement('button')
    c.className = 'chip small ' + (extraCls || '') + (sel ? ' on has-star' : '') + (isLead ? ' lead' : '')
    const txt = document.createElement('span'); txt.textContent = name; c.appendChild(txt)
    if (sel) {
      const star = document.createElement('span'); star.className = 'lead-star' + (isLead ? ' on' : ''); star.textContent = '★'
      star.setAttribute('data-tip', t('lead_tip'))
      star.onclick = (e) => { e.stopPropagation(); S.leadInstrument = isLead ? null : name; renderInstruments(); refresh() }
      c.appendChild(star)
    }
    if (onDelete) {
      const del = document.createElement('span'); del.className = 'chip-del'; del.textContent = '×'; del.setAttribute('data-tip', t('del_saved'))
      del.onclick = (e) => { e.stopPropagation(); onDelete(); renderInstruments(); refresh() }
      c.appendChild(del)
    }
    c.onclick = () => {
      const i = S.instruments.indexOf(name)
      if (i >= 0) { S.instruments.splice(i, 1); if (S.leadInstrument === name) S.leadInstrument = null }
      else S.instruments.push(name)
      renderInstruments(); refresh()
    }
    return c
  }

  // Custom / saved instruments first
  if (CUSTOM_INSTRUMENTS.length) {
    const lbl = document.createElement('div'); lbl.className = 'cat-label'; lbl.textContent = t('custom_saved')
    wrap.appendChild(lbl)
    const chips = document.createElement('div'); chips.className = 'chips'
    CUSTOM_INSTRUMENTS.forEach(name => chips.appendChild(instChip(name, 'custom', () => deleteCustomInstrument(name))))
    wrap.appendChild(chips)
  }

  INSTRUMENT_GROUPS.forEach(group => {
    const lbl = document.createElement('div'); lbl.className = 'cat-label'; lbl.textContent = L(group.label)
    wrap.appendChild(lbl)
    const chips = document.createElement('div'); chips.className = 'chips'
    group.items.forEach(name => chips.appendChild(instChip(name)))
    wrap.appendChild(chips)
  })
}

// ─── ORCHESTRATION ───────────────────────────────────────────────────
function renderOrch() {
  const o = $('orch'); o.innerHTML = ''
  ORCHESTRATION_LEVELS.forEach(l => {
    const b = document.createElement('button'); b.className = 'orch-item' + (S.orchestration === l.level ? ' on' : '')
    b.innerHTML = `<span class="orch-n">${l.level}</span><span class="orch-l">${L(l.label)}</span><span class="orch-s">${L(l.sublabel)}</span>`
    b.onclick = () => { S.orchestration = l.level; renderOrch(); refresh() }
    o.appendChild(b)
  })
}

// ─── SOUND SLIDER ────────────────────────────────────────────────────
function soundLabel(v) {
  const es = ['Completamente acústico', 'Muy acústico', 'Predominantemente acústico', 'Híbrido acústico-eléctrico', 'Predominantemente eléctrico', 'Muy electrónico', 'Completamente electrónico']
  const en = ['Fully acoustic', 'Very acoustic', 'Mostly acoustic', 'Hybrid acoustic-electric', 'Mostly electric', 'Very electronic', 'Fully electronic']
  const a = LANG === 'en' ? en : es
  const i = v <= 10 ? 0 : v <= 25 ? 1 : v <= 40 ? 2 : v <= 55 ? 3 : v <= 70 ? 4 : v <= 85 ? 5 : 6
  return a[i]
}

// ─── TEMPO ───────────────────────────────────────────────────────────
function renderTempo() {
  const t = $('tempo'); t.innerHTML = ''
  BPM_PRESETS.forEach(p => {
    const c = document.createElement('button'); c.className = 'chip' + (S.tempoPreset === p.label && !S.useBpm ? ' on' : '')
    c.innerHTML = `${L(p.label)} <span style="opacity:.55">${p.bpm}</span>`; c.setAttribute('data-tip', p.desc)
    c.onclick = () => { S.tempoPreset = p.label; S.bpm = p.bpm; S.useBpm = false; $('bpm-on').checked = false; $('bpm').disabled = true; $('bpm').value = p.bpm; renderTempo(); refresh() }
    t.appendChild(c)
  })
}

// ─── VOCALS (lead / second / choir) ──────────────────────────────────
const LEAD_TYPES = [['none', 'Instrumental'], ['female', 'Femenina'], ['male', 'Masculina'], ['androgynous', 'Andrógina'], ['rap', 'Rap'], ['spoken', 'Hablado']]
const SECOND_TYPES = [['female', 'Femenina'], ['male', 'Masculina'], ['androgynous', 'Andrógina']]
const CHOIR_TYPES = [['female', 'Femeninos'], ['male', 'Masculinos'], ['children', 'Niños'], ['mixed', 'Femeninos + Masculinos']]

function renderVoices() {
  const hasVoice = S.lead.type !== 'none'

  // Voz líder
  const lt = $('lead-type'); lt.innerHTML = ''
  LEAD_TYPES.forEach(([id, label]) => {
    const c = document.createElement('button'); c.className = 'chip' + (S.lead.type === id ? ' on' : ''); c.textContent = L(label)
    c.onclick = () => { S.lead.type = id; renderVoices(); refresh() }
    lt.appendChild(c)
  })

  // Estilo de la voz líder
  const ls = $('lead-style'); ls.innerHTML = ''
  VOCAL_STYLES.forEach(v => {
    const c = document.createElement('button'); c.className = 'chip small' + (S.lead.styles.includes(v.id) ? ' on' : ''); c.textContent = L(v.label)
    c.onclick = () => { const i = S.lead.styles.indexOf(v.id); if (i >= 0) S.lead.styles.splice(i, 1); else S.lead.styles.push(v.id); c.classList.toggle('on'); refresh() }
    ls.appendChild(c)
  })
  $('lead-style-wrap').style.display = hasVoice ? 'block' : 'none'
  $('extra-voices').style.display = hasVoice ? 'block' : 'none'

  // Segunda voz
  $('second-on').checked = S.second.on
  const st = $('second-type'); st.innerHTML = ''; st.style.display = S.second.on ? 'flex' : 'none'
  SECOND_TYPES.forEach(([id, label]) => {
    const c = document.createElement('button'); c.className = 'chip small' + (S.second.type === id ? ' on' : ''); c.textContent = L(label)
    c.onclick = () => { S.second.type = id; renderVoices(); refresh() }
    st.appendChild(c)
  })

  // Coros
  $('choir-on').checked = S.choir.on
  const ct = $('choir-type'); ct.innerHTML = ''; ct.style.display = S.choir.on ? 'flex' : 'none'
  CHOIR_TYPES.forEach(([id, label]) => {
    const c = document.createElement('button'); c.className = 'chip small' + (S.choir.type === id ? ' on' : ''); c.textContent = L(label)
    c.onclick = () => { S.choir.type = id; renderVoices(); refresh() }
    ct.appendChild(c)
  })
}

// ─── MOODS ───────────────────────────────────────────────────────────
function renderMoods() {
  const m = $('moods'); m.innerHTML = ''
  MOODS.forEach(mood => {
    const moodLabel = LANG === 'en' ? ((MOOD_EN[mood] || mood).replace(/^./, x => x.toUpperCase())) : mood
    const c = document.createElement('button'); c.className = 'chip' + (S.moods.includes(mood) ? ' on' : ''); c.textContent = moodLabel
    c.onclick = () => {
      const i = S.moods.indexOf(mood)
      if (i >= 0) S.moods.splice(i, 1)
      else if (S.moods.length < 3) S.moods.push(mood)
      renderMoods(); refresh()
    }
    m.appendChild(c)
  })
}

// ─── PRODUCTION ──────────────────────────────────────────────────────
function renderProd() {
  const p = $('prod'); p.innerHTML = ''
  PRODUCTION_SCALES.forEach(ps => {
    const c = document.createElement('button'); c.className = 'chip' + (S.prod === ps.id ? ' on' : '')
    c.innerHTML = `${L(ps.label)} <span style="opacity:.55">· ${L(ps.sublabel)}</span>`
    c.onclick = () => { S.prod = ps.id; renderProd(); refresh() }
    p.appendChild(c)
  })
}

// ─── COPY ────────────────────────────────────────────────────────────
function copyText(text) {
  // Try async Clipboard API; fall back to execCommand for file:///insecure contexts
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(() => legacyCopy(text))
    }
  } catch (e) {}
  return Promise.resolve(legacyCopy(text))
}
function legacyCopy(text) {
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
    document.body.appendChild(ta)
    ta.select(); ta.setSelectionRange(0, text.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch (e) { return false }
}
function copyBtn(btnId, getText) {
  $(btnId).onclick = () => {
    const text = getText()
    if (!text) return
    copyText(text)
    const b = $(btnId), prev = b.textContent; b.textContent = LANG === 'en' ? '✓ Copied' : '✓ Copiado'; b.classList.add('ok')
    setTimeout(() => { b.textContent = prev; b.classList.remove('ok') }, 1600)
  }
}

// ─── RESET ───────────────────────────────────────────────────────────
function resetAll() {
  S.genres = []; S.instruments = []; S.leadInstrument = null; S.orchestration = 5; S.sound = 50
  S.bpm = 120; S.useBpm = false; S.tempoPreset = 'Medio'
  S.lead = { type: 'female', styles: ['clean'] }; S.second = { on: false, type: 'male' }; S.choir = { on: false, type: 'mixed' }
  S.moods = []; S.prod = 'indie'; S.extra = ''
  S.lyrics = ''; S.coverMode = false
  $('sound').value = 50; $('sound-lbl').textContent = soundLabel(50)
  $('bpm').value = 120; $('bpm').disabled = true; $('bpm-on').checked = false
  $('extra').value = ''; $('g-search').value = ''; gSearch = ''
  $('lyr-input').value = ''; $('cover-on').checked = false
  if ($('inst-custom')) $('inst-custom').value = ''
  renderAll()
}

// ─── INIT ────────────────────────────────────────────────────────────
function renderAll() {
  renderGenres(); renderTray(); renderInstruments(); renderOrch()
  renderTempo(); renderVoices(); renderMoods(); renderProd(); renderPalette(); refresh()
}

document.addEventListener('DOMContentLoaded', () => {
  applyLang()   // sets language + renders everything
  document.querySelectorAll('#lang-switch button').forEach(b => { b.onclick = () => setLang(b.dataset.lang) })
  $('sound').oninput = e => { S.sound = +e.target.value; $('sound-lbl').textContent = soundLabel(S.sound); refresh() }
  $('bpm-on').onchange = e => { S.useBpm = e.target.checked; $('bpm').disabled = !e.target.checked; renderTempo(); refresh() }
  $('bpm').oninput = e => { const v = +e.target.value; if (v >= 20 && v <= 300) { S.bpm = v; refresh() } }
  $('extra').oninput = e => { S.extra = e.target.value; refresh() }
  $('g-search').oninput = e => { gSearch = e.target.value; renderGenres() }
  $('g-custom').onkeydown = e => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const name = e.target.value.trim()
      addCustomGenre(name)                       // persist to localStorage DB
      if (!S.genres.some(g => g.name === name)) toggleGenre(name)  // also select it now
      e.target.value = ''; renderGenres(); renderTray(); refresh()
    }
  }
  $('inst-custom').onkeydown = e => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const name = e.target.value.trim()
      addCustomInstrument(name)                  // persist to localStorage DB
      if (!S.instruments.includes(name)) S.instruments.push(name)  // also select now
      e.target.value = ''; renderInstruments(); refresh()
    }
  }
  $('second-on').onchange = e => { S.second.on = e.target.checked; renderVoices(); refresh() }
  $('choir-on').onchange = e => { S.choir.on = e.target.checked; renderVoices(); refresh() }
  // custom ad-lib / tag palette
  let palType = 'adlib'
  document.querySelectorAll('#pal-type button').forEach(b => {
    b.onclick = () => { palType = b.dataset.type; document.querySelectorAll('#pal-type button').forEach(x => x.classList.toggle('on', x === b)) }
  })
  const addToken = () => {
    const inp = $('pal-new')
    if (addCustomToken(inp.value, palType)) { inp.value = ''; renderPalette() }
    inp.focus()
  }
  $('pal-add-btn').onclick = addToken
  $('pal-new').onkeydown = e => { if (e.key === 'Enter') addToken() }
  $('lyr-input').oninput = e => { S.lyrics = e.target.value; refreshLyrics() }
  $('cover-on').onchange = e => { S.coverMode = e.target.checked; updateCover() }
  $('reset').onclick = () => { if (confirm(LANG === 'en' ? 'Reset all selections?' : '¿Reiniciar todas las selecciones?')) resetAll() }
  copyBtn('cp-style', () => $('o-style').value)
  copyBtn('cp-neg', () => $('o-neg').value)
  copyBtn('cp-lyr', () => S.lyrics)
  copyBtn('cp-cover', () => phoneticLyrics(S.lyrics))
  initTooltips()

  // donate / buy me a coffee
  $('donate-go').href = DONATE_URL
  const modal = $('donate-modal')
  $('donate-btn').onclick = () => modal.classList.add('show')
  $('donate-close').onclick = () => modal.classList.remove('show')
  modal.onclick = e => { if (e.target === modal) modal.classList.remove('show') }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') modal.classList.remove('show') })
})

// ─── FLOATING TOOLTIPS (data-tip / title) ────────────────────────────
function initTooltips() {
  const tip = document.createElement('div'); tip.id = 'tooltip'; document.body.appendChild(tip)
  let current = null
  const show = el => {
    let text = el.getAttribute('data-tip')
    if (!text) {
      text = el.getAttribute('title')
      if (text) { el.setAttribute('data-tip', text); el.removeAttribute('title') } // kill native dupe
    }
    if (!text) return
    current = el
    tip.textContent = text
    const r = el.getBoundingClientRect()
    tip.classList.add('show')
    // measure then position (below by default, above if no room)
    const tw = tip.offsetWidth, th = tip.offsetHeight
    let left = Math.min(window.innerWidth - tw - 8, Math.max(8, r.left))
    let top = r.bottom + 8
    if (top + th > window.innerHeight - 8) top = r.top - th - 8
    tip.style.left = left + 'px'; tip.style.top = top + 'px'
  }
  const hide = () => { current = null; tip.classList.remove('show') }
  document.addEventListener('mouseover', e => {
    const el = e.target.closest('[data-tip],[title]')
    if (el && el !== current) show(el)
  })
  document.addEventListener('mouseout', e => {
    const el = e.target.closest('[data-tip],[title]')
    if (el && el === current) hide()
  })
  document.addEventListener('click', e => { if (!e.target.closest('[data-tip]')) hide() }, true)
}
