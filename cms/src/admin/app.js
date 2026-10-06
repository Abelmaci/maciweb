// Panel de Strapi en español.
const config = {
  locales: ['es'],
  translations: {
    es: {
      'Auth.form.welcome.title': 'MACI · Contenidos',
      'Auth.form.welcome.subtitle': 'Entra para editar la web',
    },
  },
  tutorials: false,
  notifications: { releases: false },
};

export default {
  config,
  bootstrap() {},
};
