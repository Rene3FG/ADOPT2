// src/lib/presentation/components/QrUnidadModal.jsx
// Modal con el código QR de una unidad recién registrada, listo para imprimir
// y pegar en el cristal del autobús. El QR contiene solo el número de serie:
// es lo que espera el escáner del operador (LectorQR → POST /camiones/{serie}/avanzar).
import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const escaparHtml = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const QrUnidadModal = ({ bus, onCerrar }) => {
  const qrRef = useRef(null);
  if (!bus) return null;

  const serie = String(bus.numeroSerie);

  const imprimir = () => {
    const svg = qrRef.current?.innerHTML;
    if (!svg) return;
    const ventana = window.open('', '', 'height=600,width=600');
    if (!ventana) {
      alert('El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes e inténtalo de nuevo.');
      return;
    }
    ventana.document.write(
      '<html><head><title>QR unidad ' + escaparHtml(serie) + '</title>' +
      '<style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}' +
      '.etiqueta{text-align:center;border:2px dashed #000;padding:20px;border-radius:10px}' +
      'h2{margin:0 0 4px;font-size:28px}p{margin:0 0 14px;color:#555}</style></head><body>' +
      '<div class="etiqueta"><h2>ADO ' + escaparHtml(serie) + '</h2><p>' + escaparHtml(bus.tipoUnidad || '') + '</p>' +
      svg + '</div></body></html>'
    );
    ventana.document.close();
    ventana.focus();
    setTimeout(() => { ventana.print(); ventana.close(); }, 250);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: '20px', boxSizing: 'border-box' }}>
      <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '16px', width: '100%', maxWidth: '380px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '10px', borderRadius: '8px', fontWeight: 800, marginBottom: '18px' }}>
          ✓ Unidad {serie} registrada
        </div>
        <h2 style={{ margin: '0 0 4px', fontSize: '24px', color: '#333' }}>ADO {serie}</h2>
        <p style={{ margin: '0 0 14px', fontSize: '14px', color: '#666' }}>{bus.tipoUnidad}</p>
        <div ref={qrRef} data-testid="qr-unidad" style={{ display: 'inline-block', backgroundColor: 'white', padding: '8px' }}>
          <QRCodeSVG value={serie} size={200} level="H" marginSize={2} />
        </div>
        <p style={{ margin: '12px 0 0', fontSize: '12px', color: '#94a3b8' }}>
          Pégalo en el cristal del autobús: el operador lo escanea para avanzar la unidad.
        </p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
          <button onClick={onCerrar} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#334155', fontWeight: 600, cursor: 'pointer' }}>
            Cerrar
          </button>
          <button onClick={imprimir} style={{ flex: 2, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#0284c7', color: 'white', fontWeight: 800, cursor: 'pointer' }}>
            🖨️ Imprimir
          </button>
        </div>
      </div>
    </div>
  );
};
