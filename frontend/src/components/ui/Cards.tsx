import type { ReactNode } from 'react';

interface CardsProps {
  title: string;
  description: string;
  icon?: ReactNode;
  onClick: () => void;
}

export function Cards({ title, description, icon, onClick }: CardsProps) {
  const hasIcon = !!icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group relative flex w-full flex-col rounded-xl border bg-white p-6 shadow-sm transition-all duration-300
        hover:-translate-y-1 hover:border-ubb-blue/50 hover:shadow-lg
        focus:outline-none focus:ring-2 focus:ring-ubb-blue focus:ring-offset-2
        border-gray-200
        ${hasIcon ? 'items-center text-center h-full' : 'items-start text-left h-auto'}
      `}
    >
      {/* Icono  */}
      {hasIcon && (
        <div className="mb-5 rounded-full bg-gray-50 p-4 text-ubb-blue transition-colors group-hover:bg-blue-50">
          {icon}
        </div>
      )}

      {/* Título */}
      <h3
        className={`text-lg font-bold text-gray-900 transition-colors group-hover:text-ubb-blue ${hasIcon ? 'mb-3 text-xl' : 'mb-2'}`}
      >
        {title}
      </h3>

      {/* Descripción */}
      <p className="text-sm leading-relaxed text-gray-600">{description}</p>

      {/*botone */}
      <div
        className={`mt-auto w-full pt-5 ${hasIcon ? 'flex justify-center' : 'flex justify-end'}`}
      >
        <span className="inline-flex items-center text-xs font-bold uppercase tracking-wide text-ubb-blue opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100">
          Seleccionar <span className="ml-1 text-base leading-none">&rarr;</span>
        </span>
      </div>
    </button>
  );
}
