// src/components/Notificaciones.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getNotificaciones,
  getContadorNoLeidas,
  marcarNotificacionLeida,
  marcarTodasLeidas,
  type Notificacion
} from '@/services/notificaciones.api'
import { useSocket } from '@/hooks/useSocket'
import { formatDistanceToNow } from 'date-fns'

export default function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [contador, setContador] = useState(0)
  const [mostrarDropdown, setMostrarDropdown] = useState(false)
  const [cargando, setCargando] = useState(false)
  const { socket } = useSocket()
  const navigate = useNavigate()

  // Cargar notificaciones y contador
  const cargarNotificaciones = async () => {
    try {
      setCargando(true)
      const [notifs, count] = await Promise.all([
        getNotificaciones({ limit: 10 }),
        getContadorNoLeidas()
      ])
      setNotificaciones(notifs)
      setContador(count)
    } catch (error) {
      console.error('Error cargando notificaciones:', error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarNotificaciones()
  }, [])

  // Escuchar nuevas notificaciones por WebSocket
  useEffect(() => {
    if (!socket) return

    const handleNuevaNotificacion = (notificacion: Notificacion) => {
      setNotificaciones(prev => [notificacion, ...prev])
      setContador(prev => prev + 1)

      // Mostrar notificación del navegador si está permitido
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notificacion.Titulo, {
          body: notificacion.Mensaje,
          icon: '/logo-ubb.png',
        })
      }
    }

    socket.on('nueva_notificacion', handleNuevaNotificacion)

    return () => {
      socket.off('nueva_notificacion', handleNuevaNotificacion)
    }
  }, [socket])

  // Solicitar permiso para notificaciones del navegador
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const handleMarcarLeida = async (id: number, denunciaId?: number | null) => {
    try {
      await marcarNotificacionLeida(id)
      setNotificaciones(prev =>
        prev.map(n => n.ID_Notificacion === id ? { ...n, Leida: true } : n)
      )
      setContador(prev => Math.max(0, prev - 1))

      // Navegar a la denuncia si tiene ID
      if (denunciaId) {
        navigate(`/dirgegen/denuncia/${denunciaId}`)
        setMostrarDropdown(false)
      }
    } catch (error) {
      console.error('Error marcando notificación como leída:', error)
    }
  }

  const handleMarcarTodasLeidas = async () => {
    try {
      await marcarTodasLeidas()
      setNotificaciones(prev => prev.map(n => ({ ...n, Leida: true })))
      setContador(0)
    } catch (error) {
      console.error('Error marcando todas como leídas:', error)
    }
  }

  const notificacionesNoLeidas = notificaciones.filter(n => !n.Leida)

  return (
    <div className="relative">
      <button
        onClick={() => setMostrarDropdown(!mostrarDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Notificaciones"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {contador > 0 && (
          <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
            {contador > 9 ? '9+' : contador}
          </span>
        )}
      </button>

      {mostrarDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMostrarDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-96 rounded-lg border border-gray-200 bg-white shadow-xl z-50 max-h-[600px] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Notificaciones
              </h3>
              {notificacionesNoLeidas.length > 0 && (
                <button
                  onClick={handleMarcarTodasLeidas}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {cargando ? (
                <div className="p-8 text-center text-gray-500">
                  Cargando notificaciones...
                </div>
              ) : notificaciones.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No hay notificaciones
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notificaciones.map((notif) => (
                    <div
                      key={notif.ID_Notificacion}
                      className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notif.Leida ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={() => handleMarcarLeida(notif.ID_Notificacion, notif.ID_Denuncia)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-semibold ${!notif.Leida ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notif.Titulo}
                            </p>
                            {!notif.Leida && (
                              <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notif.Mensaje}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(notif.Fecha_Creacion), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TODO: Desarrollar vista completa de notificaciones */}
            {/* {notificaciones.length > 0 && (
              <div className="border-t border-gray-200 px-4 py-2">
                <button
                  onClick={() => {
                    navigate('/notificaciones')
                    setMostrarDropdown(false)
                  }}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Ver todas las notificaciones
                </button>
              </div>
            )} */}
          </div>
        </>
      )}
    </div>
  )
}

