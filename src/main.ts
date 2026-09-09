import './style.css';
import { startRouter } from './router/router.ts';
import { resumePendingResult } from './exam/resultQueue.ts';

const root = document.getElementById('app');
if (!root) {
  throw new Error('No se encontró el contenedor #app');
}

startRouter(root);

// Si quedó un resultado sin confirmar (recarga, cierre de pestaña, backend
// congestionado), se reintenta en segundo plano.
resumePendingResult();
