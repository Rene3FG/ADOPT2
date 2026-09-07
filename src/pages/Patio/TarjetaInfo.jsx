// src/pages/Patio/TarjetaInfo.jsx — tarjeta de un autobús en el tablero de
// escritorio. El semáforo/cronómetro viene de usePatioBloc.obtenerSemaforo
// (mismos minutos reales que usa la vista mobile), no de un timer local.
export default function TarjetaInfo({ bus, semaforo, alIniciarArrastre, onVerFicha, onIniciarServicio }) {
  const colorSemaforo = semaforo ? semaforo.color : null;
  const claseSemaforo = colorSemaforo === 'rojo' ? 'rojo' : colorSemaforo === 'naranja' ? 'amarillo' : colorSemaforo === 'verde' ? 'verde' : null;

  return (
    <div
      className="tarjeta-camion"
      draggable
      onDragStart={(e) => alIniciarArrastre(e, bus.busId)}
      onDoubleClick={() => onVerFicha(bus)}
      title="Doble clic para ver la ficha del registro"
    >
      <div className="tarjeta-header">
        {claseSemaforo && <span className={`estado-semaforo ${claseSemaforo}`}></span>}
        <span className="codigo-unidad">{bus.busId}</span>
        {bus.isPriority && <span title="Prioridad por hora de salida">⚠️</span>}
      </div>

      <div className="tipo-unidad">{bus.busType}</div>

      {semaforo ? (
        <div className={`tiempo-area ${claseSemaforo}`}>
          En {bus.currentArea}: {semaforo.elapsed} min (prom. {semaforo.promedio})
        </div>
      ) : (
        <div className="tiempo-area" style={{ backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>
          {bus.currentArea === 'Espera' ? 'En espera' : 'Pendiente de iniciar'}
        </div>
      )}

      {!semaforo && bus.currentArea !== 'Espera' && (
        <button
          className="btn-final btn-descanso"
          style={{ width: '90%', margin: '0 auto 8px auto' }}
          onClick={(e) => { e.stopPropagation(); onIniciarServicio(bus); }}
        >
          Iniciar servicio
        </button>
      )}

      <div style={{ width: '90%', margin: '10px auto 0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', padding: '0 2px' }}>
          <span style={{ fontSize: '11px', color: '#475569', fontWeight: '600' }}>Avance</span>
          <span style={{ fontSize: '12px', fontWeight: '800', color: bus.progressPercentage === 100 ? '#059669' : '#0f172a' }}>
            {bus.progressPercentage}%
          </span>
        </div>
        <div className="tarjeta-progreso-mini-bg">
          <div className="tarjeta-progreso-mini-fill" style={{ width: `${bus.progressPercentage}%` }}></div>
        </div>
      </div>
    </div>
  );
}
