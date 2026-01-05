import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarDenuncias, type DenunciaListado } from '@/services/denuncias.api';
import { useAuth } from '@/hooks/useAuth';
import { formatearFechaCorta } from '@/utils/date.utils';

type OrdenFecha = 'mas_nueva' | 'mas_antigua';

export default function BandejaCampoClinico() {
  const [denuncias, setDenuncias] = useState<DenunciaListado[]>([]);
  const [denunciasFiltradas, setDenunciasFiltradas] = useState<DenunciaListado[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordenFecha, setOrdenFecha] = useState<OrdenFecha>('mas_nueva');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await listarDenuncias({ page: 1, pageSize: 100 });
        // ✅ FILTRO: Solo mostrar denuncias de Campos Clínicos (ID_TipoDe === 300)
        const casosCampoClinico = res.data.filter(
          d => d.tipo_denuncia && d.tipo_denuncia.ID_TipoDe === 300
        );
        setDenuncias(casosCampoClinico);
        // Aplicar ordenamiento inicial
        ordenarDenuncias(casosCampoClinico, ordenFecha);
      } catch (error) {
        console.error('Error cargando bandeja', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Función para ordenar denuncias por fecha
  const ordenarDenuncias = (lista: DenunciaListado[], orden: OrdenFecha) => {
    const listaOrdenada = [...lista].sort((a, b) => {
      const fechaA = a.Fecha_Ingreso ? new Date(a.Fecha_Ingreso).getTime() : 0;
      const fechaB = b.Fecha_Ingreso ? new Date(b.Fecha_Ingreso).getTime() : 0;

      if (orden === 'mas_nueva') {
        return fechaB - fechaA; // Más nueva primero (descendente)
      } else {
        return fechaA - fechaB; // Más antigua primero (ascendente)
      }
    });
    setDenunciasFiltradas(listaOrdenada);
  };

  // Efecto para reordenar cuando cambia el orden
  useEffect(() => {
    ordenarDenuncias(denuncias, ordenFecha);
  }, [ordenFecha, denuncias]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-ubb-blue font-medium animate-pulse">
        Cargando denuncias de Campos Clínicos...
      </div>
    );

  return (
    <section className="space-y-6 max-w-7xl mx-auto py-8 px-4">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-condensed text-3xl font-bold tracking-tight text-gray-900">
            Bandeja de Entrada - Campo Clínico
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestión de denuncias de Convivencia en Campos Clínicos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Bienvenido(a), {user?.nombre || 'Usuario'}
          </span>
          <div className="bg-ubb-blue text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm">
            {denunciasFiltradas.length} Casos Pendientes
          </div>
        </div>
      </header>

      {/* Filtro de Ordenamiento por Fecha */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700 mr-2">Ordenar por fecha:</span>
          <button
            onClick={() => setOrdenFecha('mas_nueva')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              ordenFecha === 'mas_nueva'
                ? 'bg-ubb-blue text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Más Nueva
          </button>
          <button
            onClick={() => setOrdenFecha('mas_antigua')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              ordenFecha === 'mas_antigua'
                ? 'bg-ubb-blue text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Más Antigua
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">Área</th>
              <th className="px-6 py-4">Denunciante</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {denunciasFiltradas.map(d => (
              <tr key={d.ID_Denuncia} className="group hover:bg-blue-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {d.Fecha_Ingreso ? (
                      formatearFechaCorta(d.Fecha_Ingreso)
                    ) : d.Fecha_Fin ? (
                      <span>
                        {formatearFechaCorta(d.Fecha_Inicio)} - {formatearFechaCorta(d.Fecha_Fin)}
                      </span>
                    ) : (
                      formatearFechaCorta(d.Fecha_Inicio)
                    )}
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                    {d.tipo_denuncia?.Nombre || 'Campos Clínicos'}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <span className="font-mono text-sm font-semibold text-gray-900">
                    {d.denunciante?.Rut || 'N/A'}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border
                    ${
                      d.estado_denuncia?.Tipo_Estado === 'Recibida'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : d.estado_denuncia?.Tipo_Estado === 'Derivada'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : d.estado_denuncia?.Tipo_Estado === 'En Investigación'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-green-50 text-green-700 border-green-200'
                    }`}
                  >
                    {d.estado_denuncia?.Tipo_Estado || 'Recibida'}
                  </span>
                </td>

                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => navigate(`/campo-clinico/denuncia/${d.ID_Denuncia}`)}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-white border border-gray-300 px-4 py-2 text-xs font-bold uppercase tracking-wide text-gray-700 shadow-sm transition-all hover:bg-ubb-blue hover:text-white hover:border-ubb-blue group-hover:border-blue-300"
                  >
                    Revisar y Gestionar
                  </button>
                </td>
              </tr>
            ))}

            {denunciasFiltradas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                    <svg
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">¡Todo al día!</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No hay denuncias de Campos Clínicos pendientes de revisión en tu bandeja.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
