import { useState, useEffect } from 'react'
import { apiFetch } from '../../lib/api'

interface Item { id: string; name: string; type: string; rarity: string; stats: Record<string, unknown> }
interface InventoryEntry { id: string; quantity: number; item: Item }

const RARITY_COLOR: Record<string, string> = {
  common: 'var(--parchment-dim)',
  uncommon: '#5a9a5a',
  rare: 'var(--ember)',
  epic: '#9966cc',
  legendary: '#e8c820',
}

interface Props { characterId: string; token: string; open: boolean; onClose: () => void }

export default function InventoryPanel({ characterId, token, open, onClose }: Props) {
  const [items, setItems] = useState<InventoryEntry[] | null>(null)

  useEffect(() => {
    if (!open || items !== null) return
    apiFetch<InventoryEntry[]>(`/inventory/${characterId}`, {}, token)
      .then(setItems)
      .catch(() => setItems([]))
  }, [open, characterId, token, items])

  if (!open) return null

  return (
    <div style={{
      position: 'absolute', bottom: 16, left: 16, width: 260,
      maxHeight: 380, overflowY: 'auto',
      background: 'rgba(10,10,18,0.95)',
      border: '1px solid var(--rune-border)',
      zIndex: 20,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 14px', borderBottom: '1px solid var(--rune-border)',
      }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ember-dim)' }}>
          Inventário
        </span>
        <button
          aria-label="×"
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--parchment-dim)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0 2px' }}
        >
          ×
        </button>
      </div>
      <div style={{ padding: '8px 0' }}>
        {items === null && (
          <div style={{ padding: '12px 14px', fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--parchment-dim)' }}>
            Carregando...
          </div>
        )}
        {items !== null && items.length === 0 && (
          <div style={{ padding: '12px 14px', fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--parchment-dim)' }}>
            Nenhum item encontrado.
          </div>
        )}
        {items !== null && items.map(entry => (
          <div key={entry.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '7px 14px', borderBottom: '1px solid rgba(196,137,14,0.07)',
          }}>
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: 'var(--parchment)' }}>
                {entry.item.name}
              </div>
              <div style={{ display: 'flex', gap: 5, marginTop: 3 }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--parchment-dim)', background: 'rgba(255,255,255,0.06)', padding: '1px 5px' }}>
                  {entry.item.type}
                </span>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: RARITY_COLOR[entry.item.rarity] ?? 'var(--parchment-dim)', background: 'rgba(255,255,255,0.06)', padding: '1px 5px' }}>
                  {entry.item.rarity}
                </span>
              </div>
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.65rem', color: 'var(--parchment-dim)', minWidth: 24, textAlign: 'right' }}>
              ×{entry.quantity}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
