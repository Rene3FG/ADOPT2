const API_URL = import.meta.env.VITE_API_URL || 'https://ado-project.onrender.com';

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('sca_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    headers,
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  if (!res.ok) {
    // JWT vencido (la API lo emite por 12 h): mismo cierre que "Cerrar sesión".
    // Solo con token guardado y fuera de /login, para que credenciales malas
    // sigan mostrando su error en vez de recargar la página.
    if (res.status === 401 && token && path !== '/login') {
      localStorage.removeItem('sca_token');
      localStorage.removeItem('sesionAdo');
      window.location.reload();
      throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
    }
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Error ${res.status} en ${path}`);
  }
  return res.status === 204 ? null : res.json();
}

// La API expone los nombres de área en mayúsculas (ver AREA_NOMBRE_DB en db_client.py);
// Backup usa nombres con mayúscula inicial. Este es el único punto de traducción.
export const AREA_API_TO_LOCAL = {
  DIESEL: 'Diesel',
  ADDBLUE: 'Ad-blue',
  TALLER: 'Taller',
  DESFOGUE: 'Desfogue',
  'LAVADO EXTERIOR': 'Lavado Exterior',
  'LAVADO INTERIOR': 'Lavado Interior',
  RECEPCION: 'Recepcion',
};

export const AREA_LOCAL_TO_API = Object.fromEntries(
  Object.entries(AREA_API_TO_LOCAL).map(([api, local]) => [local, api])
);
