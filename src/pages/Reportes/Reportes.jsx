// src/pages/Reportes/Reportes.jsx — panel de reportes de escritorio.
// El tablero de KPIs/tabla usa los autobuses activos en tiempo real
// (usePatioBloc, vía props); la exportación PDF/CSV reutiliza el
// useReportesBloc real (misma bitácora que ReportesPage.jsx en mobile).
import { MdBarChart, MdPeople, MdTimeline, MdWarningAmber } from 'react-icons/md';
import { useReportesBloc } from '../../lib/logic/useReportesBloc.js';
import './Reportes.css';

export default function Reportes({ autobuses = [], obtenerSemaforo }) {
  const { fechaInicio, setFechaInicio, fechaFin, setFechaFin, cargando, error, generarPDF, generarCSV } = useReportesBloc();

  const enProceso = autobuses.filter((b) => b.estadoServicio === 'En Proceso').length;
  const conRetraso = obtenerSemaforo ? autobuses.filter((b) => obtenerSemaforo(b)?.color === 'rojo').length : 0;

  return (
    <div className="reportes-panel">
      <div className="reportes-header">
        <h2>Panel de Reportes y Rendimiento</h2>
        <p>Análisis de tiempos de estancia y productividad por unidad vehicular.</p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon"><MdTimeline /></div>
          <div className="kpi-info"><h3>{autobuses.length}</h3><p>Unidades en Patio</p></div>
        </div>
        <div className="kpi-card completado">
          <div className="kpi-icon"><MdBarChart /></div>
          <div className="kpi-info"><h3>{enProceso}</h3><p>En Proceso</p></div>
        </div>
        <div className="kpi-card proceso">
          <div className="kpi-icon"><MdWarningAmber /></div>
          <div className="kpi-info"><h3>{conRetraso}</h3><p>Con Retraso</p></div>
        </div>
      </div>

      {autobuses.length === 0 ? (
        <div className="no-reportes">No hay unidades activas en el patio.</div>
      ) : (
        <div className="table-container-rep">
          <div style={{ overflowX: 'auto' }}>
            <table className="reportes-table">
              <thead>
                <tr>
                  <th>Unidad</th>
                  <th>Conductor</th>
                  <th>Área Actual</th>
                  <th>Hora de Salida</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Avance</th>
                </tr>
              </thead>
              <tbody>
                {autobuses.map((bus) => (
                  <tr key={bus.busId}>
                    <td><span className="badge-bus-rep">{bus.busId}</span></td>
                    <td>
                      <div className="driver-cell">
                        <MdPeople className="driver-icon" />
                        <span>{bus.conductor || 'Sin asignar'}</span>
                      </div>
                    </td>
                    <td>{bus.currentArea}</td>
                    <td className={bus.isPriority ? 'time-out text-anim' : 'time-out'}>{bus.departureTime}</td>
                    <td>
                      <span className={`status-badge ${bus.estadoServicio === 'En Proceso' ? 'proceso' : 'listo'}`}>
                        {bus.estadoServicio}
                      </span>
                    </td>
                    <td>
                      <div className="progreso-celda-container">
                        <div className="barra-progreso-fondo">
                          <div className="barra-progreso-relleno" style={{ width: `${bus.progressPercentage}%` }}></div>
                        </div>
                        <span className="porcentaje-texto">{bus.progressPercentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="table-container-rep" style={{ marginTop: '25px', padding: '20px' }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>Exportar bitácora de movimientos</h3>
        <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#64748b' }}>Para auditoría o contabilidad, por rango de fechas.</p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="input-group" style={{ minWidth: '160px' }}>
            <label>Fecha Inicio</label>
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} disabled={cargando} />
          </div>
          <div className="input-group" style={{ minWidth: '160px' }}>
            <label>Fecha Fin</label>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} disabled={cargando} />
          </div>
          <button className="btn-secondary" disabled={cargando} onClick={generarCSV}>
            {cargando ? 'Procesando...' : '📄 Exportar CSV'}
          </button>
          <button className="btn-primary" disabled={cargando} onClick={generarPDF}>
            {cargando ? 'Generando...' : '📥 Generar PDF'}
          </button>
        </div>
        {error && <p style={{ color: 'var(--primary)', fontWeight: 600, marginTop: '10px' }}>⚠️ {error}</p>}
      </div>
    </div>
  );
}
