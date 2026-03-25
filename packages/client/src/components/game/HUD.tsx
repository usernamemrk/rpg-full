import { useRef, useEffect } from 'react'
import { Minimap, MinimapPlayer } from '../../engine/Minimap'
import { TileMap } from '../../engine/TileMap'
import { Camera } from '../../engine/Camera'

interface Props {
  tileMap: TileMap | null
  camera: Camera
  players: MinimapPlayer[]
  isGM: boolean
  onMinimapClick?: (worldX: number, worldY: number) => void
}

const mm = new Minimap(150, 150)

export default function HUD({ tileMap, camera, players, isGM, onMinimapClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!tileMap) return
    const TILE = tileMap.tileSize
    mm.setMapSize(tileMap.cols * TILE, tileMap.rows * TILE)
    let raf: number
    function loop() {
      const ctx = canvasRef.current?.getContext('2d')
      if (ctx) mm.render(ctx, tileMap!, camera, players, isGM)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [tileMap, camera, players, isGM])

  function handleClick(e: React.MouseEvent) {
    if (!isGM || !onMinimapClick) return
    const rect = canvasRef.current!.getBoundingClientRect()
    const { x, y } = mm.minimapToWorld(e.clientX - rect.left, e.clientY - rect.top)
    onMinimapClick(x, y)
  }

  return (
    <div style={{ position: 'absolute', bottom: 8, right: 8 }}>
      <canvas
        ref={canvasRef} width={150} height={150}
        style={{ border: '2px solid #555', cursor: isGM ? 'crosshair' : 'default' }}
        onClick={handleClick}
      />
    </div>
  )
}
