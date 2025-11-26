import { Link } from 'react-router-dom'
import { routes } from '@/services/routes'
import { useAuth } from '@/context/AuthContext'

export default function Home() {
  const { user } = useAuth()
  
  // Detectar rol
  const isDirgergen = user?.roles?.includes('Dirgegen') || user?.roles?.includes('Admin')

  return (
    <div className="space-y-10 py-6">
      
      {/* SECCIÓN 1: PANEL DE GESTIÓN (Solo visible para Dirgegen) */}
      {isDirgergen && (
        <section className="bg-blue-50 border border-blue-100 rounded-xl p-8 text-center animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="inline-flex items-center gap-2 mb-4 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
            Espacio de Trabajo
          </div>
          <h1 className="font-condensed text-3xl font-bold tracking-tight text-ubb-blue mb-2">
            Panel de Gestión Dirgegen
          </h1>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Accede a la administración de casos de Acoso Sexual, Violencia de Género y Discriminación asignados a tu unidad.
          </p>
          
          <div className="flex justify-center">
            <Link
              to="/dirgegen/bandeja"
              className="inline-flex items-center gap-2 rounded-md bg-ubb-blue px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-blue-800 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Ir a Bandeja de Entrada
            </Link>
          </div>
        </section>
      )}

      {/* SECCIÓN 2: PORTAL DE USUARIO (Visible para todos) */}
      <section className="space-y-4">
        <div className="border-b border-gray-200 pb-2">
          <h2 className="font-condensed text-2xl font-bold tracking-tight text-gray-900">
            Portal de Denuncias UBB
          </h2>
        </div>
        <p className="text-gray-700 max-w-3xl">
          Bienvenido al canal oficial. Si has sido víctima o testigo de situaciones que vulneren la normativa universitaria, puedes realizar tu denuncia aquí.
        </p>
        
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            to={routes.denuncias.nueva}
            className="inline-flex items-center gap-2 rounded-md bg-white border-2 border-ubb-blue text-ubb-blue px-5 py-2.5 text-sm font-bold hover:bg-blue-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Registrar nueva denuncia
          </Link>
          
          <Link
            to={routes.denuncias.root}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Ver mis denuncias realizadas
          </Link>
        </div>
      </section>

    </div>
  )
}
