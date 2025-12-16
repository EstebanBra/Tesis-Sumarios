// src/components/SolicitudMedidaModal.tsx
import React, { useState } from 'react';
import { crearSolicitudMedida } from '@/services/denuncias.api';


interface SolicitudMedidaModalProps {
  idDenuncia: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
const TIPOS_MEDIDA = [
    { value: 'Separacion Espacios', label: 'Separación de Espacios (No Contacto)' },
    { value: 'Flexibilidad Academica', label: 'Flexibilidad Académica' },
    { value: 'Suspension Temporal', label: 'Suspensión Temporal del Denunciado' },
];

export default function SolicitudMedidaModal({ idDenuncia, isOpen, onClose, onSuccess }: SolicitudMedidaModalProps) {
  const [tipoMedida, setTipoMedida] = useState('');
  const [observacion, setObservacion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!tipoMedida || !observacion.trim()) {
      setError('Debe seleccionar el tipo y justificar la necesidad de la medida.');
      return;
    }

    setLoading(true);

    try {
      // ✅ USAR EL SERVICIO CENTRALIZADO (Maneja cookies y errores automáticamente)
      await crearSolicitudMedida({
        ID_Denuncia: idDenuncia,
        Tipo_Medida: tipoMedida,
        Observacion: observacion,
      });

      alert('✅ Solicitud de medida registrada. DIRGEGEN ha sido notificada.');
      onSuccess();
      onClose();
      
    } catch (err: any) {
      // El helper 'api.ts' devuelve el mensaje de error en err.message o err.detalles
      console.error(err);
      setError(err.message || 'Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-75 transition-opacity" role="dialog" aria-modal="true">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative rounded-lg bg-white p-6 shadow-xl transition-all sm:my-8 w-full max-w-md">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Solicitar Medida de Resguardo</h3>
          <p className="text-sm text-gray-600 mb-4">
            Esta solicitud será derivada a la unidad competente ({idDenuncia < 200 ? 'Dirgegen' : 'VRA/Fiscalía'}) para su evaluación urgente.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Medida Requerida *</label>
              <select 
                value={tipoMedida} 
                onChange={(e) => setTipoMedida(e.target.value)} 
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm bg-white"
                required
              >
                <option value="">-- Seleccionar --</option>
                {TIPOS_MEDIDA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Justificación/Necesidad *</label>
              <textarea
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                rows={4}
                placeholder="Explique su necesidad de protección urgente."
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm resize-none"
                required
              />
            </div>
            {error && <div className="text-sm text-red-600 border border-red-200 bg-red-50 p-2 rounded">{error}</div>}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                disabled={loading}
              >
                Cerrar
              </button>
              <button type="submit" disabled={loading}
                className="rounded-md bg-ubb-blue px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900"
              >
                {loading ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}