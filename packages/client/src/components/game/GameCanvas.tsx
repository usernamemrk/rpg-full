import { useRef, useEffect } from 'react'
import { useGame } from '../../hooks/useGame'

interface Props { mapData?: any; style?: React.CSSProperties }

export default function GameCanvas({ mapData, style }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { load } = useGame(canvasRef)

  useEffect(() => { if (mapData) load(mapData) }, [mapData, load])

  return (
    <div style={{ position: 'relative', ...style }}>
      <canvas ref={canvasRef} width={800} height={600} style={{ display: 'block', background: '#111' }} />
    </div>
  )
}
