export class Camera {
  x = 0
  y = 0
  zoom = 1
  private mapW = Infinity
  private mapH = Infinity

  constructor(public viewW: number, public viewH: number) {}

  setMapBounds(mapPixelW: number, mapPixelH: number) {
    this.mapW = mapPixelW
    this.mapH = mapPixelH
  }

  moveTo(x: number, y: number) {
    this.x = Math.max(0, Math.min(x, this.mapW - this.viewW))
    this.y = Math.max(0, Math.min(y, this.mapH - this.viewH))
  }

  follow(worldX: number, worldY: number) {
    this.moveTo(worldX - this.viewW / 2, worldY - this.viewH / 2)
  }

  worldToScreen(worldX: number, worldY: number) {
    return { x: (worldX - this.x) * this.zoom, y: (worldY - this.y) * this.zoom }
  }

  screenToWorld(screenX: number, screenY: number) {
    return { x: screenX / this.zoom + this.x, y: screenY / this.zoom + this.y }
  }
}
