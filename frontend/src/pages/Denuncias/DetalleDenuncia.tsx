import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getDenunciaById,
  subirEvidenciaDenuncia,
} from '@/services/denuncias.api';
// import type { DenunciaListado } from '@/services/denuncias.api'; // Temporalmente deshabilitado
// import SolicitudMedidaModal from './components/SolicitudMedidaModal'; // Temporalmente deshabilitado
import { formatearFechaLarga } from '@/utils/date.utils';
import EvidenciaViewer from '@/components/EvidenciaViewer';
import FileUploader, { type FileMetadata } from '@/components/FileUploader';

export default function DetalleDenuncia() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Estados
  const [denuncia, setDenuncia] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  // const [showSolicitudModal, setShowSolicitudModal] = useState(false); // Temporalmente deshabilitado
  const [nuevosArchivos, setNuevosArchivos] = useState<FileMetadata[]>([]);

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

  // Función para subir múltiples archivos
  const handleUpdateEvidencia = async () => {
    if (!id || nuevosArchivos.length === 0) return;

    try {
      setUploading(true);

      // Subir cada archivo secuencialmente
      for (const fileMetadata of nuevosArchivos) {
        await subirEvidenciaDenuncia(Number(id), fileMetadata.file);
      }

      // Recargar datos para mostrar los nuevos archivos
      await cargarDatos();

      // Limpiar el uploader
      setNuevosArchivos([]);

      alert(`Se subieron ${nuevosArchivos.length} archivo(s) exitosamente.`);
    } catch (error) {
      console.error('Error al subir evidencias:', error);
      alert('Error al subir uno o más archivos. Por favor, inténtalo nuevamente.');
    } finally {
      setUploading(false);
    }
  };

  // --- LÓGICA DE VISUALIZACIÓN ---

  // Helper para obtener propiedades con respaldo
  const getProp = (obj: any, keyCap: string, keyLow: string) => {
    if (!obj) return '';
    return obj[keyCap] || obj[keyLow] || '';
  };

  // Fechas y Textos
  const fechaIngreso = denuncia?.Fecha_Ingreso || denuncia?.fechaCreacion;
  const fechaHechos = denuncia?.Fecha_Inicio || denuncia?.fechaHechos;
  const fechaFinRaw = denuncia?.Fecha_Fin || denuncia?.fechaFin;
  const esRangoFechas = !!fechaFinRaw;
  const relatoCaso = denuncia?.Relato_Hechos || denuncia?.relato;
  const ubicacion = denuncia?.Ubicacion || denuncia?.ubicacion;
  const estadoCaso = denuncia?.estado_denuncia?.Tipo_Estado || denuncia?.estado || 'Pendiente';

  // Usar la utilidad de fechas
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No registrada';
    return formatearFechaLarga(dateString);
  };

  // Datos Denunciante
  const datosDenuncianteObj = denuncia?.denunciante || denuncia;
  const nombreCompletoDenunciante = getProp(datosDenuncianteObj, 'Nombre', 'nombre');
  const rutDenunciante = getProp(datosDenuncianteObj, 'Rut', 'rut');
  const correoDenunciante = getProp(datosDenuncianteObj, 'Correo', 'correo');
  const telefonoDenunciante = getProp(datosDenuncianteObj, 'Telefono', 'telefono');
  const sexoDenunciante = getProp(datosDenuncianteObj, 'sexo', 'sexo');
  const generoDenunciante = getProp(datosDenuncianteObj, 'genero', 'genero');
  const carreraCargoDenunciante = getProp(datosDenuncianteObj, 'carreraCargo', 'Carrera_Cargo') || getProp(datosDenuncianteObj, 'Carrera_Cargo', 'carreraCargo');
  const regionDenunciante = getProp(datosDenuncianteObj, 'region', 'region');
  const comunaDenunciante = getProp(datosDenuncianteObj, 'comuna', 'comuna');
  const direccionDenunciante = getProp(datosDenuncianteObj, 'direccion', 'direccion');

  // Determinar si el denunciante es la víctima
  let esVictima = false;
  let victimaMenor = false;

  if (denuncia?.denunciante?.participantes_caso && Array.isArray(denuncia.denunciante.participantes_caso)) {
    for (const pc of denuncia.denunciante.participantes_caso) {
      if (pc.hitos && Array.isArray(pc.hitos)) {
        for (const hito of pc.hitos) {
          if (hito.Descripcion && typeof hito.Descripcion === 'string') {
            const desc = hito.Descripcion;
            if (desc.includes('Denunciante es la víctima')) {
              esVictima = true;
            }
            if (desc.includes('Víctima es menor de edad') || desc.toLowerCase().includes('menor de edad')) {
              victimaMenor = true;
            }
            if (esVictima && victimaMenor) break;
          }
        }
        if (esVictima && victimaMenor) break;
      }
    }
  }

  // Buscar víctima externa si no es el denunciante
  const todosParticipantes = denuncia?.participante_denuncia || [];
  const denuncianteId = denuncia?.denunciante?.ID || datosDenuncianteObj?.ID;
  let victimaExterna: any = null;

  if (!esVictima) {
    victimaExterna = todosParticipantes.find((p: any) => {
      return p.ID_Persona && (!denuncianteId || p.ID_Persona !== denuncianteId);
    });
  }

  // Datos de víctima
  const nombreVictima = esVictima
    ? nombreCompletoDenunciante
    : (victimaExterna?.persona?.Nombre || 'No identificado');

  const rutVictima = esVictima
    ? rutDenunciante
    : (victimaExterna?.persona?.Rut || null);

  const correoVictima = esVictima
    ? correoDenunciante
    : (victimaExterna?.persona?.Correo || null);

  const telefonoVictima = esVictima
    ? telefonoDenunciante
    : (victimaExterna?.persona?.Telefono || null);

  const sexoVictima = esVictima
    ? sexoDenunciante
    : (victimaExterna?.persona?.sexo || null);

  const generoVictima = esVictima
    ? generoDenunciante
    : (victimaExterna?.persona?.genero || null);

  // Denunciados
  const listaInvolucrados = denuncia?.datos_denunciados || denuncia?.Involucrados || denuncia?.involucrados || [];

  // Testigos
  const nombresDenunciados = new Set(
    listaInvolucrados.map((inv: any) =>
      (inv.Nombre_Ingresado || inv.Nombre || inv.nombre || '').toLowerCase().trim()
    )
  );

  const listaTestigos = todosParticipantes.filter((p: any) => {
    const nombreParticipante = (p.Nombre_PD || p.Nombre || p.nombre || '').toLowerCase().trim();
    return !nombresDenunciados.has(nombreParticipante);
  });

  // Archivos/Evidencias
  const archivosRaw = denuncia?.archivos_denuncia ||
    (denuncia?.denunciante?.participantes_caso?.flatMap((pc: any) =>
      pc.hitos?.flatMap((hito: any) => hito.archivos || []) || []
    ) || []) ||
    denuncia?.Evidencias ||
    denuncia?.evidencias ||
    denuncia?.Archivos ||
    [];

  // Filtrar duplicados por ID_Archivo
  const archivosUnicos = new Map();
  archivosRaw.forEach((arch: any) => {
    const id = arch.ID_Archivo || arch.id;
    if (id && !archivosUnicos.has(id)) {
      archivosUnicos.set(id, arch);
    }
  });
  const listaEvidencias = Array.from(archivosUnicos.values());

  // Solicitudes - Temporalmente deshabilitado
  // const solicitudesDeMedida = denuncia?.solicitudes_medidas || denuncia?.SolicitudesMedidas || [];
  // const tieneSolicitudPendiente = solicitudesDeMedida.some(
  //   (s: any) => s.Estado === 'Pendiente Informe' || s.Estado === 'En Revisión'
  // );

  // Línea de tiempo (actualmente comentado)
  // const pasosProceso = [
  //   { id: 1, nombre: 'Recepción', plazo: 'Día 0', desc: 'Ingreso inmediato', claves: ['pendiente', 'recibida', 'ingresada'] },
  //   { id: 2, nombre: 'Admisibilidad', plazo: '3-5 días hábiles', desc: 'Análisis de forma', claves: ['revisión', 'admisibilidad', 'análisis'] },
  //   { id: 3, nombre: 'Investigación', plazo: 'Hasta 20 días hábiles', desc: 'Indagatoria y Fiscal', claves: ['investigación', 'fiscal', 'sumario'] },
  //   { id: 4, nombre: 'Resolución', plazo: '5-10 días hábiles', desc: 'Sanción o Cierre', claves: ['resuelta', 'cerrada', 'sanción', 'finalizada'] }
  // ];

  // Función para el componente de estado del proceso (actualmente comentado)
  // const getPasoActual = (estado: string) => {
  //   if (!estado) return 0;
  //   const index = pasosProceso.findIndex(p => p.claves.some(k => estado.toLowerCase().includes(k)));
  //   return index !== -1 ? index : 0;
  // };

  // Variables para el componente de estado del proceso (actualmente comentado)
  // const activeStep = getPasoActual(estadoCaso);
  // const diasTranscurridos = fechaIngreso ? Math.floor((new Date().getTime() - new Date(fechaIngreso).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-blue-800 font-medium animate-pulse">
        Cargando información del caso...
      </div>
    );
  }

  if (!denuncia) {
    return (
      <div className="p-10 text-center text-red-600 font-bold border border-red-200 bg-red-50 rounded-lg mx-auto max-w-lg mt-10">
        Error: Denuncia no encontrada.
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-6xl pb-12 px-4 py-8 space-y-6">

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4 pt-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Caso #{denuncia.ID_Denuncia || denuncia.id}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Fecha de Ingreso: {formatDate(fechaIngreso)}
          </p>
          {esRangoFechas ? (
            <p className="text-sm text-gray-600 mt-1">
              Fecha de los hechos: <span className="font-medium">Del {formatDate(fechaHechos)} al {formatDate(fechaFinRaw)}</span>
            </p>
          ) : (
            <p className="text-sm text-gray-600 mt-1">
              Fecha de los hechos: <span className="font-medium">{formatDate(fechaHechos)}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
            {estadoCaso}
          </span>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Volver
          </button>
          {/* BOTÓN SOLICITUD MEDIDA DE RESGUARDO - TEMPORALMENTE OCULTO */}
          {/* <button
            onClick={() => setShowSolicitudModal(true)}
            disabled={tieneSolicitudPendiente}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {tieneSolicitudPendiente ? '⚠️ Solicitud en Proceso' : 'Solicitar Medida de Resguardo'}
          </button> */}
        </div>
      </div>

      {/* --- LÍNEA DE TIEMPO --- */}
      {/* <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
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
      </div> */}

      {/* --- DETALLE --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* COLUMNA IZQUIERDA (8) */}
        <div className="lg:col-span-8 space-y-6">

          {/* 1. CLASIFICACIÓN Y RELATO */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-4 pb-4 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Clasificación del Hecho</h3>
              <p className="text-lg font-semibold text-blue-900">
                {denuncia.tipo_denuncia?.Nombre || denuncia.tipo?.nombre || 'Tipo no especificado'}
              </p>
              <p className="text-gray-600 text-sm mt-1">
                {denuncia.tipo_denuncia?.Area || denuncia.subtipo?.nombre || 'Sin detalle de área'}
              </p>
            </div>

            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Relato de los Hechos</h3>
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 text-sm text-gray-800 whitespace-pre-wrap break-words leading-relaxed max-h-96 overflow-y-auto custom-scrollbar">
              {relatoCaso || 'No hay relato disponible.'}
            </div>
          </div>

          {/* 2. UBICACIÓN - VISUALIZACIÓN DINÁMICA */}
          {(() => {
            // Determinar si es denuncia de Campo Clínico
            // Verificar por tipoId === 3 O si existe detalle_campo_clinico
            const tipoId = denuncia?.ID_TipoDe || denuncia?.tipo_denuncia?.ID_TipoDe;
            const tipoNombre = denuncia?.tipo_denuncia?.Nombre || '';
            const detalleCampoClinico = denuncia?.detalle_campo_clinico || denuncia?.detalleCampoClinico;

            // Es campo clínico si: tipoId === 3, o existe detalle_campo_clinico, o el nombre incluye "Campos Clínicos"
            const esCampoClinico = tipoId === 3 ||
                                   !!detalleCampoClinico ||
                                   tipoNombre.toLowerCase().includes('campos clínicos') ||
                                   tipoNombre.toLowerCase().includes('campo clínico');

            // Si no hay ubicación para mostrar, no renderizar nada
            if (!ubicacion && !detalleCampoClinico) {
              return null;
            }

            if (esCampoClinico) {
              // CASO A: Denuncia de Campo Clínico
              // Intentar usar campos desagregados primero, luego parsear string si no están disponibles
              let nombreEstablecimiento = detalleCampoClinico?.Nombre_Establecimiento || null;
              let direccionEstablecimiento = detalleCampoClinico?.Direccion_Establecimiento || null;
              let regionEstablecimiento = detalleCampoClinico?.Region || null;
              let comunaEstablecimiento = detalleCampoClinico?.Comuna || null;
              let unidadServicio = detalleCampoClinico?.Unidad_Servicio || null;
              let detalleAdicional = null;

              // Si no hay campos desagregados pero sí hay string de ubicación, intentar parsearlo
              if (!detalleCampoClinico && ubicacion) {
                const partes = ubicacion.split(' - ').map((p: string) => p.trim()).filter(Boolean);
                if (partes.length > 0) {
                  // El primer elemento siempre es el nombre del establecimiento
                  nombreEstablecimiento = partes[0] || null;

                  // Para cada parte restante, intentar identificarla
                  for (let i = 1; i < partes.length; i++) {
                    const parte = partes[i];
                    const parteLower = parte.toLowerCase();

                    // Detectar región (contiene "Región" o nombres comunes de regiones)
                    if ((parteLower.includes('región') ||
                         parteLower.includes('region')) &&
                        !regionEstablecimiento) {
                      regionEstablecimiento = parte;
                    }
                    // Detectar unidades/servicios comunes
                    else if ((parteLower.includes('urgencias') ||
                              parteLower.includes('pediatría') ||
                              parteLower.includes('pediatria') ||
                              parteLower.includes('maternidad') ||
                              parteLower.includes('cirugía') ||
                              parteLower.includes('cirugia') ||
                              parteLower.includes('oncología') ||
                              parteLower.includes('oncologia') ||
                              parteLower.includes('servicio') ||
                              parteLower.includes('unidad')) &&
                             !unidadServicio) {
                      unidadServicio = parte;
                    }
                    // Detectar comuna (nombres cortos, típicamente entre región y detalles)
                    else if (!comunaEstablecimiento &&
                             parte.length < 40 &&
                             parte.length > 2 &&
                             !parteLower.includes('región') &&
                             !parteLower.includes('region') &&
                             i < partes.length - 2) {
                      comunaEstablecimiento = parte;
                    }
                    // La penúltima parte suele ser dirección o lugar específico
                    else if (!direccionEstablecimiento && i === partes.length - 2) {
                      direccionEstablecimiento = parte;
                    }
                    // La última parte suele ser detalles adicionales
                    else if (!detalleAdicional && i === partes.length - 1) {
                      detalleAdicional = parte;
                    }
                  }

                  // Si no identificamos comuna pero sí hay regiones conocidas, intentar extraer
                  if (!comunaEstablecimiento && partes.length > 2) {
                    // Buscar entre las partes que no son región ni unidad/servicio
                    for (let i = 1; i < partes.length - 1; i++) {
                      const parte = partes[i];
                      if (parte.toLowerCase() !== regionEstablecimiento?.toLowerCase() &&
                          parte.toLowerCase() !== unidadServicio?.toLowerCase() &&
                          parte.length < 40 && parte.length > 2) {
                        comunaEstablecimiento = parte;
                        break;
                      }
                    }
                  }
                }
              }

              return (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">📍 Ubicación - Campo Clínico</h3>
                  <div className="space-y-3">
                    {nombreEstablecimiento && (
                      <div>
                        <span className="text-xs text-gray-500 font-semibold">🏥 Establecimiento:</span>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {nombreEstablecimiento}
                        </p>
                      </div>
                    )}
                    {direccionEstablecimiento && (
                      <div>
                        <span className="text-xs text-gray-500 font-semibold">📍 Dirección:</span>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {direccionEstablecimiento}
                        </p>
                      </div>
                    )}
                    {(regionEstablecimiento || comunaEstablecimiento) && (
                      <div>
                        <span className="text-xs text-gray-500 font-semibold">🗺️ Comuna/Región:</span>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {[comunaEstablecimiento, regionEstablecimiento].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    )}
                    {unidadServicio && (
                      <div>
                        <span className="text-xs text-gray-500 font-semibold">🩺 Unidad/Servicio:</span>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {unidadServicio}
                        </p>
                      </div>
                    )}
                    {detalleAdicional && (
                      <div>
                        <span className="text-xs text-gray-500 font-semibold">📝 Detalles:</span>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {detalleAdicional}
                        </p>
                      </div>
                    )}
                    {/* Si después de todo no hay nada, mostrar el string original */}
                    {!nombreEstablecimiento && !direccionEstablecimiento && !regionEstablecimiento &&
                     !comunaEstablecimiento && !unidadServicio && !detalleAdicional && ubicacion && (
                      <div>
                        <p className="text-sm font-medium text-gray-900">{ubicacion}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            } else {
              // CASO B: Denuncia General (Convivencia, Género, etc.)
              // Intentar obtener campos desagregados primero
              let sedeNombre = denuncia?.sedeHecho || denuncia?.Sede_Hecho;
              let regionNombre = denuncia?.regionHecho || denuncia?.Region_Hecho;
              let lugarNombre = denuncia?.lugarHecho || denuncia?.Lugar_Hecho;
              let detalleHecho = denuncia?.detalleHecho || denuncia?.Detalle_Hecho;

              // Si no hay campos desagregados pero sí hay string de ubicación, parsearlo
              if (!sedeNombre && !lugarNombre && !detalleHecho && ubicacion) {
                const partes = ubicacion.split(' - ').map((p: string) => p.trim()).filter(Boolean);

                if (partes.length > 0) {
                  // La primera parte generalmente es la Sede (puede incluir dirección)
                  sedeNombre = partes[0] || null;

                  // Extraer región de la sede si está incluida (buscar "Región" o nombres comunes)
                  if (sedeNombre) {
                    const regionMatch = sedeNombre.match(/Región\s+(?:de\s+)?(?:del\s+)?([^-()]+)|(?:Región\s+)?([IVX]+)\s+Región/i);
                    if (regionMatch && !regionNombre) {
                      // Intentar extraer región de la sede
                      const posiblesRegiones = [
                        'Bío-Bío', 'Biobío', 'Bio-Bio', 'Bio Bio',
                        'Ñuble', 'Nuble',
                        'Metropolitana', 'Metropolitana de Santiago',
                        'Valparaíso', 'Valparaiso',
                        'Maule', 'Araucanía', 'Araucania',
                        'Los Lagos', 'Los Ríos', 'Los Rios',
                        'Arica y Parinacota', 'Tarapacá', 'Tarapaca',
                        'Antofagasta', 'Atacama', 'Coquimbo',
                        'O\'Higgins', 'OHiggins',
                        'Aysén', 'Aysen', 'Magallanes'
                      ];

                      posiblesRegiones.forEach(reg => {
                        if (sedeNombre.toLowerCase().includes(reg.toLowerCase()) && !regionNombre) {
                          regionNombre = sedeNombre.match(new RegExp(`[IVX]+\\s*Región\\s*(?:de\\s*)?(?:del\\s*)?${reg}`, 'i'))?.[0] ||
                                         sedeNombre.match(new RegExp(reg, 'i'))?.[0] ||
                                         null;
                        }
                      });
                    }
                  }

                  // Si hay más de una parte, la segunda generalmente es el Lugar Específico
                  if (partes.length > 1) {
                    lugarNombre = partes[1] || null;
                  }

                  // Si hay más de dos partes, las últimas partes pueden ser Detalles Adicionales
                  if (partes.length > 2) {
                    detalleHecho = partes.slice(2).join(' - ') || null;
                  }
                }
              }

              // Si aún no tenemos región, intentar buscar en el string completo
              if (!regionNombre && ubicacion) {
                const regionMatch = ubicacion.match(/([IVX]+\s*Región\s*(?:de\s+)?(?:del\s+)?[^-()]+)/i);
                if (regionMatch) {
                  regionNombre = regionMatch[1].trim();
                } else {
                  // Buscar nombres comunes de regiones
                  const posiblesRegiones = [
                    { pattern: /(VIII|8)\s*Región\s*(?:de\s+)?(?:del\s+)?(Bío-Bío|Biobío|Bio-Bio)/i, nombre: 'VIII Región del Bío-Bío' },
                    { pattern: /(XVI|16)\s*Región\s*(?:de\s+)?(Ñuble|Nuble)/i, nombre: 'XVI Región de Ñuble' },
                    { pattern: /(XIII|13)\s*Región\s*(?:de\s+)?(?:del\s+)?(Metropolitana|Metropolitana de Santiago)/i, nombre: 'Región Metropolitana' },
                    { pattern: /(V|5)\s*Región\s*(?:de\s+)?(Valparaíso|Valparaiso)/i, nombre: 'V Región de Valparaíso' },
                  ];

                  for (const reg of posiblesRegiones) {
                    if (reg.pattern.test(ubicacion)) {
                      regionNombre = reg.nombre;
                      break;
                    }
                  }
                }
              }

              return (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">📍 Ubicación</h3>
                  <div className="space-y-3">
                    {sedeNombre && (
                      <div>
                        <span className="text-xs text-gray-500 font-semibold">🏫 Sede:</span>
                        <p className="text-sm font-medium text-gray-900 mt-1">{sedeNombre}</p>
                      </div>
                    )}

                    {regionNombre && (
                      <div>
                        <span className="text-xs text-gray-500 font-semibold">🗺️ Región:</span>
                        <p className="text-sm font-medium text-gray-900 mt-1">{regionNombre}</p>
                      </div>
                    )}

                    {lugarNombre && (
                      <div>
                        <span className="text-xs text-gray-500 font-semibold">📍 Lugar Específico:</span>
                        <p className="text-sm font-medium text-gray-900 mt-1">{lugarNombre}</p>
                      </div>
                    )}

                    {detalleHecho && (
                      <div>
                        <span className="text-xs text-gray-500 font-semibold">📝 Detalles Adicionales:</span>
                        <p className="text-sm font-medium text-gray-900 mt-1">{detalleHecho}</p>
                      </div>
                    )}

                    {/* Si después de parsear no hay nada, mostrar el string completo de ubicación */}
                    {!sedeNombre && !regionNombre && !lugarNombre && !detalleHecho && ubicacion && (
                      <div>
                        <p className="text-sm font-medium text-gray-900">{ubicacion}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          })()}

          {/* 3. PERSONAS DENUNCIADAS */}
          {listaInvolucrados.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden">
              <div className="bg-orange-50 px-6 py-3 border-b border-orange-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-orange-800 uppercase">⚠️ Personas Denunciadas</h3>
                <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full font-bold">
                  {listaInvolucrados.length} Persona(s)
                </span>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4">
                  {listaInvolucrados.map((inv: any, idx: number) => {
                    const nombreCompleto = inv.persona?.Nombre
                      ? inv.persona.Nombre.trim()
                      : (inv.Nombre_Ingresado || inv.Nombre || inv.nombre || 'Sin Nombre').trim();
                    const estaIdentificado = !!(inv.ID_Persona || inv.persona);

                    return (
                      <div
                        key={idx}
                        className="border border-orange-100 bg-white p-4 rounded-lg shadow-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div className="w-full">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-gray-900 text-base">
                                {nombreCompleto} {inv.Apellido1 || ''}
                              </p>
                              {estaIdentificado && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                                  ✓ Identificado
                                </span>
                              )}
                              {!estaIdentificado && (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">
                                  Sin identificar
                                </span>
                              )}
                            </div>

                            {estaIdentificado && inv.persona && (
                              <div className="mt-2 bg-green-50 border border-green-200 rounded p-2 text-xs">
                                <p><span className="font-semibold">RUT:</span> {inv.persona.Rut || 'N/A'}</p>
                                {inv.persona.Correo && <p><span className="font-semibold">Correo:</span> {inv.persona.Correo}</p>}
                                {inv.persona.Telefono && <p><span className="font-semibold">Teléfono:</span> {inv.persona.Telefono}</p>}
                              </div>
                            )}

                            {(inv.persona?.sexo || inv.persona?.genero) && (
                              <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-2 text-xs">
                                {inv.persona?.sexo && (
                                  <p><span className="font-semibold">Sexo:</span> {inv.persona.sexo}</p>
                                )}
                                {inv.persona?.genero && (
                                  <p><span className="font-semibold">Género:</span> {
                                    inv.persona.genero === 'NoLoSe' ? 'No lo sé' :
                                    inv.persona.genero === 'NoBinario' ? 'No Binario' :
                                    inv.persona.genero
                                  }</p>
                                )}
                              </div>
                            )}

                            {(inv.Descripcion || inv.descripcion) ? (
                              <p className="text-sm text-gray-700 mt-2 bg-orange-50/50 p-2 rounded border border-orange-100 whitespace-pre-wrap">
                                {inv.Descripcion || inv.descripcion}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-600 mt-1">
                                <span className="font-semibold">Vinculación:</span> {inv.Vinculacion || inv.vinculacion || 'No especificada'}
                              </p>
                            )}
                          </div>
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded ml-2 whitespace-nowrap">
                            Sindicado #{idx + 1}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 4. TESTIGOS */}
          {listaTestigos.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">👀 Testigos</h3>
              <ul className="space-y-3">
                {listaTestigos.map((t: any, idx: number) => (
                  <li
                    key={idx}
                    className="text-sm border-b border-gray-100 last:border-0 pb-2"
                  >
                    <span className="font-bold text-gray-700 block">{t.Nombre_PD || t.Nombre || t.nombre}</span>
                    <span className="text-xs text-gray-500 block mt-0.5">
                      {t.Contacto ? `Contacto: ${t.Contacto}` : 'Participante registrado'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 5. ARCHIVOS CON PREVISUALIZACIÓN */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">📎 Archivos y Evidencias</h3>
            {listaEvidencias.length > 0 ? (
              <div className="space-y-4 mb-6">
                {listaEvidencias.map((arch: any, i: number) => (
                  <EvidenciaViewer key={arch.ID_Archivo || i} archivo={arch} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic mb-6">No se adjuntaron archivos.</p>
            )}

            {/* SECCIÓN: AGREGAR NUEVA EVIDENCIA */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-sm font-bold text-gray-700 mb-4">Agregar Nueva Evidencia</h4>
              <FileUploader
                onFilesChange={setNuevosArchivos}
                maxFiles={10}
                maxSizeMB={200}
                disabled={uploading}
              />

              {nuevosArchivos.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleUpdateEvidencia}
                    disabled={uploading || nuevosArchivos.length === 0}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium shadow-sm hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Guardar/Subir Evidencias ({nuevosArchivos.length})
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (4) */}
        <div className="lg:col-span-4 space-y-6">

          {/* CARD: DENUNCIANTE */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-sm">👤 Datos Denunciante</h3>
              {(denuncia.reservaIdentidad || denuncia.ReservaIdentidad) && (
                <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                  CONFIDENCIAL
                </span>
              )}
            </div>
            <div className="p-5 text-sm space-y-4">
              {(denuncia.anonimo || denuncia.Anonimo) ? (
                <div className="text-center py-4 bg-gray-50 rounded text-gray-500 italic">
                  Denuncia Anónima
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Nombre Completo</label>
                    <p className="font-medium text-gray-900">{nombreCompletoDenunciante || 'No especificado'}</p>
                    {rutDenunciante && (
                      <p className="text-xs text-gray-500 font-mono mt-1">{rutDenunciante}</p>
                    )}
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <label className="text-xs text-gray-400 uppercase font-bold block mb-1">RUT</label>
                    <p className="font-mono text-sm font-medium text-gray-900">{rutDenunciante || 'No especificado'}</p>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Contacto</label>
                    {correoDenunciante && (
                      <p className="text-gray-700 break-words">{correoDenunciante}</p>
                    )}
                    {telefonoDenunciante && (
                      <p className="text-gray-700">{telefonoDenunciante}</p>
                    )}
                    {!correoDenunciante && !telefonoDenunciante && (
                      <p className="text-gray-400 italic text-xs">No disponible</p>
                    )}
                  </div>
                  {(sexoDenunciante || generoDenunciante) && (
                    <div className="pt-2 border-t border-gray-100">
                      <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Sexo y Género</label>
                      {sexoDenunciante && (
                        <p className="text-gray-700 text-xs">Sexo: {sexoDenunciante}</p>
                      )}
                      {generoDenunciante && (
                        <p className="text-gray-700 text-xs">Género: {generoDenunciante}</p>
                      )}
                    </div>
                  )}
                  {carreraCargoDenunciante && (
                    <div className="pt-2 border-t border-gray-100">
                      <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Carrera o Cargo</label>
                      <p className="text-gray-700 text-xs">{carreraCargoDenunciante}</p>
                    </div>
                  )}
                  {(regionDenunciante || comunaDenunciante || direccionDenunciante) && (
                    <div className="pt-2 border-t border-gray-100">
                      <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Ubicación</label>
                      {(regionDenunciante || comunaDenunciante) && (
                        <p className="text-gray-700 text-xs">
                          <strong>Región:</strong> {regionDenunciante || 'No especificada'}
                          {comunaDenunciante && <>, <strong>Comuna:</strong> {comunaDenunciante}</>}
                        </p>
                      )}
                      {direccionDenunciante && (
                        <p className="text-gray-700 text-xs"><strong>Domicilio:</strong> {direccionDenunciante}</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* CARD: VÍCTIMA */}
          <div className={`rounded-xl shadow-sm border overflow-hidden ${victimaMenor ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}>
            <div className={`px-5 py-3 border-b flex justify-between items-center ${victimaMenor ? 'bg-red-100 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
              <h3 className={`font-bold text-sm ${victimaMenor ? 'text-red-800' : 'text-gray-800'}`}>
                🛡️ Datos de la Víctima
              </h3>
              {victimaMenor && (
                <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-1 rounded shadow-sm">
                  MENOR DE EDAD
                </span>
              )}
            </div>
            <div className="p-5 text-sm space-y-4">
              {esVictima && !(denuncia.anonimo || denuncia.Anonimo) ? (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <p className="text-xs text-blue-800 font-semibold">
                      ℹ️ El denunciante declara ser la víctima.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Nombre Completo</label>
                      <p className="font-medium text-gray-900">{nombreVictima || 'No disponible'}</p>
                      {rutVictima && (
                        <p className="text-xs text-gray-500 font-mono mt-1">{rutVictima}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase font-bold block mb-1">RUT</label>
                      <p className="font-mono text-sm font-medium text-gray-900">{rutVictima || 'No disponible'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Correo Electrónico</label>
                      <p className="text-gray-700 break-words">{correoVictima || 'No informado'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Teléfono</label>
                      <p className="text-gray-700">{telefonoVictima || 'No informado'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Género</label>
                      <p className="text-gray-700">{generoVictima || 'No informado'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Sexo</label>
                      <p className="text-gray-700">{sexoVictima || 'No informado'}</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Nombre Completo</label>
                      <p className="font-medium text-gray-900">{nombreVictima || 'No identificado'}</p>
                      {rutVictima && (
                        <p className="text-xs text-gray-500 font-mono mt-1">{rutVictima}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase font-bold block mb-1">RUT</label>
                      <p className="font-mono text-sm font-medium text-gray-900">{rutVictima || 'No informado'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Correo Electrónico</label>
                      <p className="text-gray-700 break-words">{correoVictima || 'No informado'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Teléfono</label>
                      <p className="text-gray-700">{telefonoVictima || 'No informado'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Género</label>
                      <p className="text-gray-700">{generoVictima || 'No informado'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Sexo</label>
                      <p className="text-gray-700">{sexoVictima || 'No informado'}</p>
                    </div>
                  </div>
                  {!rutVictima && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                      <p className="text-xs text-yellow-800">
                        ⚠️ <strong>Nota:</strong> La víctima aún no ha sido completamente identificada en el sistema.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* SECCIÓN DE MEDIDAS - TEMPORALMENTE OCULTA */}
          {/* {(denuncia.solicitaMedidas || denuncia.SolicitaMedidas) && (
            <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-yellow-200">
                <h3 className="font-bold text-yellow-900 text-sm">✋ Medidas Solicitadas</h3>
              </div>
              <div className="p-5 text-sm text-gray-800 italic bg-white/50">
                "{denuncia.detalleMedidas || denuncia.DetalleMedidas || 'Sin detalle adicional'}"
              </div>
            </div>
          )} */}
        </div>
      </div>

      {/* MODAL DE SOLICITUD DE MEDIDA - TEMPORALMENTE OCULTO */}
      {/* {denuncia && (
        <SolicitudMedidaModal
          idDenuncia={denuncia.ID_Denuncia}
          isOpen={showSolicitudModal}
          onClose={() => setShowSolicitudModal(false)}
          onSuccess={() => {
            cargarDatos();
            setShowSolicitudModal(false);
          }}
        />
      )} */}
    </section>
  );
}
