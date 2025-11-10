import { Link } from 'react-router-dom'
import { routes } from '@/services/routes'

export default function Home() {
  return (
    <section className="space-y-3">
      <h1 className="font-condensed text-3xl font-bold tracking-tight">
        Portal de Denuncias UBB
      </h1>
      <p className="text-gray-700">
        Bienvenido. Desde aquí podrás registrar nuevas denuncias y revisar su estado.
      </p>
      <div className="flex gap-3">
        <Link
          to={routes.denuncias.nueva}
          className="rounded-md bg-ubb-blue px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
        >
          Registrar denuncia
        </Link>
        <Link
          to={routes.denuncias.root}
          className="rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-200"
        >
          Mis denuncias
        </Link>
      </div>
    </section>
  )
}
