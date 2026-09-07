// src/lib/data/repositories/AutobusRepository.js
// Migrado de Supabase directo (esquema viejo autobus/area/bitacora_movimiento,
// que ya no existe en producción) a la SCA API (corridas/registros/movimientos).
import { apiFetch, AREA_API_TO_LOCAL, AREA_LOCAL_TO_API } from '../apiClient';

// Pydantic "need_*" de /corridas <-> nombre de área local (mismos ids que usa
// useRegistroBloc.WORKFLOW_ORDER y PatioPage.definicionAreas).
const NEED_FIELD_TO_AREA = {
  need_recepcion: 'Recepcion',
  need_desfogue: 'Desfogue',
  need_diesel: 'Diesel',
  need_adblue: 'Ad-blue',
  need_lav_ext: 'Lavado Exterior',
  need_lav_int: 'Lavado Interior',
  need_taller: 'Taller',
};

function esPrioridad(horaSalida) {
  if (!horaSalida) return false;
  const [h, m] = horaSalida.split(':').map(Number);
  const ahora = new Date();
  const salida = new Date();
  salida.setHours(h, m, 0, 0);
  if (salida < ahora) salida.setDate(salida.getDate() + 1);
  return (salida - ahora) / (1000 * 60) <= 60;
}

// El sync de Sheets a veces guarda un timestamp ISO completo en hora_salida
// ("2026-05-12T12:14:30...") en vez de "HH:MM:SS"; si tomamos los primeros 5
// caracteres de eso, los promedios del patio terminan en NaN.
function horaCorta(valor) {
  if (!valor) return undefined;
  const t = valor.includes('T') ? valor.split('T')[1] : valor;
  return t.substring(0, 5);
}

function construirHistorial(movimientosDelBus) {
  const historial = {};
  for (const m of movimientosDelBus) {
    const areaLocal = AREA_API_TO_LOCAL[m.area_nombre] || m.area_nombre;
    historial[areaLocal] = {
      inicio: horaCorta(m.hora_entrada) || '',
      fin: horaCorta(m.hora_salida),
    };
  }
  return historial;
}

export const AutobusRepository = {
  registrarAutobus: async (datos) => {
    const needs = Object.fromEntries(
      Object.entries(NEED_FIELD_TO_AREA).map(([campo, area]) => [
        campo,
        datos.areasRequeridas.includes(area) ? 1 : 0,
      ])
    );

    await apiFetch('/corridas', {
      method: 'POST',
      body: JSON.stringify({
        serie: Number(datos.numeroSerie),
        tipo_nombre: datos.tipoUnidad,
        hora_salida: datos.horaSalida || null,
        conductor: datos.conductor || null,
        terminal_origen: datos.terminalOrigen || null,
        terminal_destino: datos.terminalDestino || null,
        observaciones: datos.observaciones || null,
        ...needs,
      }),
    });

    // Coloca la unidad en su área inicial (si no es una espera pura)
    const areaApi = AREA_LOCAL_TO_API[datos.areaInicial];
    if (areaApi) {
      await apiFetch('/movimientos', {
        method: 'POST',
        body: JSON.stringify({ serie: Number(datos.numeroSerie), area_nombre: areaApi }),
      });
    }
  },

  obtenerAutobusesActivos: async () => {
    const [registros, corridas, movimientos] = await Promise.all([
      apiFetch('/registros'),
      apiFetch('/corridas'),
      apiFetch('/movimientos'),
    ]);

    const corridaPorSerie = new Map(corridas.map((c) => [c.serie, c]));
    const movsPorSerie = new Map();
    for (const m of movimientos) {
      const lista = movsPorSerie.get(m.serie) || [];
      lista.push(m);
      movsPorSerie.set(m.serie, lista);
    }

    return registros
      .filter((r) => r.ubicacion_texto !== 'Salida')
      .map((r) => {
        const corrida = corridaPorSerie.get(r.serie) || {};
        const movsBus = movsPorSerie.get(r.serie) || [];
        const abierto = movsBus.find((m) => !m.completado) || null;
        const completados = movsBus.filter((m) => m.completado);

        const requiredAreas = Object.entries(NEED_FIELD_TO_AREA)
          .filter(([campo]) => corrida[campo])
          .map(([, area]) => area);

        return {
          id_autobus: r.id,
          busId: r.serie,
          busType: corrida.tipo_nombre || '',
          departureTime: corrida.hora_salida ? corrida.hora_salida.substring(0, 5) : '--:--',
          conductor: corrida.conductor || '',
          terminalOrigen: corrida.terminal_origen || '',
          terminalDestino: corrida.terminal_destino || '',
          observaciones: corrida.observaciones || '',
          requiredAreas,
          completedAreas: completados.map((m) => AREA_API_TO_LOCAL[m.area_nombre] || m.area_nombre),
          currentArea: abierto ? AREA_API_TO_LOCAL[abierto.area_nombre] || abierto.area_nombre : 'Espera',
          progressPercentage:
            requiredAreas.length === 0 ? 100 : Math.round((completados.length / requiredAreas.length) * 100),
          isPriority: esPrioridad(corrida.hora_salida),
          estadoServicio: 'Pendiente', // ver TODO en usePatioBloc.js: no hay campo persistido para esto
          historialTiempos: construirHistorial(movsBus),
          ingresoPatio: r.hora_registro,
          movimientoAbiertoId: abierto ? abierto.id : null,
        };
      });
  },

  // No hay un campo "servicio iniciado" persistido en el esquema actual de records/movements.
  // usePatioBloc.js maneja esa transición Pendiente -> En Proceso solo en el cliente.
  iniciarServicio: async () => {},

  moverAutobus: async (bus, nuevaArea) => {
    if (bus.movimientoAbiertoId) {
      await apiFetch(`/movimientos/${bus.movimientoAbiertoId}/completar`, { method: 'PUT' });
    }

    if (nuevaArea === 'Salida') {
      await apiFetch(`/registros/${bus.busId}`, {
        method: 'PUT',
        body: JSON.stringify({ ubicacion_texto: 'Salida', avance: 100 }),
      });
      return;
    }

    if (nuevaArea === 'Espera') {
      return; // sin movimiento abierto, obtenerAutobusesActivos ya lo resuelve como 'Espera'
    }

    // Áreas creadas desde el Gestor de Áreas no están en el mapa fijo de
    // las 7 áreas originales del Sheet — su nombre local ya es el nombre
    // real en la API (ver AreaRepository.listar), de ahí el fallback.
    const areaApi = AREA_LOCAL_TO_API[nuevaArea] || nuevaArea;

    await apiFetch('/movimientos', {
      method: 'POST',
      body: JSON.stringify({ serie: bus.busId, area_nombre: areaApi }),
    });
  },

  // Avance automático (swipe / NFC): el backend resuelve el siguiente paso de
  // la ruta del camión y cierra+abre el movimiento en una sola transacción —
  // reemplaza la orquestación de 2 llamadas de moverAutobus para este flujo.
  avanzarAutobus: (serie) => apiFetch(`/camiones/${serie}/avanzar`, { method: 'POST' }),

  escanearNfc: (tagUid) =>
    apiFetch('/nfc/scan', {
      method: 'POST',
      body: JSON.stringify({ tag_uid: tagUid }),
    }),

  registrarTagNfc: (tagUid, serie) =>
    apiFetch('/nfc/tags', {
      method: 'POST',
      body: JSON.stringify({ tag_uid: tagUid, serial_number: Number(serie) }),
    }),
};
