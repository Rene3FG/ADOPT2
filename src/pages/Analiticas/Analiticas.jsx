// src/pages/Analiticas/Analiticas.jsx — analíticas de escritorio: tendencias de
// mantenimiento, comparativa día/noche y retraso de salida (GET /analiticas).
import { useEffect, useState } from 'react';
import { MdTimeline, MdWarningAmber, MdPercent } from 'react-icons/md';
import { AnaliticasRepository } from '../../lib/data/repositories/AnaliticasRepository.js';
import './Analiticas.css';

const RANGOS = [
  { dias: 7, etiqueta: 'Últimos 7 días' },
  { dias: 30, etiqueta: 'Últimos 30 días' },
  { dias: 90, etiqueta: 'Últimos 90 días' },
];
const PESTANAS = [
  { id: 'mantenimiento', etiqueta: 'Mantenimiento' },
  { id: 'turnos', etiqueta: 'Día vs. noche' },
  { id: 'retraso', etiqueta: 'Retraso' },
];

const aISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function fmtMin(min) {
  if (min == null) return '—';
  const abs = Math.abs(min);
  if (abs < 1) return `${Math.round(abs * 60)} s`;
  if (abs < 60) return `${abs.toFixed(abs < 10 ? 1 : 0)} min`;
  return `${Math.floor(abs / 60)} h ${Math.round(abs % 60)} min`;
}

// Barras horizontales HTML: una fila por categoría, una barra por serie. La
// escala arranca en 0 y es común a todas las filas; hover con tooltip nativo.
function BarrasHorizontales({ filas, series, formato = (v) => v, vacio }) {
  const max = Math.max(0, ...filas.flatMap((f) => f.valores.map((v) => v ?? 0)));
  if (filas.length === 0 || max === 0) return <p className="an-vacio">{vacio}</p>;
  return (
    <div className="an-barras" role="list">
      {series.length > 1 && (
        <div className="an-leyenda">
          {series.map((s) => (
            <span key={s.nombre}><i style={{ background: s.color }} />{s.nombre}</span>
          ))}
        </div>
      )}
      {filas.map((f) => (
        <div className="an-fila" role="listitem" key={f.etiqueta}>
          <span className="an-fila__etq">{f.etiqueta}</span>
          <div className="an-fila__pistas">
            {f.valores.map((v, i) => (
              <div className="an-pista" key={series[i].nombre} title={`${f.etiqueta} · ${series[i].nombre}: ${formato(v)}${f.n?.[i] != null ? ` (${f.n[i]} mov.)` : ''}`}>
                <div className="an-barra" style={{ width: `${((v ?? 0) / max) * 100}%`, background: series[i].color }} />
                <span className="an-valor">{v == null ? 'sin datos' : formato(v)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Columnas verticales (una serie) para tendencias. Con muchas columnas (p. ej. 29 días)
// pasa a modo denso: barras delgadas, solo se rotulan algunas fechas y el valor va en el tooltip.
function Columnas({ items, formato = (v) => v, vacio }) {
  const max = Math.max(0, ...items.map((i) => i.valor ?? 0));
  if (items.length === 0 || max === 0) return <p className="an-vacio">{vacio}</p>;
  const denso = items.length > 12;
  const paso = Math.ceil(items.length / 8);
  return (
    <div className={denso ? 'an-cols an-cols--densas' : 'an-cols'}>
      {items.map((i, idx) => (
        <div className="an-col" key={i.etiqueta} title={`${i.etiqueta}: ${formato(i.valor)}`}>
          {!denso && <span className="an-col__valor">{formato(i.valor)}</span>}
          <div className="an-col__barra" style={{ height: `${((i.valor ?? 0) / max) * 100}%` }} />
          <span className="an-col__etq">{!denso || idx % paso === 0 || idx === items.length - 1 ? i.etiqueta : '\u00a0'}</span>
        </div>
      ))}
    </div>
  );
}

function Tabla({ columnas, filas }) {
  return (
    <div className="an-tabla-wrap">
      <table className="an-tabla">
        <thead><tr>{columnas.map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>{filas.map((f, i) => <tr key={i}>{f.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function Tarjeta({ titulo, subtitulo, children, tabla }) {
  const [verTabla, setVerTabla] = useState(false);
  return (
    <section className="an-card">
      <header>
        <div><h3>{titulo}</h3>{subtitulo && <p>{subtitulo}</p>}</div>
        {tabla && <button className="an-link" onClick={() => setVerTabla((v) => !v)}>{verTabla ? 'Ver gráfica' : 'Ver tabla'}</button>}
      </header>
      {verTabla && tabla ? <Tabla {...tabla} /> : children}
    </section>
  );
}

const Kpi = ({ valor, etiqueta, icono, tono }) => (
  <div className={`an-kpi an-kpi--icono${tono ? ` an-kpi--${tono}` : ''}`}>
    <div className="an-kpi__icono">{icono}</div>
    <div><strong>{valor}</strong><span>{etiqueta}</span></div>
  </div>
);

const fmtSemana = (iso) => {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
};

function Mantenimiento({ datos }) {
  const { por_semana: semanas, por_tipo: tipos } = datos.mantenimiento;
  const conTipos = tipos.filter((t) => t.n > 0);
  return (
    <>
      <Tarjeta
        titulo="Unidades atendidas en taller por semana"
        subtitulo="Semana que inicia el lunes indicado"
        tabla={{ columnas: ['Semana', 'Unidades', 'Tiempo promedio'], filas: semanas.map((s) => [fmtSemana(s.semana), s.n, fmtMin(s.promedio_min)]) }}
      >
        <Columnas items={semanas.map((s) => ({ etiqueta: fmtSemana(s.semana), valor: s.n }))} vacio="No hay unidades atendidas en taller en este periodo." />
      </Tarjeta>
      <Tarjeta
        titulo="Trabajos realizados en taller"
        subtitulo="Cuántas veces se marcó cada tipo de trabajo"
        tabla={{ columnas: ['Trabajo', 'Veces'], filas: tipos.map((t) => [t.tipo, t.n]) }}
      >
        <BarrasHorizontales
          filas={conTipos.map((t) => ({ etiqueta: t.tipo, valores: [t.n] }))}
          series={[{ nombre: 'Veces', color: 'var(--an-serie-1)' }]}
          vacio="Aún no se registran trabajos de taller desde la app en este periodo."
        />
      </Tarjeta>
      <Tarjeta
        titulo="Tiempo promedio por área"
        tabla={{ columnas: ['Área', 'Movimientos', 'Promedio', 'Mediana', 'p90'], filas: datos.por_area.map((a) => [a.area, a.n, fmtMin(a.promedio_min), fmtMin(a.mediana_min), fmtMin(a.p90_min)]) }}
      >
        <BarrasHorizontales
          filas={datos.por_area.map((a) => ({ etiqueta: a.area, valores: [a.promedio_min], n: [a.n] }))}
          series={[{ nombre: 'Promedio', color: 'var(--an-serie-1)' }]}
          formato={fmtMin}
          vacio="Sin movimientos completados en este periodo."
        />
      </Tarjeta>
    </>
  );
}

function Turnos({ datos }) {
  const [dia, noche] = datos.turnos;
  const areas = [...new Set([...dia.areas, ...noche.areas].map((a) => a.area))].sort();
  const buscar = (t, area) => t.areas.find((a) => a.area === area);
  const series = [
    { nombre: dia.turno, color: 'var(--an-serie-1)' },
    { nombre: noche.turno, color: 'var(--an-serie-2)' },
  ];
  return (
    <>
      <div className="an-kpis">
        {[dia, noche].map((t, i) => (
          <div className="an-kpi an-kpi--turno" key={t.turno} style={{ '--an-borde-turno': series[i].color }}>
            <span>{t.turno}</span>
            <strong>{t.movimientos}</strong>
            <span>movimientos · {t.completados} completados · promedio {fmtMin(t.promedio_min)}</span>
          </div>
        ))}
      </div>
      <Tarjeta
        titulo="Tiempo promedio por área y turno"
        subtitulo="Según la hora de entrada al área"
        tabla={{ columnas: ['Área', dia.turno, noche.turno], filas: areas.map((a) => [a, fmtMin(buscar(dia, a)?.promedio_min), fmtMin(buscar(noche, a)?.promedio_min)]) }}
      >
        <BarrasHorizontales
          filas={areas.map((a) => ({
            etiqueta: a,
            valores: [buscar(dia, a)?.promedio_min ?? null, buscar(noche, a)?.promedio_min ?? null],
            n: [buscar(dia, a)?.n, buscar(noche, a)?.n],
          }))}
          series={series}
          formato={fmtMin}
          vacio="Sin movimientos completados en este periodo."
        />
      </Tarjeta>
    </>
  );
}

function Retraso({ datos }) {
  const r = datos.retraso;
  const pct = r.viajes_medidos ? Math.round((r.con_retraso / r.viajes_medidos) * 100) : 0;
  return (
    <>
      <div className="an-kpis">
        <Kpi valor={r.viajes_medidos} etiqueta="viajes medidos (con todos sus servicios completos)" icono={<MdTimeline />} />
        <Kpi valor={r.con_retraso} etiqueta="terminaron después de su hora de salida" icono={<MdWarningAmber />} tono="alerta" />
        <Kpi valor={`${pct} %`} etiqueta="de los viajes con retraso" icono={<MdPercent />} tono="alerta" />
        <Kpi valor={fmtMin(r.mediana_retraso_min)} etiqueta={`retraso típico (mediana) · p90 ${fmtMin(r.p90_retraso_min)}`} icono={<MdTimeline />} />
      </div>
      <Tarjeta
        titulo="Retraso promedio por día"
        subtitulo="Solo viajes que terminaron sus servicios después de la salida programada"
        tabla={{ columnas: ['Fecha', 'Viajes', 'Con retraso', 'Retraso promedio'], filas: r.por_dia.map((d) => [d.fecha, d.viajes, d.con_retraso, fmtMin(d.retraso_promedio_min)]) }}
      >
        <Columnas
          items={r.por_dia.map((d) => ({ etiqueta: fmtSemana(d.fecha), valor: d.retraso_promedio_min }))}
          formato={fmtMin}
          vacio="Ningún viaje terminó tarde en este periodo."
        />
      </Tarjeta>
      <Tarjeta titulo="Viajes con mayor retraso">
        {r.peores.length === 0 ? (
          <p className="an-vacio">Sin viajes medidos en este periodo.</p>
        ) : (
          <Tabla
            columnas={['Unidad', 'Fecha', 'Salida programada', 'Fin de servicios', 'Diferencia']}
            filas={r.peores.map((v) => [v.serie, v.fecha, v.salida_programada, v.fin_servicios,
              v.retraso_min > 0
                ? <span className="an-pill an-pill--tarde">▲ Retraso {fmtMin(v.retraso_min)}</span>
                : <span className="an-pill an-pill--ok">✓ {fmtMin(v.retraso_min)} antes</span>])}
          />
        )}
      </Tarjeta>
    </>
  );
}

export default function Analiticas() {
  const [dias, setDias] = useState(30);
  const [pestana, setPestana] = useState('mantenimiento');
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  const cambiarPeriodo = (nuevo) => {
    setCargando(true);
    setError('');
    setDias(nuevo);
  };

  useEffect(() => {
    let vigente = true;
    const hasta = new Date();
    const desde = new Date();
    desde.setDate(hasta.getDate() - dias);
    AnaliticasRepository.obtener(aISO(desde), aISO(hasta))
      .then((d) => vigente && setDatos(d))
      .catch((e) => vigente && setError(e.message))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
  }, [dias]);

  return (
    <div className="analiticas-panel">
      <div className="an-header">
        <div>
          <h2>Analíticas</h2>
          <p>Tendencias de mantenimiento, comparativa entre turnos y retraso de salida.</p>
        </div>
        <select value={dias} onChange={(e) => cambiarPeriodo(Number(e.target.value))} aria-label="Periodo">
          {RANGOS.map((r) => <option key={r.dias} value={r.dias}>{r.etiqueta}</option>)}
        </select>
      </div>

      <div className="an-tabs" role="tablist">
        {PESTANAS.map((p) => (
          <button key={p.id} role="tab" aria-selected={pestana === p.id} className={pestana === p.id ? 'activa' : ''} onClick={() => setPestana(p.id)}>{p.etiqueta}</button>
        ))}
      </div>

      {error && <div className="an-aviso an-aviso--error">{error}</div>}
      {cargando && !datos && <p className="an-vacio">Cargando analíticas…</p>}
      {datos && (
        <>
          {!datos.muestra.suficiente && (
            <div className="an-aviso">
              Pocos datos: {datos.muestra.con_duracion} movimientos con duración en {datos.muestra.dias} día(s).
              Las cifras se vuelven confiables con al menos 30 movimientos completados.
            </div>
          )}
          <div className={cargando ? 'an-contenido an-contenido--carga' : 'an-contenido'}>
            {pestana === 'mantenimiento' && <Mantenimiento datos={datos} />}
            {pestana === 'turnos' && <Turnos datos={datos} />}
            {pestana === 'retraso' && <Retraso datos={datos} />}
          </div>
          <p className="an-nota">
            Turnos: día 06:00–18:00 y noche 18:00–06:00, por hora local de entrada. Se cuentan todos los movimientos del sistema (app y hoja de cálculo sincronizada)
            {datos.muestra.descartados > 0 && `; se omitieron ${datos.muestra.descartados} con fechas inconsistentes`}.
          </p>
        </>
      )}
    </div>
  );
}
