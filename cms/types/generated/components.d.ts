import type { Schema, Struct } from '@strapi/strapi';

export interface TextosBilingue extends Struct.ComponentSchema {
  collectionName: 'components_textos_bilingues';
  info: {
    description: 'Texto corto en espa\u00F1ol e ingl\u00E9s';
    displayName: 'Texto ES/EN';
    icon: 'globe';
  };
  attributes: {
    en: Schema.Attribute.String & Schema.Attribute.Required;
    es: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface TextosBilingueLargo extends Struct.ComponentSchema {
  collectionName: 'components_textos_bilingues_largos';
  info: {
    description: 'Texto en espa\u00F1ol e ingl\u00E9s; los saltos de l\u00EDnea se respetan en la web';
    displayName: 'Texto largo ES/EN';
    icon: 'feather';
  };
  attributes: {
    en: Schema.Attribute.Text & Schema.Attribute.Required;
    es: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

export interface TextosEnlaceMenu extends Struct.ComponentSchema {
  collectionName: 'components_textos_enlaces_menu';
  info: {
    description: 'Texto ES/EN y secci\u00F3n a la que lleva';
    displayName: 'Enlace del men\u00FA';
    icon: 'link';
  };
  attributes: {
    destino: Schema.Attribute.Enumeration<
      [
        'inicio',
        'discograf\u00EDa',
        'biograf\u00EDa',
        'adela',
        'plataformas',
        'lanzamientos',
        'easyprompt',
        'colaboraciones',
      ]
    > &
      Schema.Attribute.Required;
    en: Schema.Attribute.String & Schema.Attribute.Required;
    es: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface TextosParrafo extends Struct.ComponentSchema {
  collectionName: 'components_textos_parrafos';
  info: {
    description: 'P\u00E1rrafo en espa\u00F1ol e ingl\u00E9s';
    displayName: 'P\u00E1rrafo ES/EN';
    icon: 'paragraph';
  };
  attributes: {
    destacado: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    en: Schema.Attribute.Text & Schema.Attribute.Required;
    es: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'textos.bilingue': TextosBilingue;
      'textos.bilingue-largo': TextosBilingueLargo;
      'textos.enlace-menu': TextosEnlaceMenu;
      'textos.parrafo': TextosParrafo;
    }
  }
}
