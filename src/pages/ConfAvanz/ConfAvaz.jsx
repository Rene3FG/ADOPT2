// src/pages/ConfAvanz/ConfAvaz.jsx — Configuración Avanzada de escritorio.
// Mismos BLoCs reales que ConfiguracionPage.jsx en mobile (useAreasBloc,
// useUsuariosBloc) + confirmarMovimientoDirecto de usePatioBloc para la
// reubicación forzada — nada de esto vive en estado local/mock.
import { useState } from 'react';
import { MdAddLocation, MdPersonAdd, MdDirectionsBus, MdDelete, MdArrowBack, MdCompareArrows, MdEdit } from 'react-icons/md';
import { useAreasBloc } from '../../lib/logic/useAreasBloc.js';
import { useUsuariosBloc } from '../../lib/logic/useUsuariosBloc.js';
import './ConfAvanz.css';

export default function ConfAvaz({ autobuses = [], areas = [], confirmarMovimientoDirecto }) {
  const [vistaActual, setVistaActual] = useState('menu');

  const {
    areas: areasReales, cargandoAreas, formDataArea, esEdicionArea,
    abrirModalNuevaArea, abrirModalEditarArea, handleAreaInputChange, guardarArea, eliminarArea, guardandoArea
  } = useAreasBloc();

  const {
    usuarios, cargando: cargandoUsuarios, modalAbierto, esEdicion, guardando: guardandoUsu, formData: formUsu, roles,
    abrirModalNuevo, abrirModalEditar, cerrarModal, handleInputChange: handleUsuChange, guardarUsuario, eliminarUsuario
  } = useUsuariosBloc();

  const [camionSeleccionadoId, setCamionSeleccionadoId] = useState('');
  const [areaDestinoId, setAreaDestinoId] = useState('');
  const [reubicando, setReubicando] = useState(false);

  const ejecutarReubicacion = async (e) => {
    e.preventDefault();
    if (!camionSeleccionadoId || !areaDestinoId) return;

    const bus = autobuses.find((c) => String(c.busId) === String(camionSeleccionadoId));
    const infoAreaDestino = areas.find((a) => a.id === areaDestinoId);
    const limite = infoAreaDestino?.capacidad ?? 4;
    const actuales = autobuses.filter((c) => c.currentArea === areaDestinoId).length;

    if (actuales >= limite) {
      alert(`⚠️ Capacidad máxima superada. El área ${areaDestinoId} está llena.`);
      return;
    }

    setReubicando(true);
    try {
      await confirmarMovimientoDirecto(bus, areaDestinoId);
      alert(`⚡ Reubicación exitosa: el autobús ${bus.busId} fue forzado a "${areaDestinoId}".`);
      setCamionSeleccionadoId('');
      setAreaDestinoId('');
    } catch (error) {
      alert(error.message || 'Error al reubicar la unidad.');
    } finally {
      setReubicando(false);
    }
  };

  if (vistaActual === 'areas') {
    return (
      <div className="config-panel">
        <div className="config-header-flex">
          <button className="btn-back" onClick={() => setVistaActual('menu')}><MdArrowBack /> Volver</button>
          <h2>Gestor de Áreas del Patio</h2>
        </div>

        <form className="area-form" onSubmit={guardarArea}>
          <div className="input-group-row">
            <input type="text" name="nombre" placeholder="Nombre del área (Ej. Bahía 1)" value={formDataArea.nombre} onChange={handleAreaInputChange} required disabled={esEdicionArea} />
            <input type="number" name="capacidad" placeholder="Capacidad" min="1" value={formDataArea.capacidad} onChange={handleAreaInputChange} required />
            <button type="submit" className="btn-primary" disabled={guardandoArea}>{esEdicionArea ? 'Guardar' : 'Crear'}</button>
            {esEdicionArea && <button type="button" className="btn-secondary" onClick={abrirModalNuevaArea}>Cancelar</button>}
          </div>
        </form>

        <div className="area-list-container">
          <h3>Áreas Activas</h3>
          {cargandoAreas ? <p>Cargando áreas...</p> : (
            <ul className="area-list">
              {areasReales.map((area) => (
                <li key={area.dbId} className="area-list-item">
                  <div className="area-info">
                    <strong>{area.nombre}</strong>
                    <span>Capacidad: {area.capacidad} autobuses</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-delete" onClick={() => abrirModalEditarArea(area)} title="Editar capacidad"><MdEdit /></button>
                    <button className="btn-delete" onClick={() => eliminarArea(area.dbId, area.nombre)} title="Eliminar"><MdDelete /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  if (vistaActual === 'mover') {
    return (
      <div className="config-panel">
        <div className="config-header-flex">
          <button className="btn-back" onClick={() => setVistaActual('menu')}><MdArrowBack /> Volver</button>
          <h2>Módulo de Reubicación Forzada (Admin)</h2>
        </div>

        <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '13px' }}>
          *Nota: esta herramienta mueve el autobús ignorando el ciclo estricto del patio (misma llamada que el drag-and-drop del tablero).
        </p>

        <form className="reubicacion-form" onSubmit={ejecutarReubicacion}>
          <div className="form-group-vertical">
            <label>1. Selecciona el Autobús a mover:</label>
            <select value={camionSeleccionadoId} onChange={(e) => setCamionSeleccionadoId(e.target.value)} required>
              <option value="">-- Seleccionar Autobús --</option>
              {autobuses.map((c) => (
                <option key={c.busId} value={c.busId}>{c.busId} ({c.busType}) - Actualmente en: {c.currentArea}</option>
              ))}
            </select>
          </div>

          <div className="form-group-vertical" style={{ marginTop: '15px' }}>
            <label>2. Forzar hacia el Área destino:</label>
            <select value={areaDestinoId} onChange={(e) => setAreaDestinoId(e.target.value)} required>
              <option value="">-- Seleccionar Destino --</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre || a.id}</option>)}
              <option value="Salida">Salida</option>
            </select>
          </div>

          <button type="submit" className="btn-primary btn-block" style={{ marginTop: '20px', width: '100%' }} disabled={reubicando}>
            <MdCompareArrows /> {reubicando ? 'Reubicando...' : 'Forzar Reubicación de Unidad'}
          </button>
        </form>
      </div>
    );
  }

  if (vistaActual === 'usuarios') {
    return (
      <div className="config-panel" style={{ maxWidth: '900px' }}>
        <div className="config-header-flex">
          <button className="btn-back" onClick={() => setVistaActual('menu')}><MdArrowBack /> Volver</button>
          <h2>Gestión de Personal</h2>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
          <button className="btn-primary" onClick={abrirModalNuevo}>+ Nuevo usuario</button>
        </div>

        {cargandoUsuarios ? <p>Cargando personal...</p> : (
          <ul className="area-list">
            {usuarios.map((user) => (
              <li key={user.id} className="area-list-item">
                <div className="area-info">
                  <strong>{user.nombre} ({user.id_empleado})</strong>
                  <span>{user.rol} · Área: {user.areaAsignada || '—'}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-delete" onClick={() => abrirModalEditar(user)} title="Editar"><MdEdit /></button>
                  {user.id !== 1 && <button className="btn-delete" onClick={() => eliminarUsuario(user.id, user.nombre)} title="Eliminar"><MdDelete /></button>}
                </div>
              </li>
            ))}
          </ul>
        )}

        {modalAbierto && (
          <div className="modal-overlay" onClick={cerrarModal}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
              <div className="modal-card__header">
                <h2>{esEdicion ? 'Editar usuario' : 'Nuevo usuario'}</h2>
                <button className="modal-card__close" onClick={cerrarModal}>&times;</button>
              </div>
              <form onSubmit={guardarUsuario} className="modal-card__body">
                <div className="input-group-row" style={{ flexDirection: 'column' }}>
                  <input type="text" name="id_empleado" placeholder="ID de empleado" value={formUsu.id_empleado} onChange={handleUsuChange} required disabled={esEdicion} />
                  <input type="text" name="nombre" placeholder="Nombre completo" value={formUsu.nombre} onChange={handleUsuChange} required />
                  <select name="rol" value={formUsu.rol} onChange={handleUsuChange}>
                    {roles.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </select>
                  <input type="password" name="password" placeholder={esEdicion ? 'Dejar igual (***)' : 'Contraseña'} value={formUsu.password} onChange={handleUsuChange} required={!esEdicion} />
                </div>
                <button type="submit" className="btn-primary btn-block" style={{ marginTop: '15px', width: '100%' }} disabled={guardandoUsu}>
                  {guardandoUsu ? 'Guardando...' : 'Guardar'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="config-panel">
      <p style={{ color: '#64748b', marginBottom: '30px', fontSize: '14px' }}>
        Selecciona una tarea administrativa para el control del patio.
      </p>

      <div className="config-grid">
        <div className="config-option-card" onClick={() => setVistaActual('areas')}>
          <div className="config-option-icon"><MdAddLocation /></div>
          <div className="config-option-text">
            <h3>Gestor de Áreas</h3>
            <p>Crea nuevas zonas de trabajo en el patio, define capacidades o elimina áreas en desuso.</p>
          </div>
        </div>

        <div className="config-option-card" onClick={() => setVistaActual('usuarios')}>
          <div className="config-option-icon"><MdPersonAdd /></div>
          <div className="config-option-text">
            <h3>Gestión de Personal</h3>
            <p>Registra nuevos operadores, mecánicos o supervisores de patio.</p>
          </div>
        </div>

        <div className="config-option-card" onClick={() => setVistaActual('mover')}>
          <div className="config-option-icon"><MdDirectionsBus /></div>
          <div className="config-option-text">
            <h3>Mover unidades</h3>
            <p>Salte el ciclo operativo y reubique manualmente cualquier autobús en caso de emergencia.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
