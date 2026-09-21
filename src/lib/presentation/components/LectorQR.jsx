// src/lib/presentation/components/LectorQR.jsx
// Escáner de códigos QR con la cámara trasera (html5-qrcode). Alternativa al
// lector NFC para dispositivos sin Web NFC (iPhone, Chrome de escritorio).
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const ID_LECTOR = 'lector-qr-region';

export const LectorQR = ({ onScanExitoso, onError }) => {
  // Los callbacks se guardan en refs para que un render del padre no reinicie la cámara.
  const alLeerRef = useRef(onScanExitoso);
  const alFallarRef = useRef(onError);
  useEffect(() => {
    alLeerRef.current = onScanExitoso;
    alFallarRef.current = onError;
  }, [onScanExitoso, onError]);

  const [mensaje, setMensaje] = useState('Iniciando cámara...');

  useEffect(() => {
    let cancelado = false;
    let iniciado = false;
    let leido = false;
    const scanner = new Html5Qrcode(ID_LECTOR, { verbose: false });

    const detener = async () => {
      if (!iniciado) return;
      iniciado = false;
      try { await scanner.stop(); } catch { /* ya estaba detenido */ }
      try { scanner.clear(); } catch { /* sin nada que limpiar */ }
    };

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (codigo) => {
          // La cámara reporta el mismo código varias veces por segundo: solo el primero cuenta.
          if (leido || cancelado) return;
          leido = true;
          detener();
          alLeerRef.current?.(codigo);
        },
        () => { /* fotogramas sin código: es lo normal mientras enfoca */ }
      )
      .then(() => {
        iniciado = true;
        if (cancelado) { detener(); return; }
        setMensaje('');
      })
      .catch((err) => {
        if (cancelado) return;
        const texto = String(err?.message || err);
        setMensaje(
          /permission|denied|notallowed/i.test(texto)
            ? 'No hay permiso para usar la cámara. Actívalo en los ajustes del navegador.'
            : 'No se pudo abrir la cámara en este dispositivo.'
        );
        alFallarRef.current?.(texto);
      });

    return () => {
      cancelado = true;
      detener();
    };
  }, []);

  return (
    <div style={{ width: '100%', maxWidth: '360px', margin: '0 auto' }}>
      <div
        id={ID_LECTOR}
        style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--ado-purple, #6b21a8)', minHeight: '120px', backgroundColor: '#111' }}
      />
      {mensaje && (
        <p style={{ margin: '12px 0 0', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>{mensaje}</p>
      )}
    </div>
  );
};
