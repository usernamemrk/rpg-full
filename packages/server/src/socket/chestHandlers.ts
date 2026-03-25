import { Server, Socket } from 'socket.io'
import { prisma } from '../lib/prisma'
import { sessionStates } from './sessionHandlers'
import { rollLoot, LootTableSchema } from '../game/LootService'

const TILE_SIZE = 32

function chebyshev(ax: number, ay: number, bx: number, by: number) {
  return Math.max(Math.abs(Math.floor(ax / TILE_SIZE) - bx), Math.abs(Math.floor(ay / TILE_SIZE) - by))
}

export function registerChestHandlers(io: Server, socket: Socket) {
  socket.on('chest:open', async ({ chestId }: { chestId: string }) => {
    const { sessionId, characterId } = socket.data
    if (!sessionId) return

    const state = sessionStates.get(sessionId)
    const player = state?.players.find((p: any) => p.characterId === characterId)
    if (!player) return

    const chest = await prisma.chest.findUnique({ where: { id: chestId } })
    if (!chest) return

    // Adjacency check
    if (chebyshev(player.x, player.y, chest.x, chest.y) > 1) return

    const tableResult = LootTableSchema.safeParse(chest.lootTable)
    if (!tableResult.success) return
    const table = tableResult.data

    if (table.mode === 'single_use') {
      const existing = await prisma.chestState.findUnique({
        where: { sessionId_chestId: { sessionId, chestId } }
      })
      if (existing?.opened) return
      await prisma.chestState.upsert({
        where: { sessionId_chestId: { sessionId, chestId } },
        create: { sessionId, chestId, opened: true },
        update: { opened: true },
      })
    }

    const allItems = await prisma.item.findMany()
    const loot = rollLoot(table, allItems)

    // Save to inventory
    for (const item of loot) {
      await prisma.inventoryItem.upsert({
        where: { characterId_itemId: { characterId, itemId: item.itemId } },
        create: { characterId, itemId: item.itemId, quantity: item.quantity },
        update: { quantity: { increment: item.quantity } },
      })
    }

    socket.emit('chest:loot', { chestId, items: loot })
    io.to(`session:${sessionId}`).emit('chest:opened', { chestId })
  })
}
