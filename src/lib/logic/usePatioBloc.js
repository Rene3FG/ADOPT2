// src/lib/logic/usePatioBloc.js
import { useState, useEffect, useRef } from 'react';
import { AutobusRepository } from '../data/repositories/AutobusRepository';

// Tiempos iniciales "quemados" (En minutos). El sistema los ajustará con los datos reales.
const TIEMPOS_BASE = {
  'Desfogue': 15,
  'Diesel': 15,
  'Lavado Exterior': 20,
  'Lavado Interior': 20,
  'Ad-blue': 10,
  'Taller': 45,
  'Espera': 999 
};

export const usePatioBloc = () => {
  const [autobuses, setAutobuses] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busSeleccionado, setBusSeleccionado] = useState(null);
  const [areaDestino, setAreaDestino] = useState('');
  const [moviendo, setMoviendo] = useState(false);
  
  // Estado para guardar los promedios dinámicos calculados
  const [promediosArea, setPromediosArea] = useState(TIEMPOS_BASE);
  
  // Reloj interno para forzar actualización de los semáforos cada minuto
  const [tick, setTick] = useState(0);

  // Marca si ya hubo una primera carga: los refrescos periódicos no deben
  // encender el spinner (evita el parpadeo de "Cargando..." cada 30 seg).
  const primeraCargaHechaRef = useRef(false);

  const calcularPromediosDinamicos = (buses) => {
    let sumas = {};
    let conteos = {};
    
    // Inicializamos con el tiempo base (le damos un "peso" de 3 camiones para no tener saltos bruscos)
    Object.keys(TIEMPOS_BASE).forEach(area => {
      sumas[area] = TIEMPOS_BASE[area] * 3;
      conteos[area] = 3;
    });

    // Sumamos los tiempos reales del historial de cada camión
    buses.forEach(bus => {
      Object.entries(bus.historialTiempos || {}).forEach(([area, tiempos]) => {
        // El sync de Sheets deja hora_entrada en "00:00:00.xxx" (serial de Excel,
        // no una hora real); esas filas inflaban el promedio a cientos de minutos.
        if (tiempos.inicio === '00:00') return;
        if (tiempos.inicio && tiempos.fin) {
          const [hI, mI] = tiempos.inicio.split(':').map(Number);
          const [hF, mF] = tiempos.fin.split(':').map(Number);
          let diff = (hF * 60 + mF) - (hI * 60 + mI);
          if (diff < 0) diff += 24 * 60; // Ajuste por si cruza la medianoche
          // Hora malformada o área fuera de TIEMPOS_BASE: no contaminar el promedio con NaN.
          // El tope de 180 min descarta movimientos con hora_salida de otro día
          // (el sync mezcla timestamps viejos); ningún servicio real dura tanto.
          if (!Number.isFinite(diff) || diff > 180 || sumas[area] === undefined) return;
          sumas[area] += diff;
          conteos[area] += 1;
        }
      });
    });

    let nuevosPromedios = {};
    Object.keys(sumas).forEach(area => {
      nuevosPromedios[area] = Math.round(sumas[area] / conteos[area]);
    });
    setPromediosArea(nuevosPromedios);
  };

  // TODO: el esquema actual (records/movements) no tiene un campo persistido
  // para "servicio iniciado" — solo sabemos cuándo entró a la área (entry_time),
  // no cuándo el operador confirmó que ya está siendo atendida. Por eso ese
  // segundo momento se guarda solo en memoria del cliente (se pierde al recargar
  // la página). Si esto importa para reportes, hay que agregar la columna en
  // movements y exponerla en POST/PUT /movimientos.
  const iniciadosRef = useRef({}); // { [busId]: { area, horaInicio } }

  const aplicarIniciados = (data) =>
    data.map((bus) => {
      const local = iniciadosRef.current[bus.busId];
      if (local && local.area === bus.currentArea) {
        return {
          ...bus,
          estadoServicio: 'En Proceso',
          historialTiempos: {
            ...bus.historialTiempos,
            [bus.currentArea]: { ...bus.historialTiempos[bus.currentArea], inicio: local.horaInicio },
          },
        };
      }
      return bus;
    });

  const limpiarIniciado = (busId) => { delete iniciadosRef.current[busId]; };

  const cargarAutobuses = async () => {
    if (!primeraCargaHechaRef.current) setCargando(true);
    try {
      const data = await AutobusRepository.obtenerAutobusesActivos();
      const activos = aplicarIniciados(data.filter(bus => bus.currentArea !== 'Salida'));
      setAutobuses(activos);
      primeraCargaHechaRef.current = true;
      calcularPromediosDinamicos(data); // Calculamos usando incluso los que ya salieron si están en la query
    } catch (error) {
      console.error("No se pudieron cargar los autobuses:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarAutobuses();
    // "Tiempo real" sin Supabase: la API no emite eventos, así que refrescamos
    // silenciosamente cada 30 seg (mismo reloj que actualiza los semáforos).
    const intervalo = setInterval(() => {
      setTick(t => t + 1);
      cargarAutobuses();
    }, 30000);
    return () => clearInterval(intervalo);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const abrirModalMover = (bus) => { setBusSeleccionado(bus); setAreaDestino(''); };
  const cerrarModal = () => { setBusSeleccionado(null); setAreaDestino(''); };
  const obtenerOcupacion = (nombreArea) => autobuses.filter(bus => bus.currentArea === nombreArea).length;

  const arrancarServicio = async (bus) => {
    try {
      await AutobusRepository.iniciarServicio(bus);
      const horaActual = new Date().toLocaleTimeString('es-MX', { hour12: false, hour: '2-digit', minute: '2-digit' });
      iniciadosRef.current[bus.busId] = { area: bus.currentArea, horaInicio: horaActual };
      await cargarAutobuses();
    } catch (error) { alert("Error al iniciar servicio."); }
  };

  const confirmarMovimiento = async () => {
    if (!areaDestino || !busSeleccionado) return;
    setMoviendo(true);
    try {
      await AutobusRepository.moverAutobus(busSeleccionado, areaDestino);
      limpiarIniciado(busSeleccionado.busId);
      await cargarAutobuses();
      cerrarModal();
    } catch (error) { alert("Error al mover la unidad."); }
    finally { setMoviendo(false); }
  };

  const confirmarMovimientoDirecto = async (bus, destino) => {
    if (!destino || !bus) return;
    setMoviendo(true);
    try {
      await AutobusRepository.moverAutobus(bus, destino);
      limpiarIniciado(bus.busId);
      await cargarAutobuses();
    } catch (error) { alert("Error al mover la unidad."); }
    finally { setMoviendo(false); }
  };

  // Swipe / NFC: avanza automáticamente al siguiente paso de la ruta del
  // camión, sin pedir destino (lo resuelve el backend con POST /camiones/{serie}/avanzar).
  const avanzarBus = async (bus) => {
    if (!bus) return;
    setMoviendo(true);
    try {
      await AutobusRepository.avanzarAutobus(bus.busId);
      limpiarIniciado(bus.busId);
      await cargarAutobuses();
    } catch (error) {
      alert(error.message || "Error al avanzar la unidad.");
    } finally {
      setMoviendo(false);
    }
  };

  const avanzarPorNfc = async (tagUid) => {
    setMoviendo(true);
    try {
      const r = await AutobusRepository.escanearNfc(tagUid);
      await cargarAutobuses();
      return r;
    } finally {
      setMoviendo(false);
    }
  };

  // Escaneo de QR: el código trae el número de serie, así que se avanza directo
  // con POST /camiones/{serie}/avanzar (misma validación de área que el NFC).
  const avanzarPorQr = async (serie) => {
    setMoviendo(true);
    try {
      await AutobusRepository.avanzarAutobus(serie);
      limpiarIniciado(serie);
      await cargarAutobuses();
    } finally {
      setMoviendo(false);
    }
  };

  // NUEVA FUNCIÓN: Calcula el estado del semáforo para un camión
  const obtenerSemaforo = (bus) => {
    if (bus.estadoServicio !== 'En Proceso' || !bus.historialTiempos[bus.currentArea]?.inicio) return null;

    const [hI, mI] = bus.historialTiempos[bus.currentArea].inicio.split(':').map(Number);
    const now = new Date();
    let elapsed = (now.getHours() * 60 + now.getMinutes()) - (hI * 60 + mI);
    if (elapsed < 0) elapsed += 24 * 60; // Ajuste medianoche

    const promedio = promediosArea[bus.currentArea] || TIEMPOS_BASE[bus.currentArea];
    
    let color = 'verde';
    if (elapsed > promedio) color = 'rojo';
    else if (promedio - elapsed <= 5) color = 'naranja'; // Naranja si faltan 5 mins o menos

    return { color, elapsed, promedio };
  };

  return {
    autobuses, cargando, cargarAutobuses,
    busSeleccionado, areaDestino, setAreaDestino, moviendo,
    abrirModalMover, cerrarModal, confirmarMovimiento, obtenerOcupacion, arrancarServicio,
    confirmarMovimientoDirecto, avanzarBus, avanzarPorNfc, avanzarPorQr, obtenerSemaforo, promediosArea
  };
};