import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDenunciaById } from '@/services/denuncias.api'
import IdentificarDenunciadoModal from '../Dirgegen/components/IdentificarDenunciadoModal'
import ModalDetalleDenunciado from '@/components/modals/ModalDetalleDenunciado'
import ModalDetalleTestigo from '@/components/modals/ModalDetalleTestigo'
import { useAuth } from '@/context/AuthContext'

export default function DetalleRevisor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [denuncia, setDenuncia] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [showIdentificarModal, setShowIdentificarModal] = useState(false)
  const [denunciadoAIdentificar, setDenunciadoAIdentificar] = useState<{ id: number; nombre: string } | null>(null)
  const [selectedDenunciado, setSelectedDenunciado] = useState<any | null>(null)
  const [showModalDenunciado, setShowModalDenunciado] = useState(false)
  const [selectedTestigo, setSelectedTestigo] = useState<any | null>(null)
  const [showModalTestigo, setShowModalTestigo] = useState(false)

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
  
  const listaEvidencias = denuncia.Evidencias || denuncia.evidencias || denuncia.Archivos || [];
  
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
  const generoDenunciante = getProp(datosDenuncianteObj, 'genero', 'genero');
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
    
    const generoVictima = esVictima
      ? generoDenunciante
      : (victimaExterna?.persona?.genero || null);
    
    const sexoVictima = esVictima
      ? null
      : (victimaExterna?.persona?.sexo || null);

  // Verificar si la denuncia fue derivada y tiene observación
  const observacionDerivacion = denuncia.observacionDirgegen;
  const fueDerivada = denuncia.tipo_denuncia?.ID_TipoDe === 301 || denuncia.tipo_denuncia?.ID_TipoDe === 302 || denuncia.tipo_denuncia?.ID_TipoDe === 303;

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
                        
                        {/* Botón para identificar si no está identificado */}
                        {!estaIdentificado && (
                          <div className="mt-3 pt-3 border-t border-orange-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation() // Prevenir que se abra el modal de detalles
                                setDenunciadoAIdentificar({ id: inv.ID_Datos || inv.id, nombre: nombreCompleto })
                                setShowIdentificarModal(true)
                              }}
                              className="w-full px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                            >
                              🔍 Individualizar Denunciado
                            </button>
                          </div>
                        )}
                        
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

            {/* Archivos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">📎 Archivos</h3>
              {listaEvidencias.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {listaEvidencias.map((arch: any, i: number) => (
                    <a key={i} href={arch.url || arch.Url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-blue-50 text-blue-700 rounded text-sm hover:bg-blue-100 transition border border-blue-100">
                      <span>📄</span>
                      <span className="truncate">{arch.nombreOriginal || arch.NombreOriginal || `Documento ${i+1}`}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No se adjuntaron archivos.</p>
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
                  {(generoDenunciante || regionDenunciante || comunaDenunciante || direccionDenunciante) && (
                    <div className="pt-2 border-t border-gray-100">
                      <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Información Adicional</label>
                      {generoDenunciante && (
                        <p className="text-gray-700 text-xs">Género: {generoDenunciante}</p>
                      )}
                      {(regionDenunciante || comunaDenunciante) && (
                        <p className="text-gray-700 text-xs">
                          {regionDenunciante}{comunaDenunciante ? `, ${comunaDenunciante}` : ''}
                        </p>
                      )}
                      {direccionDenunciante && (
                        <p className="text-gray-700 text-xs">{direccionDenunciante}</p>
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
        </div>
      </div>
      
      {/* --- FOOTER --- */}
      <div className="bg-gray-50 px-6 py-5 border-t border-gray-200 flex flex-col sm:flex-row justify-end items-center gap-4 rounded-b-xl mt-6">
        <div className="text-xs text-gray-500 font-medium">
          Vista de Revisor - Sin acciones de gestión
        </div>
      </div>

      <div className="flex justify-start pt-2"> 
        <button onClick={() => navigate('/revisor/bandeja')} className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
          ← Volver a la Bandeja
        </button>
      </div>

      {/* MODAL DE IDENTIFICAR DENUNCIADO */}
      {denunciadoAIdentificar && (
        <IdentificarDenunciadoModal
          isOpen={showIdentificarModal}
          onClose={() => {
            setShowIdentificarModal(false)
            setDenunciadoAIdentificar(null)
          }}
          onSuccess={() => {
            // Cerrar el modal de identificación primero
            setShowIdentificarModal(false)
            setDenunciadoAIdentificar(null)
            // Recargar datos sin abrir el modal de detalles
            cargarDatos()
          }}
          idDatosDenunciado={denunciadoAIdentificar.id}
          nombreActual={denunciadoAIdentificar.nombre}
        />
      )}

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

