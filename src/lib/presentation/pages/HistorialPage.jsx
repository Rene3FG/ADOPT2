// src/lib/presentation/pages/HistorialPage.jsx
import { useHistorialBloc } from '../../logic/useHistorialBloc';

export const HistorialPage = () => {
  const {
    movimientos, cargando, error, filtroPeriodo, setFiltroPeriodo,
    fechaInicioPersonalizada, setFechaInicioPersonalizada,
    fechaFinPersonalizada, setFechaFinPersonalizada
  } = useHistorialBloc();

  const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'white', color: 'var(--text-main)', colorScheme: 'light', boxSizing: 'border-box' };

  return (
    <div className="historial-page" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.8rem', fontWeight: 800 }}>Historial de Movimientos</h2>
          <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)' }}>Registro detallado de entradas y salidas por área.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={filtroPeriodo} onChange={(e) => setFiltroPeriodo(e.target.value)} style={inputStyle}>
            <option value="hoy">Hoy</option>
            <option value="semana">Últimos 7 días</option>
            <option value="mes">Último mes</option>
            <option value="personalizado">Rango personalizado</option>
          </select>

          {filtroPeriodo === 'personalizado' && (
            <>
              <input type="date" value={fechaInicioPersonalizada} onChange={(e) => setFechaInicioPersonalizada(e.target.value)} style={inputStyle} />
              <span style={{ fontWeight: 600 }}>hasta</span>
              <input type="date" value={fechaFinPersonalizada} onChange={(e) => setFechaFinPersonalizada(e.target.value)} style={inputStyle} />
            </>
          )}
        </div>
      </div>

      {error && <div style={{ color: 'var(--ado-red)', marginBottom: '15px', fontWeight: 600 }}>⚠️ {error}</div>}

      {cargando ? (
        <p style={{ textAlign: 'center', padding: '20px' }}>Cargando historial...</p>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="historial-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-light)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '15px' }}>Serie</th>
                  <th style={{ padding: '15px' }}>Tipo</th>
                  <th style={{ padding: '15px' }}>Área</th>
                  <th style={{ padding: '15px' }}>Entrada</th>
                  <th style={{ padding: '15px' }}>Salida</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay registros en este periodo.</td></tr>
                ) : (
                  movimientos.map((mov) => (
                    <tr key={mov.id_movimiento} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '15px', fontWeight: 600 }}>{mov.autobus?.numero_serie}</td>
                      <td style={{ padding: '15px' }}>{mov.autobus?.tipo_unidad}</td>
                      <td style={{ padding: '15px' }}><span style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>{mov.area?.nombre_area}</span></td>
                      <td style={{ padding: '15px' }}>{new Date(mov.hora_entrada).toLocaleString()}</td>
                      <td style={{ padding: '15px', color: !mov.hora_salida ? '#f59e0b' : 'inherit', fontWeight: !mov.hora_salida ? 600 : 'normal' }}>
                        {mov.hora_salida ? new Date(mov.hora_salida).toLocaleString() : 'En proceso...'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};