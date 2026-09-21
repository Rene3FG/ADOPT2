// src/pages/Patio/DropDrag.jsx — shell de escritorio (rediseño de Rosaura).
// Sustituye el mock local (CamionArea.json) por los mismos BLoCs/repositorios
// reales que ya usa la vista mobile (PatioPage.jsx), para no duplicar lógica
// de negocio: usePatioBloc resuelve datos/NFC/semáforos contra la SCA API.
import { useState, useEffect } from 'react';
import TarjetaInfo from './TarjetaInfo.jsx';
import './DropDrag.css';
import '../shared/desktop-shared.css';
import Registro from '../Registro/Registro.jsx';
import ConfAvaz from '../ConfAvanz/ConfAvaz.jsx';
import Reportes from '../Reportes/Reportes.jsx';
import { HistorialPage } from '../../lib/presentation/pages/HistorialPage.jsx';
import { usePatioBloc } from '../../lib/logic/usePatioBloc.js';
import { useMenuBloc } from '../../lib/logic/useMenuBloc.js';
import { AreaRepository } from '../../lib/data/repositories/AreaRepository.js';
import { AREAS_PATIO } from '../../lib/areasConfig.js';

import { MdDashboard, MdAssignmentTurnedIn, MdHistory, MdBarChart, MdSettings, MdExitToApp, MdAddAlert } from 'react-icons/md';
import { TbWash, TbWashDryDip } from 'react-icons/tb';
import { BsFillFuelPumpDieselFill } from 'react-icons/bs';
import { CiDroplet } from 'react-icons/ci';
import { HiMiniWrenchScrewdriver } from 'react-icons/hi2';

const AREA_ICONS = {
  'Desfogue': <TbWash />,
  'Diesel': <BsFillFuelPumpDieselFill />,
  'Ad-blue': <CiDroplet />,
  'Lavado Exterior': <TbWashDryDip />,
  'Lavado Interior': <TbWashDryDip />,
  'Taller': <HiMiniWrenchScrewdriver />,
  'Espera': <MdDashboard />,
};

// Mismo orden canónico que WORKFLOW_ORDER en useRegistroBloc.js y en
// routing.py (backend) — se usa solo para avisar de un flujo fuera de orden
// al soltar la tarjeta, el backend es quien de verdad valida en /avanzar.
const WORKFLOW_ORDER = ['Desfogue', 'Diesel', 'Ad-blue', 'Taller', 'Lavado Interior', 'Lavado Exterior'];

function siguienteAreaEsperada(bus) {
  const ruta = [...WORKFLOW_ORDER.filter((a) => bus.requiredAreas.includes(a)), 'Salida'];
  const i = ruta.indexOf(bus.currentArea);
  return i === -1 ? ruta[0] : (ruta[i + 1] ?? 'Salida');
}

export default function DropDrag({ usuario, onLogout }) {
  const [pestanaActiva, setPestanaActiva] = useState('patio');
  const [camionSeleccionado, setCamionSeleccionado] = useState(null);
  const [movimientoPendiente, setMovimientoPendiente] = useState(null);
  const [tagPendiente, setTagPendiente] = useState(null);

  const [areas, setAreas] = useState(AREAS_PATIO);

  const {
    autobuses, cargando, cargarAutobuses,
    confirmarMovimientoDirecto, avanzarBus, arrancarServicio,
    obtenerSemaforo, obtenerOcupacion, moviendo
  } = usePatioBloc();

  const { ejecutarCerrarSesion } = useMenuBloc();

  useEffect(() => {
    let activo = true;
    const cargarAreas = async () => {
      try {
        const espera = AREAS_PATIO.find((a) => a.id === 'Espera');
        const lista = await AreaRepository.listar();
        if (activo) setAreas(espera ? [...lista, espera] : lista);
      } catch (error) {
        console.error('No se pudieron cargar las áreas:', error);
      }
    };
    cargarAreas();
    const intervalo = setInterval(cargarAreas, 30000);
    return () => { activo = false; clearInterval(intervalo); };
  }, []);

  const esAdmin = usuario?.rol === 'Administrador';
  const esSupervisor = usuario?.rol === 'Supervisor';

  const alIniciarArrastre = (e, busId) => e.dataTransfer.setData('text/plain', String(busId));
  const permitirSoltar = (e) => e.preventDefault();

  const ejecutarMovimiento = async (busId, nuevaAreaId) => {
    const bus = autobuses.find((b) => String(b.busId) === String(busId));
    if (!bus) return;
    try {
      await confirmarMovimientoDirecto(bus, nuevaAreaId);
    } catch (error) {
      alert(error.message || 'Error al mover la unidad.');
    }
  };

  const alSoltar = (e, nuevaAreaId) => {
    e.preventDefault();
    const busId = e.dataTransfer.getData('text/plain');
    const bus = autobuses.find((b) => String(b.busId) === String(busId));
    if (!bus || bus.currentArea === nuevaAreaId) return;

    const infoAreaDestino = areas.find((a) => a.id === nuevaAreaId);
    const limite = infoAreaDestino?.capacidad ?? 4;
    if (obtenerOcupacion(nuevaAreaId) >= limite) {
      alert(`No hay espacio. El área de ${nuevaAreaId} está llena (${limite}/${limite}).`);
      return;
    }

    const esperada = siguienteAreaEsperada(bus);
    if (nuevaAreaId !== esperada) {
      setMovimientoPendiente({
        busId,
        nuevaAreaId,
        mensaje: `Flujo incorrecto: la unidad ${bus.busId} debería ir a "${esperada}". ¿Forzar su movimiento a "${nuevaAreaId}"? Confirma con el supervisor.`,
      });
      return;
    }

    ejecutarMovimiento(busId, nuevaAreaId);
  };

  const alSalir = async (bus) => {
    try {
      await avanzarBus(bus);
    } catch (error) {
      alert(error.message || 'Error al avanzar la unidad.');
    }
  };

  const alIniciarServicio = async (bus) => {
    try {
      await arrancarServicio(bus);
    } catch (error) {
      alert(error.message || 'Error al iniciar servicio.');
    }
  };

  const alertasRetraso = autobuses.filter((bus) => obtenerSemaforo(bus)?.color === 'rojo');

  const irA = (vista) => {
    setPestanaActiva(vista);
    if (vista !== 'registrar') setTagPendiente(null);
    if (vista === 'patio') cargarAutobuses();
  };

  const renderizarContenido = () => {
    switch (pestanaActiva) {
      case 'patio':
        return (
          <div className="drag-board">
            {areas.map((areaInfo) => {
              const nombreArea = areaInfo.id;
              const busesArea = autobuses.filter((b) => b.currentArea === nombreArea);
              return (
                <div key={nombreArea} className="drag-zone" onDragOver={permitirSoltar} onDrop={(e) => alSoltar(e, nombreArea)}>
                  <div className="drag-zone__header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="sidebar__icon-active">{AREA_ICONS[nombreArea] || <MdDashboard />}</span>
                      <h3>{areaInfo.nombre || nombreArea}</h3>
                    </div>
                    <span className="zone-counter">Capacidad: {busesArea.length}/{areaInfo.capacidad}</span>
                  </div>
                  <div className="drag-zone__content">
                    {cargando ? (
                      <div className="no-buses">Cargando...</div>
                    ) : busesArea.length === 0 ? (
                      <div className="no-buses">No hay autobuses</div>
                    ) : (
                      busesArea.map((bus) => (
                        <div key={bus.busId}>
                          <TarjetaInfo
                            bus={bus}
                            semaforo={obtenerSemaforo(bus)}
                            alIniciarArrastre={alIniciarArrastre}
                            onVerFicha={setCamionSeleccionado}
                            onIniciarServicio={alIniciarServicio}
                          />
                          {siguienteAreaEsperada(bus) === 'Salida' && (
                            <div className="botones-accion-final">
                              <button className="btn-final btn-salida" disabled={moviendo} onClick={() => alSalir(bus)}>
                                Salida
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      case 'registrar':
        return <Registro tagNfc={tagPendiente} onRegistrado={() => irA('patio')} />;
      case 'historial':
        return <HistorialPage />;
      case 'reportes':
        return <Reportes autobuses={autobuses} obtenerSemaforo={obtenerSemaforo} />;
      case 'configuracion':
        return <ConfAvaz autobuses={autobuses} areas={areas} confirmarMovimientoDirecto={confirmarMovimientoDirecto} />;
      default:
        return <div className="pantalla-vacia"><h2>Selecciona una opción</h2></div>;
    }
  };

  return (
    <div className="ado-desktop-shell">
    <div className="layout-container">
      <aside className="sidebar">
        <div className="sidebar__logo">
          <img src="/logo-ado.png" alt="ADO" className="sidebar__logo-img" />
        </div>

        <nav className="sidebar__nav">
          <button className={`sidebar__item ${pestanaActiva === 'patio' ? 'sidebar__item--active' : ''}`} onClick={() => irA('patio')}>
            <MdDashboard className="sidebar__icon" />
            <span>Patio en tiempo real</span>
          </button>
          {esAdmin && (
            <button className={`sidebar__item ${pestanaActiva === 'registrar' ? 'sidebar__item--active' : ''}`} onClick={() => irA('registrar')}>
              <MdAssignmentTurnedIn className="sidebar__icon" />
              <span>Registrar autobús</span>
            </button>
          )}
          {(esAdmin || esSupervisor) && (
            <button className={`sidebar__item ${pestanaActiva === 'historial' ? 'sidebar__item--active' : ''}`} onClick={() => irA('historial')}>
              <MdHistory className="sidebar__icon" />
              <span>Historial</span>
            </button>
          )}
          {(esAdmin || esSupervisor) && (
            <button className={`sidebar__item ${pestanaActiva === 'reportes' ? 'sidebar__item--active' : ''}`} onClick={() => irA('reportes')}>
              <MdBarChart className="sidebar__icon" />
              <span>Reportes</span>
            </button>
          )}
          {esAdmin && (
            <button className={`sidebar__item ${pestanaActiva === 'configuracion' ? 'sidebar__item--active' : ''}`} onClick={() => irA('configuracion')}>
              <MdSettings className="sidebar__icon" />
              <span>Configuración Avanzada</span>
            </button>
          )}
        </nav>

        <button className="sidebar__logout" onClick={() => { ejecutarCerrarSesion(); if (onLogout) onLogout(); }}>
          <MdExitToApp className="sidebar__icon" />
          <span>Cerrar sesión</span>
        </button>
      </aside>

      <main className="main-content">
        <header className="main-content__header">
          <h1>Control de Patio - Oaxaca</h1>
          <p>{usuario?.nombre} · {usuario?.rol}</p>
        </header>

        {alertasRetraso.length > 0 && (
          <div className="alertas-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {alertasRetraso.map((bus) => {
              const semaforo = obtenerSemaforo(bus);
              return (
                <div key={bus.busId} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '0.9rem' }}>
                  <MdAddAlert />
                  <span>La unidad {bus.busId} lleva {semaforo.elapsed} min en {bus.currentArea} (promedio {semaforo.promedio} min)</span>
                </div>
              );
            })}
          </div>
        )}

        {renderizarContenido()}
      </main>

      {camionSeleccionado && (
        <div className="modal-overlay" onClick={() => setCamionSeleccionado(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card__header">
              <h2>Ficha de Registro: {camionSeleccionado.busId}</h2>
              <button className="modal-card__close" onClick={() => setCamionSeleccionado(null)}>&times;</button>
            </div>
            <div className="modal-card__body">
              <div className="modal-data-row"><strong>Serie:</strong> <span>{camionSeleccionado.busId}</span></div>
              <div className="modal-data-row"><strong>Tipo de Unidad:</strong> <span>{camionSeleccionado.busType}</span></div>
              <div className="modal-data-row"><strong>Área Actual:</strong> <span>{camionSeleccionado.currentArea}</span></div>
              <div className="modal-data-row"><strong>Hora de Salida:</strong> <span>{camionSeleccionado.departureTime}</span></div>
              <div className="modal-data-row"><strong>Conductor:</strong> <span>{camionSeleccionado.conductor || 'No asignado'}</span></div>
              <div className="modal-data-row"><strong>Origen:</strong> <span>{camionSeleccionado.terminalOrigen || 'N/A'}</span></div>
              <div className="modal-data-row"><strong>Destino:</strong> <span>{camionSeleccionado.terminalDestino || 'N/A'}</span></div>
              {camionSeleccionado.requiredAreas.length > 0 && (
                <div className="modal-data-row"><strong>Ruta:</strong> <span>{camionSeleccionado.requiredAreas.join(' → ')}</span></div>
              )}
            </div>
          </div>
        </div>
      )}

      {movimientoPendiente && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-card" style={{ maxWidth: '450px', textAlign: 'center' }}>
            <div style={{ backgroundColor: '#f59e0b', padding: '15px', borderRadius: '8px 8px 0 0' }}>
              <h2 style={{ margin: 0, color: '#1a2235', fontSize: '20px' }}>⚠️ Flujo incorrecto</h2>
            </div>
            <div className="modal-card__body" style={{ padding: '25px 20px' }}>
              <p style={{ fontSize: '16px', color: '#0f172a', marginBottom: '25px', lineHeight: '1.5' }}>
                {movimientoPendiente.mensaje}
              </p>
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button className="btn-secondary" onClick={() => setMovimientoPendiente(null)}>Cancelar</button>
                <button
                  className="btn-primary"
                  style={{ backgroundColor: '#f59e0b' }}
                  onClick={() => {
                    ejecutarMovimiento(movimientoPendiente.busId, movimientoPendiente.nuevaAreaId);
                    setMovimientoPendiente(null);
                  }}
                >
                  Sí, forzar movimiento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
