import { AmbientName } from '../../engine/AudioManager'

const AMBIENTS: { name: AmbientName; icon: string; label: string }[] = [
  { name: 'floresta',  icon: '🌿', label: 'Floresta'  },
  { name: 'caverna',   icon: '🕯',  label: 'Caverna'   },
  { name: 'cidade',    icon: '🏰', label: 'Cidade'    },
  { name: 'dungeon',   icon: '💀', label: 'Dungeon'   },
  { name: 'batalha',   icon: '⚔',  label: 'Batalha'   },
  { name: 'chuva',     icon: '🌧', label: 'Chuva'     },
]

interface Props { onSelect: (name: AmbientName) => void; current: AmbientName | null }

export default function AmbientControl({ onSelect, current }: Props) {
  return (
    <div className="panel-section">
      <div className="section-title">Som Ambiente</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {AMBIENTS.map(({ name, icon, label }) => {
          const active = current === name
          return (
            <button
              key={name}
              onClick={() => onSelect(name)}
              style={{
                background: active ? 'rgba(196,137,14,0.15)' : 'rgba(8,8,16,0.5)',
                border: `1px solid ${active ? 'var(--ember)' : 'var(--rune-border)'}`,
                color: active ? 'var(--ember-bright)' : 'var(--parchment-dim)',
                padding: '8px 4px',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                transition: 'all 0.2s',
                boxShadow: active ? '0 0 12px rgba(196,137,14,0.2)' : 'none',
              }}
            >
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{icon}</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
