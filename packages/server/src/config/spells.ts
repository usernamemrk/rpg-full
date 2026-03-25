export interface SpellDefinition {
  id: string
  name: string
  damage?: number
  healing?: number
  range: number
  fxType: 'lightning' | 'explosion' | 'healing'
}

export const SPELLS: SpellDefinition[] = [
  { id: 'lightning', name: 'Raio', damage: 35, range: 8, fxType: 'lightning' },
  { id: 'explosion', name: 'Explosao', damage: 50, range: 5, fxType: 'explosion' },
  { id: 'healing', name: 'Cura', healing: 30, range: 3, fxType: 'healing' },
]
