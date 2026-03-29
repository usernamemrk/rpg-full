# Fundação Visual — Implementation Spec

> **For agentic workers:** Use superpowers:subagent-driven-development to implement task-by-task.

**Goal:** Make the core RPG experience fully functional: map editor renders tiles, ambient sounds play, inventory is viewable in-game, and spell effects fire correctly.

**Architecture:** Four independent fixes/features that share no state. Each can be implemented and tested in isolation.

**Tech Stack:** React + TypeScript + Canvas 2D + Web Audio API (client), Express + Prisma + PostgreSQL (server)

---

## Problem 1 — Map Renders Nothing

### Root Cause
- `TileSet.ts` only draws when `this.image` is loaded. Image loads from `/assets/tilesets/world.png` which does not exist in the repo.
- All new maps have every tile = `0`. `TileMap.render` skips `tile <= 0`. Even if the image loaded, nothing would appear.

### Fix
**`TileSet.ts`:** Add procedural fallback in `drawTile`. When `this.image` is null, draw a colored rectangle using the tile index to pick a hue: `hsl((index * 37) % 360, 55%, 38%)`. Draw a 1px darker border and the tile number in small text. This gives each tile a distinct, recognisable color.

**`MapEditor.tsx`:** The palette already draws colored `hsl` divs — align the hue formula so palette colors match the canvas tiles exactly.

**Result:** Map editor works with zero external files. If a real PNG tileset is later placed at the correct path, it loads automatically.

---

## Problem 2 — Ambient Sounds Silent

### Root Cause
`AudioManager.loadAmbient` tries `fetch('/assets/audio/{name}.ogg')` then `.mp3`. Neither exists. It logs a warning and returns. `crossfadeTo` gets no buffer and exits silently.

### Fix
**`AudioManager.ts`:** After both fetch attempts fail, generate a procedural `AudioBuffer` using Web Audio API oscillators/noise. Each ambient gets a distinct profile:

| Ambient | Sound profile |
|---------|--------------|
| floresta | Filtered pink noise (LPF 600 Hz) + slow LFO tremolo |
| caverna | Sine drone 55 Hz + sparse high clicks |
| cidade | Band-pass noise 300–900 Hz, medium level |
| dungeon | Sub sine 40 Hz + sawtooth 80 Hz, slow LFO |
| batalha | Square wave 110 Hz + noise bursts |
| chuva | White noise LPF 1200 Hz, steady |

Each procedural buffer is 4 seconds long, looped. The existing `crossfadeTo` / volume / resume interface stays identical — callers don't change.

---

## Problem 3 — Inventory Has No UI

### Current State
`InventoryItem` and `Item` tables exist in Prisma schema. No API endpoint exists to read them.

### API
**`GET /api/inventory`** — returns the authenticated user's character inventory:
```json
[{ "id": "...", "quantity": 2, "item": { "name": "Espada", "type": "weapon", "rarity": "rare", "stats": {} } }]
```

**`GET /api/inventory/:characterId`** — same shape, accessible by any authenticated user (GM needs to see player inventories).

**`packages/server/src/api/inventory.ts`** — new file, exported as `inventoryRouter`.

### UI
**`InventoryPanel.tsx`** — `packages/client/src/components/game/InventoryPanel.tsx`

- Toggle via keyboard shortcut `I` in `GamePage`
- Floating panel, bottom-left of canvas, 260 px wide
- Dark fantasy style (`.card`, `.badge`, `.section-title` from `index.css`)
- Rarity colors: common = parchment-dim, uncommon = green-ish, rare = ember, epic = purple, legendary = gold
- Shows: item name, type badge, rarity badge, quantity
- Empty state: "Nenhum item encontrado"
- Loading state while fetch is in flight

**`GamePage.tsx`** — add `useState<boolean>` for panel visibility, `useEffect` fetching inventory on mount, `onKeyDown` handler for `i`/`I`.

---

## Problem 4 — Spell Effects Broken

### Root Cause
Phaser 3.60+ changed the `particles` API. `scene.add.particles(x, y, undefined, config)` throws because `undefined` texture is not valid.

### Fix
**`SpellFX.ts` — `explosion` method:** Replace the Phaser particles call with a pure `Graphics` approach (same pattern as `lightning` and `healing`):
- Emit 20 circles expanding outward from center with randomised angles
- Colors cycle through orange → yellow → white
- Fade alpha over 50 frames (~800 ms)

No other methods need changing — `lightning` and `healing` use `Graphics` and work correctly.

---

## Files Changed

| File | Action |
|------|--------|
| `packages/client/src/engine/TileSet.ts` | Modify — add procedural fallback in `drawTile` |
| `packages/client/src/components/master/MapEditor.tsx` | Modify — align palette hue formula |
| `packages/client/src/engine/AudioManager.ts` | Modify — add `generateProcedural(name)` fallback |
| `packages/client/src/engine/SpellFX.ts` | Modify — rewrite `explosion` using Graphics |
| `packages/client/src/components/game/InventoryPanel.tsx` | Create |
| `packages/client/src/pages/GamePage.tsx` | Modify — add inventory toggle + fetch |
| `packages/server/src/api/inventory.ts` | Create |
| `packages/server/src/app.ts` | Modify — register `/api/inventory` route |

---

## Testing

- **TileSet fallback:** Create a `TileSet`, call `drawTile` on a mock canvas context without loading an image — assert colored rect is drawn.
- **AudioManager fallback:** Call `crossfadeTo('floresta')` with no audio files present — assert `currentAmbient` is set and no error thrown.
- **Inventory API:** GET `/api/inventory` with valid token returns array; GET without token returns 401.
- **SpellFX explosion:** Call `spellFX.explosion(0, 0, mockCamera)` — assert resolves without error.
- **InventoryPanel:** Render with mock items, assert each item name appears; render empty, assert empty state text.
