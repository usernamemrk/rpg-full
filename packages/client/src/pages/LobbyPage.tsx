import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { apiFetch } from '../lib/api'

interface MapOption { id: string; name: string; width: number; height: number; tilesetId: string }

export default function LobbyPage() {
  const { token, logout } = useAuth()
  const nav = useNavigate()
  const [maps, setMaps] = useState<MapOption[]>([])
  const [selectedMap, setSelectedMap] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'gm' | 'player'>('player')

  // New map form
  const [showNewMap, setShowNewMap] = useState(false)
  const [newMapName, setNewMapName] = useState('')
  const [newMapW, setNewMapW] = useState(20)
  const [newMapH, setNewMapH] = useState(20)
  const [mapError, setMapError] = useState('')
  const [mapLoading, setMapLoading] = useState(false)

  function loadMaps() {
    if (!token) return
    apiFetch<MapOption[]>('/maps', {}, token).then(m => {
      setMaps(m)
      if (m.length > 0 && !selectedMap) setSelectedMap(m[0].id)
    }).catch(() => {})
  }

  useEffect(() => { loadMaps() }, [token])

  async function handleCreateMap() {
    if (!newMapName.trim()) { setMapError('Nome obrigatório'); return }
    setMapError(''); setMapLoading(true)
    try {
      const m = await apiFetch<MapOption>('/maps', {
        method: 'POST',
        body: JSON.stringify({ name: newMapName.trim(), width: newMapW, height: newMapH }),
      }, token!)
      setMaps(prev => [m, ...prev])
      setSelectedMap(m.id)
      setShowNewMap(false)
      setNewMapName('')
    } catch (e: unknown) {
      setMapError(e instanceof Error ? e.message : String(e))
    } finally { setMapLoading(false) }
  }

  async function handleCreateSession() {
    if (!selectedMap) { setError('Seleciona um mapa primeiro'); return }
    setError(''); setLoading(true)
    try {
      const session = await apiFetch<{ id: string }>('/sessions', {
        method: 'POST',
        body: JSON.stringify({ mapId: selectedMap }),
      }, token!)
      nav(`/master/${session.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally { setLoading(false) }
  }

  async function handleJoinSession() {
    if (!joinCode.trim()) { setError('Digite o código da sessão'); return }
    setError(''); setLoading(true)
    try {
      const session = await apiFetch<{ id: string }>(`/sessions/code/${joinCode.trim().toUpperCase()}`, {}, token!)
      nav(`/game/${session.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally { setLoading(false) }
  }

  async function handleLogout() {
    await logout()
    nav('/')
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div className="bg-atmo" />
      <div className="bg-vignette" />

      {/* Top bar */}
      <header style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 28px',
        borderBottom: '1px solid var(--rune-border)',
        background: 'rgba(7,7,11,0.7)',
        backdropFilter: 'blur(6px)',
      }}>
        <div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--ember)', letterSpacing: '0.08em' }}>
            VOID GRIMOIRE
          </span>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.55rem', letterSpacing: '0.18em', color: 'var(--parchment-dim)', display: 'block', textTransform: 'uppercase', marginTop: 1 }}>
            Taverna dos Aventureiros
          </span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sair</button>
      </header>

      <main style={{ position: 'relative', zIndex: 10, maxWidth: 820, margin: '0 auto', padding: '48px 20px' }}>
        <h1 className="anim-up" style={{ fontFamily: 'var(--font-heading)', fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--ember-dim)', marginBottom: 36 }}>
          Escolha seu Destino
        </h1>

        {/* Tab toggle */}
        <div className="anim-up anim-del1" style={{ display: 'flex', gap: 0, marginBottom: 32, borderBottom: '1px solid var(--rune-border)' }}>
          {([['player', 'Aventureiro — Entrar em Sessão'], ['gm', 'Mestre — Criar Sessão']] as const).map(([t, label]) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError('') }}
              style={{
                background: 'transparent', border: 'none',
                borderBottom: tab === t ? '2px solid var(--ember)' : '2px solid transparent',
                color: tab === t ? 'var(--ember-bright)' : 'var(--parchment-dim)',
                fontFamily: 'var(--font-heading)', fontSize: '0.6rem',
                letterSpacing: '0.16em', textTransform: 'uppercase',
                padding: '0 24px 14px', cursor: 'pointer', transition: 'all 0.2s', marginBottom: -1,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'player' && (
          <div className="ornate anim-up anim-del2" style={{ padding: '32px', maxWidth: 460 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ember-dim)', marginBottom: 8 }}>
              Código da Sessão
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--parchment-dim)', marginBottom: 16, lineHeight: 1.5 }}>
              O Mestre compartilha um código de 6 caracteres. Digite abaixo para entrar na aventura.
            </p>
            <label className="input-label">Código</label>
            <input
              className="input"
              placeholder="EX: ABCD12"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              maxLength={8}
              style={{ letterSpacing: '0.22em', fontFamily: 'var(--font-heading)', fontSize: '1.1rem', textAlign: 'center', marginBottom: 20 }}
              onKeyDown={e => e.key === 'Enter' && handleJoinSession()}
            />
            {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
            <button className="btn btn-primary btn-full" onClick={handleJoinSession} disabled={loading}>
              {loading ? '...' : 'Cruzar o Portal'}
            </button>
          </div>
        )}

        {tab === 'gm' && (
          <div className="anim-up anim-del2" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 520 }}>
            {/* Map picker */}
            <div className="ornate" style={{ padding: '28px' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ember-dim)', marginBottom: 16 }}>
                Escolher Mapa
              </div>

              {maps.length === 0 && !showNewMap && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--parchment-dim)', marginBottom: 16, lineHeight: 1.5 }}>
                  Nenhum mapa criado ainda. Crie seu primeiro mapa abaixo.
                </p>
              )}

              {maps.length > 0 && (
                <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
                  {maps.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMap(m.id)}
                      style={{
                        background: selectedMap === m.id ? 'rgba(196,137,14,0.12)' : 'rgba(8,8,16,0.6)',
                        border: `1px solid ${selectedMap === m.id ? 'var(--ember)' : 'var(--rune-border)'}`,
                        color: selectedMap === m.id ? 'var(--ember-bright)' : 'var(--parchment)',
                        padding: '10px 16px', cursor: 'pointer', textAlign: 'left',
                        transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '1rem' }}>{m.name}</span>
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.55rem', letterSpacing: '0.12em', color: 'var(--parchment-dim)' }}>
                        {m.width}×{m.height}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* New map toggle */}
              {!showNewMap ? (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowNewMap(true)}
                  style={{ width: '100%', borderStyle: 'dashed' }}
                >
                  + Criar novo mapa
                </button>
              ) : (
                <div style={{ background: 'rgba(8,8,16,0.6)', border: '1px solid var(--rune-border)', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.55rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ember-dim)' }}>
                    Novo Mapa
                  </div>
                  <div>
                    <label className="input-label">Nome</label>
                    <input
                      className="input"
                      placeholder="Ruínas de Etherhold..."
                      value={newMapName}
                      onChange={e => setNewMapName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreateMap()}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label className="input-label">Largura (tiles)</label>
                      <input
                        className="input"
                        type="number"
                        min={5} max={100}
                        value={newMapW}
                        onChange={e => setNewMapW(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="input-label">Altura (tiles)</label>
                      <input
                        className="input"
                        type="number"
                        min={5} max={100}
                        value={newMapH}
                        onChange={e => setNewMapH(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  {mapError && <div className="error-msg">{mapError}</div>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreateMap} disabled={mapLoading}>
                      {mapLoading ? '...' : 'Forjar Mapa'}
                    </button>
                    <button className="btn btn-ghost" onClick={() => { setShowNewMap(false); setMapError('') }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Create session */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {error && <div className="error-msg">{error}</div>}
              <button
                className="btn btn-primary btn-full"
                onClick={handleCreateSession}
                disabled={loading || !selectedMap}
              >
                {loading ? '...' : 'Abrir Portal'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
