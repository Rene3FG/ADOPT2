// src/pages/Registro/Registro.jsx — asistente de registro de escritorio
// (rediseño de Rosaura), wireado al mismo useRegistroBloc real que usa
// RegistroUnidadPage.jsx en mobile (POST /corridas + /movimientos + NFC).
import { useState } from 'react';
import { useRegistroBloc } from '../../lib/logic/useRegistroBloc.js';
import './Resgistro.css';

export default function Registro({ tagNfc = null, onRegistrado = null }) {
  const {
    formData, WORKFLOW_ORDER, areaRecomendada, tiposUnidad,
    handleInputChange, handleCheckboxChange,
    cargando, error, exito, guardarUnidad
  } = useRegistroBloc({ tagNfc, onRegistrado });

  const [paso, setPaso] = useState(1);

  const areasSeleccionadas = WORKFLOW_ORDER.filter((area) => formData.areasRequeridas[area]);
  const tieneAreas = areasSeleccionadas.length > 0;
  const puedeContinuarPaso2 = formData.numeroSerie && formData.horaSalida;

  const confirmarRegistro = async () => {
    await guardarUnidad();
    setPaso(1);
  };

  return (
    <div className="registro-page">
      <div className="registro-card">
        <h1 className="registro-title">Registro de Autobús</h1>
        <p className="registro-subtitle">Control de acceso al patio</p>

        {tagNfc && (
          <p style={{ margin: '0 0 20px 0', padding: '8px 12px', backgroundColor: '#FFF8E1', border: '1px solid #F0A93D', borderRadius: '8px', color: '#7A5200', fontSize: '0.85rem' }}>
            📡 Tag NFC <strong>{tagNfc}</strong> detectado — se asociará a esta unidad al registrarla.
          </p>
        )}

        <div className="step-indicator">
          {[1, 2, 3, 4].map((s) => <div key={s} className={`step ${paso >= s ? 'active' : ''}`}>{s}</div>)}
        </div>

        {paso === 1 && (
          <div className="button-group" style={{ justifyContent: 'center' }}>
            <button className="btn-primary" onClick={() => setPaso(2)}>Registrar Autobús</button>
          </div>
        )}

        {paso === 2 && (
          <>
            <h2 style={{ color: 'var(--primary)' }}>Datos del Autobús</h2>
            <div className="form-grid">
              <div className="input-group">
                <label>Número de Autobús *</label>
                <input type="number" name="numeroSerie" placeholder="Ej: 1001" value={formData.numeroSerie} onChange={handleInputChange} required />
              </div>
              <div className="input-group">
                <label>Tipo de Unidad</label>
                <select name="tipoUnidad" value={formData.tipoUnidad} onChange={handleInputChange}>
                  {tiposUnidad.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Hora límite de salida *</label>
                <input type="time" name="horaSalida" value={formData.horaSalida} onChange={handleInputChange} required />
              </div>
              <div className="input-group">
                <label>Nombre del Conductor</label>
                <input type="text" name="conductor" placeholder="Nombre completo" value={formData.conductor} onChange={handleInputChange} />
              </div>
              <div className="input-group">
                <label>Terminal de Origen</label>
                <input type="text" name="terminalOrigen" placeholder="Ej: CDMX TAPO" value={formData.terminalOrigen} onChange={handleInputChange} />
              </div>
              <div className="input-group">
                <label>Terminal de Destino</label>
                <input type="text" name="terminalDestino" placeholder="Ej: Oaxaca Centro" value={formData.terminalDestino} onChange={handleInputChange} />
              </div>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label>Observaciones</label>
                <textarea rows="3" name="observaciones" placeholder="Detalles de llegada o averías sutiles..." value={formData.observaciones} onChange={handleInputChange} />
              </div>
            </div>
            <div className="button-group">
              <button className="btn-secondary" onClick={() => setPaso(1)}>Atrás</button>
              <button className="btn-primary" disabled={!puedeContinuarPaso2} onClick={() => setPaso(3)}>Continuar</button>
            </div>
          </>
        )}

        {paso === 3 && (
          <>
            <h2 style={{ color: 'var(--primary)' }}>Seleccionar las Áreas de Ruta</h2>
            <div className="area-grid">
              {WORKFLOW_ORDER.map((area) => (
                <div
                  key={area}
                  className={`area-card ${formData.areasRequeridas[area] ? 'selected' : ''}`}
                  onClick={() => handleCheckboxChange(area)}
                >
                  {area}
                </div>
              ))}
            </div>
            <div className="button-group">
              <button className="btn-secondary" onClick={() => setPaso(2)}>Atrás</button>
              <button className="btn-primary" disabled={!tieneAreas} onClick={() => setPaso(4)}>Continuar</button>
            </div>
          </>
        )}

        {paso === 4 && (
          <>
            <h2 style={{ color: 'var(--primary)' }}>Confirmar Registro</h2>
            <div className="confirm-card">
              <p><strong>Número:</strong> {formData.numeroSerie} ({formData.tipoUnidad})</p>
              {formData.conductor && <p><strong>Conductor:</strong> {formData.conductor}</p>}
              <p><strong>Hora de salida:</strong> {formData.horaSalida}</p>
              <p><strong>Ruta Planificada:</strong> {areasSeleccionadas.length > 0 ? areasSeleccionadas.join(' ➔ ') : 'Ninguna'}</p>
              <p><strong>Enviar primero a:</strong> {areaRecomendada || 'Espera'}</p>
            </div>

            {error && <p style={{ color: 'var(--primary)', fontWeight: 600 }}>⚠️ {error}</p>}

            <div className="button-group">
              <button className="btn-secondary" disabled={cargando} onClick={() => setPaso(3)}>Atrás</button>
              <button className="btn-success" disabled={cargando} onClick={confirmarRegistro}>
                {cargando ? 'Guardando...' : 'Confirmar Registro'}
              </button>
            </div>
          </>
        )}
      </div>

      {exito && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-card">
            <div className="modal-card__body" style={{ textAlign: 'center' }}>
              <h2>✅ Registro Exitoso</h2>
              <p>La unidad fue registrada y enviada al patio.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
