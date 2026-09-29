// Punto de entrada de los scripts de la página. Astro lo empaqueta como
// módulo (diferido), así que se ejecuta antes de DOMContentLoaded.
import { initCore } from './core.js';
import { initApp } from './app.js';

const start = () => {
  initCore();
  initApp();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
