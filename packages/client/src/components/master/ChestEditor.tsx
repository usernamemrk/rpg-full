import { useState, useEffect } from 'react'
import { apiFetch } from '../../lib/api'

interface Item { id: string; name: string; type: string; rarity: string }
interface Entry { itemId: string; quantity: { min: number; max: number }; weight: number }
interface LootTable { mode: 'single_use' | 'infinite'; guaranteed_min: number; entries: Entry[] }

interface Props {
  chestId: string
  initialTable: LootTable
  token: string
  onSave?: () => void
  onClose: () => void
}

export default function ChestEditor({ chestId, initialTable, token, onSave, onClose }: Props) {
  const [table, setTable] = useState<LootTable>(initialTable)
  const [items, setItems] = useState<Item[]>([])
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<Item[]>('/items', {}, token).then(setItems).catch(console.error)
  }, [token])

  function addEntry() {
    if (!items[0]) return
    setTable(t => ({ ...t, entries: [...t.entries, { itemId: items[0].id, quantity: { min: 1, max: 1 }, weight: 1 }] }))
  }

  function updateEntry(i: number, patch: Partial<Entry>) {
    setTable(t => ({ ...t, entries: t.entries.map((e, idx) => idx === i ? { ...e, ...patch } : e) }))
  }

  function removeEntry(i: number) {
    setTable(t => ({ ...t, entries: t.entries.filter((_, idx) => idx !== i) }))
  }

  return (
    <div style={{ padding: 16, background: '#333', border: '1px solid #666', borderRadius: 8, minWidth: 360 }}>
      <h3>Configurar Bau</h3>
      <label>Modo:
        <select value={table.mode} onChange={e => setTable(t => ({ ...t, mode: e.target.value as any }))}>
          <option value="single_use">Uma vez por sessao</option>
          <option value="infinite">Infinito</option>
        </select>
      </label>
      <br />
      <label>Minimo garantido:
        <input type="number" min={0} value={table.guaranteed_min}
          onChange={e => setTable(t => ({ ...t, guaranteed_min: +e.target.value }))} />
      </label>

      <table style={{ width: '100%', marginTop: 8 }}>
        <thead><tr><th>Item</th><th>Min</th><th>Max</th><th>Peso</th><th></th></tr></thead>
        <tbody>
          {table.entries.map((entry, i) => (
            <tr key={entry.itemId + '-' + i}>
              <td>
                <select value={entry.itemId} onChange={e => updateEntry(i, { itemId: e.target.value })}>
                  {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                </select>
              </td>
              <td><input type="number" min={1} value={entry.quantity.min}
                onChange={e => updateEntry(i, { quantity: { ...entry.quantity, min: +e.target.value } })} style={{ width: 50 }} /></td>
              <td><input type="number" min={1} value={entry.quantity.max}
                onChange={e => updateEntry(i, { quantity: { ...entry.quantity, max: +e.target.value } })} style={{ width: 50 }} /></td>
              <td><input type="number" min={0} value={entry.weight}
                onChange={e => updateEntry(i, { weight: +e.target.value })} style={{ width: 50 }} /></td>
              <td><button onClick={() => removeEntry(i)}>X</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button onClick={addEntry}>+ Item</button>
        <button onClick={async () => {
          try {
            await apiFetch(`/chests/${chestId}`, { method: 'PUT', body: JSON.stringify({ lootTable: table }) }, token)
            onSave?.()
            onClose()
          } catch (err: any) {
            setSaveError(err.message)
          }
        }}>Salvar</button>
        {saveError && <span style={{ color: 'red' }}>{saveError}</span>}
        <button onClick={onClose}>Cancelar</button>
      </div>
    </div>
  )
}
