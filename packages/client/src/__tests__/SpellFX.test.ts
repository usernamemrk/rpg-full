// packages/client/src/__tests__/SpellFX.test.ts
import { SpellFX } from '../engine/SpellFX'
import { Camera } from '../engine/Camera'

vi.mock('phaser', () => ({
  default: {
    CANVAS: 1,
    Game: vi.fn(),
  },
}))

function makePhaserGameMock() {
  return vi.fn().mockImplementation(function(config: any) {
    const scene = {
      add: {
        graphics: () => ({
          clear: vi.fn(),
          lineStyle: vi.fn(),
          strokeCircle: vi.fn(),
          beginPath: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          strokePath: vi.fn(),
          fillStyle: vi.fn(),
          fillCircle: vi.fn(),
        }),
      },
      time: {
        addEvent: vi.fn(),
      },
    }
    config.scene.create.call(scene)
    return { destroy: vi.fn() }
  })
}

beforeEach(async () => {
  document.body.appendChild = vi.fn().mockReturnValue(undefined)
  const mockCanvas = {
    width: 800, height: 600, style: { cssText: '' },
    getContext: vi.fn(),
    remove: vi.fn(),
  }
  vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any)

  const phaser = await import('phaser')
  ;(phaser.default as any).Game = makePhaserGameMock()
})

afterEach(() => { vi.restoreAllMocks() })

function makeCamera() {
  return new Camera(800, 600)
}

test('SpellFX instantiates without loading Phaser', () => {
  const fx = new SpellFX()
  expect(fx).toBeTruthy()
})

test('explosion resolves without error', async () => {
  const fx = new SpellFX()
  await expect(fx.explosion(0, 0, makeCamera(), 64)).resolves.toBeUndefined()
})

test('lightning resolves without error', async () => {
  const fx = new SpellFX()
  await expect(fx.lightning(0, 0, 100, 100, makeCamera())).resolves.toBeUndefined()
})

test('healing resolves without error', async () => {
  const fx = new SpellFX()
  await expect(fx.healing(0, 0, makeCamera())).resolves.toBeUndefined()
})
