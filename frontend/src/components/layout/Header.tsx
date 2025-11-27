import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Header() {
  const { isAuthenticated, logout } = useAuth()
  return (
    <header className="w-full border-b border-gray-200 bg-white">
      {/* Bloque superior de marcas */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Marca del sistema / unidad (izquierda) */}
        <div className="min-h-8 min-w-0">
          <Link
            to="/home"
            className="inline-flex items-center gap-2"
            aria-label="Inicio — Portal de Denuncias UBB"
          >
            {/* <img src="/brand/logo-sistema.svg" alt="Portal de Denuncias" className="h-8 w-auto" /> */}
            <span className="font-condensed text-xl font-bold tracking-tight text-gray-900">
              Portal de Denuncias
            </span>
          </Link>
        </div>

        {/* Marca UBB (derecha, según manual) */}
        <div className="shrink-0 pl-4">
          <img
            src="/brand/logo-ubb-horizontal.png"  // PNG está bien por ahora
            alt="Universidad del Bío-Bío"
            className="h-8 w-auto"
            loading="eager"
          />
        </div>
      </div>

      {/* Barra de navegación secundaria (debajo de las marcas) */}
      <nav
        className="w-full border-t border-gray-200 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60"
        aria-label="Navegación principal"
      >
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4">
          <Link
            to="/home"
            className="inline-flex items-center border-b-2 border-transparent px-3 py-2 text-sm font-medium text-gray-700 hover:border-ubb-blue hover:text-ubb-blue"
          >
            Inicio
          </Link>
          <Link
            to="/denuncias/nueva"
            className="inline-flex items-center border-b-2 border-transparent px-3 py-2 text-sm font-medium text-gray-700 hover:border-ubb-blue hover:text-ubb-blue"
          >
            Registrar denuncia
          </Link>
          <Link
            to="/denuncias"
            className="inline-flex items-center border-b-2 border-transparent px-3 py-2 text-sm font-medium text-gray-700 hover:border-ubb-blue hover:text-ubb-blue"
          >
            Mis denuncias
          </Link>

          {/* Zona de usuario al extremo derecho (placeholder) */}
          <div className="ml-auto inline-flex items-center gap-3 py-2">
            {isAuthenticated ? (
              <button
                onClick={() => logout()}
                className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Cerrar sesión
              </button>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center rounded-md bg-ubb-blue px-3 py-1.5 text-sm font-semibold text-white hover:opacity-95"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
