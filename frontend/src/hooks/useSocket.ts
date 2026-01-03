// src/hooks/useSocket.ts
import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/hooks/useAuth'

/**
 * Obtiene el token de autenticación desde las cookies
 */
function getTokenFromCookies(): string | null {
  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      const token = parts.pop()?.split(';').shift()
      return token || null
    }
    return null
  }
  return getCookie('token')
}

export function useSocket() {
  const { user, isAuthenticated } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Obtener token de las cookies
    const token = getTokenFromCookies()

    // No conectar si no hay autenticación o token
    if (!isAuthenticated || !user || !token) {
      // Desconectar si ya existe una conexión
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setSocket(null)
        setConnected(false)
      }
      return
    }

    // WebSocket a través de /api para cumplir con restricciones de Nginx:
    // - En desarrollo: Vite proxy maneja /api (con ws: true) -> localhost:3000
    // - En producción: Nginx solo permite tráfico que comience con /api
    // El path '/api/socket.io' permite que el WebSocket atraviese el proxy
    const newSocket = io({
      path: '/api/socket.io',
      auth: {
        token: token, // Token explícitamente pasado en auth
      },
      withCredentials: true, // Asegura que las cookies se envíen
      transports: ['websocket', 'polling'],
    })

    newSocket.on('connect', () => {
      console.log('🔌 Conectado a WebSocket')
      setConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('🔌 Desconectado de WebSocket')
      setConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('Error conectando WebSocket:', error)
      setConnected(false)
    })

    socketRef.current = newSocket
    setSocket(newSocket)

    // Cleanup: desconectar cuando el componente se desmonte o cambien las dependencias
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setSocket(null)
        setConnected(false)
      }
    }
  }, [isAuthenticated, user]) // Se reconecta cuando cambia la autenticación o el usuario

  return { socket, connected }
}

