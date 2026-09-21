// Definición compartida de áreas del patio usada por ambas vistas (PatioPage.jsx
// en mobile, DropDrag.jsx en desktop). Desde la migración 003, GET /areas ya
// expone capacidad real (ver AreaRepository) — este arreglo ahora solo sirve
// como (a) valor inicial mientras carga el primer fetch y (b) fuente de los
// iconos, que la API no expone.
export const AREAS_PATIO = [
  { id: 'Desfogue', nombre: 'Desfogue', capacidad: 4, icono: '💨' },
  { id: 'Diesel', nombre: 'Diesel', capacidad: 3, icono: '⛽' },
  { id: 'Ad-blue', nombre: 'Ad-blue', capacidad: 2, icono: '💧' },
  { id: 'Taller', nombre: 'Taller', capacidad: 2, icono: '🛠️' },
  { id: 'Lavado Interior', nombre: 'Lavado Interior', capacidad: 3, icono: '🧽' },
  { id: 'Lavado Exterior', nombre: 'Lavado Exterior', capacidad: 4, icono: '🚿' },
  { id: 'Espera', nombre: 'Área de Espera', capacidad: 6, icono: '🚏' },
];

// Orden de flujo del patio (el del diseño de Rosaura). GET /areas ordena por
// nombre en la base, que no tiene columna de orden, así que se ordena aquí.
// Las áreas que no estén en la lista (creadas desde el Gestor) van al final.
const ORDEN_AREAS = AREAS_PATIO.map((a) => a.id);
export const ordenarAreas = (areas) => {
  const pos = (a) => {
    const i = ORDEN_AREAS.indexOf(a.id);
    return i === -1 ? ORDEN_AREAS.length : i;
  };
  return [...areas].sort((a, b) => pos(a) - pos(b));
};

export const ICONO_AREA_DEFAULT = '📍';

export const ICONOS_AREA = Object.fromEntries(AREAS_PATIO.map((a) => [a.id, a.icono]));
