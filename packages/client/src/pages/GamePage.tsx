import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'
import { useGame } from '../hooks/useGame'
import { AudioManager, AmbientName } from '../engine/AudioManager'
import { SpellFX } from '../engine/SpellFX'
import HUD from '../components/game/HUD'

const audioManager = new AudioManager()
const spellFX = new SpellFX()

export default function GamePage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { token, characterId } = useAuth()
  const { emit, on } = useSocket(token)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { camera, entities, tileMap, load } = useGame(canvasRef)
  const [players, setPlayers] = useState<any[]>([])

  useEffect(() => {
    const offPlayers = on<{ players: any[] }>('session:players', ({ players }) => {
      setPlayers(players)
      for (const p of players) {
        entities.upsert({ id: p.characterId, x: p.x, y: p.y, color: '#4af', label: p.characterId.slice(0, 4) })
      }
    })

    const offAmbient = on<{ ambient: AmbientName }>('ambient:change', async ({ ambient }) => {
      audioManager.resume()
      await audioManager.crossfadeTo(ambient)
    })

    const offSpell = on<any>('spell:effect', ({ spellId, originX, originY, targetX, targetY }) => {
      if (spellId === 'lightning') spellFX.lightning(originX, originY, targetX, targetY, camera)
      else if (spellId === 'explosion') spellFX.explosion(targetX, targetY, camera, 64)
      else if (spellId === 'healing') spellFX.healing(targetX, targetY, camera)
    })

    return () => { offPlayers(); offAmbient(); offSpell() }
  }, [on, entities, camera])

  function handleKeyDown(e: React.KeyboardEvent) {
    const local = players.find(p => p.characterId === characterId)
    if (!local) return
    const STEP = 32
    let { x, y } = local
    let direction = local.direction ?? 'down'
    if (e.key === 'ArrowUp') { y -= STEP; direction = 'up' }
    else if (e.key === 'ArrowDown') { y += STEP; direction = 'down' }
    else if (e.key === 'ArrowLeft') { x -= STEP; direction = 'left' }
    else if (e.key === 'ArrowRight') { x += STEP; direction = 'right' }
    emit('player:move', { x, y, direction })
    camera.follow(x, y)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} tabIndex={0} onKeyDown={handleKeyDown}>
      <canvas ref={canvasRef} width={800} height={600} style={{ display: 'block', background: '#111' }} />
      <HUD tileMap={tileMap.current} camera={camera} players={players.map(p => ({ userId: p.userId ?? p.characterId, x: p.x, y: p.y, class: p.class ?? 'warrior', isLocal: p.characterId === characterId }))} isGM={false} />
    </div>
  )
}
