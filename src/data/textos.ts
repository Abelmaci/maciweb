// Textos editables de la web (src/data/textos.json, editado desde Strapi).
import textos from './textos.json';

export interface Bilingue {
  es: string;
  en: string;
}

export interface Parrafo extends Bilingue {
  destacado: boolean;
}

export const TEXTOS = textos;

// Atributos que usa el selector de idioma (src/scripts/core.js).
export const i18n = (t: Bilingue) => ({ 'data-i18n-es': t.es, 'data-i18n-en': t.en });

// Lista de "una cosa por línea" (campo de texto largo en Strapi).
export const lineas = (texto: string) => texto.split('\n').map((l) => l.trim()).filter(Boolean);
