// src/lib/logic/useReportesBloc.js
import { useState } from 'react';
import { MovimientoRepository } from '../data/repositories/MovimientoRepository';

export const useReportesBloc = () => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const generarPDF = async () => {
    if (!fechaInicio || !fechaFin) return setError('Selecciona un rango de fechas válido.');
    setCargando(true); setError('');

    try {
      const inicio = new Date(fechaInicio).toISOString();
      const finObj = new Date(fechaFin); finObj.setHours(23, 59, 59, 999);
      const fin = finObj.toISOString();

      const data = await MovimientoRepository.obtenerHistorial(inicio, fin);
      
      if (data.length === 0) {
        setError('No hay datos en este periodo para generar el reporte.');
        setCargando(false); return;
      }

      const { jsPDF } = await import('jspdf');
      // jspdf-autotable 5.x ya no agrega doc.autoTable() al importarse desde un
      // bundler: hay que usar la función exportada, autoTable(doc, {...}).
      const { autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      doc.text(`Reporte de Movimientos ADO`, 14, 15);
      doc.setFontSize(10);
      doc.text(`Periodo: ${fechaInicio} al ${fechaFin}`, 14, 22);

      const tableColumn = ["Serie", "Tipo", "Área", "Entrada", "Salida"];
      const tableRows = data.map(mov => [
        mov.autobus?.numero_serie || 'N/A',
        mov.autobus?.tipo_unidad || 'N/A',
        mov.area?.nombre_area || 'N/A',
        new Date(mov.hora_entrada).toLocaleString(),
        mov.hora_salida ? new Date(mov.hora_salida).toLocaleString() : 'En proceso'
      ]);

      autoTable(doc, {
        head: [tableColumn], body: tableRows, startY: 30,
        styles: { fontSize: 8 }, headStyles: { fillColor: [206, 0, 55] } 
      });

      doc.save(`Reporte_SCA_${fechaInicio}_${fechaFin}.pdf`);
    } catch (err) {
      setError('Error al generar el PDF. Verificar instalación de jspdf y jspdf-autotable.');
    } finally { setCargando(false); }
  };

  const generarCSV = async () => {
    if (!fechaInicio || !fechaFin) return setError('Selecciona un rango de fechas válido.');
    setCargando(true); setError('');

    try {
      const inicio = new Date(fechaInicio).toISOString();
      const finObj = new Date(fechaFin); finObj.setHours(23, 59, 59, 999);
      const fin = finObj.toISOString();

      const data = await MovimientoRepository.obtenerHistorial(inicio, fin);
      if (data.length === 0) {
        setError('No hay datos en este periodo.'); setCargando(false); return;
      }

      let csvContent = "data:text/csv;charset=utf-8,Serie,Tipo,Area,Entrada,Salida\n";
      data.forEach(mov => {
        const serie = mov.autobus?.numero_serie || '';
        const tipo = mov.autobus?.tipo_unidad || '';
        const area = mov.area?.nombre_area || '';
        const entrada = new Date(mov.hora_entrada).toLocaleString();
        const salida = mov.hora_salida ? new Date(mov.hora_salida).toLocaleString() : 'En proceso';
        csvContent += `${serie},${tipo},${area},${entrada},${salida}\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Reporte_SCA_${fechaInicio}_${fechaFin}.csv`);
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch (err) { setError('Error al generar el CSV.'); } 
    finally { setCargando(false); }
  };

  return { fechaInicio, setFechaInicio, fechaFin, setFechaFin, cargando, error, generarPDF, generarCSV };
};