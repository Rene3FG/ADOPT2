// src/lib/logic/useRegistroBloc.js
import { useState, useEffect } from 'react';
import { AutobusRepository } from '../data/repositories/AutobusRepository';
import { apiFetch } from '../data/apiClient';

// Fallback mientras carga GET /tipos-camion (o si la API no responde)
const TIPOS_DEFAULT = ['ADO', 'AU', 'LUJO', 'OCC', 'SUR', 'TXO'];

export const useRegistroBloc = ({ tagNfc = null, onRegistrado = null } = {}) => {
  const [step, setStep] = useState(1);

  const WORKFLOW_ORDER = ['Desfogue', 'Diesel', 'Ad-blue', 'Taller', 'Lavado Interior', 'Lavado Exterior'];

  // Tipos de unidad reales desde la API (bus_types) — antes estaban
  // hardcodeados en el select y faltaban LUJO/SUR/TXO.
  const [tiposUnidad, setTiposUnidad] = useState(TIPOS_DEFAULT);
  useEffect(() => {
    apiFetch('/tipos-camion')
      .then((tipos) => {
        const nombres = (tipos || []).map((t) => t.nombre).filter(Boolean);
        if (nombres.length > 0) setTiposUnidad(nombres);
      })
      .catch(() => {});
  }, []);

  const [formData, setFormData] = useState({
    numeroSerie: '',
    tipoUnidad: 'ADO',
    horaSalida: '',
    conductor: '',
    terminalOrigen: '',
    terminalDestino: '',
    areasRequeridas: {
      'Desfogue': false, 'Diesel': false, 'Ad-blue': false,
      'Taller': false, 'Lavado Interior': false, 'Lavado Exterior': false
    },
    areaInicial: '',
    observaciones: ''
  });

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  // Unidad recién guardada: mientras exista se muestra el modal con su QR
  // imprimible, y el formulario se reinicia hasta que se cierre.
  const [busRegistrado, setBusRegistrado] = useState(null);

  // Sistema de recomendación inteligente
  const getRecommendedArea = () => {
    for (const area of WORKFLOW_ORDER) {
      if (formData.areasRequeridas[area]) {
        return area; 
      }
    }
    const hasSelections = Object.values(formData.areasRequeridas).some(val => val);
    return hasSelections ? 'Espera' : '';
  };

  const areaRecomendada = getRecommendedArea();
  const todasSeleccionadas = WORKFLOW_ORDER.every((area) => formData.areasRequeridas[area]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, areaInicial: areaRecomendada }));
  }, [areaRecomendada]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (area) => {
    setFormData((prev) => ({
      ...prev,
      areasRequeridas: { ...prev.areasRequeridas, [area]: !prev.areasRequeridas[area] }
    }));
  };

  const handleToggleAll = () => {
    const newValue = !todasSeleccionadas;
    const updatedAreas = {};
    WORKFLOW_ORDER.forEach((area) => updatedAreas[area] = newValue);
    setFormData((prev) => ({ ...prev, areasRequeridas: updatedAreas }));
  };

  // Validación para pasar al Paso 2
  const avanzarPaso = (e) => {
    e.preventDefault();
    const tieneAreas = Object.values(formData.areasRequeridas).some(v => v);
    if (!formData.numeroSerie || !formData.horaSalida || !tieneAreas) {
      setError("Por favor llena los campos obligatorios y selecciona al menos un área.");
      return;
    }
    setError('');
    setStep(2);
  };

  const guardarUnidad = async () => {
    setCargando(true);
    setError('');
    setExito(false);

    try {
      // Extraemos solo las áreas que el usuario marcó como true
      const areasSeleccionadas = Object.keys(formData.areasRequeridas).filter(area => formData.areasRequeridas[area]);

      const serieRegistrada = formData.numeroSerie;
      await AutobusRepository.registrarAutobus({
        numeroSerie: serieRegistrada,
        tipoUnidad: formData.tipoUnidad,
        horaSalida: formData.horaSalida,
        conductor: formData.conductor,
        terminalOrigen: formData.terminalOrigen,
        terminalDestino: formData.terminalDestino,
        areasRequeridas: areasSeleccionadas,
        areaInicial: formData.areaInicial || areaRecomendada || 'Espera',
        observaciones: formData.observaciones
      });

      // Llegada por NFC: el tag escaneado queda asociado a la unidad recién
      // registrada, para que los siguientes escaneos la avancen de estación.
      if (tagNfc) {
        await AutobusRepository.registrarTagNfc(tagNfc, serieRegistrada);
      }

      setExito(true);
      setBusRegistrado({ numeroSerie: serieRegistrada, tipoUnidad: formData.tipoUnidad });

    } catch (err) {
      setError('Error al registrar. Verifica que el número de serie no esté duplicado.');
    } finally {
      setCargando(false);
    }
  };

  const cerrarModalQR = () => {
    const serie = busRegistrado?.numeroSerie;
    setBusRegistrado(null);
    setExito(false);
    setStep(1); // Regresamos al paso 1
    setFormData({
      numeroSerie: '', tipoUnidad: 'ADO', horaSalida: '',
      conductor: '', terminalOrigen: '', terminalDestino: '',
      areasRequeridas: { 'Desfogue': false, 'Diesel': false, 'Ad-blue': false, 'Taller': false, 'Lavado Interior': false, 'Lavado Exterior': false },
      areaInicial: '', observaciones: ''
    });
    if (onRegistrado && serie) onRegistrado(serie);
  };

  return {
    step, setStep,
    formData, WORKFLOW_ORDER, areaRecomendada, todasSeleccionadas, tiposUnidad,
    handleInputChange, handleCheckboxChange, handleToggleAll, avanzarPaso,
    cargando, error, exito, guardarUnidad,
    busRegistrado, cerrarModalQR
  };
};