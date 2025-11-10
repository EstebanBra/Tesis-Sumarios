import { useParams } from 'react-router-dom'

export default function DetalleDenuncia() {
  const { id } = useParams()
  return (
    <section className="space-y-2">
      <h1 className="font-condensed text-2xl font-bold tracking-tight">Detalle de denuncia</h1>
      <p className="text-gray-700 text-sm">ID: <span className="font-mono">{id}</span></p>
      <p className="text-gray-700 text-sm">(Resumen, estado, documentos y acciones irán aquí.)</p>
    </section>
  )
}
