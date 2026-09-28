// src/lib/data/repositories/MovimientoRepository.js
// Migrado de Supabase directo a la SCA API. GET /movimientos solo filtra por
// un único día (`fecha`), no por rango, así que iteramos día por día.
import { apiFetch, AREA_API_TO_LOCAL } from '../apiClient';

function rangoFechas(fechaInicioISO, fechaFinISO) {
  if (!fechaInicioISO) return [];
  const inicio = new Date(fechaInicioISO);
  const fin = fechaFinISO ? new Date(fechaFinISO) : inicio;
  const cursor = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
  const ultimo = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate());

  const fechas = [];
  while (cursor <= ultimo) {
    fechas.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return fechas;
}

function combinarFechaHora(fecha, hora) {
  if (!hora) return null;
  // hora_salida llega como datetime ISO completo; hora_entrada, como TIME suelto
  return hora.includes('T') ? hora : `${fecha}T${hora}`;
}

export const MovimientoRepository = {
  obtenerHistorial: async (fechaInicioISO, fechaFinISO) => {
    const fechas = rangoFechas(fechaInicioISO, fechaFinISO);
    if (fechas.length === 0) return [];

    const [movimientosPorDia, corridasPorDia] = await Promise.all([
      Promise.all(fechas.map((f) => apiFetch(`/movimientos?fecha=${f}`))),
      Promise.all(fechas.map((f) => apiFetch(`/corridas?fecha=${f}`))),
    ]);

    const tipoPorFechaSerie = new Map();
    for (const corrida of corridasPorDia.flat()) {
      tipoPorFechaSerie.set(`${corrida.fecha}-${corrida.serie}`, corrida.tipo_nombre);
    }

    return movimientosPorDia
      .flat()
      .map((m) => ({
        id_movimiento: m.id,
        hora_entrada: combinarFechaHora(m.fecha, m.hora_entrada),
        hora_salida: combinarFechaHora(m.fecha, m.hora_salida),
        autobus: {
          numero_serie: m.serie,
          tipo_unidad: tipoPorFechaSerie.get(`${m.fecha}-${m.serie}`) || 'N/A',
        },
        area: { nombre_area: AREA_API_TO_LOCAL[m.area_nombre] || m.area_nombre },
      }))
      .sort((a, b) => (b.hora_entrada || '').localeCompare(a.hora_entrada || ''));
  },
};
