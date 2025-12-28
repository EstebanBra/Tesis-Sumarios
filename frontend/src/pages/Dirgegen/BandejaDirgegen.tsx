import { useEffect, useState } from 'react'
import {  useNavigate } from 'react-router-dom'
// 1. IMPORTAR la nueva función y tipos
import { listarDenuncias, listarMedidasPendientes, type DenunciaListado, type SolicitudMedida } from '@/services/denuncias.api'
import { useAuth } from '@/context/AuthContext'

export default function BandejaDirgegen() {
  const [denuncias, setDenuncias] = useState<DenunciaListado[]>([])
  // 2. ESTADO NUEVO para las alertas
  const [medidasPendientes, setMedidasPendientes] = useState<SolicitudMedida[]>([])
  
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        // 3. CARGA PARALELA: Pedimos denuncias Y medidas pendientes a la vez
       const [resDenuncias, resMedidas] = await Promise.all([
            listarDenuncias({ page: 1, pageSize: 100 }), // Traemos más para filtrar localmente
            listarMedidasPendientes()
        ])
        
        // ✅ FILTRO DE COMPETENCIA: Solo mostrar Serie 100 (Género)
        const casosGenero = resDenuncias.data.filter(d => 
            d.tipo_denuncia && d.tipo_denuncia.ID_TipoDe < 200
        );

        setDenuncias(casosGenero)
        setMedidasPendientes(resMedidas)

      } catch (error) {
        console.error('Error cargando bandeja', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

 

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-ubb-blue font-medium animate-pulse">
      Cargando...
    </div>
  )

  return (
    <section className="space-y-6 max-w-7xl mx-auto py-8 px-4">
      {/* Header (Igual que antes) */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-condensed text-3xl font-bold tracking-tight text-gray-900">
            Bandeja de Entrada Dirgegen
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestión de denuncias bajo el Protocolo de Género y Equidad (DUE 4560).
          </p>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Bienvenida, {user?.nombre || 'Encargada'}
            </span>
            <div className="bg-ubb-blue text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm">
            {denuncias.length} Casos en Total
            </div>
        </div>
      </header>

      {/* 4. AQUÍ ESTÁ LA MAGIA: El Banner Rojo */}
      {/* Solo se muestra si hay medidas pendientes */}
      {medidasPendientes.length > 0 && (
        <div className="rounded-xl border-l-4 border-red-500 bg-red-50 p-6 shadow-sm">
            <div className="flex items-start gap-4">
                <div className="text-3xl">🚨</div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-800">
                        Atención Requerida: Medidas de Resguardo
                    </h3>
                    <p className="text-sm text-red-700 mt-1 mb-4">
                        Se han recibido <strong>{medidasPendientes.length} solicitud(es)</strong> que requieren la elaboración de Informe Técnico urgente.
                    </p>
                    
                    <div className="grid gap-3 md:grid-cols-2">
                        {medidasPendientes.map(m => (
                            <div key={m.ID_Solicitud} className="flex items-center justify-between bg-white p-3 rounded-lg border border-red-200 shadow-sm hover:shadow-md transition-shadow">
                                <div>
                                    <p className="text-sm font-bold text-gray-800">Caso #{m.ID_Denuncia}</p>
                                    <p className="text-xs text-gray-500">{m.Tipo_Medida}</p>
                                </div>
                                <button 
                                    onClick={() => navigate(`/dirgegen/denuncia/${m.ID_Denuncia}`)}
                                    className="bg-red-100 text-red-700 text-xs font-bold px-3 py-2 rounded hover:bg-red-200 transition-colors"
                                >
                                    Gestionar →
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}
      {/* Fin del Banner */}

      {/* Tu tabla original sigue aquí abajo... */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-200">
         {/* ... Código de tu tabla ... */}
         <table className="min-w-full divide-y divide-gray-200 text-sm">
            {/* Copia aquí el contenido de tu tabla tal cual lo tenías */}
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                <th className="px-6 py-4">ID / Fecha</th>
                <th className="px-6 py-4">Tipo de Denuncia</th>
                <th className="px-6 py-4">Denunciante</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acción</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {denuncias.map((d) => (
                <tr key={d.ID_Denuncia} className="group hover:bg-blue-50/50 transition-colors">
                    {/* ... tus celdas ... */}
                    <td className="px-6 py-4">
                        <div className="font-mono font-bold text-gray-900">#{d.ID_Denuncia}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                            {d.Fecha_Fin ? (
                                <span>
                                    {new Date(d.Fecha_Inicio).toLocaleDateString()} - {new Date(d.Fecha_Fin).toLocaleDateString()}
                                </span>
                            ) : (
                                new Date(d.Fecha_Inicio).toLocaleDateString()
                            )}
                        </div>
                    </td>
                    <td className="px-6 py-4">{d.tipo_denuncia?.Nombre}</td>
                    <td className="px-6 py-4 font-mono text-xs">{d.Rut}</td>
                    <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
                            {d.estado_denuncia?.Tipo_Estado}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <button onClick={() => navigate(`/dirgegen/denuncia/${d.ID_Denuncia}`)} className="text-ubb-blue font-bold text-xs hover:underline">REVISAR</button>
                    </td>
                </tr>
                ))}
            </tbody>
         </table>
      </div>
    </section>
  )
}