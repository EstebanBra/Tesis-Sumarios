// src/hooks/useSocket.ts
import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/hooks/useAuth'
import { getMe } from '@/services/auth.api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function useSocket() {
  const { user, isAuthenticated } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Desconectar si no está autenticado
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setSocket(null)
        setConnected(false)
      }
      return
    }

    // Obtener token de las cookies
    const connectSocket = async () => {
      try {
        // Verificar que el usuario esté autenticado
        await getMe()

        // Obtener token de las cookies
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        }

        const token = getCookie('token')

        const newSocket = io(API_URL.replace('/api', ''), {
          auth: {
            token: token || '',
          },
          withCredentials: true,
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
      } catch (error) {
        console.error('Error inicializando socket:', error)
      }
    }

    connectSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setSocket(null)
        setConnected(false)
      }
    }
  }, [isAuthenticated, user])

  return { socket, connected }
}

