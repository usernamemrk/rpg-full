import { useEffect, useRef, useCallback } from 'react'
import { Socket } from 'socket.io-client'
import { getSocket } from '../lib/socket'

interface UseSocketReturn {
  socket: Socket | null
  emit: <T>(event: string, data?: T) => void
  on: <T>(event: string, handler: (data: T) => void) => () => void
}

export function useSocket(token: string | null): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!token) return
    socketRef.current = getSocket(token)
    return () => { /* keep socket alive between page navigations */ }
  }, [token])

  const emit = useCallback(<T,>(event: string, data?: T) => {
    socketRef.current?.emit(event, data)
  }, [])

  const on = useCallback(<T,>(event: string, handler: (data: T) => void) => {
    socketRef.current?.on(event, handler)
    return () => { socketRef.current?.off(event, handler) }
  }, [])

  return { socket: socketRef.current, emit, on }
}
