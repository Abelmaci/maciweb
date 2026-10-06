// Datos técnicos del sitio: dominio, analytics, navegación y datos estructurados.
// Los textos editables (SEO, redes, secciones) están en textos.json (Strapi).

export const SITE = {
  url: 'https://macimusic.es/',
  name: 'MACI',
  ogImage: 'https://macimusic.es/images/opengraph.jpg',
  themeColor: '#0e0e0f',
  googleSiteVerification: 'v6knNyaAd6sDMSaU9LULXPnhZWhRyFbVg_W0OxBZRu8',
  gaId: 'G-CZ95R97TWB',
};

export const NAV = [
  { href: '#inicio', es: 'INICIO', en: 'HOME' },
  { href: '#discografía', es: 'DISCOGRAFÍA', en: 'DISCOGRAPHY' },
  { href: '#biografía', es: 'BIOGRAFÍA', en: 'BIOGRAPHY' },
  { href: '#adela', es: 'ADELA', en: 'ADELA' },
  { href: '#plataformas', es: 'PLATAFORMAS', en: 'PLATFORMS' },
  { href: '#lanzamientos', es: 'LANZAMIENTOS', en: 'RELEASES' },
  { href: '#easyprompt', es: 'APPS', en: 'APPS' },
];

export const JSON_LD = [
  {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    '@id': 'https://macimusic.es/#maci',
    name: 'MACI',
    url: 'https://macimusic.es/',
    genre: ['AI Music', 'Digital Music'],
    member: {
      '@type': 'Person',
      name: 'Abel Maciñeiras',
      role: 'Composer, Producer',
    },
  },
  [
    {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      '@id': 'https://macimusic.es/#jobeneva',
      name: 'Jobeneva: Endgame',
      creator: { '@id': 'https://macimusic.es/#maci' },
      description: 'AI-influenced digital music piece combining human composition and electronic production.',
      inLanguage: 'es',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      '@id': 'https://macimusic.es/#poetripper',
      name: 'Poetripper',
      creator: { '@id': 'https://macimusic.es/#maci' },
      description: 'Experimental digital track blending AI music generation and emotional composition.',
      inLanguage: 'es',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      '@id': 'https://macimusic.es/#parnu',
      name: 'Pärnu Pastoraal',
      creator: { '@id': 'https://macimusic.es/#maci' },
      description: 'Atmospheric AI-assisted composition inspired by emotional and ambient textures.',
      inLanguage: 'es',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      '@id': 'https://macimusic.es/#pakslaul',
      name: 'Paks laul',
      creator: { '@id': 'https://macimusic.es/#maci' },
      description: 'Fusion of digital production and human-driven melodic structure.',
      inLanguage: 'es',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      '@id': 'https://macimusic.es/#tahtede',
      name: 'Tähtede poole',
      creator: { '@id': 'https://macimusic.es/#maci' },
      description: 'Experimental AI music piece exploring emotional soundscapes and rhythm design.',
      inLanguage: 'es',
    },
  ],
  {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Abel Maciñeiras',
    jobTitle: 'Composer and Music Producer',
    description: 'Digital artist behind MACI project',
  },
];
