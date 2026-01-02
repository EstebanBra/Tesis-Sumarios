import type { ReactNode } from 'react';

interface FormularioLayoutProps {
  step: number;
  steps: { id: number; label: string }[];
  stepTitle: string;
  error: string | null;
  detalles: { field: string; msg: string }[] | null;
  children: ReactNode;
  onBack: () => void;
  onNext: () => void;
  onSend: () => void;
  puedeAvanzar: boolean;
  enviando: boolean;
}

export default function FormularioLayout({
  step,
  steps,
  stepTitle,
  error,
  detalles,
  children,
  onBack,
  onNext,
  onSend,
  puedeAvanzar,
  enviando,
}: FormularioLayoutProps) {
  return (
    <section className="mx-auto max-w-4xl py-6">
      <header className="mb-6 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-ubb-blue">Nueva denuncia</p>
        <h1 className="font-condensed text-3xl font-bold tracking-tight text-gray-900">
          Paso {step} · {stepTitle}
        </h1>
        <p className="text-sm text-gray-600">
          Completa los campos. Puedes revisar todo al final antes de enviar.
        </p>
      </header>

      <ol className="mb-8 flex items-center justify-between gap-3">
        {steps.map((s, idx) => {
          const isActive = step === s.id;
          const isCompleted = step > s.id;
          return (
            <li key={s.id} className="flex flex-1 items-center gap-3">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${isCompleted ? 'bg-ubb-blue text-white' : isActive ? 'border-2 border-ubb-blue text-ubb-blue' : 'border-2 border-gray-300 text-gray-500'}`}
              >
                {isCompleted ? '✓' : s.id}
              </span>
              <div
                className={`hidden sm:block flex-1 text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}
              >
                {s.label}
              </div>
              {idx < steps.length - 1 && <div className="h-[1px] flex-1 bg-gray-200" />}
            </li>
          );
        })}
      </ol>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-bold">No se pudo registrar</p>
          <p>{error}</p>
          {detalles && (
            <ul className="mt-2 list-disc pl-4">
              {detalles.map((d, i) => (
                <li key={i}>
                  <b>{d.field}:</b> {d.msg}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {children}
      </div>

      {/* FOOTER NAVEGACIÓN */}
      <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-gray-500">
          Paso {step} de {steps.length}
        </div>
        <div className="flex flex-col gap-2 md:flex-row">
          <button
            type="button"
            onClick={onBack}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            {step === 1 ? 'Volver a selección' : 'Volver'}
          </button>

          {step < steps.length && (
            <button
              type="button"
              disabled={!puedeAvanzar}
              onClick={onNext}
              className="rounded-md bg-ubb-blue px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          )}

          {step === steps.length && (
            <button
              type="button"
              onClick={onSend}
              disabled={enviando}
              className="rounded-md bg-ubb-blue px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
            >
              {enviando ? 'Enviando...' : 'Enviar denuncia'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
