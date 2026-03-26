import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const items = [
    { name: 'Espada Enferrujada', type: 'weapon', rarity: 'common', stats: { damage: 5 } },
    { name: 'Espada de Ferro', type: 'weapon', rarity: 'uncommon', stats: { damage: 10 } },
    { name: 'Espada Magica', type: 'weapon', rarity: 'rare', stats: { damage: 20 } },
    { name: 'Escudo de Madeira', type: 'armor', rarity: 'common', stats: { defense: 3 } },
    { name: 'Escudo de Ferro', type: 'armor', rarity: 'uncommon', stats: { defense: 8 } },
    { name: 'Pocao de Cura', type: 'potion', rarity: 'common', stats: { healing: 20 } },
    { name: 'Pocao de Cura Maior', type: 'potion', rarity: 'uncommon', stats: { healing: 50 } },
    { name: 'Ouro', type: 'gold', rarity: 'common', stats: { value: 1 } },
    { name: 'Elmo de Couro', type: 'armor', rarity: 'common', stats: { defense: 2 } },
    { name: 'Anel Magico', type: 'misc', rarity: 'rare', stats: { magic: 15 } },
  ]

  for (const item of items) {
    await prisma.item.upsert({
      where: { name: item.name },
      update: {},
      create: { ...item, stats: item.stats },
    })
  }
  console.log('Seed complete')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
