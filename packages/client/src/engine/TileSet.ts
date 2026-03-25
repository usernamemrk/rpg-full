export class TileSet {
  image: HTMLImageElement | null = null
  tilesPerRow = 0

  async load(src: string, tileSize: number) {
    return new Promise<void>((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        this.image = img
        this.tilesPerRow = Math.floor(img.width / tileSize)
        resolve()
      }
      img.onerror = reject
      img.src = src
    })
  }

  drawTile(ctx: CanvasRenderingContext2D, index: number, dx: number, dy: number, tileSize: number) {
    if (!this.image || index <= 0) return
    const sx = ((index - 1) % this.tilesPerRow) * tileSize
    const sy = Math.floor((index - 1) / this.tilesPerRow) * tileSize
    ctx.drawImage(this.image, sx, sy, tileSize, tileSize, dx, dy, tileSize, tileSize)
  }
}
