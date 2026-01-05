import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function ConfirmacionDenuncia() {
    const navigate = useNavigate();
    const location = useLocation();
    const [copiado, setCopiado] = useState(false);

    // Obtener datos del state de navegación
    const { tokenSeguimiento, linkSeguimiento } = location.state || {};

    useEffect(() => {
        // Si no hay token, redirigir a inicio
        if (!tokenSeguimiento) {
            navigate('/');
        }

        // Limpiar sessionStorage de la denuncia pública
        sessionStorage.removeItem('tokenTemporal');
        sessionStorage.removeItem('rutVerificado');
        sessionStorage.removeItem('datosDenunciante');
    }, [tokenSeguimiento, navigate]);

    const copiarEnlace = () => {
        if (linkSeguimiento) {
            navigator.clipboard.writeText(linkSeguimiento);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 3000);
        }
    };

    if (!tokenSeguimiento) {
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="max-w-2xl w-full bg-white shadow-xl rounded-lg overflow-hidden">
                {/* Header con banda azul */}
                <div className="h-2 w-full bg-ubb-blue"></div>

                <div className="p-8 sm:p-12">
                    {/* Ícono de éxito */}
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 flex items-center justify-center">
                            <svg
                                className="w-full h-full text-green-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.5}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Título */}
                    <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">
                        ¡Denuncia Registrada Exitosamente!
                    </h1>

                    {/* Mensaje principal */}
                    <p className="text-center text-gray-600 mb-8">
                        Tu denuncia ha sido registrada correctamente. Hemos enviado un correo electrónico
                        con el enlace de seguimiento.
                    </p>

                    {/* Cuadro con el enlace de seguimiento */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">
                            Enlace de Seguimiento
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Guarda este enlace para consultar el estado de tu denuncia en cualquier momento:
                        </p>

                        {/* Enlace con botón de copiar */}
                        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-md p-3">
                            <input
                                type="text"
                                readOnly
                                value={linkSeguimiento}
                                className="flex-1 text-sm text-gray-700 outline-none bg-transparent"
                            />
                            <button
                                onClick={copiarEnlace}
                                className="flex items-center gap-2 px-4 py-2 bg-ubb-blue text-white rounded hover:bg-blue-700 transition-colors"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                </svg>
                                {copiado ? 'Copiado' : 'Copiar'}
                            </button>
                        </div>

                        {/* Código de seguimiento */}
                        <div className="mt-4 pt-4 border-t border-blue-200">
                            <p className="text-sm text-gray-600 mb-2">Código de seguimiento:</p>
                            <p className="font-mono text-sm text-gray-900 font-semibold break-all">
                                {tokenSeguimiento}
                            </p>
                        </div>
                    </div>

                    {/* Información adicional */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
                        <div className="flex items-start gap-3">
                            <svg
                                className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <div>
                                <h3 className="text-sm font-semibold text-yellow-800 mb-2">
                                    Importante
                                </h3>
                                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                                    <li>Guarda este enlace en un lugar seguro</li>
                                    <li>Recibirás un correo electrónico con el enlace de seguimiento</li>
                                    <li>Podrás consultar el estado de tu denuncia con este enlace</li>
                                    <li>No compartas este enlace con personas no autorizadas</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => navigate(linkSeguimiento.replace(window.location.origin, ''))}
                            className="flex-1 bg-ubb-blue text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Ver Estado de la Denuncia
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-md font-semibold hover:bg-gray-300 transition-colors"
                        >
                            Volver al Inicio
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
