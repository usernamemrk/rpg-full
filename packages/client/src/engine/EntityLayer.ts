import { Camera } from './Camera'

export interface Entity {
  id: string
  x: number  // world pixels
  y: number
  color: string
  label?: string
}

export class EntityLayer {
  private entities = new Map<string, Entity>()

  upsert(entity: Entity) { this.entities.set(entity.id, entity) }
  remove(id: string) { this.entities.delete(id) }
  get(id: string) { return this.entities.get(id) }
  all() { return Array.from(this.entities.values()) }

  render(ctx: CanvasRenderingContext2D, camera: Camera, tileSize: number) {
    for (const e of this.entities.values()) {
      const { x, y } = camera.worldToScreen(e.x, e.y)
      ctx.fillStyle = e.color
      ctx.fillRect(x + 4, y + 4, tileSize - 8, tileSize - 8)
      if (e.label) {
        ctx.fillStyle = '#fff'
        ctx.font = '10px monospace'
        ctx.fillText(e.label, x + 2, y - 2)
      }
    }
  }
}
