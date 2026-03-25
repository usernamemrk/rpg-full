import { z } from 'zod'

export const LootTableSchema = z.object({
  mode: z.enum(['single_use', 'infinite']),
  guaranteed_min: z.number().int().min(0),
  entries: z.array(z.object({
    itemId: z.string(),
    quantity: z.object({ min: z.number().int().min(1), max: z.number().int().min(1) }),
    weight: z.number().min(0),
  })),
})

export type LootTable = z.infer<typeof LootTableSchema>

export interface LootedItem {
  itemId: string
  name: string
  type: string
  rarity: string
  quantity: number
  stats: Record<string, number>
}

function weightedPickWithoutReplacement(entries: LootTable['entries'], count: number): LootTable['entries'] {
  const pool = entries.filter(e => e.weight > 0)
  const picked: LootTable['entries'] = []
  const remaining = [...pool]

  for (let i = 0; i < count && remaining.length > 0; i++) {
    const totalWeight = remaining.reduce((s, e) => s + e.weight, 0)
    let r = Math.random() * totalWeight
    const idx = remaining.findIndex(e => { r -= e.weight; return r <= 0 })
    const chosen = remaining.splice(idx === -1 ? 0 : idx, 1)[0]
    picked.push(chosen)
  }
  return picked
}

export function rollLoot(table: LootTable, itemDb: { id: string; name: string; type: string; rarity: string; stats: any }[]): LootedItem[] {
  const active = table.entries.filter(e => e.weight > 0)
  const effectiveMin = Math.min(table.guaranteed_min, active.length)
  const picked = weightedPickWithoutReplacement(active, effectiveMin)

  return picked.map(entry => {
    const quantity = entry.quantity.min + Math.floor(Math.random() * (entry.quantity.max - entry.quantity.min + 1))
    const item = itemDb.find(i => i.id === entry.itemId)
    return {
      itemId: entry.itemId,
      name: item?.name ?? 'Unknown',
      type: item?.type ?? 'misc',
      rarity: item?.rarity ?? 'common',
      quantity,
      stats: item?.stats ?? {},
    }
  })
}
