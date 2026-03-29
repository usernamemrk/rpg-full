# Fundação Visual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix map rendering (procedural tile fallback), ambient sounds (Web Audio procedural), inventory (API + panel), and spell explosion effect.

**Architecture:** Four independent changes — TileSet fallback draws colored rects when no image; AudioManager generates tones via OfflineAudioContext; a new `/api/inventory/:characterId` route + InventoryPanel component; SpellFX explosion replaced with Graphics rings. No shared state between tasks.

**Tech Stack:** React 18, TypeScript, Vitest (jsdom), Canvas 2D, Web Audio API, Express, Prisma, Jest + supertest

---

## File Structure

```
packages/client/src/
  engine/
    TileSet.ts              ← modify: procedural drawTile fallback
    AudioManager.ts         ← modify: generateProcedural + async resume
    SpellFX.ts              ← modify: explosion → Graphics rings
  components/
    master/MapEditor.tsx    ← modify: palette hue formula
    game/InventoryPanel.tsx ← create: floating inventory UI
  pages/
    GamePage.tsx            ← modify: I-key toggle + InventoryPanel
  __tests__/
    TileSet.test.ts         ← create: drawTile fallback tests
    AudioManager.test.ts    ← modify: add generateProcedural test
    SpellFX.test.ts         ← modify: add explosion resolves test
    InventoryPanel.test.tsx ← create: renders items / empty / hidden

packages/server/src/
  api/inventory.ts          ← create: GET /:characterId
  app.ts                    ← modify: register /api/inventory route
  __tests__/inventory.test.ts ← create: 401 / 200 tests
```

---

## Task 1: TileSet procedural fallback

**Files:**
- Create: `packages/client/src/__tests__/TileSet.test.ts`
- Modify: `packages/client/src/engine/TileSet.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// packages/client/src/__tests__/TileSet.test.ts
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
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd packages/client && pnpm vitest run src/__tests__/TileSet.test.ts
```
Expected: 3–4 failures (drawTile not modified yet)

- [ ] **Step 3: Implement the fix in `TileSet.ts`**

Replace the entire `drawTile` method:

```typescript
drawTile(ctx: CanvasRenderingContext2D, index: number, dx: number, dy: number, tileSize: number) {
  if (index <= 0) return
  if (this.image) {
    const sx = ((index - 1) % this.tilesPerRow) * tileSize
    const sy = Math.floor((index - 1) / this.tilesPerRow) * tileSize
    ctx.drawImage(this.image, sx, sy, tileSize, tileSize, dx, dy, tileSize, tileSize)
    return
  }
  // Procedural fallback — colored rect when no tileset image loaded
  const hue = (index * 37) % 360
  ctx.fillStyle = `hsl(${hue}, 55%, 38%)`
  ctx.fillRect(dx, dy, tileSize, tileSize)
  ctx.strokeStyle = `hsl(${hue}, 55%, 28%)`
  ctx.lineWidth = 1
  ctx.strokeRect(dx + 0.5, dy + 0.5, tileSize - 1, tileSize - 1)
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = `${Math.floor(tileSize * 0.35)}px monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(index), dx + tileSize / 2, dy + tileSize / 2)
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd packages/client && pnpm vitest run src/__tests__/TileSet.test.ts
```
Expected: 4 passing

- [ ] **Step 5: Fix MapEditor palette hue to match**

In `packages/client/src/components/master/MapEditor.tsx`, find the palette div and change the background formula.

Find:
```tsx
style={{ width: 24, height: 24, border: selectedTile === i + 1 ? '2px solid yellow' : '1px solid #555', cursor: 'pointer', background: `hsl(${(i * 40) % 360},60%,40%)` }}
```

Replace with:
```tsx
style={{ width: 24, height: 24, border: selectedTile === i + 1 ? '2px solid var(--ember)' : '1px solid var(--rune-border)', cursor: 'pointer', background: `hsl(${((i + 1) * 37) % 360},55%,38%)` }}
```

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/engine/TileSet.ts \
        packages/client/src/components/master/MapEditor.tsx \
        packages/client/src/__tests__/TileSet.test.ts
git commit -m "fix: TileSet procedural fallback + palette hue alignment"
```

---

## Task 2: AudioManager procedural ambient

**Files:**
- Modify: `packages/client/src/engine/AudioManager.ts`
- Modify: `packages/client/src/__tests__/AudioManager.test.ts`

- [ ] **Step 1: Add failing tests**

Append to `packages/client/src/__tests__/AudioManager.test.ts`:

```typescript
describe('AudioManager procedural fallback', () => {
  beforeEach(() => {
    // Mock OfflineAudioContext for jsdom
    const mockBuffer = { duration: 4 } as AudioBuffer
    const mockOfflineCtx = {
      createOscillator: () => ({ frequency: { value: 0 }, type: 'sine', connect: vi.fn(), start: vi.fn() }),
      createGain: () => ({ gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() }, connect: vi.fn() }),
      createBiquadFilter: () => ({ type: '', frequency: { value: 0 }, Q: { value: 0 }, connect: vi.fn() }),
      createBuffer: (ch: number, len: number) => ({ getChannelData: () => new Float32Array(len) }),
      createBufferSource: () => ({ buffer: null, loop: false, connect: vi.fn(), start: vi.fn() }),
      destination: {},
      sampleRate: 44100,
      length: 44100 * 4,
      startRendering: vi.fn().mockResolvedValue(mockBuffer),
    }
    ;(globalThis as any).OfflineAudioContext = vi.fn(() => mockOfflineCtx)
  })

  it('sets currentAmbient after crossfadeTo even with no audio files', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as any
    const am = new AudioManager()
    // Mock the live AudioContext so start() doesn't fail
    am['_context'] = {
      createBufferSource: () => ({ buffer: null, loop: false, connect: vi.fn(), start: vi.fn() }),
      createGain: () => ({ gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() }, connect: vi.fn() }),
      currentTime: 0, destination: {}, state: 'running',
      resume: vi.fn().mockResolvedValue(undefined),
    } as any
    await am.crossfadeTo('floresta', 0)
    expect(am.currentAmbient).toBe('floresta')
  })

  it('caches procedural buffer so generateProcedural runs only once', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as any
    const am = new AudioManager()
    am['_context'] = {
      createBufferSource: () => ({ buffer: null, loop: false, connect: vi.fn(), start: vi.fn() }),
      createGain: () => ({ gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() }, connect: vi.fn() }),
      currentTime: 0, destination: {}, state: 'running',
      resume: vi.fn().mockResolvedValue(undefined),
    } as any
    await am.crossfadeTo('caverna', 0)
    await am.crossfadeTo('caverna', 0)
    // OfflineAudioContext constructor called only once for 'caverna'
    expect((globalThis as any).OfflineAudioContext).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd packages/client && pnpm vitest run src/__tests__/AudioManager.test.ts
```
Expected: 2 new failures

- [ ] **Step 3: Implement `AudioManager.ts` changes**

Replace the full file content:

```typescript
export type AmbientName = 'floresta' | 'caverna' | 'cidade' | 'dungeon' | 'batalha' | 'chuva'

const SAMPLE_RATE = 44100
const DURATION = 4  // seconds per looped buffer

export class AudioManager {
  private _context: AudioContext | null = null
  private buffers = new Map<string, AudioBuffer>()
  private currentSource: AudioBufferSourceNode | null = null
  private currentGain: GainNode | null = null
  currentAmbient: AmbientName | null = null
  private masterVolume = 1

  private get context(): AudioContext {
    if (!this._context) this._context = new AudioContext()
    return this._context
  }

  async resume() {
    if (this.context.state === 'suspended') await this.context.resume()
  }

  private async generateProcedural(name: AmbientName): Promise<AudioBuffer> {
    const frames = SAMPLE_RATE * DURATION
    const offline = new OfflineAudioContext(1, frames, SAMPLE_RATE)

    const masterGain = offline.createGain()
    masterGain.gain.value = 0.18
    masterGain.connect(offline.destination)

    if (name === 'floresta' || name === 'cidade' || name === 'chuva' || name === 'batalha') {
      // Noise source
      const noiseBuffer = offline.createBuffer(1, frames, SAMPLE_RATE)
      const data = noiseBuffer.getChannelData(0)
      for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1
      const noise = offline.createBufferSource()
      noise.buffer = noiseBuffer
      noise.loop = true

      const filter = offline.createBiquadFilter()
      if (name === 'floresta') { filter.type = 'lowpass'; filter.frequency.value = 600; filter.Q.value = 0.8 }
      else if (name === 'cidade') { filter.type = 'bandpass'; filter.frequency.value = 600; filter.Q.value = 1 }
      else if (name === 'chuva') { filter.type = 'lowpass'; filter.frequency.value = 1200; filter.Q.value = 0.5 }
      else if (name === 'batalha') { filter.type = 'bandpass'; filter.frequency.value = 400; filter.Q.value = 2 }

      noise.connect(filter)
      filter.connect(masterGain)
      noise.start(0)
    } else {
      // Oscillator source
      const osc = offline.createOscillator()
      if (name === 'caverna') { osc.type = 'sine'; osc.frequency.value = 55 }
      else if (name === 'dungeon') { osc.type = 'sawtooth'; osc.frequency.value = 80 }

      const oscGain = offline.createGain()
      oscGain.gain.value = 0.4
      osc.connect(oscGain)
      oscGain.connect(masterGain)
      osc.start(0)
    }

    return offline.startRendering()
  }

  async loadAmbient(name: AmbientName) {
    if (this.buffers.has(name)) return
    const formats = ['ogg', 'mp3']
    for (const fmt of formats) {
      try {
        const res = await fetch(`/assets/audio/${name}.${fmt}`)
        if (!res.ok) continue
        const buf = await this.context.decodeAudioData(await res.arrayBuffer())
        this.buffers.set(name, buf)
        return
      } catch { /* try next format */ }
    }
    // No file found — generate procedural tone
    try {
      const buf = await this.generateProcedural(name)
      this.buffers.set(name, buf)
    } catch (e) {
      console.warn(`AudioManager: could not generate procedural for ${name}`, e)
    }
  }

  async crossfadeTo(name: AmbientName, durationMs = 1500) {
    await this.loadAmbient(name)
    const buf = this.buffers.get(name)
    if (!buf) return

    await this.resume()
    const ctx = this.context
    const duration = durationMs / 1000

    if (this.currentGain) {
      const g = this.currentGain
      g.gain.setValueAtTime(g.gain.value, ctx.currentTime)
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
      setTimeout(() => { try { this.currentSource?.stop() } catch {} }, durationMs)
    }

    const source = ctx.createBufferSource()
    source.buffer = buf
    source.loop = true

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(this.masterVolume, ctx.currentTime + duration)

    source.connect(gain)
    gain.connect(ctx.destination)
    source.start()

    this.currentSource = source
    this.currentGain = gain
    this.currentAmbient = name
  }

  setVolume(v: number) {
    this.masterVolume = Math.max(0, Math.min(1, v))
    if (this.currentGain) this.currentGain.gain.setValueAtTime(this.masterVolume, this.context.currentTime)
  }
}
```

- [ ] **Step 4: Run all AudioManager tests — expect PASS**

```bash
cd packages/client && pnpm vitest run src/__tests__/AudioManager.test.ts
```
Expected: all passing (3 original + 2 new)

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/engine/AudioManager.ts \
        packages/client/src/__tests__/AudioManager.test.ts
git commit -m "fix: AudioManager procedural ambient fallback via OfflineAudioContext"
```

---

## Task 3: SpellFX explosion rewrite

**Files:**
- Modify: `packages/client/src/engine/SpellFX.ts`
- Modify: `packages/client/src/__tests__/SpellFX.test.ts`

- [ ] **Step 1: Add failing test**

Replace `packages/client/src/__tests__/SpellFX.test.ts` entirely:

```typescript
import { SpellFX } from '../engine/SpellFX'
import { Camera } from '../engine/Camera'

// Mock Phaser lazy import
vi.mock('phaser', () => ({
  default: {
    CANVAS: 1,
    Game: vi.fn().mockImplementation(function(config: any) {
      // Immediately call scene.create
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
    }),
  },
}))

// Mock DOM for canvas
beforeEach(() => {
  document.body.appendChild = vi.fn().mockReturnValue(undefined)
  const mockCanvas = {
    width: 800, height: 600, style: { cssText: '' },
    getContext: vi.fn(),
    remove: vi.fn(),
  }
  vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any)
})

afterEach(() => { vi.restoreAllMocks() })

function makeCamera() {
  const c = new Camera(800, 600)
  return c
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
```

- [ ] **Step 2: Run — note which tests fail**

```bash
cd packages/client && pnpm vitest run src/__tests__/SpellFX.test.ts
```

- [ ] **Step 3: Rewrite `explosion` method in `SpellFX.ts`**

Replace the `explosion` method (lines 65–81 in current file) with:

```typescript
async explosion(worldX: number, worldY: number, camera: Camera, radius = 64): Promise<void> {
  const { x, y } = camera.worldToScreen(worldX, worldY)
  const { game, scene, canvas } = await this.createPhaserScene(camera.viewW, camera.viewH)
  const gfx = scene.add.graphics()
  const FRAMES = 45
  let frame = 0

  scene.time.addEvent({
    delay: 16,
    repeat: FRAMES - 1,
    callback: () => {
      gfx.clear()
      const progress = frame / FRAMES
      const alpha = 1 - progress

      // Outer expanding ring
      gfx.lineStyle(3, 0xff6600, alpha)
      gfx.strokeCircle(x, y, radius * progress)

      // Inner ring fades out faster
      if (progress < 0.6) {
        const innerProgress = progress / 0.6
        gfx.lineStyle(2, 0xffdd00, (1 - innerProgress) * 0.8)
        gfx.strokeCircle(x, y, radius * 0.5 * innerProgress)
      }

      // 8 spark lines radiating outward
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        const len = radius * 0.7 * progress
        gfx.lineStyle(1, 0xff9900, alpha * 0.7)
        gfx.beginPath()
        gfx.moveTo(x, y)
        gfx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len)
        gfx.strokePath()
      }

      frame++
    },
  })

  this.cleanup(game, canvas, FRAMES * 16 + 100)
}
```

- [ ] **Step 4: Run tests — expect all passing**

```bash
cd packages/client && pnpm vitest run src/__tests__/SpellFX.test.ts
```
Expected: 4 passing

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/engine/SpellFX.ts \
        packages/client/src/__tests__/SpellFX.test.ts
git commit -m "fix: SpellFX explosion rewritten with Graphics rings (Phaser 3.60+ compat)"
```

---

## Task 4: Inventory API

**Files:**
- Create: `packages/server/src/api/inventory.ts`
- Create: `packages/server/src/__tests__/inventory.test.ts`
- Modify: `packages/server/src/app.ts`

- [ ] **Step 1: Write failing server tests**

```typescript
// packages/server/src/__tests__/inventory.test.ts
import request from 'supertest'
import { createApp } from '../app'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'

process.env.JWT_SECRET = 'test-secret'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'

const { app } = createApp()

function playerToken(userId = 'user1', charId = 'char1') {
  return jwt.sign({ sub: userId, role: 'player', characterId: charId }, 'test-secret', { expiresIn: '1h' })
}

describe('GET /api/inventory/:characterId', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/inventory/char1')
    expect(res.status).toBe(401)
  })

  it('returns empty array when character has no items', async () => {
    // Mock prisma
    jest.spyOn(prisma.inventoryItem, 'findMany').mockResolvedValueOnce([])
    const res = await request(app)
      .get('/api/inventory/char1')
      .set('Authorization', `Bearer ${playerToken()}`)
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns items with nested item data', async () => {
    const mockItems = [{
      id: 'inv1', quantity: 2,
      item: { id: 'item1', name: 'Espada', type: 'weapon', rarity: 'rare', stats: {} },
    }]
    jest.spyOn(prisma.inventoryItem, 'findMany').mockResolvedValueOnce(mockItems as any)
    const res = await request(app)
      .get('/api/inventory/char1')
      .set('Authorization', `Bearer ${playerToken()}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].item.name).toBe('Espada')
    expect(res.body[0].quantity).toBe(2)
  })
})

afterAll(async () => {
  await prisma.$disconnect()
})
```

- [ ] **Step 2: Run — expect FAIL (route doesn't exist)**

```bash
cd packages/server && pnpm test -- --testPathPattern=inventory
```
Expected: 404s or test failures

- [ ] **Step 3: Create `packages/server/src/api/inventory.ts`**

```typescript
import { Router, IRouter } from 'express'
import { requireAuth } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router: IRouter = Router()

router.get('/:characterId', requireAuth, async (req, res) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      where: { characterId: req.params.characterId },
      include: { item: true },
      orderBy: { item: { name: 'asc' } },
    })
    res.json(items)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
```

- [ ] **Step 4: Register route in `packages/server/src/app.ts`**

Add import after the existing imports:
```typescript
import inventoryRouter from './api/inventory'
```

Add route registration after existing routes (before the closing `return`):
```typescript
app.use('/api/inventory', inventoryRouter)
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
cd packages/server && pnpm test -- --testPathPattern=inventory
```
Expected: 3 passing

- [ ] **Step 6: Commit**

```bash
git add packages/server/src/api/inventory.ts \
        packages/server/src/app.ts \
        packages/server/src/__tests__/inventory.test.ts
git commit -m "feat: add GET /api/inventory/:characterId endpoint"
```

---

## Task 5: InventoryPanel component + GamePage integration

**Files:**
- Create: `packages/client/src/components/game/InventoryPanel.tsx`
- Create: `packages/client/src/__tests__/InventoryPanel.test.tsx`
- Modify: `packages/client/src/pages/GamePage.tsx`

- [ ] **Step 1: Write failing component tests**

```typescript
// packages/client/src/__tests__/InventoryPanel.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import InventoryPanel from '../components/game/InventoryPanel'

const mockItems = [
  { id: 'inv1', quantity: 2, item: { id: 'i1', name: 'Espada Longa', type: 'weapon', rarity: 'rare', stats: {} } },
  { id: 'inv2', quantity: 1, item: { id: 'i2', name: 'Poção', type: 'consumable', rarity: 'common', stats: {} } },
]

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => mockItems,
  }) as any
})

afterEach(() => { vi.restoreAllMocks() })

it('renders nothing when closed', () => {
  const { container } = render(
    <InventoryPanel characterId="c1" token="tok" open={false} onClose={vi.fn()} />
  )
  expect(container.firstChild).toBeNull()
})

it('renders item names when open', async () => {
  render(<InventoryPanel characterId="c1" token="tok" open={true} onClose={vi.fn()} />)
  await waitFor(() => {
    expect(screen.getByText('Espada Longa')).toBeTruthy()
    expect(screen.getByText('Poção')).toBeTruthy()
  })
})

it('shows empty state when no items', async () => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] }) as any
  render(<InventoryPanel characterId="c1" token="tok" open={true} onClose={vi.fn()} />)
  await waitFor(() => {
    expect(screen.getByText(/nenhum item/i)).toBeTruthy()
  })
})

it('calls onClose when close button clicked', async () => {
  const onClose = vi.fn()
  render(<InventoryPanel characterId="c1" token="tok" open={true} onClose={onClose} />)
  await waitFor(() => screen.getByText('Espada Longa'))
  screen.getByRole('button', { name: '×' }).click()
  expect(onClose).toHaveBeenCalled()
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd packages/client && pnpm vitest run src/__tests__/InventoryPanel.test.tsx
```

- [ ] **Step 3: Create `InventoryPanel.tsx`**

```typescript
// packages/client/src/components/game/InventoryPanel.tsx
import { useState, useEffect } from 'react'
import { apiFetch } from '../../lib/api'

interface Item { id: string; name: string; type: string; rarity: string; stats: Record<string, unknown> }
interface InventoryEntry { id: string; quantity: number; item: Item }

const RARITY_COLOR: Record<string, string> = {
  common: 'var(--parchment-dim)',
  uncommon: '#5a9a5a',
  rare: 'var(--ember)',
  epic: '#9966cc',
  legendary: '#e8c820',
}

interface Props { characterId: string; token: string; open: boolean; onClose: () => void }

export default function InventoryPanel({ characterId, token, open, onClose }: Props) {
  const [items, setItems] = useState<InventoryEntry[] | null>(null)

  useEffect(() => {
    if (!open || items !== null) return
    apiFetch<InventoryEntry[]>(`/inventory/${characterId}`, {}, token)
      .then(setItems)
      .catch(() => setItems([]))
  }, [open, characterId, token, items])

  if (!open) return null

  return (
    <div style={{
      position: 'absolute', bottom: 16, left: 16, width: 260,
      maxHeight: 380, overflowY: 'auto',
      background: 'rgba(10,10,18,0.95)',
      border: '1px solid var(--rune-border)',
      zIndex: 20,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 14px', borderBottom: '1px solid var(--rune-border)',
      }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ember-dim)' }}>
          Inventário
        </span>
        <button
          aria-label="×"
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--parchment-dim)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0 2px' }}
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '8px 0' }}>
        {items === null && (
          <div style={{ padding: '12px 14px', fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--parchment-dim)' }}>
            Carregando...
          </div>
        )}
        {items !== null && items.length === 0 && (
          <div style={{ padding: '12px 14px', fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--parchment-dim)' }}>
            Nenhum item encontrado.
          </div>
        )}
        {items !== null && items.map(entry => (
          <div key={entry.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '7px 14px', borderBottom: '1px solid rgba(196,137,14,0.07)',
          }}>
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: 'var(--parchment)' }}>
                {entry.item.name}
              </div>
              <div style={{ display: 'flex', gap: 5, marginTop: 3 }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--parchment-dim)', background: 'rgba(255,255,255,0.06)', padding: '1px 5px' }}>
                  {entry.item.type}
                </span>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: RARITY_COLOR[entry.item.rarity] ?? 'var(--parchment-dim)', background: 'rgba(255,255,255,0.06)', padding: '1px 5px' }}>
                  {entry.item.rarity}
                </span>
              </div>
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.65rem', color: 'var(--parchment-dim)', minWidth: 24, textAlign: 'right' }}>
              ×{entry.quantity}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run component tests — expect PASS**

```bash
cd packages/client && pnpm vitest run src/__tests__/InventoryPanel.test.tsx
```
Expected: 4 passing

- [ ] **Step 5: Wire into `GamePage.tsx`**

Add imports at the top (after existing imports):
```typescript
import InventoryPanel from '../components/game/InventoryPanel'
```

Add state after existing `useState` lines:
```typescript
const [inventoryOpen, setInventoryOpen] = useState(false)
```

In `handleKeyDown`, add before the `emit` logic:
```typescript
if (e.key === 'i' || e.key === 'I') { setInventoryOpen(v => !v); return }
```

In the JSX, change the outer wrapper div to include `position: relative` if not already, then add the panel as a sibling of `<canvas>`:
```tsx
// Change the outer div:
<div
  style={{ position: 'relative', display: 'inline-block' }}
  tabIndex={0}
  onKeyDown={handleKeyDown}
  autoFocus
>
  <canvas ... />
  <HUD ... />
  <InventoryPanel
    characterId={characterId ?? ''}
    token={token ?? ''}
    open={inventoryOpen}
    onClose={() => setInventoryOpen(false)}
  />
</div>
```

- [ ] **Step 6: Full client build check**

```bash
cd packages/client && pnpm build 2>&1 | tail -5
```
Expected: `✓ built in ...`

- [ ] **Step 7: Commit**

```bash
git add packages/client/src/components/game/InventoryPanel.tsx \
        packages/client/src/__tests__/InventoryPanel.test.tsx \
        packages/client/src/pages/GamePage.tsx
git commit -m "feat: InventoryPanel component + I-key toggle in GamePage"
```

---

## Task 6: Full test suite + final verification

- [ ] **Step 1: Run all client tests**

```bash
cd packages/client && pnpm vitest run
```
Expected: all passing (20+ tests)

- [ ] **Step 2: Run all server tests**

```bash
cd packages/server && pnpm test 2>&1 | tail -10
```
Expected: all passing (11+ tests, DB tests skipped if no PostgreSQL)

- [ ] **Step 3: Build both packages**

```bash
cd ../.. && pnpm --filter client build && pnpm --filter server build
```
Expected: both compile clean

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: fundacao-visual complete — all tests passing, clean build"
git push origin master
```
