import { useState, useCallback } from 'react'
import { apiFetch } from '../lib/api'

interface AuthState { token: string | null; userId: string | null; characterId: string | null }

function parseJwt(token: string) {
  try { return JSON.parse(atob(token.split('.')[1])) } catch { return null }
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ token: null, userId: null, characterId: null })

  const login = useCallback(async (email: string, password: string) => {
    const { accessToken } = await apiFetch<{ accessToken: string }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    })
    const payload = parseJwt(accessToken)
    setState({ token: accessToken, userId: payload?.sub ?? null, characterId: payload?.characterId ?? null })
    return accessToken
  }, [])

  const register = useCallback(async (email: string, password: string, name: string) => {
    const { accessToken } = await apiFetch<{ accessToken: string }>('/auth/register', {
      method: 'POST', body: JSON.stringify({ email, password, name }),
    })
    const payload = parseJwt(accessToken)
    setState({ token: accessToken, userId: payload?.sub ?? null, characterId: payload?.characterId ?? null })
    return accessToken
  }, [])

  const logout = useCallback(async () => {
    await apiFetch('/auth/logout', { method: 'POST' }, state.token ?? undefined)
    setState({ token: null, userId: null, characterId: null })
  }, [state.token])

  return { ...state, isAuthenticated: !!state.token, login, register, logout }
}
