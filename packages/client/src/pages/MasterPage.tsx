import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
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
  const [mapData, setMapData] = useState<any>(null)
  const [tileMap, setTileMap] = useState<TileMap | null>(null)
  const [tileSet] = useState(new TileSet())
  const [currentAmbient, setCurrentAmbient] = useState<AmbientName | null>(null)

  useEffect(() => {
    if (!mapData) return
    const tm = new TileMap(mapData.layers, 32)
    tileSet.load(`/assets/tilesets/${mapData.tilesetId}.png`, 32).then(() => setTileMap(tm))
  }, [mapData, tileSet])

  async function handleSave(layers: any) {
    await apiFetch(`/maps/${mapData.id}`, { method: 'POST', body: JSON.stringify({ layers, sessionId }) }, token!)
  }

  async function handleAmbient(name: AmbientName) {
    audioManager.resume()
    await audioManager.crossfadeTo(name)
    setCurrentAmbient(name)
    await apiFetch(`/sessions/${sessionId}/ambient`, { method: 'POST', body: JSON.stringify({ ambient: name }) }, token!)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16 }}>
      <h2>Painel do Mestre</h2>
      <AmbientControl onSelect={handleAmbient} current={currentAmbient} />
      {tileMap && tileSet && (
        <MapEditor tileMap={tileMap} tileSet={tileSet} onSave={handleSave} />
      )}
    </div>
  )
}
