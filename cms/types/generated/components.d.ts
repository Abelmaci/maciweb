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
      'textos.parrafo': TextosParrafo;
    }
  }
}
