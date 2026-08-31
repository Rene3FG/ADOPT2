// src/lib/presentation/pages/PatioPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useMenuBloc } from '../../logic/useMenuBloc';
import { usePatioBloc } from '../../logic/usePatioBloc';
import { RegistroUnidadPage } from './RegistroUnidadPage';
import { ConfiguracionPage } from './ConfiguracionPage';
// NUEVO: Importamos las páginas de tu compañero
import { HistorialPage } from './HistorialPage';
import { ReportesPage } from './ReportesPage';
import { AREAS_PATIO } from '../../areasConfig';
import { AreaRepository } from '../../data/repositories/AreaRepository';
import { SwipeToConfirm } from '../components/SwipeToConfirm';
import "../../../App.css";
import "../styles/PatioPage.css";

export const PatioPage = ({ usuario }) => {
  const {
    menuAbierto, alternarMenu, cerrarMenu,
    modalCerrarSesionAbierto, confirmarCerrarSesion, cancelarCerrarSesion, ejecutarCerrarSesion
  } = useMenuBloc();
  const [vistaActual, setVistaActual] = useState('patio');

  const [inicioAConfirmar, setInicioAConfirmar] = useState(null);
  // Tag NFC escaneado que aún no está asociado a ninguna unidad — dispara el
  // flujo de registro de llegada (el formulario lo asocia al guardar).
  const [tagPendiente, setTagPendiente] = useState(null);

  const {
    autobuses, cargando, cargarAutobuses,
    busSeleccionado, cerrarModal, abrirModalMover, moviendo,
    arrancarServicio, avanzarBus, avanzarPorNfc,
    obtenerSemaforo, promediosArea
  } = usePatioBloc();

  // Web NFC (NDEFReader) solo existe en Android + Chrome — en cualquier otro
  // navegador el botón se oculta en vez de fallar al tocarlo.
  const soporteNfc = typeof window !== 'undefined' && 'NDEFReader' in window;
  const escanearNfc = async () => {
    try {
      // Mientras el tag sigue cerca de la antena, Android reporta el mismo
      // tag varias veces en milisegundos — sin este candado cada lectura
      // dispara su propio avance y produce movimientos duplicados.
      let yaLeido = false;
      const controller = new AbortController();
      const reader = new window.NDEFReader();
      await reader.scan({ signal: controller.signal });
      reader.onreading = async ({ serialNumber, message }) => {
        if (yaLeido) return;
        // Preferimos el UID físico del tag (serialNumber); si el navegador no
        // lo expone, caemos al primer registro de texto NDEF escrito al enrolar.
        const registroTexto = message?.records?.find(r => r.recordType === 'text');
        const tagUid = serialNumber || (registroTexto && new TextDecoder(registroTexto.encoding).decode(registroTexto.data));
        if (!tagUid) return;
        yaLeido = true;
        controller.abort();
        try {
          await avanzarPorNfc(tagUid);
        } catch (error) {
          const msg = error.message || '';
          if (msg.includes('no está registrado a ningún camión')) {
            // Llegada nueva: el tag no pertenece a ninguna unidad — abrir el
            // registro de recepción con el tag listo para asociarse.
            setTagPendiente(tagUid);
            setVistaActual('registrar');
          } else {
            alert(msg || 'No se pudo procesar el tag NFC.');
          }
        }
      };
    } catch (error) {
      alert('No se pudo activar el lector NFC: ' + (error.message || error));
    }
  };

  const esAdmin = usuario.rol === 'Administrador';
  const esSupervisor = usuario.rol === 'Supervisor';
  const esOperador = usuario.rol === 'Operador';
  // El supervisor ve el patio completo igual que el admin (solo cambia el menú)
  const vePatioCompleto = esAdmin || esSupervisor;

  // El área del operador ahora la asigna el admin desde Configuración
  // (users.assigned_area_id) — /login la devuelve real, ya no se elige
  // manualmente ni se guarda en localStorage.
  const areaOperador = usuario.areaAsignada || '';

  const [definicionAreas, setDefinicionAreas] = useState(AREAS_PATIO);

  const cargarAreas = useCallback(async () => {
    try {
      const areaEspera = AREAS_PATIO.find((a) => a.id === 'Espera');
      const areas = await AreaRepository.listar();
      setDefinicionAreas(areaEspera ? [...areas, areaEspera] : areas);
    } catch (error) {
      console.error('No se pudieron cargar las áreas:', error);
    }
  }, []);

  useEffect(() => {
    cargarAreas();
    const intervalo = setInterval(cargarAreas, 30000);
    return () => clearInterval(intervalo);
  }, [cargarAreas]);

  const busesDelOperador = autobuses.filter(bus => bus.currentArea === areaOperador);
  const ocupacionActual = busesDelOperador.length;
  const capacidadMaxArea = definicionAreas.find(a => a.id === areaOperador)?.capacidad || 3;

  const obtenerSlotsArea = (nombreArea, capacidad) => {
    const busesEnArea = autobuses.filter(bus => bus.currentArea === nombreArea);
    const slots = busesEnArea.slice(0, capacidad).map(bus => {
      const semaforo = obtenerSemaforo ? obtenerSemaforo(bus) : null;
      let dotColor = 'transparent';
      if (semaforo) {
        dotColor = semaforo.color === 'rojo' ? '#ef4444' : semaforo.color === 'naranja' ? '#f59e0b' : '#22c55e';
      }

      return (
        <div key={bus.id_autobus} className={`slot ${bus.estadoServicio === 'En Proceso' ? 'process' : 'occ'}`} onClick={() => abrirModalMover(bus)} style={{ cursor: 'pointer', position: 'relative' }}>
          {semaforo && <div style={{ position: 'absolute', top: '5px', left: '5px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: dotColor, border: '1px solid white' }}></div>}
          {bus.isPriority && <span style={{ position: 'absolute', top: '-8px', right: '-8px', fontSize: '1.2rem' }}>⚠️</span>}
          <span>{bus.busId}</span>
          <span className="slot-time">{bus.estadoServicio === 'En Proceso' ? '⏱️ Proceso' : 'En Espera'}</span>
        </div>
      );
    });
    const espaciosLibres = capacidad - slots.length;
    for (let i = 0; i < espaciosLibres; i++) {
      slots.push(<div key={`free-${nombreArea}-${i}`} className="slot free"><span>Libre</span></div>);
    }
    return slots;
  };

  // Capacidad real del patio = suma de capacidades de las áreas (antes era un 24 fijo)
  const capacidadTotalPatio = definicionAreas.reduce((suma, a) => suma + (a.capacidad || 0), 0);
  const ocupacionPorcentaje = capacidadTotalPatio > 0
    ? Math.round((autobuses.length / capacidadTotalPatio) * 100)
    : 0;

  const alertasPrioridad = autobuses.filter(bus => bus.isPriority && bus.currentArea !== 'Salida');
  const alertasRetraso = autobuses.filter(bus => obtenerSemaforo && obtenerSemaforo(bus)?.color === 'rojo');

  const navegarA = (vista) => {
    setVistaActual(vista);
    cerrarMenu();
    if (vista !== 'registrar') setTagPendiente(null);
    if (vista === 'patio') cargarAutobuses();
  };

  const ejecutarInicioConfirmado = async () => {
    if (!inicioAConfirmar) return;
    await arrancarServicio(inicioAConfirmar);
    setInicioAConfirmar(null);
  };

  return (
    <div className="app-layout">
      {menuAbierto && <div className="overlay-menu" onClick={cerrarMenu}></div>}

      <aside className={`sidebar ${menuAbierto ? 'abierto' : ''}`}>
        <div className="sidebar-logo"><h1>ADO</h1></div>
        <ul className="sidebar-menu">
          <li><a className={vistaActual === 'patio' ? 'active' : ''} onClick={() => navegarA('patio')}>🏠 {esOperador ? 'Mi Área' : 'Patio Central'}</a></li>
          {esAdmin && <li><a className={vistaActual === 'registrar' ? 'active' : ''} onClick={() => navegarA('registrar')}>⊕ Registrar camión</a></li>}
          {(esAdmin || esSupervisor) && <li><a className={vistaActual === 'historial' ? 'active' : ''} onClick={() => navegarA('historial')}>🕒 Historial</a></li>}
          {(esAdmin || esSupervisor) && <li><a className={vistaActual === 'reportes' ? 'active' : ''} onClick={() => navegarA('reportes')}>📊 Reportes</a></li>}
          {esAdmin && <li><a className={vistaActual === 'configuracion' ? 'active' : ''} onClick={() => navegarA('configuracion')}>⚙️ Config. Avanzada</a></li>}
          <li style={{ marginTop: '20px' }}><a onClick={confirmarCerrarSesion} style={{ color: '#ef4444' }}>🚪 Cerrar sesión</a></li>
        </ul>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="hamburger-btn" onClick={alternarMenu}>☰</button>
            <div className="topbar-title">Control de Patio - Oaxaca</div>
          </div>
          <div className="user-profile">
            <div style={{ textAlign: 'right' }}><p className="name">{usuario.nombre}</p><p className="role">{usuario.rol}</p></div>
            <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👤</div>
          </div>
        </header>

        <div className="dashboard-container" style={{ padding: vePatioCompleto ? '30px' : '0', backgroundColor: vePatioCompleto ? 'var(--bg-light)' : '#f4f4f9' }}>
          {vistaActual === 'patio' && (
            <>
              {vePatioCompleto ? (
                /* ================= VISTA: ADMINISTRADOR / SUPERVISOR ================= */
                <>
                  <div className="dash-header">
                    <div><h2>Patio en tiempo real</h2><p>Vista general de ocupación por área</p></div>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <div className="leyenda">
                        <div className="leyenda-item"><div className="caja-color caja-libre"></div> Libre</div>
                        <div className="leyenda-item"><div className="caja-color caja-ocupada"></div> Ocupado</div>
                        <div className="leyenda-item"><div className="caja-color" style={{backgroundColor: '#f59e0b'}}></div> En proceso</div>
                      </div>
                      {esAdmin && <button className="btn-registrar-header" onClick={() => navegarA('registrar')}>⊕ Registrar camión</button>}
                    </div>
                  </div>
                  <div className="dash-grid">
                    <div className="areas-grid">
                      {definicionAreas.map((area) => (
                        <div key={area.id} className="area-card">
                          <div className="area-header">
                            <h3>{area.icono} {area.nombre}</h3>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-main)', marginBottom: '2px', fontWeight: 600 }}>Promedio: {promediosArea?.[area.id] ?? '--'} min</span>
                              <span>Cap: {area.capacidad}</span>
                            </div>
                          </div>
                          <div className="slots-container">{cargando ? <p>Cargando...</p> : obtenerSlotsArea(area.id, area.capacidad)}</div>
                        </div>
                      ))}
                    </div>

                    <div className="widget-panel">
                      {alertasRetraso.length > 0 && (
                        <div className="widget-card" style={{ border: '1px solid #ef4444', backgroundColor: '#fef2f2' }}>
                          <h3 className="widget-title" style={{ color: '#dc2626' }}>🔴 Alertas de Retraso</h3>
                          {alertasRetraso.map(bus => {
                            const semaforo = obtenerSemaforo(bus);
                            return (
                              <div key={bus.id_autobus} style={{ backgroundColor: 'white', padding: '10px', borderRadius: '6px', marginBottom: '8px', fontSize: '0.85rem', borderLeft: '4px solid #ef4444' }}>
                                <strong>Unidad {bus.busId} en {bus.currentArea}</strong>
                                <br />Lleva {semaforo.elapsed} min (Promedio: {semaforo.promedio} min)
                              </div>
                            )
                          })}
                        </div>
                      )}

                      <div className="widget-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-muted)' }}>Autobuses en patio</p>
                          <h2 style={{ margin: 0, fontSize: '2rem' }}>{autobuses.length}</h2>
                        </div>
                        <div style={{ marginTop: '20px' }}>
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', fontWeight: 600 }}>Ocupación total</p>
                          <h3 style={{ margin: '0 0 10px 0', color: ocupacionPorcentaje > 100 ? '#dc2626' : 'var(--ado-purple)' }}>
                            {ocupacionPorcentaje}%
                          </h3>
                          <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-light)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(ocupacionPorcentaje, 100)}%`, height: '100%', backgroundColor: ocupacionPorcentaje > 100 ? '#dc2626' : 'var(--ado-purple)' }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="widget-card">
                        <h3 className="widget-title">Alertas Prioritarias</h3>
                        {alertasPrioridad.length === 0 ? (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No hay alertas activas.</p>
                        ) : (
                          alertasPrioridad.map(bus => (
                            <div key={bus.id_autobus} style={{ backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b', padding: '10px', marginBottom: '10px', fontSize: '0.85rem' }}>
                              <strong>⚠️ Unidad {bus.busId}</strong>
                              <br />Salida límite: {bus.departureTime}
                              <br />Ubicación: {bus.currentArea}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* ================= VISTA: OPERADOR ================= */
                !areaOperador ? (
                  /* Sin área asignada: el admin la asigna desde Configuración */
                  <div style={{ maxWidth: '500px', margin: '40px auto', padding: '20px', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
                    <div style={{ backgroundColor: '#D32F2F', color: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                      <h1 style={{ margin: 0, fontSize: '20px' }}>Sin área asignada</h1>
                      <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>Contacta al administrador para que te asigne un área en Configuración.</p>
                    </div>
                  </div>
                ) : (
                <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
                  <div style={{ backgroundColor: '#D32F2F', color: 'white', padding: '20px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                    <h1 style={{ margin: 0, fontSize: '24px' }}>Área: {areaOperador}</h1>
                    <p style={{ margin: '5px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: '#FFEB3B' }}>Ocupación: {ocupacionActual}/{capacidadMaxArea} camiones</p>
                    {promediosArea?.[areaOperador] != null && <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>⏱️ Tiempo Promedio: {promediosArea[areaOperador]} min</p>}
                    {soporteNfc && (
                      <button
                        onClick={escanearNfc}
                        disabled={moviendo}
                        style={{ marginTop: '10px', padding: '10px 18px', fontSize: '14px', fontWeight: 'bold', backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '8px', cursor: moviendo ? 'not-allowed' : 'pointer' }}
                      >
                        📡 Escanear NFC
                      </button>
                    )}
                  </div>

                  <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {cargando ? <p style={{ textAlign: 'center' }}>Cargando unidades...</p> : busesDelOperador.length === 0 ? (
                      <p style={{ textAlign: 'center', color: '#777', fontSize: '18px', marginTop: '20px' }}>No hay unidades en la cola.</p>
                    ) : (
                      busesDelOperador.map(bus => {
                        const semaforo = obtenerSemaforo ? obtenerSemaforo(bus) : null;

                        return (
                          <div key={bus.id_autobus} style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderLeft: '6px solid #1976D2' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eeeeee', paddingBottom: '10px', marginBottom: '15px' }}>
                              <h2 style={{ margin: 0, fontSize: '22px', color: '#333' }}>Unidad #{bus.busId}</h2>
                              <span style={{ color: '#666' }}>{bus.busType}</span>
                            </div>
                            
                            <div style={{ fontSize: '16px', color: '#555', marginBottom: '15px', textAlign: 'center' }}>
                              <p style={{ margin: '0 0 5px 0' }}><strong>Estado:</strong> {bus.estadoServicio === 'En Proceso' ? 'En Proceso ⚙️' : 'En Espera ⏳'}</p>
                              <p style={{ margin: '0 0 5px 0' }}><strong>Hora límite:</strong> {bus.departureTime}</p>
                              {bus.isPriority && <p style={{ color: '#D32F2F', fontWeight: 'bold', margin: '5px 0' }}>¡PRIORIDAD ALTA!</p>}
                            </div>

                            {semaforo && (
                              <div style={{ 
                                padding: '15px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center',
                                backgroundColor: semaforo.color === 'rojo' ? '#fee2e2' : semaforo.color === 'naranja' ? '#fef3c7' : '#dcfce7',
                                border: `1px solid ${semaforo.color === 'rojo' ? '#ef4444' : semaforo.color === 'naranja' ? '#f59e0b' : '#22c55e'}`
                              }}>
                                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>
                                  {semaforo.color === 'rojo' ? '🔴 SERVICIO RETRASADO' : semaforo.color === 'naranja' ? '🟠 TIEMPO POR TERMINAR' : '🟢 A TIEMPO'}
                                </span>
                                <p style={{ margin: '5px 0 0 0', fontSize: '1rem', color: '#555' }}>
                                  Llevas: <strong>{semaforo.elapsed} min</strong> | Promedio del área: <strong>{semaforo.promedio} min</strong>
                                </p>
                              </div>
                            )}

                            <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', border: '1px solid #eee', marginBottom: '15px' }}>
                              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '14px', color: '#333', textAlign: 'center' }}>Ruta asignada:</p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                                {bus.requiredAreas.map(area => {
                                  const isCompleted = bus.completedAreas.includes(area);
                                  const isCurrent = bus.currentArea === area;
                                  let bg = isCompleted ? '#E0E0E0' : isCurrent ? '#FFB74D' : '#f1f5f9';
                                  let color = isCompleted ? '#555' : isCurrent ? '#000' : '#94a3b8';
                                  return <div key={area} style={{ backgroundColor: bg, color: color, padding: '6px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}>{area}</div>;
                                })}
                              </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                              <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#333', textAlign: 'center' }}>Avance: {bus.progressPercentage}%</p>
                              <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '10px', height: '10px', overflow: 'hidden' }}>
                                <div style={{ width: `${bus.progressPercentage}%`, backgroundColor: '#388E3C', height: '100%', transition: 'width 0.3s ease' }}></div>
                              </div>
                            </div>

                            {bus.estadoServicio === 'Pendiente' ? (
                              <button onClick={() => setInicioAConfirmar(bus)} style={{ width: '100%', padding: '15px', backgroundColor: '#388E3C', color: 'white', fontSize: '18px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                                INICIAR SERVICIO
                              </button>
                            ) : (
                              <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', border: '1px solid #eeeeee' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#333', textAlign: 'center' }}>
                                  Desliza para enviar al siguiente paso
                                </label>
                                <SwipeToConfirm
                                  label="➜ Deslizar para avanzar"
                                  disabled={moviendo}
                                  onConfirm={() => avanzarBus(bus)}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                )
              )}
            </>
          )}

          {/* NUEVO: Renderizado de las páginas de tu compañero */}
          {vistaActual === 'registrar' && (esAdmin || tagPendiente) && (
            <RegistroUnidadPage
              tagNfc={tagPendiente}
              onRegistrado={() => {
                setTagPendiente(null);
                navegarA('patio');
              }}
            />
          )}
          {vistaActual === 'configuracion' && esAdmin && <ConfiguracionPage autobuses={autobuses} />}
          {vistaActual === 'historial' && (esAdmin || esSupervisor) && <HistorialPage />}
          {vistaActual === 'reportes' && (esAdmin || esSupervisor) && <ReportesPage />}
        </div>

        {/* ================= MODAL ADMIN / SUPERVISOR ================= */}
        {vePatioCompleto && busSeleccionado && (
          <div 
            onClick={cerrarModal} 
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', boxSizing: 'border-box' }}
          >
            <div 
              onClick={(e) => e.stopPropagation()} 
              style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid var(--bg-light)', paddingBottom: '10px' }}>
                <h3 style={{ margin: 0, color: 'var(--ado-purple)', fontSize: '1.4rem' }}>Detalles Unidad #{busSeleccionado.busId}</h3>
                <button onClick={cerrarModal} style={{ background: '#f1f5f9', border: 'none', fontSize: '1.2rem', cursor: 'pointer', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>✖</button>
              </div>
              
              <div style={{ backgroundColor: 'var(--bg-light)', padding: '15px', borderRadius: '12px', marginBottom: '20px', fontSize: '1rem' }}>
                <p style={{ margin: '0 0 8px 0' }}><strong>Área actual:</strong> <span style={{ color: 'var(--ado-red)', fontWeight: 600 }}>{busSeleccionado.currentArea} ({busSeleccionado.estadoServicio})</span></p>
                <p style={{ margin: '0 0 8px 0' }}><strong>Ingreso al Patio:</strong> {new Date(busSeleccionado.ingresoPatio).toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'})}</p>
                
                <p style={{ margin: '20px 0 10px 0', fontWeight: 'bold', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>Historial de Servicios:</p>
                {Object.keys(busSeleccionado.historialTiempos).length === 0 ? (
                  <p style={{ margin: 0, color: 'var(--text-muted)' }}>No hay servicios registrados aún.</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                    {Object.entries(busSeleccionado.historialTiempos).map(([area, tiempos]) => (
                      <li key={area} style={{ margin: '8px 0' }}>
                        <strong>{area}:</strong> <br/>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                          Inició {tiempos.inicio || '--:--'} | Finalizó {tiempos.fin || '--:--'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL DE CONFIRMACIÓN DE INICIO DE SERVICIO ================= */}
        {inicioAConfirmar && (
          <div 
            onClick={() => setInicioAConfirmar(null)} 
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2500, padding: '20px', boxSizing: 'border-box' }}
          >
            <div 
              onClick={(e) => e.stopPropagation()} 
              style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', width: '100%', maxWidth: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', textAlign: 'center' }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>▶️</div>
              <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>Confirmar Inicio</h3>
              <p style={{ margin: '0 0 20px 0', color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.5' }}>
                ¿Estás seguro de iniciar el servicio para la unidad <strong>#{inicioAConfirmar.busId}</strong>? Se registrará la hora actual.
              </p>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setInicioAConfirmar(null)} 
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'white', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={ejecutarInicioConfirmado} 
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#388E3C', color: 'white', fontWeight: 800, cursor: 'pointer' }}
                >
                  Sí, iniciar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL DE CONFIRMACIÓN DE CERRAR SESIÓN ================= */}
        {modalCerrarSesionAbierto && (
          <div
            onClick={cancelarCerrarSesion}
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: '20px', boxSizing: 'border-box' }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', width: '100%', maxWidth: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', textAlign: 'center' }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🚪</div>
              <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>Cerrar Sesión</h3>
              <p style={{ margin: '0 0 20px 0', color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.5' }}>
                ¿Estás seguro de que deseas salir del sistema?
              </p>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={cancelarCerrarSesion}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'white', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={ejecutarCerrarSesion}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#ef4444', color: 'white', fontWeight: 800, cursor: 'pointer' }}
                >
                  Sí, salir
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};