import { TileSet } from '../engine/TileSet'

function mockCtx() {
  return {
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: '',
    textBaseline: '',
  } as unknown as CanvasRenderingContext2D
}

describe('TileSet.drawTile', () => {
  it('draws nothing for tile index 0 (empty tile)', () => {
    const ts = new TileSet()
    const ctx = mockCtx()
    ts.drawTile(ctx, 0, 0, 0, 32)
    expect(ctx.fillRect).not.toHaveBeenCalled()
    expect(ctx.drawImage).not.toHaveBeenCalled()
  })

  it('draws colored rect fallback when no image loaded', () => {
    const ts = new TileSet()
    const ctx = mockCtx()
    ts.drawTile(ctx, 1, 10, 20, 32)
    expect(ctx.fillRect).toHaveBeenCalledWith(10, 20, 32, 32)
    expect(ctx.drawImage).not.toHaveBeenCalled()
  })

  it('uses correct hue for tile index 3: hsl(111, 55%, 38%)', () => {
    const ts = new TileSet()
    const ctx = mockCtx()
    ts.drawTile(ctx, 3, 0, 0, 32)
    expect(ctx.fillStyle).toBe('hsl(111, 55%, 38%)')
  })

  it('calls drawImage when image is loaded', () => {
    const ts = new TileSet()
    ts.image = { width: 128 } as HTMLImageElement
    ts.tilesPerRow = 4
    const ctx = mockCtx()
    ts.drawTile(ctx, 1, 0, 0, 32)
    expect(ctx.drawImage).toHaveBeenCalled()
    expect(ctx.fillRect).not.toHaveBeenCalled()
  })
})
