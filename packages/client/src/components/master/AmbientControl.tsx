import { AmbientName } from '../../engine/AudioManager'

const AMBIENTS: AmbientName[] = ['floresta', 'caverna', 'cidade', 'dungeon', 'batalha', 'chuva']

interface Props { onSelect: (name: AmbientName) => void; current: AmbientName | null }

export default function AmbientControl({ onSelect, current }: Props) {
  return (
    <div>
      <b>Som Ambiente</b>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
        {AMBIENTS.map(a => (
          <button key={a} onClick={() => onSelect(a)}
            style={{ fontWeight: current === a ? 'bold' : 'normal', padding: '4px 8px' }}>
            {a}
          </button>
        ))}
      </div>
    </div>
  )
}
