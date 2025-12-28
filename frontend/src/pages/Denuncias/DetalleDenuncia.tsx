import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Importamos funciones del API (asegúrate que la ruta sea correcta)
import { 
  getDenunciaById, 
  subirEvidenciaDenuncia,
} from '@/services/denuncias.api'; 

import type { DenunciaListado } from '@/services/denuncias.api';
import SolicitudMedidaModal from './components/SolicitudMedidaModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DetalleDenuncia() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados
  const [denuncia, setDenuncia] = useState<DenunciaListado | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showSolicitudModal, setShowSolicitudModal] = useState(false); // Estado para el modal

  // Carga inicial
  useEffect(() => {
    if (id) cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await getDenunciaById(Number(id));
      setDenuncia(data);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Subida de archivos
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    try {
      setUploading(true);
      await subirEvidenciaDenuncia(Number(id), file);
      await cargarDatos(); 
      alert('Evidencia agregada exitosamente.');
    } catch (error) {
      console.error(error);
      alert('Error al subir el archivo.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- LÓGICA DE VISUALIZACIÓN ---

  // 1. Fechas y Textos (Con respaldos por si cambia el nombre en BD)
  const fechaIngreso = denuncia?.Fecha_Ingreso || denuncia?.fechaCreacion // Fecha de ingreso al sistema
  const fechaHechos = denuncia?.Fecha_Inicio || denuncia?.fechaHechos // Fecha de los hechos
  const fechaFinRaw = denuncia?.Fecha_Fin // Fecha fin del rango (opcional)
  const esRangoFechas = !!fechaFinRaw // Si hay Fecha_Fin, es un rango
  const relato = denuncia?.Relato_Hechos 
  const ubicacion = denuncia?.Ubicacion 

  const formatearFecha = (f?: string) => {
    if (!f) return '-';
    try { return format(new Date(f), "dd 'de' MMMM, yyyy", { locale: es }); }
    catch (e) { return f; }
  };

  // 2. Participantes y Archivos
  const denunciante = denuncia?.participante_denuncia?.find(p => p.Tipo_Participante === 'DENUNCIANTE');
  const denunciado = denuncia?.participante_denuncia?.find(p => p.Tipo_Participante === 'DENUNCIADO');
  const archivos = denuncia?.archivos_denuncia || [];
  
  // 3. Estado de la Solicitud (Para habilitar/deshabilitar botón)
  const tieneSolicitudPendiente = denuncia?.solicitudes_medidas?.some(
    s => s.Estado === 'Pendiente Informe' || s.Estado === 'En Revisión'
  );

  // 4. Línea de Tiempo (Con Plazos Reglamentarios)
  const estadoTexto = denuncia?.estado_denuncia?.Tipo_Estado || 'Pendiente';
  
  const pasosProceso = [
    { id: 1, nombre: 'Recepción', plazo: 'Día 0', desc: 'Ingreso inmediato', claves: ['pendiente', 'recibida', 'ingresada'] },
    { id: 2, nombre: 'Admisibilidad', plazo: '3-5 días hábiles', desc: 'Análisis de forma', claves: ['revisión', 'admisibilidad', 'análisis'] },
    { id: 3, nombre: 'Investigación', plazo: 'Hasta 20 días hábiles', desc: 'Indagatoria y Fiscal', claves: ['investigación', 'fiscal', 'sumario'] },
    { id: 4, nombre: 'Resolución', plazo: '5-10 días hábiles', desc: 'Sanción o Cierre', claves: ['resuelta', 'cerrada', 'sanción', 'finalizada'] }
  ];

  const getPasoActual = (estado: string) => {
    if (!estado) return 0;
    const index = pasosProceso.findIndex(p => p.claves.some(k => estado.toLowerCase().includes(k)));
    return index !== -1 ? index : 0;
  };
  
  const activeStep = getPasoActual(estadoTexto);
  const diasTranscurridos = fechaIngreso ? Math.floor((new Date().getTime() - new Date(fechaIngreso).getTime()) / (1000 * 60 * 60 * 24)) : 0;


  if (loading) return <div className="p-12 text-center text-gray-500">Cargando información...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 font-sans bg-gray-50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Denuncia #{denuncia?.ID_Denuncia}</h1>
          <p className="text-gray-500 mt-1">Ingresada el {formatearFecha(fechaIngreso)}</p>
          {esRangoFechas ? (
            <p className="text-sm text-gray-600 mt-1">
              Fecha de los hechos: <span className="font-medium">Del {formatearFecha(fechaHechos)} al {formatearFecha(fechaFinRaw)}</span>
            </p>
          ) : (
            <p className="text-sm text-gray-600 mt-1">
              Fecha de los hechos: <span className="font-medium">{formatearFecha(fechaHechos)}</span>
            </p>
          )}
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
           <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Volver</button>
           
           {/* BOTÓN SOLICITUD DE MEDIDA */}
           <button 
             onClick={() => setShowSolicitudModal(true)}
             disabled={tieneSolicitudPendiente}
             className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
           >
             {tieneSolicitudPendiente ? '⚠️ Solicitud en Proceso' : 'Solicitar Medida de Resguardo'}
           </button>
        </div>
      </div>

      {/* LÍNEA DE TIEMPO */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
         <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
             <div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Estado del Proceso</h3>
                <p className="text-xs text-gray-500 mt-1">Tiempo transcurrido: <span className="font-semibold text-indigo-600">{diasTranscurridos} días</span></p>
             </div>
             <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-200">Reglamento DUE 4560 / 5415</span>
         </div>

         <div className="relative mx-4">
            <div className="absolute top-5 left-0 w-full h-1 bg-gray-100 -z-0 rounded"></div>
            <div className="absolute top-5 left-0 h-1 bg-indigo-600 -z-0 rounded transition-all duration-700" style={{ width: `${(activeStep / (pasosProceso.length - 1)) * 100}%` }}></div>
            
            <div className="flex justify-between relative z-10">
                {pasosProceso.map((paso, idx) => {
                   const isActive = idx === activeStep;
                   const isCompleted = idx < activeStep;
                   return (
                   <div key={paso.id} className="flex flex-col items-center w-32 text-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 bg-white transition-all
                         ${isCompleted ? 'bg-indigo-600 border-indigo-600 text-white' : ''}
                         ${isActive ? 'border-indigo-600 text-indigo-600 ring-4 ring-indigo-50 scale-110' : 'border-gray-300 text-gray-400'}
                      `}>{isCompleted ? '✓' : idx + 1}</div>
                      <div className="mt-3">
                          <span className={`text-sm font-bold block ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>{paso.nombre}</span>
                          <span className="text-xs font-semibold text-indigo-600 block">{paso.plazo}</span>
                      </div>
                   </div>
                   );
                })}
            </div>
         </div>
         <div className="mt-6 bg-blue-50 p-3 rounded text-xs text-blue-800 flex gap-2">
            <span>ℹ️</span> <p>Plazos en días hábiles administrativos. La etapa de investigación puede prorrogarse según complejidad.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="space-y-6">
           <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">📋 Hechos</h3>
              <div className="space-y-4">
                  <div><span className="text-xs font-bold text-gray-400 uppercase">Ubicación</span><p className="text-sm font-medium text-gray-900">{ubicacion || 'No especificada'}</p></div>
                  <div><span className="text-xs font-bold text-gray-400 uppercase">Relato</span><div className="mt-1 bg-gray-50 p-3 rounded-lg text-sm text-gray-700 italic border border-gray-100">"{relato}"</div></div>
              </div>
           </section>

           <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">👤 Denunciante</h3>
              {denunciante ? (
                 <ul className="text-sm space-y-3">
                    <li className="flex justify-between"><span className="text-gray-500">Nombre:</span> <span className="font-medium">{denunciante.Nombre}</span></li>
                    <li className="flex justify-between"><span className="text-gray-500">RUT:</span> <span className="font-medium">{denunciante.Rut}</span></li>
                    <li className="flex justify-between"><span className="text-gray-500">Estamento:</span> <span className="font-medium">{denunciante.Estamento}</span></li>
                 </ul>
              ) : <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">Identidad Reservada</span>}
           </section>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="space-y-6">
           <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-red-800 mb-4 pb-2 border-b border-red-100">🚫 Denunciado</h3>
              {denunciado ? (
                 <div><p className="text-lg font-medium text-gray-900">{denunciado.Nombre}</p><p className="text-sm text-gray-500">{denunciado.Estamento}</p></div>
              ) : <p className="text-sm text-gray-500 italic">No individualizado</p>}
           </section>

           <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">📂 Evidencias</h3>
              <div className="space-y-3 mb-6">
                 {archivos.length > 0 ? archivos.map((arch: any, idx: number) => (
                    <a key={idx} href={arch.Ruta_Archivo || arch.archivo} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded transition-colors group">
                       <span className="text-xl">📄</span>
                       <span className="text-sm text-blue-600 font-medium group-hover:underline truncate">{arch.Nombre_Archivo || `Archivo ${idx + 1}`}</span>
                    </a>
                 )) : <p className="text-sm text-gray-400 italic">No hay archivos adjuntos.</p>}
              </div>
              <div className="border-t border-gray-100 pt-4">
                 <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Subir nueva evidencia</label>
                 <div className="flex items-center gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} disabled={uploading} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                    {uploading && <span className="text-xs text-indigo-600 font-medium animate-pulse">Subiendo...</span>}
                 </div>
              </div>
           </section>
        </div>
      </div>

      {/* ✅ CORRECCIÓN: IMPLEMENTACIÓN DEL MODAL EXACTAMENTE COMO EN EL CÓDIGO ANTIGUO */}
      {denuncia && (
        <SolicitudMedidaModal
          idDenuncia={denuncia.ID_Denuncia} // Usamos 'idDenuncia' como pediste
          isOpen={showSolicitudModal}       // Usamos 'isOpen'
          onClose={() => setShowSolicitudModal(false)}
          onSuccess={() => {
            cargarDatos();
            setShowSolicitudModal(false);
          }}
        />
      )}
    </div>
  );
}