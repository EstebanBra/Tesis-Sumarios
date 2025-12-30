import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarDenuncias, type DenunciaListado } from '@/services/denuncias.api'
import { useAuth } from '@/context/AuthContext'

type FiltroTipo = 'todas' | 'convivencia' | 'genero'

export default function BandejaRevisor() {
  const [denuncias, setDenuncias] = useState<DenunciaListado[]>([])
  const [denunciasCompletas, setDenunciasCompletas] = useState<DenunciaListado[]>([])
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todas')
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        // REVISOR ve TODAS las denuncias sin filtrar
        const resDenuncias = await listarDenuncias({ page: 1, pageSize: 100 })
        setDenunciasCompletas(resDenuncias.data)
        setDenuncias(resDenuncias.data)
      } catch (error) {
        console.error('Error cargando bandeja', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Filtrar denuncias según el filtro seleccionado
  useEffect(() => {
    let denunciasFiltradas = denunciasCompletas

    if (filtroTipo === 'convivencia') {
      // Serie 200: Convivencia Escolar
      denunciasFiltradas = denunciasCompletas.filter(d => 
        d.tipo_denuncia && d.tipo_denuncia.ID_TipoDe >= 200 && d.tipo_denuncia.ID_TipoDe < 300
      )
    } else if (filtroTipo === 'genero') {
      // Serie 100: Género/Dirgegen
      denunciasFiltradas = denunciasCompletas.filter(d => 
        d.tipo_denuncia && d.tipo_denuncia.ID_TipoDe < 200
      )
    }

    setDenuncias(denunciasFiltradas)
  }, [filtroTipo, denunciasCompletas])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-ubb-blue font-medium animate-pulse">
      Cargando...
    </div>
  )

  return (
    <section className="space-y-6 max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-condensed text-3xl font-bold tracking-tight text-gray-900">
            Bandeja de Entrada - Revisor
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Vista transversal de todas las denuncias del sistema.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Bienvenido, {user?.nombre || 'Revisor'}
          </span>
          <div className="bg-ubb-blue text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm">
            {denuncias.length} Casos {filtroTipo !== 'todas' && `(${filtroTipo === 'convivencia' ? 'Convivencia' : 'Género'})`}
          </div>
        </div>
      </header>

      {/* Filtros por Tipo */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700 mr-2">Filtrar por tipo:</span>
          <button
            onClick={() => setFiltroTipo('todas')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtroTipo === 'todas'
                ? 'bg-ubb-blue text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Ver Todas
          </button>
          <button
            onClick={() => setFiltroTipo('convivencia')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtroTipo === 'convivencia'
                ? 'bg-ubb-blue text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Solo Convivencia
          </button>
          <button
            onClick={() => setFiltroTipo('genero')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtroTipo === 'genero'
                ? 'bg-ubb-blue text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Solo Género
          </button>
        </div>
      </div>

      {/* Tabla de Denuncias */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-6 py-4">ID / Fecha</th>
              <th className="px-6 py-4">Tipo de Denuncia</th>
              <th className="px-6 py-4">Área</th>
              <th className="px-6 py-4">Denunciante</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {denuncias.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No se encontraron denuncias con el filtro seleccionado.
                </td>
              </tr>
            ) : (
              denuncias.map((d) => (
                <tr key={d.ID_Denuncia} className="group hover:bg-blue-50/50 transition-colors">
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
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      d.tipo_denuncia?.ID_TipoDe && d.tipo_denuncia.ID_TipoDe < 200
                        ? 'bg-pink-100 text-pink-700 border border-pink-200'
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      {d.tipo_denuncia?.Area || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{d.Rut}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
                      {d.estado_denuncia?.Tipo_Estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => navigate(`/revisor/denuncia/${d.ID_Denuncia}`)} 
                      className="text-ubb-blue font-bold text-xs hover:underline"
                    >
                      REVISAR
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

