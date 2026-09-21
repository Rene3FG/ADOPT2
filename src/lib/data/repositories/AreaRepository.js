// src/lib/data/repositories/AreaRepository.js
// Gestor de Áreas (admin) — crear/eliminar áreas de servicio reales en la API.
import { apiFetch, AREA_API_TO_LOCAL, AREA_LOCAL_TO_API } from '../apiClient';
import { ICONOS_AREA, ICONO_AREA_DEFAULT, ordenarAreas } from '../../areasConfig';

export const AreaRepository = {
  listar: async () => {
    const areas = await apiFetch('/areas');
    return ordenarAreas(areas.map((a) => {
      const local = AREA_API_TO_LOCAL[a.nombre] || a.nombre;
      return {
        id: local,
        nombre: local,
        dbId: a.id,
        capacidad: a.capacidad ?? 4,
        icono: ICONOS_AREA[local] || ICONO_AREA_DEFAULT,
      };
    }));
  },

  crear: ({ nombre, capacidad }) =>
    apiFetch('/areas', {
      method: 'POST',
      body: JSON.stringify({ nombre: AREA_LOCAL_TO_API[nombre] || nombre, capacidad }),
    }),

  // PUT /areas solo acepta capacidad; el nombre es la llave del área en la API
  editar: (dbId, capacidad) =>
    apiFetch(`/areas/${dbId}`, {
      method: 'PUT',
      body: JSON.stringify({ capacidad }),
    }),

  eliminar: (dbId) => apiFetch(`/areas/${dbId}`, { method: 'DELETE' }),
};
