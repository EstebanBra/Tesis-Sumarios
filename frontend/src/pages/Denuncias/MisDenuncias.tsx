import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarDenuncias, type DenunciaListado, type ListarDenunciasResponse } from '@/services/denuncias.api'
import { routes } from '@/services/routes'

const PAGE_SIZE = 10

export default function MisDenuncias() {
  const [denuncias, setDenuncias] = useState<DenunciaListado[]>([])
  const [meta, setMeta] = useState<ListarDenunciasResponse['meta']>({
    total: 0,
    page: 1,
    pageSize: PAGE_SIZE,
    pages: 1,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }),
    []
  )

  async function fetchDenuncias(page = 1) {
    try {
      setLoading(true)
      setError(null)

      const respuesta = await listarDenuncias({ page, pageSize: PAGE_SIZE })
      setDenuncias(respuesta.data)
      setMeta(respuesta.meta)
    } catch (err: any) {
      setError(err?.message ?? 'No pudimos cargar tus denuncias.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDenuncias(meta.page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleRefresh() {
    fetchDenuncias(meta.page)
  }

  function handlePrevPage() {
    if (meta.page > 1) {
      const prevPage = meta.page - 1
      setMeta((prev) => ({ ...prev, page: prevPage }))
      fetchDenuncias(prevPage)
    }
  }

  function handleNextPage() {
    if (meta.page < meta.pages) {
      const nextPage = meta.page + 1
      setMeta((prev) => ({ ...prev, page: nextPage }))
      fetchDenuncias(nextPage)
    }
  }

  function formatFecha(fechaISO: string) {
    if (!fechaISO) return '—'
    try {
      return dateFormatter.format(new Date(fechaISO))
    } catch {
      return fechaISO
    }
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-ubb-blue font-semibold">Gestión de casos</p>
          <h1 className="font-condensed text-3xl font-bold tracking-tight text-gray-900">
            Mis denuncias
          </h1>
          <p className="text-sm text-gray-600">
            Revisa el estado y avance de las denuncias que has registrado.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            Actualizar
          </button>
          <Link
            to={routes.denuncias.nueva}
            className="rounded-md bg-ubb-blue px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            Registrar nueva
          </Link>
        </div>
      </header>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <p className="text-sm text-gray-600">
            Total de denuncias: <span className="font-semibold text-gray-900">{meta.total}</span>
          </p>
        </div>

        {loading ? (
          <div className="px-4 py-16 text-center text-gray-500 text-sm">
            Cargando denuncias…
          </div>
        ) : error ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-semibold text-red-600">{error}</p>
            <button
              type="button"
              onClick={handleRefresh}
              className="mt-3 rounded-md bg-red-600/10 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-600/15"
            >
              Reintentar
            </button>
          </div>
        ) : denuncias.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-gray-500">
            Aún no registras denuncias. Comienza creando una nueva.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th scope="col" className="px-4 py-3">ID</th>
                  <th scope="col" className="px-4 py-3">Tipo</th>
                  <th scope="col" className="px-4 py-3">Estado</th>
                  <th scope="col" className="px-4 py-3">Fecha de inicio</th>
                  <th scope="col" className="px-4 py-3">Ubicación</th>
                  <th scope="col" className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white text-gray-800">
                {denuncias.map((denuncia) => (
                  <tr key={denuncia.ID_Denuncia} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      #{denuncia.ID_Denuncia}
                    </td>
                    <td className="px-4 py-3">
                      {denuncia.tipo_denuncia?.Nombre ?? 'Sin tipo'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-ubb-blue/10 px-3 py-1 text-xs font-semibold text-ubb-blue">
                        {denuncia.estado_denuncia?.Tipo_Estado ?? 'Sin estado'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {denuncia.Fecha_Fin ? (
                        <span className="text-sm">
                          {formatFecha(denuncia.Fecha_Inicio)} - {formatFecha(denuncia.Fecha_Fin)}
                        </span>
                      ) : (
                        formatFecha(denuncia.Fecha_Inicio)
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {denuncia.Ubicacion ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={routes.denuncias.detalle(denuncia.ID_Denuncia)}
                        className="text-ubb-blue hover:underline font-medium"
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && denuncias.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
            <p>
              Página {meta.page} de {meta.pages} — Mostrando {denuncias.length} de {meta.total} denuncias
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={meta.page <= 1}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={meta.page >= meta.pages}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
