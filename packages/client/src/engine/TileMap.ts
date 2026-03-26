import { Camera } from './Camera'
import { TileSet } from './TileSet'

type LayerName = 'ground' | 'objects' | 'overlay'
interface Layers { ground: number[][]; objects: number[][]; overlay: number[][] }

export class TileMap {
  private layers: Layers
  readonly cols: number
  readonly rows: number

  constructor(layers: Layers, public tileSize: number) {
    this.layers = JSON.parse(JSON.stringify(layers)) // defensive copy
    this.rows = layers.ground.length
    this.cols = layers.ground[0]?.length ?? 0
  }

  getTileAt(layer: LayerName, col: number, row: number): number {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return -1
    return this.layers[layer][row][col]
  }

  setTileAt(layer: LayerName, col: number, row: number, value: number) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return
    this.layers[layer][row][col] = value
  }

  getLayers(): Layers {
    return JSON.parse(JSON.stringify(this.layers))
  }

  render(ctx: CanvasRenderingContext2D, tileSet: TileSet, camera: Camera) {
    const { tileSize } = this
    const startCol = Math.floor(camera.x / tileSize)
    const startRow = Math.floor(camera.y / tileSize)
    const endCol = Math.min(startCol + Math.ceil(camera.viewW / tileSize) + 1, this.cols)
    const endRow = Math.min(startRow + Math.ceil(camera.viewH / tileSize) + 1, this.rows)

    for (const layer of ['ground', 'objects', 'overlay'] as LayerName[]) {
      for (let row = startRow; row < endRow; row++) {
        for (let col = startCol; col < endCol; col++) {
          const tile = this.layers[layer][row][col]
          if (tile <= 0) continue
          const { x, y } = camera.worldToScreen(col * tileSize, row * tileSize)
          tileSet.drawTile(ctx, tile, x, y, tileSize)
        }
      }
    }
  }
}
