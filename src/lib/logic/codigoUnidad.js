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
