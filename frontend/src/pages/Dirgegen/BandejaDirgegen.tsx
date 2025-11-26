import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarDenuncias, type DenunciaListado } from '@/services/denuncias.api'

const TIPOS_DIRGEGEN = [
  //deberia ser asi el tipo pero despues hay que actualizar 
  'Acoso Sexual',
  'Violencia de Género',
  'Discriminación Arbitraria',
  // por esto no me funcionaba hay que seguir actualizando denuncia para que quede con lo de arriba 
  // por lo mismos actualizar la base dedatos con subtipo y seed igual 
  'Denuncia por acoso sexual, violencia y/o discriminación arbitraria por razones de sexo/género'
]

export default function BandejaDirgegen() {
  const [denuncias, setDenuncias] = useState<DenunciaListado[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // Obtenemos todas (o paginadas)
        const res = await listarDenuncias({ pageSize: 100 }) 
        
        // esto el para que no salga lo de la VRA
        const filtered = res.data.filter(d => 
          d.tipo_denuncia && TIPOS_DIRGEGEN.includes(d.tipo_denuncia.Nombre)
        )
        
        setDenuncias(filtered)
      } catch (error) {
        console.error('Error cargando bandeja', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) return <div className="p-10 text-center text-gray-500">Cargando bandeja de entrada...</div>
  // recordatorio que esto se puede achicar
  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-condensed text-3xl font-bold tracking-tight text-ubb-blue">
            Bandeja de Entrada Dirgegen
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Visualizando denuncias de: {TIPOS_DIRGEGEN.join(', ')}.
          </p>
        </div>
        <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg text-sm font-semibold">
          {denuncias.length} Pendientes
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Fecha Ingreso</th>
              <th className="px-6 py-3">Tipo</th>
              <th className="px-6 py-3">Estado</th>
              <th className="px-6 py-3 text-right">Gestión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {denuncias.map((d) => (
              <tr key={d.ID_Denuncia} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-mono text-gray-600">#{d.ID_Denuncia}</td>
                <td className="px-6 py-4">{new Date(d.Fecha_Inicio).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-900">{d.tipo_denuncia?.Nombre}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                    ${d.estado_denuncia?.ID_EstadoDe === 1 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {d.estado_denuncia?.Tipo_Estado}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    to={`/dirgegen/denuncia/${d.ID_Denuncia}`}
                   
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-ubb-blue px-4 py-2 text-xs font-bold uppercase tracking-wide text-ubb-blue transition-colors hover:bg-blue-50 hover:text-blue-800"
                  >
                    Revisar Caso
                  </Link>
                </td>
              </tr>
            ))}
            {denuncias.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                  <p className="text-lg font-medium">Todo al día</p>
                  <p className="text-sm">No hay denuncias pendientes en esta bandeja.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}