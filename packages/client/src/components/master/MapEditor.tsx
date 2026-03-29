import { useRef, useEffect, useState } from 'react'
import { TileMap } from '../../engine/TileMap'
import { TileSet } from '../../engine/TileSet'
import { Camera } from '../../engine/Camera'

type Tool = 'brush' | 'fill' | 'erase' | 'select'
type LayerName = 'ground' | 'objects' | 'overlay'

// Exported for testing
export function floodFill(grid: number[][], col: number, row: number, target: number, replacement: number): number[][] {
  if (target === replacement) return grid
  const result = grid.map(r => [...r])
  const rows = result.length, cols = result[0].length
  const stack = [[col, row]]
  while (stack.length) {
    const [c, r] = stack.pop()!
    if (c < 0 || c >= cols || r < 0 || r >= rows) continue
    if (result[r][c] !== target) continue
    result[r][c] = replacement
    stack.push([c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1])
  }
  return result
}

interface Props {
  tileMap: TileMap
  tileSet: TileSet
  onSave: (layers: ReturnType<TileMap['getLayers']>) => void
}

const TILE = 32
const PALETTE_TILES = 16  // show first 16 tiles in palette

export default function MapEditor({ tileMap, tileSet, onSave }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const camera = useRef(new Camera(800, 600))
  const [tool, setTool] = useState<Tool>('brush')
  const [layer, setLayer] = useState<LayerName>('ground')
  const [selectedTile, setSelectedTile] = useState(1)
  const [history, setHistory] = useState<ReturnType<TileMap['getLayers']>[]>([])
  const isDrawing = useRef(false)

  function render() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    tileMap.render(ctx, tileSet, camera.current)
    // grid overlay
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    for (let c = 0; c < tileMap.cols; c++) {
      for (let r = 0; r < tileMap.rows; r++) {
        const { x, y } = camera.current.worldToScreen(c * TILE, r * TILE)
        ctx.strokeRect(x, y, TILE, TILE)
      }
    }
  }

  useEffect(() => {
    let raf: number
    function loop() { render(); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  })

  function canvasToTile(e: React.MouseEvent) {
    const rect = canvasRef.current!.getBoundingClientRect()
    const world = camera.current.screenToWorld(e.clientX - rect.left, e.clientY - rect.top)
    return { col: Math.floor(world.x / TILE), row: Math.floor(world.y / TILE) }
  }

  function paint(e: React.MouseEvent) {
    const { col, row } = canvasToTile(e)
    if (tool === 'brush') tileMap.setTileAt(layer, col, row, selectedTile)
    else if (tool === 'erase') tileMap.setTileAt(layer, col, row, 0)
    else if (tool === 'fill') {
      const current = tileMap.getTileAt(layer, col, row)
      if (current < 0) return
      const layers = tileMap.getLayers()
      const filled = floodFill(layers[layer], col, row, current, selectedTile)
      for (let r = 0; r < tileMap.rows; r++)
        for (let c = 0; c < tileMap.cols; c++)
          tileMap.setTileAt(layer, c, r, filled[r][c])
    }
  }

  function pushHistory() {
    setHistory(h => [...h.slice(-49), tileMap.getLayers()])
  }

  function undo() {
    if (!history.length) return
    const prev = history[history.length - 1]
    setHistory(h => h.slice(0, -1))
    for (const l of ['ground', 'objects', 'overlay'] as LayerName[])
      for (let r = 0; r < tileMap.rows; r++)
        for (let c = 0; c < tileMap.cols; c++)
          tileMap.setTileAt(l, c, r, prev[l][r][c])
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 120 }}>
        <b>Ferramenta</b>
        {(['brush', 'fill', 'erase'] as Tool[]).map(t => (
          <button key={t} onClick={() => setTool(t)} style={{ fontWeight: tool === t ? 'bold' : 'normal' }}>{t}</button>
        ))}
        <b>Camada</b>
        {(['ground', 'objects', 'overlay'] as LayerName[]).map(l => (
          <button key={l} onClick={() => setLayer(l)} style={{ fontWeight: layer === l ? 'bold' : 'normal' }}>{l}</button>
        ))}
        <b>Tile: {selectedTile}</b>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 24px)', gap: 2 }}>
          {Array.from({ length: PALETTE_TILES }, (_, i) => (
            <div key={i + 1} onClick={() => setSelectedTile(i + 1)}
              style={{ width: 24, height: 24, border: selectedTile === i + 1 ? '2px solid var(--ember)' : '1px solid var(--rune-border)', cursor: 'pointer', background: `hsl(${((i + 1) * 37) % 360},55%,38%)` }} />
          ))}
        </div>
        <button onClick={undo}>Desfazer</button>
        <button onClick={() => onSave(tileMap.getLayers())}>Salvar</button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef} width={800} height={600}
        style={{ background: '#222', cursor: 'crosshair' }}
        onMouseDown={e => { pushHistory(); isDrawing.current = true; paint(e) }}
        onMouseMove={e => { if (isDrawing.current) paint(e) }}
        onMouseUp={() => { isDrawing.current = false }}
        onMouseLeave={() => { isDrawing.current = false }}
      />
    </div>
  )
}
