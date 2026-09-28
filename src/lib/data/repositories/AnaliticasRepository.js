import { apiFetch } from '../apiClient';

export const AnaliticasRepository = {
  // GET /analiticas: solo Administrador/Supervisor; el backend usa únicamente
  // movimientos capturados desde la app (los de Sheets son filas de prueba).
  obtener: (desde, hasta) => {
    const qs = new URLSearchParams();
    if (desde) qs.set('desde', desde);
    if (hasta) qs.set('hasta', hasta);
    return apiFetch(`/analiticas?${qs.toString()}`);
  },
};
