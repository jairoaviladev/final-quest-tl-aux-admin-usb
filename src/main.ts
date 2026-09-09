import './style.css';
import { startRouter } from './router/router.ts';

const root = document.getElementById('app');
if (!root) {
  throw new Error('No se encontró el contenedor #app');
}

startRouter(root);
