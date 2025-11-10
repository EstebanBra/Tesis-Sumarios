import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()

  return (
    <section className="grid place-items-center px-4 py-12">
      <div className="w-full max-w-[520px] rounded-xl border border-gray-200 bg-white p-6 shadow-sm text-center">
        <h1 className="font-condensed text-[20px] font-bold tracking-tight text-gray-900">
          Acceso al Sistema
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Ingresa de forma segura para presentar tu denuncia
        </p>

        <button
          type="button"
          onClick={() => navigate('/home')}
          className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-ubb-blue px-4 py-2 text-sm font-semibold text-white hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-ubb-blue/30"
        >
          Ingresar con ClaveÚnica
        </button>

        <p className="mt-3 text-xs text-gray-500">
          Autenticación estatal segura (demo)
        </p>
      </div>
    </section>
  )
}
