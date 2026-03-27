import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'
import { AudioManager, AmbientName } from '../engine/AudioManager'
import { SpellFX } from '../engine/SpellFX'
import MapEditor from '../components/master/MapEditor'
import AmbientControl from '../components/master/AmbientControl'
import { apiFetch } from '../lib/api'
import { TileMap } from '../engine/TileMap'
import { TileSet } from '../engine/TileSet'

const audioManager = new AudioManager()
const spellFX = new SpellFX()

export default function MasterPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { token } = useAuth()
  const { emit, on } = useSocket(token)
  const nav = useNavigate()
  const [mapData, setMapData] = useState<any>(null)
  const [tileMap, setTileMap] = useState<TileMap | null>(null)
  const [tileSet] = useState(new TileSet())
  const [currentAmbient, setCurrentAmbient] = useState<AmbientName | null>(null)
  const [sessionCode, setSessionCode] = useState<string | null>(null)
  const [savingMap, setSavingMap] = useState(false)

  useEffect(() => {
    if (!token || !sessionId) return
    apiFetch<{ id: string; code: string; map: any }>(`/sessions/${sessionId}`, {}, token).then(s => {
      setSessionCode(s.code)
      setMapData(s.map)
    }).catch(() => {})
  }, [token, sessionId])

  useEffect(() => {
    if (!mapData) return
    const tm = new TileMap(mapData.layers, 32)
    tileSet.load(`/assets/tilesets/${mapData.tilesetId}.png`, 32).then(() => setTileMap(tm))
  }, [mapData, tileSet])

  async function handleSave(layers: any) {
    setSavingMap(true)
    try {
      await apiFetch(`/maps/${mapData.id}`, { method: 'POST', body: JSON.stringify({ layers, sessionId }) }, token!)
    } finally {
      setSavingMap(false)
    }
  }

  async function handleAmbient(name: AmbientName) {
    audioManager.resume()
    await audioManager.crossfadeTo(name)
    setCurrentAmbient(name)
    await apiFetch(`/sessions/${sessionId}/ambient`, { method: 'POST', body: JSON.stringify({ ambient: name }) }, token!)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--void)', position: 'relative' }}>
      <div className="bg-atmo" style={{ opacity: 0.6 }} />

      {/* Header */}
      <header style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px',
        borderBottom: '1px solid var(--rune-border)',
        background: 'rgba(7,7,11,0.85)',
        backdropFilter: 'blur(6px)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => nav('/lobby')}>← Lobby</button>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--ember)', letterSpacing: '0.06em' }}>
            Painel do Mestre
          </span>
        </div>
        {sessionCode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--parchment-dim)' }}>
              Código da Sessão
            </span>
            <span style={{
              fontFamily: 'var(--font-heading)', fontSize: '1.1rem', letterSpacing: '0.22em',
              color: 'var(--ember-bright)', background: 'rgba(196,137,14,0.1)',
              border: '1px solid var(--ember-dim)', padding: '4px 12px',
            }}>
              {sessionCode}
            </span>
          </div>
        )}
        {savingMap && (
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.55rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ember-dim)' }}>
            Salvando...
          </span>
        )}
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', zIndex: 10, overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside style={{
          width: 220, flexShrink: 0,
          background: 'rgba(10,10,18,0.92)',
          borderRight: '1px solid var(--rune-border)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}>
          <AmbientControl onSelect={handleAmbient} current={currentAmbient} />

          <div className="panel-section" style={{ flex: 1 }}>
            <div className="section-title">Controles</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn btn-sm btn-full" onClick={() => handleSave(mapData?.layers ?? [])}>
                Salvar Mapa
              </button>
            </div>
          </div>
        </aside>

        {/* Map area */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 24, overflowY: 'auto' }}>
          {tileMap && tileSet ? (
            <MapEditor tileMap={tileMap} tileSet={tileSet} onSave={handleSave} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--parchment-dim)', fontFamily: 'var(--font-body)', fontSize: '1rem' }}>
              {mapData ? 'Carregando mapa...' : 'Aguardando dados da sessão...'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
