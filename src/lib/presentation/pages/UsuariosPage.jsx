// src/lib/presentation/pages/UsuariosPage.jsx
import { useUsuariosBloc } from '../../logic/useUsuariosBloc';

export const UsuariosPage = () => {
  const {
    usuarios, roles, areas, cargando, modalAbierto, esEdicion, guardando, formData,
    abrirModalNuevo, abrirModalEditar, cerrarModal, handleInputChange, guardarUsuario, eliminarUsuario
  } = useUsuariosBloc();

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.8rem', fontWeight: 800 }}>Gestión de Usuarios</h2>
          <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)' }}>Administra los accesos y roles del personal.</p>
        </div>
        <button onClick={abrirModalNuevo} style={{ backgroundColor: 'var(--ado-purple)', color: 'white', padding: '12px 20px', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
          + NUEVO USUARIO
        </button>
      </div>

      {cargando ? (
        <p style={{ textAlign: 'center', padding: '20px' }}>Cargando personal...</p>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-light)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '15px' }}>ID / Usuario</th>
                  <th style={{ padding: '15px' }}>Nombre</th>
                  <th style={{ padding: '15px' }}>Rol</th>
                  <th style={{ padding: '15px' }}>Área asignada</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '15px', fontWeight: 600 }}>{user.id_empleado}</td>
                    <td style={{ padding: '15px' }}>{user.nombre}</td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ backgroundColor: '#e0e7ff', color: '#3730a3', padding: '4px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '0.8rem' }}>
                        {user.rol}
                      </span>
                    </td>
                    <td style={{ padding: '15px', color: 'var(--text-muted)' }}>{user.areaAsignada || '—'}</td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <button onClick={() => abrirModalEditar(user)} style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 800, cursor: 'pointer', marginRight: '10px' }}>Editar</button>
                      {user.id !== 1 && (
                        <button onClick={() => eliminarUsuario(user.id, user.nombre)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 800, cursor: 'pointer' }}>Borrar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalAbierto && (
        <div onClick={cerrarModal} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: '20px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', textAlign: 'left', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 20px 0', color: 'var(--ado-purple)' }}>{esEdicion ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h3>

            <form onSubmit={guardarUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>ID Empleado (Usuario)</label>
                <input type="text" name="id_empleado" value={formData.id_empleado} onChange={handleInputChange}
                  disabled={esEdicion} required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '5px', backgroundColor: esEdicion ? '#f1f5f9' : 'white', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Nombre Completo</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '5px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Rol del Sistema</label>
                  <select name="rol" value={formData.rol} onChange={handleInputChange}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '5px', boxSizing: 'border-box', backgroundColor: 'white' }}>
                    {roles.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>{esEdicion ? 'Nueva Contraseña' : 'Contraseña'}</label>
                  <input type="password" name="password" value={formData.password} onChange={handleInputChange}
                    required={!esEdicion}
                    placeholder={esEdicion ? 'Dejar en blanco para no cambiar' : ''}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '5px', boxSizing: 'border-box' }} />
                </div>
              </div>

              {esEdicion && (
                <div>
                  <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Área asignada</label>
                  <select name="assigned_area_id" value={formData.assigned_area_id} onChange={handleInputChange}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '5px', boxSizing: 'border-box', backgroundColor: 'white' }}>
                    <option value="">Sin asignar</option>
                    {areas.map(a => (
                      <option key={a.dbId} value={a.dbId}>{a.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={cerrarModal} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'white', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={guardando} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--ado-purple)', color: 'white', fontWeight: 800, cursor: guardando ? 'not-allowed' : 'pointer' }}>
                  {guardando ? 'Guardando...' : 'Guardar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
