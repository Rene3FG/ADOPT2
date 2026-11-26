// Serie de la unidad a partir de lo que trae un QR o un tag NFC:
//   "101", "ADO-101" o la URL de check-in ".../checkin?unidad=ADO-101&k=...".
// Devuelve el número de serie, o null si el código no es de una unidad.
export function serieDesdeCodigo(codigo) {
  let texto = String(codigo ?? '').trim();
  try {
    const url = new URL(texto);
    texto = url.searchParams.get('unidad') ?? '';
  } catch {
    // no es URL: se interpreta tal cual
  }
  const m = /^(?:ADO[-_ ]?)?(\d{1,9})$/i.exec(texto.trim());
  return m ? Number(m[1]) : null;
}

// URL de check-in de un tag/QR de la maqueta → { serie, k }, o null si el
// código no trae token (QR viejo con solo la serie). Nunca se hace fetch a la
// URL leída tal cual: se reconstruye contra la API propia, para que un tag
// ajeno no pueda llevarse la sesión del operador a otro servidor.
export function checkinDesdeCodigo(codigo) {
  try {
    const url = new URL(String(codigo ?? '').trim());
    const k = url.searchParams.get('k');
    const serie = serieDesdeCodigo(url.searchParams.get('unidad'));
    return k && serie !== null && url.pathname.endsWith('/checkin') ? { serie, k } : null;
  } catch {
    return null;
  }
}

// Causa real de un fallo de Web NFC, en palabras del operador.
export function mensajeErrorNfc(error) {
  const det = error?.message ? ` (${error.message})` : '';
  switch (error?.name) {
    case 'NotAllowedError':
      return 'Permiso de NFC denegado. En Chrome toca el candado de la barra → Permisos → NFC → Permitir, y vuelve a tocar "Escanear NFC".' + det;
    case 'NotReadableError':
      return 'El NFC del teléfono está apagado o ocupado. Actívalo en Ajustes → Conexiones → NFC y vuelve a intentar.' + det;
    case 'NotSupportedError':
      return 'Este teléfono no tiene NFC o el navegador no puede usarlo. Usa Chrome en un Android con NFC, o "Escanear QR".' + det;
    default:
      return 'No se pudo iniciar el lector NFC.' + det;
  }
}
