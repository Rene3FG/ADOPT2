// src/lib/presentation/pages/ConfiguracionPage.jsx
// Configuración Avanzada (admin): pestañas de Gestión de Personal y
// Estaciones de Patio. Integrada desde la rama Backup, pero operando
// contra la SCA API (no Supabase): usuarios vía useUsuariosBloc y áreas
// vía useAreasBloc. La API no guarda area_asignada por usuario ni iconos
// de área, así que esos campos del diseño original no aparecen aquí.
import { useState } from 'react';
import { useUsuariosBloc } from '../../logic/useUsuariosBloc';
import { useAreasBloc } from '../../logic/useAreasBloc';

// GET /usuarios devuelve los nombres de rol en inglés (tabla roles);
// /login los traduce al español, así que cubrimos ambos.
const COLORES_ROL = {
  Administrator: { bg: '#e0e7ff', fg: '#3730a3' },
  Administrador: { bg: '#e0e7ff', fg: '#3730a3' },
  Supervisor: { bg: '#fef3c7', fg: '#b45309' },
};

export const ConfiguracionPage = ({ autobuses = [] }) => {
  const [tabActiva, setTabActiva] = useState('usuarios');

  const {
    usuarios, roles, areas: areasParaAsignar, cargando: cargandoUsuarios, modalAbierto: modalUsuAbierto, esEdicion: esEdicionUsu, guardando: guardandoUsu, formData: formUsu,
    abrirModalNuevo: abrirModNuevoUsu, abrirModalEditar: abrirModEditarUsu, cerrarModal: cerrarModUsu, handleInputChange: handleUsuChange, guardarUsuario, eliminarUsuario
  } = useUsuariosBloc();

  const {
    areas, cargandoAreas, modalAreaAbierto, esEdicionArea, guardandoArea, formDataArea,
    abrirModalNuevaArea, abrirModalEditarArea, cerrarModalArea, handleAreaInputChange, guardarArea, eliminarArea
  } = useAreasBloc();

  const btnTabInactivo = { padding: '12px 15px', backgroundColor: 'transparent', border: 'none', borderBottom: '3px solid transparent', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap' };
  const btnTabActivo = { ...btnTabInactivo, color: 'var(--ado-purple)', borderBottom: '3px solid var(--ado-purple)' };
  const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '5px', boxSizing: 'border-box' };
  const thStyle = { padding: '12px', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '12px', whiteSpace: 'nowrap' };

  return (
    <div className="config-page" style={{ maxWidth: '1000px', margin: '0 auto' }}>

      {/* HEADER Y TABS (permite scroll en celulares si las pestañas no caben) */}
      <div style={{ marginBottom: '25px' }}>
        <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.8rem', fontWeight: 800 }}>Configuración Avanzada</h2>
        <p style={{ margin: '5px 0 20px 0', color: 'var(--text-muted)' }}>Administra los parámetros generales del sistema.</p>

        <div className="config-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', overflowX: 'auto', gap: '10px' }}>
          <button style={tabActiva === 'usuarios' ? btnTabActivo : btnTabInactivo} onClick={() => setTabActiva('usuarios')}>
            👥 Gestión de Personal
          </button>
          <button style={tabActiva === 'areas' ? btnTabActivo : btnTabInactivo} onClick={() => setTabActiva('areas')}>
            📍 Estaciones de Patio
          </button>
        </div>
      </div>

      {/* ======================= PESTAÑA: USUARIOS ======================= */}
      {tabActiva === 'usuarios' && (
        <div className="tab-content">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
            <button onClick={abrirModNuevoUsu} style={{ backgroundColor: 'var(--ado-purple)', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>+ NUEVO USUARIO</button>
          </div>
          {cargandoUsuarios ? <p>Cargando personal...</p> : (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-light)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={thStyle}>ID / Usuario</th>
                      <th style={thStyle}>Nombre</th>
                      <th style={thStyle}>Rol</th>
                      <th style={thStyle}>Área asignada</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map(user => {
                      const colorRol = COLORES_ROL[user.rol] || { bg: '#f1f5f9', fg: '#475569' };
                      return (
                        <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{user.id_empleado}</td>
                          <td style={tdStyle}>{user.nombre}</td>
                          <td style={tdStyle}>
                            <span style={{ backgroundColor: colorRol.bg, color: colorRol.fg, padding: '4px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '0.8rem' }}>
                              {user.rol}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{user.areaAsignada || '—'}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                              <button onClick={() => abrirModEditarUsu(user)} style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 800, cursor: 'pointer' }}>Editar</button>
                              {user.id !== 1 && (
                                <button onClick={() => eliminarUsuario(user.id, user.nombre)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 800, cursor: 'pointer' }}>Borrar</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================= PESTAÑA: ÁREAS ======================= */}
      {tabActiva === 'areas' && (
        <div className="tab-content">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
            <button onClick={abrirModalNuevaArea} style={{ backgroundColor: '#0284c7', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>+ NUEVA ÁREA</button>
          </div>
          {cargandoAreas ? <p>Cargando áreas...</p> : (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-light)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={thStyle}>Icono</th>
                      <th style={thStyle}>Área</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Ocupados</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Disponibles</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Total</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {areas.map(area => {
                      const capacidadTotal = area.capacidad || 0;
                      const ocupados = autobuses.filter(bus => bus.currentArea === area.id).length;
                      const disponibles = capacidadTotal - ocupados;

                      return (
                        <tr key={area.dbId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ ...tdStyle, fontSize: '1.2rem' }}>{area.icono || '📍'}</td>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{area.nombre}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <span style={{ backgroundColor: ocupados > 0 ? '#fef3c7' : '#f1f5f9', color: ocupados > 0 ? '#b45309' : '#64748b', padding: '6px 12px', borderRadius: '8px', fontWeight: 800 }}>
                              {ocupados}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <span style={{ backgroundColor: disponibles > 0 ? '#dcfce7' : '#fee2e2', color: disponibles > 0 ? '#166534' : '#991b1b', padding: '6px 12px', borderRadius: '8px', fontWeight: 800 }}>
                              {disponibles > 0 ? disponibles : 0}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <span style={{ backgroundColor: '#e0e7ff', color: '#3730a3', padding: '6px 12px', borderRadius: '8px', fontWeight: 800 }}>
                              {capacidadTotal}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                              <button onClick={() => abrirModalEditarArea(area)} style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 800, cursor: 'pointer' }}>Modificar</button>
                              <button onClick={() => eliminarArea(area.dbId, area.nombre)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 800, cursor: 'pointer' }}>Eliminar</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL PARA USUARIOS */}
      {modalUsuAbierto && (
        <div onClick={cerrarModUsu} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: '20px', boxSizing: 'border-box' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', textAlign: 'left', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 20px 0', color: 'var(--ado-purple)' }}>{esEdicionUsu ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
            <form onSubmit={guardarUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div><label style={{ fontWeight: 600 }}>ID Empleado</label><input type="text" name="id_empleado" value={formUsu.id_empleado} onChange={handleUsuChange} disabled={esEdicionUsu} required style={{ ...inputStyle, backgroundColor: esEdicionUsu ? '#f1f5f9' : 'white' }} /></div>
              <div><label style={{ fontWeight: 600 }}>Nombre</label><input type="text" name="nombre" value={formUsu.nombre} onChange={handleUsuChange} required style={inputStyle} /></div>

              {/* Grilla responsiva que se apila en móviles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
                <div><label style={{ fontWeight: 600 }}>Rol</label>
                  <select name="rol" value={formUsu.rol} onChange={handleUsuChange} style={{ ...inputStyle, backgroundColor: 'white' }}>
                    {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </select>
                </div>
                <div><label style={{ fontWeight: 600 }}>{esEdicionUsu ? 'Nueva Contraseña' : 'Contraseña'}</label><input type="password" name="password" value={formUsu.password} onChange={handleUsuChange} required={!esEdicionUsu} style={inputStyle} /></div>
              </div>

              {esEdicionUsu && (
                <div>
                  <label style={{ fontWeight: 600 }}>Área asignada</label>
                  <select name="assigned_area_id" value={formUsu.assigned_area_id} onChange={handleUsuChange} style={{ ...inputStyle, backgroundColor: 'white' }}>
                    <option value="">Sin asignar</option>
                    {areasParaAsignar.map(a => <option key={a.dbId} value={a.dbId}>{a.nombre}</option>)}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={cerrarModUsu} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'white', color: '#333', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={guardandoUsu} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--ado-purple)', color: 'white', fontWeight: 800, cursor: 'pointer' }}>{guardandoUsu ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA ÁREAS */}
      {modalAreaAbierto && (
        <div onClick={cerrarModalArea} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: '20px', boxSizing: 'border-box' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', textAlign: 'left', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#0284c7' }}>{esEdicionArea ? 'Modificar Área' : 'Crear Nueva Área'}</h3>
            <form onSubmit={guardarArea} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontWeight: 600 }}>Nombre de la Estación</label>
                <input type="text" name="nombre" value={formDataArea.nombre} onChange={handleAreaInputChange} placeholder="Ej. Lavado Express" required disabled={esEdicionArea} style={{ ...inputStyle, backgroundColor: esEdicionArea ? '#f1f5f9' : 'white' }} />
                {esEdicionArea && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '5px 0 0 0' }}>El nombre identifica al área en la API y no puede cambiarse.</p>}
              </div>

              <div>
                <label style={{ fontWeight: 600 }}>Capacidad</label>
                <input type="number" min="1" name="capacidad" value={formDataArea.capacidad} onChange={handleAreaInputChange} required style={inputStyle} />
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>⚠️ Modificar la capacidad impactará cuántos vehículos pueden ingresar a esta estación simultáneamente en el patio central.</p>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={cerrarModalArea} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'white', color: '#333', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={guardandoArea} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#0284c7', color: 'white', fontWeight: 800, cursor: 'pointer' }}>{guardandoArea ? 'Guardando...' : 'Guardar Área'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
