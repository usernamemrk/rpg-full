import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../hooks/useAuth'

global.fetch = vi.fn()

describe('useAuth', () => {
  it('starts unauthenticated', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })
})
