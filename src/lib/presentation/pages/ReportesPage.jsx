// src/lib/presentation/pages/ReportesPage.jsx
import { useReportesBloc } from '../../logic/useReportesBloc';

export const ReportesPage = () => {
  const { fechaInicio, setFechaInicio, fechaFin, setFechaFin, cargando, error, generarPDF, generarCSV } = useReportesBloc();

  const inputStyle = { padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'white', color: 'var(--text-main)', boxSizing: 'border-box', width: '100%', fontSize: '1rem', colorScheme: 'light' };

  return (
    <div className="reportes-card" style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: '1px solid var(--border-color)' }}>
      <header style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '25px' }}>
        <h2 style={{ color: 'var(--text-main)', margin: 0, fontWeight: 800 }}>Generación de Reportes</h2>
        <p style={{ color: 'var(--text-muted)', margin: '5px 0 0 0', fontSize: '0.9rem' }}>Exporta la bitácora de movimientos para auditoría o contabilidad.</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="reportes-fechas" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Fecha Inicio</label>
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} disabled={cargando} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Fecha Fin</label>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} disabled={cargando} style={inputStyle} />
          </div>
        </div>

        {error && <div style={{ color: 'var(--ado-red)', fontSize: '0.9rem', fontWeight: 600 }}>⚠️ {error}</div>}

        <div className="reportes-acciones" style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
          <button onClick={generarCSV} disabled={cargando} style={{ flex: 1, backgroundColor: 'white', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '15px', borderRadius: '8px', fontWeight: 600, cursor: cargando ? 'not-allowed' : 'pointer' }}>
            {cargando ? 'Procesando...' : '📄 Exportar a Excel (CSV)'}
          </button>
          <button onClick={generarPDF} disabled={cargando} style={{ flex: 1, backgroundColor: 'var(--ado-red)', color: 'white', border: 'none', padding: '15px', borderRadius: '8px', fontWeight: 800, cursor: cargando ? 'not-allowed' : 'pointer' }}>
            {cargando ? 'Generando...' : '📥 Generar PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};