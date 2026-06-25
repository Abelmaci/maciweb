const GENRES = [
  {
    category: 'Pop', icon: '✨',
    genres: ['Synth-pop', 'Indie pop', 'Dream pop', 'Electropop', 'Bedroom pop', 'Dark pop', 'Art pop', 'K-pop', 'J-pop', 'Hyperpop', 'Dance pop', 'Teen pop', 'Bubblegum pop', 'Baroque pop']
  },
  {
    category: 'Hip-Hop / Rap', icon: '🎤',
    genres: ['Trap', 'Boom bap', 'Lo-fi hip-hop', 'Cloud rap', 'Phonk', 'Dark phonk', 'Drift phonk', 'Drill', 'UK drill', 'NY drill', 'Conscious rap', 'Mumble rap', 'Emo rap', 'Jazz rap', 'G-funk', 'Crunk', 'Horrorcore', 'Gangsta rap', 'Southern hip-hop', 'Melodic rap']
  },
  {
    category: 'Electronic', icon: '🎛️',
    genres: ['House', 'Deep house', 'Tech house', 'Progressive house', 'Afro house', 'Techno', 'Minimal techno', 'Dark techno', 'Industrial techno', 'Trance', 'Psytrance', 'Goa trance', 'Drum and bass', 'Liquid DnB', 'Jungle', 'Neurofunk', 'Dubstep', 'Future bass', 'Synthwave', 'Retrowave', 'Darkwave', 'Outrun', 'Vaporwave', 'Chillwave', 'UK garage', 'Lo-fi beats', 'IDM', 'Glitch', 'Ambient electronic', 'Electronica', 'Big room', 'Hardstyle', 'Breakbeat', 'Electro swing']
  },
  {
    category: 'Rock', icon: '🎸',
    genres: ['Indie rock', 'Alternative rock', 'Garage rock', 'Post-punk', 'Shoegaze', 'Math rock', 'Emo rock', 'Punk rock', 'Pop-punk', 'Classic rock', 'Heartland rock', 'Power pop', 'Grunge', 'Post-rock', 'Surf rock', 'Psychedelic rock', 'Stoner rock', 'Space rock', 'Noise rock', 'Desert rock', 'Britpop']
  },
  {
    category: 'Folk / Americana', icon: '🪕',
    genres: ['Indie folk', 'Folk rock', 'Americana', 'Bluegrass', 'Celtic folk', 'Singer-songwriter', 'Acoustic folk', 'Country folk', 'Appalachian folk', 'Neo-folk', 'Freak folk', 'Chamber folk', 'Anti-folk']
  },
  {
    category: 'R&B / Soul', icon: '🎶',
    genres: ['Neo-soul', 'Contemporary R&B', 'Motown', 'Funk', 'Deep soul', 'Quiet storm', 'Alternative R&B', 'Soul', 'Gospel', 'Disco', 'Nu-funk', 'P-funk', 'Blue-eyed soul', 'Philly soul']
  },
  {
    category: 'Country', icon: '🤠',
    genres: ['Country pop', 'Country rock', 'Outlaw country', 'Traditional country', 'Honky-tonk', 'Western swing', 'Red dirt country', 'Bro-country', 'Alt-country']
  },
  {
    category: 'Jazz', icon: '🎷',
    genres: ['Smooth jazz', 'Jazz fusion', 'Bebop', 'Swing', 'Cool jazz', 'Bossa nova', 'Acid jazz', 'Hard bop', 'Free jazz', 'Latin jazz', 'Modal jazz', 'Post-bop', 'Nu-jazz', 'Jazz-funk']
  },
  {
    category: 'Latin', icon: '💃',
    genres: ['Reggaeton', 'Salsa', 'Cumbia', 'Bachata', 'Dembow', 'Tango', 'Merengue', 'Bolero', 'Timba', 'Latin pop', 'Vallenato', 'Mariachi', 'Flamenco', 'Latin jazz', 'Tropical']
  },
  {
    category: 'Reggae / Dub', icon: '🌴',
    genres: ['Reggae', 'Dub', 'Dancehall', 'Ska', 'Rocksteady', 'Roots reggae', 'Digital reggae', 'Lovers rock', 'Ragga', 'Dub techno']
  },
  {
    category: 'Metal', icon: '🤘',
    genres: ['Blackgaze', 'Doom metal', 'Melodic death metal', 'Djent', 'Symphonic metal', 'Power metal', 'Black metal', 'Thrash metal', 'Nu-metal', 'Post-metal', 'Progressive metal', 'Death metal', 'Sludge metal', 'Folk metal', 'Groove metal', 'Gothic metal', 'Industrial metal', 'Deathcore', 'Metalcore', 'Mathcore']
  },
  {
    category: 'Clásica / Orquestal', icon: '🎻',
    genres: ['Baroque', 'Romantic era', 'Minimalist classical', 'Neo-classical', 'Chamber music', 'Orchestral', 'Film score', 'Contemporary classical', 'Opera', 'Choral', 'Piano solo', 'String quartet']
  },
  {
    category: 'Ambiental / Cinematográfica', icon: '🌌',
    genres: ['Ambient', 'Dark ambient', 'Drone', 'Cinematic', 'Epic orchestral', 'Trailer music', 'Emotional piano', 'Nature soundscape', 'New age', 'Space music', 'Meditation', 'Binaural beats']
  },
  {
    category: 'Africana / World', icon: '🌍',
    genres: ['Afrobeats', 'Afro-pop', 'Highlife', 'Amapiano', 'Kwaito', 'Jùjú music', 'Mbalax', 'Afroswing', 'Afrofusion', 'Afro-soul']
  },
  {
    category: 'World Music', icon: '🌏',
    genres: ['Flamenco', 'Celtic', 'Klezmer', 'Samba', 'Fado', 'Gamelan', 'Indian classical', 'Middle Eastern', 'Turkish folk', 'Greek folk', 'Balkan', 'Cumbia', 'Zouk', 'Afrobeat (Fela)', 'Highlife', 'Calypso']
  }
]

const ORCHESTRATION_LEVELS = [
  { level: 1, label: 'Solo instrumento', sublabel: '1 instrumento', descriptor_acoustic: 'solo acoustic instrument', descriptor_electronic: 'solo synthesizer, minimal' },
  { level: 2, label: 'Dúo', sublabel: '2 instrumentos', descriptor_acoustic: 'intimate duo, two acoustic instruments', descriptor_electronic: 'minimal electronic duo' },
  { level: 3, label: 'Trío', sublabel: '3 instrumentos', descriptor_acoustic: 'acoustic trio, stripped arrangement', descriptor_electronic: 'small electronic ensemble' },
  { level: 4, label: 'Cuarteto / Quinteto', sublabel: '4-5 instrumentos', descriptor_acoustic: 'small chamber ensemble', descriptor_electronic: 'electronic chamber sound' },
  { level: 5, label: 'Banda completa', sublabel: 'guitarra, bajo, batería, teclado', descriptor_acoustic: 'full band, guitar bass drums keys', descriptor_electronic: 'full electronic band production' },
  { level: 6, label: 'Banda + metales', sublabel: 'con sección de vientos', descriptor_acoustic: 'full band with horn section, brass and woodwinds', descriptor_electronic: 'full production with brass section' },
  { level: 7, label: 'Orquesta de cámara', sublabel: '20-40 músicos', descriptor_acoustic: 'chamber orchestra, strings and woodwinds', descriptor_electronic: 'orchestral arrangement with electronics' },
  { level: 8, label: 'Orquesta completa', sublabel: '60-80 músicos', descriptor_acoustic: 'full orchestra, symphonic arrangement, rich strings', descriptor_electronic: 'cinematic orchestral with electronic production' },
  { level: 9, label: 'Gran orquesta sinfónica', sublabel: '80-120 músicos', descriptor_acoustic: 'grand symphonic orchestra, massive orchestral scale', descriptor_electronic: 'epic cinematic orchestra with electronic elements, trailer-scale' }
]

const MOODS = [
  'Melancólico', 'Eufórico', 'Agresivo', 'Soñador', 'Nostálgico', 'Oscuro',
  'Romántico', 'Esperanzador', 'Misterioso', 'Energético', 'Juguetón',
  'Inquietante', 'Meditativo', 'Triunfal', 'Angustiado', 'Épico',
  'Íntimo', 'Festivo', 'Rebelde', 'Sereno', 'Urgente', 'Hipnótico'
]

const MOOD_EN = {
  'Melancólico': 'melancholic', 'Eufórico': 'euphoric', 'Agresivo': 'aggressive',
  'Soñador': 'dreamy', 'Nostálgico': 'nostalgic', 'Oscuro': 'dark',
  'Romántico': 'romantic', 'Esperanzador': 'hopeful', 'Misterioso': 'mysterious',
  'Energético': 'energetic', 'Juguetón': 'playful', 'Inquietante': 'haunting',
  'Meditativo': 'meditative', 'Triunfal': 'triumphant', 'Angustiado': 'anguished',
  'Épico': 'epic', 'Íntimo': 'intimate', 'Festivo': 'festive', 'Rebelde': 'rebellious',
  'Sereno': 'serene', 'Urgente': 'urgent', 'Hipnótico': 'hypnotic'
}

const VOCAL_STYLES = [
  { id: 'clean', label: 'Limpio / Clean', en: 'clean vocals' },
  { id: 'raspy', label: 'Rasposo / Raspy', en: 'raspy vocals' },
  { id: 'breathy', label: 'Con aire / Breathy', en: 'breathy vocals' },
  { id: 'falsetto', label: 'Falsete / Falsetto', en: 'falsetto vocals' },
  { id: 'operatic', label: 'Operístico', en: 'operatic vocals' },
  { id: 'autotune', label: 'Auto-tune', en: 'auto-tuned vocals' },
  { id: 'growl', label: 'Gutural / Growl', en: 'growl vocals' },
  { id: 'spoken', label: 'Hablado / Spoken word', en: 'spoken word' },
  { id: 'melismatic', label: 'Melismático (runs)', en: 'melismatic vocals, vocal runs' },
  { id: 'monotone', label: 'Monotonal', en: 'monotone delivery' }
]

const PRODUCTION_SCALES = [
  { id: 'lofi', label: 'Lo-fi / Raw', sublabel: 'Cassette, bedroom, crudo', descriptor: 'lo-fi, tape saturation, bedroom recording, raw, analog warmth' },
  { id: 'indie', label: 'Indie / Mid-fi', sublabel: 'Cálido, orgánico, íntimo', descriptor: 'warm analog recording, indie production, intimate feel, live room' },
  { id: 'polished', label: 'Pulido / Radio', sublabel: 'Limpio, profesional', descriptor: 'polished mix, radio-ready, clean production, crisp and bright' },
  { id: 'cinematic', label: 'Cinematográfico', sublabel: 'Épico, amplio, dramático', descriptor: 'cinematic mix, wide stereo, dramatic, epic production, orchestral scale' }
]

const ADLIBS_BY_GENRE = {
  'trap': ['(yeah)', '(aye)', '(woo)', '(uh)', "(let's go)", '(skrrt)', '(slatt)', '(drip)'],
  'boom bap': ['(uh huh)', '(yeah)', '(okay)', '(check it)', '(word)', '(real talk)'],
  'hip-hop': ['(uh huh)', '(yeah)', '(okay)', '(mm)', "(let's go)", '(c\'mon)', '(break it down)'],
  'phonk': ['(skrrt)', '(drift)', '(yeah)', '(aye)', '(woah)', '(phonk)'],
  'drill': ['(ching)', '(gang)', '(on sight)', '(no cap)', '(facts)', '(woo)'],
  'r&b': ['(oh yeah)', '(mmm)', '(hey)', '(whoa)', '(oooh)', '(baby)', '(alright)'],
  'neo-soul': ['(yeah yeah)', '(oh)', '(hey!)', '(mmm)', '(feel it)', '(deep)'],
  'soul': ['(yeah yeah)', '(oooh)', '(come on)', '(sing it)', '(feel it baby)'],
  'gospel': ['(hallelujah)', '(amen)', '(glory)', '(yes Lord)', '(praise Him)', '(oh glory)'],
  'pop': ['(whoa)', '(hey)', '(yeah yeah)', '(oh oh)', '(woah oh)', '(la la la)'],
  'rock': ['(yeah!)', '(woah)', '(hey!)', "(c'mon)", '(alright)', '(let me hear you)'],
  'punk': ['(oi!)', '(hey!)', '(go!)', '(now!)', '(yeah!)'],
  'metal': ['[Scream]', '(growl)', '(yeah!)', '(rise!)', '(now!)', '(die!)'],
  'country': ['(yeah)', '(hey)', '(woah)', '(c\'mon boy)', '(alright y\'all)'],
  'jazz': ['(yeah)', '(mm-mm)', '(that\'s it)', '(swing it)', '(one more time)'],
  'house': ['(yeah)', '(move your body)', '(feel it)', '(yeah yeah)', "(let's go)"],
  'electronic': ['[Build]', '[Drop]', '(rise)', '(drop it)', '(feel the bass)'],
  'reggae': ['(yeah man)', '(one love)', '(irie)', '(respect)', '(jah)'],
  'dancehall': ['(dem say)', '(woi)', '(skank)', '(seet deh)', '(inna di dance)'],
  'latin': ['(ay!)', '(dale)', '(wepa)', '(eso)', '(óyeme)', '(arriba)'],
  'flamenco': ['(olé)', '(ay!)', '(palmas)', '(jaleo)', '(venga)'],
  'afrobeats': ['(aye)', '(e don happen)', '(soro soke)', '(wahala)', "(let's go)"],
  'bossa nova': ['(sim)', '(é isso)', '(saudade)', '(amor)'],
  'default': ['(yeah)', '(hey)', '(whoa)', '(oh)', '(mmm)', '(alright)', '(let\'s go)']
}

const INLINE_VOCAL_TAGS = [
  { tag: '(whispered)', desc: 'Susurrado' },
  { tag: '(softly)', desc: 'Suavemente' },
  { tag: '(spoken)', desc: 'Hablado' },
  { tag: '(building)', desc: 'Con intensidad creciente' },
  { tag: '(powerful)', desc: 'Poderoso' },
  { tag: '(belted)', desc: 'Cantado con fuerza' },
  { tag: '(screaming)', desc: 'Gritado' },
  { tag: '(harmonized)', desc: 'Armonizado' },
  { tag: '(ad-lib)', desc: 'Ad-lib general' },
  { tag: '(laughs)', desc: 'Con risa' },
  { tag: '(echo)', desc: 'Con eco' },
  { tag: '(fade)', desc: 'Desvaneciendo' },
  { tag: '(raspy)', desc: 'Rasposo' },
  { tag: '(breathy)', desc: 'Con aire' }
]

const SECTION_TAGS = [
  { id: 'intro', tag: '[Intro]', label: 'Intro', enabled: true },
  { id: 'verse1', tag: '[Verse 1]', label: 'Verso 1', enabled: true },
  { id: 'prechorus', tag: '[Pre-Chorus]', label: 'Pre-Coro', enabled: false },
  { id: 'chorus', tag: '[Chorus]', label: 'Coro', enabled: true },
  { id: 'verse2', tag: '[Verse 2]', label: 'Verso 2', enabled: true },
  { id: 'prechorus2', tag: '[Pre-Chorus]', label: 'Pre-Coro 2', enabled: false },
  { id: 'chorus2', tag: '[Chorus]', label: 'Coro 2', enabled: true },
  { id: 'bridge', tag: '[Bridge]', label: 'Puente', enabled: false },
  { id: 'finalchorus', tag: '[Final Chorus]', label: 'Coro Final', enabled: true },
  { id: 'outro', tag: '[Outro]', label: 'Outro', enabled: true }
]

const EXTRA_SECTION_TAGS = [
  '[Guitar Solo]', '[Piano Solo]', '[Saxophone Solo]', '[Drum Solo]',
  '[Instrumental Break]', '[Instrumental]', '[Interlude]',
  '[Build]', '[Drop]', '[Breakdown]', '[Key Change]',
  '[Fade Out]', '[Fade In]', '[End]'
]

const BPM_PRESETS = [
  { label: 'Muy lento', bpm: 60, desc: 'Drone, ambient, ballad' },
  { label: 'Lento', bpm: 75, desc: 'Blues, soul, bolero' },
  { label: 'Moderado', bpm: 95, desc: 'Folk, country, pop clásico' },
  { label: 'Medio', bpm: 115, desc: 'Pop, jazz, funk' },
  { label: 'Animado', bpm: 128, desc: 'House, pop, dance' },
  { label: 'Rápido', bpm: 145, desc: 'DnB, punk, hip-hop trap' },
  { label: 'Muy rápido', bpm: 175, desc: 'Metal, hardcore, gabber' }
]

const INSTRUMENT_SUGGESTIONS = {
  acoustic: ['Fingerpicked acoustic guitar', 'Nylon string guitar', 'Upright bass', 'Grand piano', 'Rhodes electric piano', 'Upright piano', 'Violin', 'Cello', 'String quartet', 'Mandolin', 'Banjo', 'Dobro / Resonator', 'Pedal steel', 'Harmonica', 'Flute', 'Clarinet', 'Trumpet', 'Trombone', 'Saxophone', 'French horn', 'Tabla', 'Congas', 'Brush kit drums', 'Vibraphone', 'Marimba', 'Harp', 'Accordion'],
  electronic: ['TR-909 drum machine', '808 bass / kick', 'Moog synthesizer', 'Juno-106 pad', 'Oberheim synth stabs', 'Yamaha DX7', 'Arp 2600', 'TB-303 acid bassline', 'LFO sweeps', 'Modular synth', 'Sub-bass', 'Supersaw synth', 'Vocoder', 'Sampler / MPC', 'Lo-fi drum machine', 'Arpeggiator'],
  hybrid: ['Electric guitar (clean)', 'Distorted electric guitar', 'Bass guitar (electric)', 'Drum kit (live)', 'Hammond organ', 'Fender Rhodes', 'Wurlitzer', 'Lap steel guitar', 'Baritone guitar']
}
