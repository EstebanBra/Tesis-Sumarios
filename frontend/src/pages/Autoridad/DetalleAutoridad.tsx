import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDenunciaById } from '@/services/denuncias.api'
import { useAuth } from '@/context/AuthContext'
import DerivacionAutoridadModal, { type DestinoDerivacion } from './components/DerivacionAutoridadModal'
import SolicitudFiscaliaModal from './components/SolicitudFiscaliaModal'
import InstruirInvestigacionModal from './components/InstruirInvestigacionModal'
import ModalDetalleDenunciado from '@/components/modals/ModalDetalleDenunciado'
import ModalDetalleTestigo from '@/components/modals/ModalDetalleTestigo'
import EvidenciaViewer from '@/components/EvidenciaViewer'

export default function DetalleAutoridad() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { hasRole } = useAuth()

    const [denuncia, setDenuncia] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)
    const [showSolicitudFiscalia, setShowSolicitudFiscalia] = useState(false)
    const [showDerivacion, setShowDerivacion] = useState(false)
    const [showInstruirInvestigacion, setShowInstruirInvestigacion] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [selectedDenunciado, setSelectedDenunciado] = useState<any | null>(null)
    const [showModalDenunciado, setShowModalDenunciado] = useState(false)
    const [selectedTestigo, setSelectedTestigo] = useState<any | null>(null)
    const [showModalTestigo, setShowModalTestigo] = useState(false)

    // Determinar autoridad actual
    const autoridadActual = (hasRole('VRA') ? 'VRA' : 'VRAE') as 'VRA' | 'VRAE'

    useEffect(() => {
        if (!id) return
        cargarDatos()
    }, [id])

    async function cargarDatos() {
        try {
            const data = await getDenunciaById(Number(id))
            setDenuncia(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // Handler para derivar a otra autoridad o Dirgegen
    const handleDerivacion = async (observacion: string, destino: DestinoDerivacion) => {
        if (!denuncia) return
        try {
            setProcessing(true)
            const idDenuncia = denuncia.ID_Denuncia;

            // Mapear destino a nuevoTipoId
            // 301 = VRA General, 302 = Casos Clínicos, 303 = Dirgegen
            let nuevoTipoId: number;
            let mensajeExito: string;

            if (destino === 'Dirgegen') {
                nuevoTipoId = 303; // Tipo para derivación a Dirgegen
                mensajeExito = 'Denuncia derivada exitosamente a Dirgegen.';
            } else if (destino === 'VRA') {
                nuevoTipoId = 301; // VRA General (por defecto)
                mensajeExito = 'Denuncia derivada exitosamente a VRA.';
            } else {
                nuevoTipoId = 301; // VRA General (VRAE deriva a VRA)
                mensajeExito = 'Denuncia derivada exitosamente a VRA.';
            }

            // Usar la función gestionarDenuncia que ya existe
            const { gestionarDenuncia } = await import('@/services/denuncias.api');
            await gestionarDenuncia(idDenuncia, {
                observacion,
                nuevoEstadoId: 3, // Estado "Derivada"
                nuevoTipoId
            })

            setShowDerivacion(false)
            alert(mensajeExito)
            navigate('/autoridad/bandeja')
        } catch (error) {
            console.error(error)
            alert('Error al derivar')
        } finally {
            setProcessing(false)
        }
    }

    const getProp = (obj: any, keyCap: string, keyLow: string) => {
        if (!obj) return '';
        return obj[keyCap] || obj[keyLow] || '';
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return 'No registrada';
        return new Date(dateString).toLocaleDateString('es-CL', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) return (
        <div className="flex h-64 items-center justify-center text-blue-800 font-medium animate-pulse">
            Cargando información del caso...
        </div>
    )

    if (!denuncia) return (
        <div className="p-10 text-center text-red-600 font-bold border border-red-200 bg-red-50 rounded-lg mx-auto max-w-lg mt-10">
            Error: Denuncia no encontrada.
        </div>
    )

    // Leer datos de denunciados
    const listaInvolucrados = denuncia.datos_denunciados || denuncia.Involucrados || denuncia.involucrados || [];

    // Testigos: filtrar participantes que NO están en datos_denunciados
    const todosParticipantes = denuncia.participante_denuncia || denuncia.Testigos || denuncia.testigos || [];
    const nombresDenunciados = new Set(
        listaInvolucrados.map((inv: any) =>
            (inv.Nombre_Ingresado || inv.Nombre || inv.nombre || '').toLowerCase().trim()
        )
    );

    // Filtrar: testigos son los que NO están en datos_denunciados
    const listaTestigos = todosParticipantes.filter((p: any) => {
        const nombreParticipante = (p.Nombre_PD || p.Nombre || p.nombre || '').toLowerCase().trim();
        return !nombresDenunciados.has(nombreParticipante);
    });

    // Extraer archivos de la estructura anidada o del campo plano, filtrando duplicados
    const archivosRaw = denuncia.archivos_denuncia ||
      (denuncia.denunciante?.participantes_caso?.flatMap((pc: any) =>
        pc.hitos?.flatMap((hito: any) => hito.archivos || []) || []
      ) || []) ||
      denuncia.Evidencias ||
      denuncia.evidencias ||
      denuncia.Archivos ||
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

    // Normalización de Datos Principales
    const idCaso = denuncia.ID_Denuncia || denuncia.id;
    const fechaIngreso = denuncia.Fecha_Ingreso || denuncia.fechaCreacion;
    const fechaHechos = denuncia.Fecha_Inicio || denuncia.fechaHechos;
    const fechaFinCaso = denuncia.Fecha_Fin || denuncia.fechaFin;
    const esRangoFechas = !!fechaFinCaso;
    const relatoCaso = denuncia.Relato_Hechos || denuncia.relato;
    const estadoCaso = denuncia.estado_denuncia?.Tipo_Estado || denuncia.estado || 'Pendiente';

    // Datos Denunciante: Si existe denuncia.denunciante, usar esos datos (persona con RUT reconocido)
    const datosDenuncianteObj = denuncia.denunciante || denuncia;
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


    // Determinar si el denunciante es la víctima buscando en los hitos
    let esVictima = false;
    let victimaMenor = false;

    if (denuncia.denunciante?.participantes_caso && Array.isArray(denuncia.denunciante.participantes_caso)) {
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

    // Si no es víctima, buscar víctima externa en participantes
    let victimaExterna: any = null;
    const denuncianteId = denuncia.denunciante?.ID || datosDenuncianteObj?.ID;

    if (!esVictima) {
      victimaExterna = todosParticipantes.find((p: any) => {
        return p.ID_Persona && (!denuncianteId || p.ID_Persona !== denuncianteId);
      });
    }

    // Datos finales para mostrar
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

    // Verificar si la denuncia fue derivada y tiene observación
    const observacionDerivacion = denuncia.observacionDirgegen;
    const fueDerivada = denuncia.tipo_denuncia?.ID_TipoDe === 301 || denuncia.tipo_denuncia?.ID_TipoDe === 302 || denuncia.tipo_denuncia?.ID_TipoDe === 303;

    // Verificar si se puede instruir investigación (habilitado solo si ya tiene recomendación de fiscalía)
    const puedeInstruirInvestigacion = denuncia?.estado_denuncia?.Tipo_Estado === 'Recomendación Recibida' ||
        denuncia?.estado_denuncia?.Tipo_Estado === 'En Investigación'

    // Handler para solicitar recomendación a fiscalía
    const handleSolicitudFiscalia = async (fundamentos: string) => {
        if (!denuncia) return
        try {
            setProcessing(true)
            // TODO: Implementar llamada al backend
            console.log('Solicitar recomendación a fiscalía:', { id: denuncia.ID_Denuncia, fundamentos })

            setShowSolicitudFiscalia(false)
            alert('Solicitud enviada a Fiscalía exitosamente (funcionalidad pendiente)')
            navigate('/autoridad/bandeja')
        } catch (error) {
            console.error(error)
            alert('Error al enviar solicitud')
        } finally {
            setProcessing(false)
        }
    }

    // Handler para instruir investigación sumaria
    const handleInstruirInvestigacion = async (fiscalDesignado: string, observaciones: string) => {
        if (!denuncia) return
        try {
            setProcessing(true)
            // TODO: Implementar llamada al backend
            console.log('Instruir investigación sumaria:', {
                id: denuncia.ID_Denuncia,
                fiscalDesignado,
                observaciones
            })

            setShowInstruirInvestigacion(false)
            alert('Investigación sumaria instruida exitosamente (funcionalidad pendiente)')
            navigate('/autoridad/bandeja')
        } catch (error) {
            console.error(error)
            alert('Error al instruir investigación')
        } finally {
            setProcessing(false)
        }
    }

    return (
        <section className="mx-auto max-w-6xl pb-12 px-4 py-8 space-y-6">

            {/* --- BANNER DE OBSERVACIÓN DE DERIVACIÓN (si fue derivada) --- */}
            {fueDerivada && observacionDerivacion && (
                <div className="rounded-lg border border-blue-300 bg-blue-50 p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-blue-900 mb-1">
                                Esta denuncia fue derivada a {denuncia.tipo_denuncia?.Nombre || 'VRA'}
                            </h3>
                            <p className="text-sm text-blue-800">
                                <strong>Observación de derivación:</strong> {observacionDerivacion}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4 pt-2">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Caso #{idCaso}</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Fecha de Ingreso: {formatDate(fechaIngreso)}
                    </p>
                    {esRangoFechas ? (
                        <p className="text-sm text-gray-600 mt-1">
                            Fecha de los hechos: <span className="font-medium">Del {formatDate(fechaHechos)} al {formatDate(fechaFinCaso)}</span>
                        </p>
                    ) : (
                        <p className="text-sm text-gray-600 mt-1">
                            Fecha de los hechos: <span className="font-medium">{formatDate(fechaHechos)}</span>
                        </p>
                    )}
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
                    {estadoCaso}
                </span>
            </div>

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
                            {relatoCaso}
                        </div>
                </div>

                    {/* 2. PERSONAS DENUNCIADAS */}
                    <div className="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden">
                        <div className="bg-orange-50 px-6 py-3 border-b border-orange-100 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-orange-800 uppercase">⚠️ Personas Denunciadas</h3>
                            <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full font-bold">
                                {listaInvolucrados.length} Persona(s)
                            </span>
                        </div>
                        <div className="p-6">
                            {listaInvolucrados.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {listaInvolucrados.map((inv: any, idx: number) => {
                                        // Si está identificado, priorizar el nombre de persona.Nombre, sino usar Nombre_Ingresado
                                        const nombreCompleto = inv.persona?.Nombre
                                          ? inv.persona.Nombre.trim()
                                          : (inv.Nombre_Ingresado || inv.Nombre || inv.nombre || 'Sin Nombre').trim()
                                        const estaIdentificado = !!(inv.ID_Persona || inv.persona)

                                        return (
                                            <div
                                                key={idx}
                                                className="border border-orange-100 bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:bg-orange-50 hover:border-orange-300 transition-all"
                                                onClick={() => {
                                                    setSelectedDenunciado(inv)
                                                    setShowModalDenunciado(true)
                                                }}
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

                                                        {/* Mostrar datos de persona si está identificado */}
                                                        {estaIdentificado && inv.persona && (
                                                            <div className="mt-2 bg-green-50 border border-green-200 rounded p-2 text-xs">
                                                                <p><span className="font-semibold">RUT:</span> {inv.persona.Rut || 'N/A'}</p>
                                                                {inv.persona.Correo && <p><span className="font-semibold">Correo:</span> {inv.persona.Correo}</p>}
                                                                {inv.persona.Telefono && <p><span className="font-semibold">Teléfono:</span> {inv.persona.Telefono}</p>}
                                                            </div>
                                                        )}

                                                        {/* Mostrar información de identidad de género si existe */}
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

                                                        {/* Mostrar descripción completa */}
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

                                                {/* Compatibilidad con campos antiguos si existieran */}
                                                {(inv.DescripcionFisica || inv.descripcionFisica) && !inv.Descripcion && (
                                                    <div className="mt-3 bg-gray-50 p-3 rounded text-xs text-gray-600 italic border border-gray-100">
                                                        "Descripción física: {inv.DescripcionFisica || inv.descripcionFisica}"
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic text-sm text-center py-4">
                                    No se encontraron datos de involucrados específicos.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* 3. TESTIGOS Y EVIDENCIAS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Testigos */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">👀 Testigos</h3>
                            {listaTestigos.length > 0 ? (
                                <ul className="space-y-3">
                                    {listaTestigos.map((t: any, idx: number) => (
                                        <li
                                            key={idx}
                                            className="text-sm border-b border-gray-100 last:border-0 pb-2 cursor-pointer hover:bg-gray-50 hover:px-2 hover:-mx-2 rounded transition-all"
                                            onClick={() => {
                                                setSelectedTestigo(t)
                                                setShowModalTestigo(true)
                                            }}
                                        >
                                            <span className="font-bold text-gray-700 block">{t.Nombre_PD || t.Nombre || t.nombre}</span>
                                            <span className="text-xs text-gray-500 block mt-0.5">
                                                {t.Contacto ? `Contacto: ${t.Contacto}` : 'Participante registrado'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-400 italic">No hay testigos registrados.</p>
                            )}
                        </div>

                        {/* Evidencias */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">📎 Evidencias</h3>
                            {listaEvidencias.length > 0 ? (
                                <ul className="space-y-2">
                                    {listaEvidencias.map((ev: any, idx: number) => (
                                        <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                                            <span className="text-blue-500">📄</span>
                                            {ev.Nombre || ev.nombre || `Evidencia ${idx + 1}`}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-400 italic">No hay evidencias adjuntas.</p>
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
                                // Caso A: El Denunciante ES la Víctima
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
                                // Caso B: El Denunciante NO es la Víctima (Víctima Externa)
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

                    {/* Ubicación */}
                    {denuncia.Ubicacion && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">📍 Ubicación</h3>
                            <p className="text-sm text-gray-700">{denuncia.Ubicacion}</p>
                        </div>
                    )}

                    {/* Archivos y Evidencias */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">📎 Archivos y Evidencias</h3>
                        {listaEvidencias.length > 0 ? (
                            <div className="space-y-4">
                                {listaEvidencias.map((arch: any, i: number) => (
                                    <EvidenciaViewer key={arch.ID_Archivo || i} archivo={arch} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 italic">No se adjuntaron archivos.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* --- FOOTER --- */}
            <div className="bg-gray-50 px-6 py-5 border-t border-gray-200 flex flex-col sm:flex-row justify-end items-center gap-4 rounded-b-xl mt-6">

                    {/* Botón 1: Solicitar Recomendación a Fiscalía */}
                    <button
                        onClick={() => setShowSolicitudFiscalia(true)}
                        className="px-4 py-2 bg-ubb-blue border border-ubb-blue text-white rounded-md text-sm font-bold hover:bg-blue-900 shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        Solicitar Recomendación a Fiscalía
                    </button>

                    {/* Botón 2: Derivar a Otra Autoridad */}
                    <button
                        onClick={() => setShowDerivacion(true)}
                        className="px-4 py-2 bg-white border border-orange-500 text-orange-600 rounded-md text-sm font-bold hover:bg-orange-50 shadow-sm flex items-center justify-center gap-2 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                        </svg>
                        Derivar a Otra Autoridad
                    </button>

                    {/* Botón 3: Instruir Investigación Sumaria (Condicional) */}
                    <div className="relative group">
                        <button
                            onClick={() => puedeInstruirInvestigacion && setShowInstruirInvestigacion(true)}
                            disabled={!puedeInstruirInvestigacion}
                            className={`px-4 py-2 rounded-md text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-colors
                ${puedeInstruirInvestigacion
                                    ? 'bg-green-600 text-white hover:bg-green-700 border border-green-600'
                                    : 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            Instruir Investigación Sumaria
                        </button>

                        {/* Tooltip cuando está deshabilitado */}
                        {!puedeInstruirInvestigacion && (
                            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block z-10">
                                <div className="bg-gray-800 text-white text-xs rounded py-1 px-3 whitespace-nowrap">
                                    Pendiente de recomendación de Fiscalía
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            <div className="flex justify-start pt-2">
                <button onClick={() => navigate('/autoridad/bandeja')} className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
                    ← Volver a la Bandeja
                </button>
            </div>

            {/* MODALES */}
            <SolicitudFiscaliaModal
                isOpen={showSolicitudFiscalia}
                onClose={() => setShowSolicitudFiscalia(false)}
                onConfirm={handleSolicitudFiscalia}
                isProcessing={processing}
            />

            <DerivacionAutoridadModal
                isOpen={showDerivacion}
                onClose={() => setShowDerivacion(false)}
                onConfirm={handleDerivacion}
                isProcessing={processing}
                autoridadActual={autoridadActual}
            />

            <InstruirInvestigacionModal
                isOpen={showInstruirInvestigacion}
                onClose={() => setShowInstruirInvestigacion(false)}
                onConfirm={handleInstruirInvestigacion}
                isProcessing={processing}
            />

            {/* Modales de Detalle */}
            <ModalDetalleDenunciado
                isOpen={showModalDenunciado}
                onClose={() => {
                    setShowModalDenunciado(false)
                    setSelectedDenunciado(null)
                }}
                denunciado={selectedDenunciado}
            />

            <ModalDetalleTestigo
                isOpen={showModalTestigo}
                onClose={() => {
                    setShowModalTestigo(false)
                    setSelectedTestigo(null)
                }}
                testigo={selectedTestigo}
            />
        </section>
    )
}
