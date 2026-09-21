// src/lib/presentation/pages/RegistroUnidadPage.jsx
import { useRegistroBloc } from '../../logic/useRegistroBloc';
import { QrUnidadModal } from '../components/QrUnidadModal';

export const RegistroUnidadPage = ({ tagNfc = null, onRegistrado = null } = {}) => {
  const {
    step, setStep, formData, WORKFLOW_ORDER, areaRecomendada, todasSeleccionadas, tiposUnidad,
    handleInputChange, handleCheckboxChange, handleToggleAll, avanzarPaso,
    cargando, error, exito, guardarUnidad, busRegistrado, cerrarModalQR
  } = useRegistroBloc({ tagNfc, onRegistrado });

  // =========================================================
  // ESTILO ESTANDARIZADO PARA INPUTS (Corrige el error de colores)
  // =========================================================
  const inputStyle = {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'white',
    color: 'var(--text-main)', // Fuerza el texto a ser oscuro
    fontSize: '1rem',
    fontFamily: 'inherit',
    colorScheme: 'light', // Obliga al navegador (reloj, opciones) a usar modo claro
    width: '100%',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: '1px solid var(--border-color)' }}>
      <header style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '25px' }}>
        <h2 style={{ color: 'var(--text-main)', margin: 0, fontWeight: 800 }}>Recepción de Unidades</h2>
        <p style={{ color: 'var(--text-muted)', margin: '5px 0 0 0', fontSize: '0.9rem' }}>
          {step === 1 ? "Paso 1: Captura de datos del autobús" : "Paso 2: Confirmación de ruta"}
        </p>
        {tagNfc && (
          <p style={{ margin: '10px 0 0 0', padding: '8px 12px', backgroundColor: '#FFF8E1', border: '1px solid #F0A93D', borderRadius: '8px', color: '#7A5200', fontSize: '0.85rem' }}>
            📡 Tag NFC <strong>{tagNfc}</strong> detectado — se asociará a esta unidad al registrarla.
          </p>
        )}
      </header>

      {/* ================= PASO 1: CAPTURA ================= */}
      {step === 1 && (
        <form onSubmit={avanzarPaso} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Número de Autobús *</label>
              <input 
                type="number" 
                name="numeroSerie" 
                value={formData.numeroSerie} 
                onChange={handleInputChange} 
                required 
                style={inputStyle} 
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Tipo de Unidad *</label>
              <select
                name="tipoUnidad"
                value={formData.tipoUnidad}
                onChange={handleInputChange}
                style={inputStyle}
              >
                {tiposUnidad.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Hora límite de salida *</label>
            <input
              type="time"
              name="horaSalida"
              value={formData.horaSalida}
              onChange={handleInputChange}
              required
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Conductor</label>
            <input
              type="text"
              name="conductor"
              value={formData.conductor}
              onChange={handleInputChange}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Terminal de Origen</label>
              <input
                type="text"
                name="terminalOrigen"
                value={formData.terminalOrigen}
                onChange={handleInputChange}
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Terminal de Destino</label>
              <input
                type="text"
                name="terminalDestino"
                value={formData.terminalDestino}
                onChange={handleInputChange}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-light)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Checklist de Áreas *</label>
              <button type="button" onClick={handleToggleAll} style={{ background: 'none', border: 'none', color: 'var(--ado-purple)', fontWeight: 600, cursor: 'pointer' }}>
                {todasSeleccionadas ? 'Desmarcar todas' : 'Marcar todas'}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {WORKFLOW_ORDER.map((area) => (
                <label key={area} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.areasRequeridas[area]} 
                    onChange={() => handleCheckboxChange(area)} 
                    style={{ width: '18px', height: '18px', accentColor: 'var(--ado-purple)' }} 
                  />
                  {area}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Área Inicial Destino *</label>
            <select 
              name="areaInicial" 
              value={formData.areaInicial} 
              onChange={handleInputChange} 
              required 
              style={inputStyle}
            >
              <option value="" disabled>Seleccione destino...</option>
              {WORKFLOW_ORDER.map((area) => (
                <option key={area} value={area}>
                  {area} {area === areaRecomendada ? ' (Recomendada)' : ''}
                </option>
              ))}
              <option value="Espera">
                Espera {areaRecomendada === 'Espera' ? ' (Recomendada por saturación)' : ''}
              </option>
            </select>
          </div>

          {error && <div style={{ color: 'var(--ado-red)', fontSize: '0.9rem', fontWeight: 600 }}>⚠️ {error}</div>}

          <button type="submit" style={{ backgroundColor: 'var(--ado-purple)', color: 'white', padding: '15px', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', marginTop: '10px' }}>
            REVISAR DATOS →
          </button>
        </form>
      )}

      {/* ================= PASO 2: CONFIRMACIÓN ================= */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: 'var(--bg-light)', padding: '20px', borderRadius: '8px', borderLeft: '5px solid var(--ado-purple)' }}>
            <p style={{ margin: '0 0 10px 0', color: 'var(--text-main)' }}><strong>Unidad:</strong> {formData.numeroSerie} ({formData.tipoUnidad})</p>
            {formData.conductor && <p style={{ margin: '0 0 10px 0', color: 'var(--text-main)' }}><strong>Conductor:</strong> {formData.conductor}</p>}
            {formData.terminalOrigen && <p style={{ margin: '0 0 10px 0', color: 'var(--text-main)' }}><strong>Terminal de Origen:</strong> {formData.terminalOrigen}</p>}
            {formData.terminalDestino && <p style={{ margin: '0 0 10px 0', color: 'var(--text-main)' }}><strong>Terminal de Destino:</strong> {formData.terminalDestino}</p>}
            <p style={{ margin: '0 0 10px 0', color: 'var(--text-main)' }}><strong>Hora de Salida:</strong> {formData.horaSalida}</p>
            <p style={{ margin: '0 0 5px 0', color: 'var(--text-main)' }}><strong>Ruta Asignada:</strong></p>
            <ul style={{ margin: '0 0 15px 0', paddingLeft: '20px', color: 'var(--text-muted)' }}>
              {Object.keys(formData.areasRequeridas).filter(area => formData.areasRequeridas[area]).map(area => <li key={area}>{area}</li>)}
            </ul>
            
            <p style={{ margin: 0, color: 'var(--text-main)' }}>
              <strong>Enviar primero a:</strong> <span style={{ color: 'var(--ado-purple)', fontWeight: 800 }}>{formData.areaInicial}</span>
              {formData.areaInicial !== areaRecomendada && (
                <span style={{ fontSize: '0.85rem', color: '#ea580c', marginLeft: '10px', fontWeight: 600, display: 'inline-block' }}>
                  ⚠️ (Modificado manualmente)
                </span>
              )}
            </p>
          </div>

          {error && <div style={{ color: 'var(--ado-red)', fontSize: '0.9rem', fontWeight: 600 }}>⚠️ {error}</div>}
          {exito && <div style={{ color: '#166534', backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '8px', fontWeight: 600 }}>✅ Unidad registrada y enviada al patio exitosamente.</div>}

          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
            <button onClick={() => setStep(1)} disabled={cargando} style={{ flex: 1, backgroundColor: 'white', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '15px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
              ← MODIFICAR
            </button>
            <button onClick={guardarUnidad} disabled={cargando} style={{ flex: 2, backgroundColor: 'var(--ado-red)', color: 'white', border: 'none', padding: '15px', borderRadius: '8px', fontWeight: 800, cursor: cargando ? 'not-allowed' : 'pointer' }}>
              {cargando ? 'GUARDANDO...' : 'CONFIRMAR REGISTRO'}
            </button>
          </div>
        </div>
      )}

      <QrUnidadModal bus={busRegistrado} onCerrar={cerrarModalQR} />
    </div>
  );
};