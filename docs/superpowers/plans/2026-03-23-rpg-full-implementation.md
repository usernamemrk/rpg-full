# RPG Full Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multiplayer top-down 2D RPG with map editor, ambient audio, spell animations, loot system, and minimap.

**Architecture:** Monorepo (pnpm workspaces) with Vite+React+Canvas client and Node.js+Express+Socket.io+Prisma server. Canvas engine handles rendering; Phaser.js loaded lazily for spell FX only. Socket.io rooms per session (max 7 connections).

**Tech Stack:** Vite, React, TypeScript, Canvas API, Phaser.js (lazy), Socket.io-client, Node.js, Express, Socket.io, Prisma, PostgreSQL, JWT, Zod, pnpm workspaces, Vitest, Jest, Supertest

---

## File Map

```
rpg-full/
├── pnpm-workspace.yaml
├── package.json                          # workspace root scripts
├── packages/
│   ├── client/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   ├── public/assets/tilesets/       # static .png tilesets
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx                   # routes
│   │       ├── lib/
│   │       │   ├── api.ts                # typed fetch wrapper
│   │       │   └── socket.ts             # singleton socket instance
│   │       ├── engine/
│   │       │   ├── GameLoop.ts           # rAF loop, delta time
│   │       │   ├── Camera.ts             # scroll/zoom, worldToScreen/screenToWorld
│   │       │   ├── TileSet.ts            # spritesheet loader + tile index
│   │       │   ├── TileMap.ts            # renders layers to canvas
│   │       │   ├── EntityLayer.ts        # characters/chests on top of map
│   │       │   ├── Minimap.ts            # 150x150 secondary canvas
│   │       │   ├── AudioManager.ts       # Web Audio API ambient system
│   │       │   └── SpellFX.ts            # Phaser lazy-load spell animations
│   │       ├── hooks/
│   │       │   ├── useAuth.ts
│   │       │   ├── useSocket.ts
│   │       │   └── useGame.ts
│   │       ├── components/
│   │       │   ├── game/
│   │       │   │   ├── GameCanvas.tsx    # mounts engine on canvas ref
│   │       │   │   └── HUD.tsx           # minimap + status bars overlay
│   │       │   └── master/
│   │       │       ├── MapEditor.tsx     # tile palette + edit tools
│   │       │       ├── ChestEditor.tsx   # loot table config panel
│   │       │       └── AmbientControl.tsx
│   │       └── pages/
│   │           ├── LoginPage.tsx
│   │           ├── LobbyPage.tsx
│   │           ├── GamePage.tsx
│   │           └── MasterPage.tsx
│   └── server/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts                  # http + socket.io server boot
│           ├── app.ts                    # express app factory
│           ├── middleware/
│           │   └── auth.ts               # JWT verify middleware
│           ├── api/
│           │   ├── auth.ts
│           │   ├── maps.ts
│           │   ├── items.ts
│           │   ├── sessions.ts
│           │   └── spells.ts
│           ├── socket/
│           │   ├── index.ts              # register all handlers
│           │   ├── sessionHandlers.ts
│           │   ├── movementHandlers.ts
│           │   ├── spellHandlers.ts
│           │   └── chestHandlers.ts
│           ├── game/
│           │   ├── LootService.ts
│           │   └── SpellService.ts
│           ├── config/
│           │   └── spells.ts             # static SpellDefinition[]
│           └── prisma/
│               ├── schema.prisma
│               └── seed.ts
```

---

## Phase 1 — Monorepo Foundation

### Task 1: Monorepo scaffold

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `package.json` (root)
- Create: `packages/server/package.json`
- Create: `packages/server/tsconfig.json`
- Create: `packages/client/package.json`
- Create: `packages/client/vite.config.ts`
- Create: `packages/client/index.html`

- [ ] **Step 1: Create workspace root**

```bash
cd ~/rpg-full
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'packages/*'
EOF

cat > package.json << 'EOF'
{
  "name": "rpg-full",
  "private": true,
  "scripts": {
    "dev": "concurrently \"pnpm --filter server dev\" \"pnpm --filter client dev\"",
    "build": "pnpm --filter server build && pnpm --filter client build",
    "test": "pnpm --filter server test && pnpm --filter client test"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
EOF
```

- [ ] **Step 2: Create server package**

```bash
mkdir -p packages/server/src/{api,socket,game,config,middleware,prisma}

cat > packages/server/package.json << 'EOF'
{
  "name": "server",
  "private": true,
  "scripts": {
    "dev": "ts-node-dev --respawn src/index.ts",
    "build": "tsc",
    "test": "jest",
    "db:migrate": "prisma migrate dev",
    "db:seed": "ts-node src/prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^5.10.0",
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "express": "^4.18.3",
    "jsonwebtoken": "^9.0.2",
    "socket.io": "^4.7.4",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cookie-parser": "^1.4.7",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.12",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/node": "^20.11.20",
    "@types/supertest": "^6.0.2",
    "jest": "^29.7.0",
    "prisma": "^5.10.0",
    "socket.io-client": "^4.7.4",
    "supertest": "^6.3.4",
    "ts-jest": "^29.1.2",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.3.3"
  }
}
EOF

cat > packages/server/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src"]
}
EOF
```

- [ ] **Step 3: Create client package**

```bash
mkdir -p packages/client/src/{engine,hooks,components/{game,master},pages,lib}
mkdir -p packages/client/public/assets/tilesets

cat > packages/client/package.json << 'EOF'
{
  "name": "client",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest run"
  },
  "dependencies": {
    "phaser": "^3.80.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.2",
    "socket.io-client": "^4.7.4"
  },
  "devDependencies": {
    "@testing-library/react": "^14.2.1",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.2.61",
    "@types/react-dom": "^18.2.19",
    "@vitejs/plugin-react": "^4.2.1",
    "jsdom": "^24.0.0",
    "typescript": "^5.3.3",
    "vite": "^5.1.4",
    "vitest": "^1.3.1"
  }
}
EOF

cat > packages/client/vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3001', '/socket.io': { target: 'http://localhost:3001', ws: true } } },
  test: { environment: 'jsdom', globals: true, setupFiles: [] }
})
EOF

cat > packages/client/index.html << 'EOF'
<!DOCTYPE html>
<html lang="pt-BR">
  <head><meta charset="UTF-8" /><title>RPG Full</title></head>
  <body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>
EOF
```

- [ ] **Step 4: Install dependencies**

```bash
cd ~/rpg-full && pnpm install
```

Expected: lockfile created, node_modules in each package.

- [ ] **Step 5: Commit**

```bash
git add . && git commit -m "chore: scaffold monorepo with client and server packages"
```

---

### Task 2: Prisma schema + migrations + seed

**Files:**
- Create: `packages/server/src/prisma/schema.prisma`
- Create: `packages/server/src/prisma/seed.ts`

- [ ] **Step 1: Write schema**

Create `packages/server/src/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum SessionStatus {
  active
  ended
}

model User {
  id           String      @id @default(cuid())
  email        String      @unique
  passwordHash String
  characters   Character[]
  mapsCreated  Map[]       @relation("MapCreator")
  sessionsAsGm Session[]   @relation("SessionGM")
}

model Character {
  id             String          @id @default(cuid())
  name           String
  class          String
  hp             Int
  maxHp          Int
  level          Int             @default(1)
  userId         String
  user           User            @relation(fields: [userId], references: [id])
  inventoryItems InventoryItem[]
}

model InventoryItem {
  id          String    @id @default(cuid())
  characterId String
  character   Character @relation(fields: [characterId], references: [id])
  itemId      String
  item        Item      @relation(fields: [itemId], references: [id])
  quantity    Int       @default(1)

  @@unique([characterId, itemId])
}

model Session {
  id          String        @id @default(cuid())
  code        String        @unique
  gmId        String
  gm          User          @relation("SessionGM", fields: [gmId], references: [id])
  mapId       String
  map         Map           @relation(fields: [mapId], references: [id])
  status      SessionStatus @default(active)
  state       Json
  chestStates ChestState[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

model ChestState {
  id        String  @id @default(cuid())
  sessionId String
  session   Session @relation(fields: [sessionId], references: [id])
  chestId   String
  chest     Chest   @relation(fields: [chestId], references: [id])
  opened    Boolean @default(false)

  @@unique([sessionId, chestId])
}

model Map {
  id          String    @id @default(cuid())
  name        String
  width       Int
  height      Int
  tilesetId   String
  layers      Json
  createdById String
  createdBy   User      @relation("MapCreator", fields: [createdById], references: [id])
  createdAt   DateTime  @default(now())
  chests      Chest[]
  sessions    Session[]
}

model Chest {
  id          String       @id @default(cuid())
  name        String
  mapId       String
  map         Map          @relation(fields: [mapId], references: [id])
  x           Int
  y           Int
  lootTable   Json
  chestStates ChestState[]
}

model Item {
  id             String          @id @default(cuid())
  name           String          @unique
  type           String
  rarity         String
  stats          Json
  inventoryItems InventoryItem[]
}
```

- [ ] **Step 2: Create .env**

```bash
cat > packages/server/.env << 'EOF'
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rpgfull"
JWT_SECRET="change-me-in-production"
JWT_REFRESH_SECRET="change-me-refresh"
PORT=3001
EOF
```

- [ ] **Step 3: Run migration**

```bash
cd packages/server && pnpm db:migrate --name init
```

Expected: `packages/server/src/prisma/migrations/` created.

- [ ] **Step 4: Write seed**

Create `packages/server/src/prisma/seed.ts`:

```typescript
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
      create: { ...item, stats: item.stats as any },
    })
  }
  console.log('Seed complete')
}

main().finally(() => prisma.$disconnect())
```

- [ ] **Step 5: Run seed**

```bash
cd packages/server && pnpm db:seed
```

Expected: "Seed complete"

- [ ] **Step 6: Commit**

```bash
cd ~/rpg-full && git add . && git commit -m "feat: add prisma schema, migration, and item seed"
```

---

### Task 3: Auth API

**Files:**
- Create: `packages/server/src/middleware/auth.ts`
- Create: `packages/server/src/api/auth.ts`
- Create: `packages/server/src/app.ts`
- Create: `packages/server/src/index.ts`
- Create: `packages/server/src/__tests__/auth.test.ts`

- [ ] **Step 1: Write failing auth tests**

Create `packages/server/src/__tests__/auth.test.ts`:

```typescript
import request from 'supertest'
import { createApp } from '../app'

// Note: createApp() returns { app, httpServer, io } — use .app for supertest
const { app } = createApp()

describe('POST /api/auth/register', () => {
  it('creates a user and returns 201', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: `test-${Date.now()}@test.com`, password: 'password123', name: 'Tester' })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('accessToken')
  })

  it('returns 400 for duplicate email', async () => {
    const email = `dup-${Date.now()}@test.com`
    await request(app).post('/api/auth/register').send({ email, password: 'pass', name: 'A' })
    const res = await request(app).post('/api/auth/register').send({ email, password: 'pass', name: 'B' })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  it('returns accessToken for valid credentials', async () => {
    const email = `login-${Date.now()}@test.com`
    await request(app).post('/api/auth/register').send({ email, password: 'secret', name: 'User' })
    const res = await request(app).post('/api/auth/login').send({ email, password: 'secret' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('accessToken')
  })

  it('returns 401 for wrong password', async () => {
    const email = `wrong-${Date.now()}@test.com`
    await request(app).post('/api/auth/register').send({ email, password: 'correct', name: 'U' })
    const res = await request(app).post('/api/auth/login').send({ email, password: 'wrong' })
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd packages/server && pnpm test -- --testPathPattern=auth
```

Expected: FAIL — `createApp` not found.

- [ ] **Step 3: Implement auth middleware**

Create `packages/server/src/middleware/auth.ts`:

```typescript
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  user?: { sub: string; role: 'gm' | 'player'; characterId: string; sessionId?: string }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as AuthRequest['user']
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

export function requireRole(role: 'gm' | 'player') {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) return res.status(403).json({ error: 'Forbidden' })
    next()
  }
}
```

- [ ] **Step 4: Implement auth routes**

Create `packages/server/src/api/auth.ts`:

```typescript
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const router = Router()
const prisma = new PrismaClient()

const RegisterSchema = z.object({ email: z.string().email(), password: z.string().min(6), name: z.string().min(1) })
const LoginSchema = z.object({ email: z.string().email(), password: z.string() })

function signAccess(payload: object) {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' })
}
function signRefresh(payload: object) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' })
}

router.post('/register', async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { email, password, name } = parsed.data
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return res.status(400).json({ error: 'Email already in use' })
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { email, passwordHash } })
  const char = await prisma.character.create({
    data: { name, class: 'warrior', hp: 100, maxHp: 100, userId: user.id }
  })
  const payload = { sub: user.id, role: 'player' as const, characterId: char.id }
  const accessToken = signAccess(payload)
  const refreshToken = signRefresh({ sub: user.id })
  res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 7 * 24 * 3600 * 1000 })
  res.status(201).json({ accessToken })
})

router.post('/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({ where: { email }, include: { characters: { take: 1 } } })
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return res.status(401).json({ error: 'Invalid credentials' })
  const char = user.characters[0]
  const payload = { sub: user.id, role: 'player' as const, characterId: char?.id ?? '' }
  const accessToken = signAccess(payload)
  const refreshToken = signRefresh({ sub: user.id })
  res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 7 * 24 * 3600 * 1000 })
  res.json({ accessToken })
})

router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken
  if (!token) return res.status(401).json({ error: 'No refresh token' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { sub: string }
    const user = await prisma.user.findUnique({ where: { id: decoded.sub }, include: { characters: { take: 1 } } })
    if (!user) return res.status(401).json({ error: 'User not found' })
    const char = user.characters[0]
    const accessToken = signAccess({ sub: user.id, role: 'player', characterId: char?.id ?? '' })
    res.json({ accessToken })
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' })
  }
})

router.post('/logout', (_req, res) => {
  res.clearCookie('refreshToken')
  res.json({ ok: true })
})

export default router
```

- [ ] **Step 5: Create app factory**

Create `packages/server/src/app.ts`:

```typescript
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRouter from './api/auth'

export function createApp() {
  const app = express()
  app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
  app.use(express.json())
  app.use(cookieParser())
  app.use('/api/auth', authRouter)
  return app
}
```

Create `packages/server/src/index.ts`:

```typescript
import { createServer } from 'http'
import { createApp } from './app'

const app = createApp()
const httpServer = createServer(app)
const PORT = process.env.PORT ?? 3001
httpServer.listen(PORT, () => console.log(`Server running on :${PORT}`))
```

Add to `packages/server/package.json` jest config:

```json
"jest": {
  "preset": "ts-jest",
  "testEnvironment": "node",
  "testMatch": ["**/__tests__/**/*.test.ts"]
}
```

- [ ] **Step 6: Run tests — expect PASS**

```bash
cd packages/server && pnpm test -- --testPathPattern=auth
```

Expected: 4 tests pass.

- [ ] **Step 7: Commit**

```bash
cd ~/rpg-full && git add . && git commit -m "feat: auth API with register, login, refresh, logout"
```

---

### Task 4: Maps + Items + Spells REST API

**Files:**
- Create: `packages/server/src/api/maps.ts`
- Create: `packages/server/src/api/items.ts`
- Create: `packages/server/src/api/spells.ts`
- Create: `packages/server/src/config/spells.ts`
- Modify: `packages/server/src/app.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/server/src/__tests__/maps.test.ts`:

```typescript
import request from 'supertest'
import { createApp } from '../app'
import jwt from 'jsonwebtoken'

const { app } = createApp()

function gmToken(userId = 'user1', charId = 'char1') {
  return jwt.sign({ sub: userId, role: 'gm', characterId: charId }, process.env.JWT_SECRET ?? 'test', { expiresIn: '1h' })
}

describe('GET /api/maps/:id', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/maps/nonexistent')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/spells', () => {
  it('returns array of spells', async () => {
    const res = await request(app).get('/api/spells').set('Authorization', `Bearer ${gmToken()}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0]).toHaveProperty('id')
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd packages/server && pnpm test -- --testPathPattern=maps
```

- [ ] **Step 3: Create spell catalog**

Create `packages/server/src/config/spells.ts`:

```typescript
export interface SpellDefinition {
  id: string
  name: string
  damage?: number
  healing?: number
  range: number
  fxType: 'lightning' | 'explosion' | 'healing'
}

export const SPELLS: SpellDefinition[] = [
  { id: 'lightning', name: 'Raio', damage: 35, range: 8, fxType: 'lightning' },
  { id: 'explosion', name: 'Explosao', damage: 50, range: 5, fxType: 'explosion' },
  { id: 'healing', name: 'Cura', healing: 30, range: 3, fxType: 'healing' },
]
```

- [ ] **Step 4: Implement maps router**

Create `packages/server/src/api/maps.ts`:

```typescript
import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { Server } from 'socket.io'

const prisma = new PrismaClient()

const LayersSchema = z.object({
  ground: z.array(z.array(z.number())),
  objects: z.array(z.array(z.number())),
  overlay: z.array(z.array(z.number())),
})

const SaveMapSchema = z.object({ layers: LayersSchema, sessionId: z.string() })

export function createMapsRouter(io: Server) {
  const router = Router()

  router.get('/:id', requireAuth, async (req, res) => {
    const map = await prisma.map.findUnique({ where: { id: req.params.id } })
    if (!map) return res.status(404).json({ error: 'Map not found' })
    res.json(map)
  })

  router.post('/:id', requireAuth, async (req: AuthRequest, res) => {
    const parsed = SaveMapSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
    const { layers, sessionId } = parsed.data
    const map = await prisma.map.update({ where: { id: req.params.id }, data: { layers } })
    io.to(`session:${sessionId}`).emit('map:updated', { mapId: map.id })
    res.json(map)
  })

  return router
}
```

- [ ] **Step 5: Implement items + spells routers**

Create `packages/server/src/api/items.ts`:

```typescript
import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth'

const prisma = new PrismaClient()
const router = Router()

const ItemSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['weapon', 'armor', 'potion', 'gold', 'misc']),
  rarity: z.enum(['common', 'uncommon', 'rare', 'legendary']),
  stats: z.record(z.number()),
})

router.get('/', requireAuth, async (_req, res) => {
  const items = await prisma.item.findMany()
  res.json(items)
})

router.post('/', requireAuth, requireRole('gm'), async (req: AuthRequest, res) => {
  const parsed = ItemSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const item = await prisma.item.create({ data: { ...parsed.data, stats: parsed.data.stats } })
  res.status(201).json(item)
})

export default router
```

Create `packages/server/src/api/spells.ts`:

```typescript
import { Router } from 'express'
import { SPELLS } from '../config/spells'
import { requireAuth } from '../middleware/auth'

const router = Router()
router.get('/', requireAuth, (_req, res) => res.json(SPELLS))
export default router
```

- [ ] **Step 6: Wire into app**

Update `packages/server/src/app.ts`:

```typescript
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { Server } from 'socket.io'
import { createServer } from 'http'
import authRouter from './api/auth'
import { createMapsRouter } from './api/maps'
import itemsRouter from './api/items'
import spellsRouter from './api/spells'

export function createApp() {
  const app = express()
  const httpServer = createServer(app)
  const io = new Server(httpServer, { cors: { origin: 'http://localhost:5173', credentials: true } })

  app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
  app.use(express.json())
  app.use(cookieParser())
  app.use('/api/auth', authRouter)
  app.use('/api/maps', createMapsRouter(io))
  app.use('/api/items', itemsRouter)
  app.use('/api/spells', spellsRouter)

  return { app, httpServer, io }
}
```

Update `packages/server/src/index.ts`:

```typescript
import { createApp } from './app'

const { httpServer } = createApp()
const PORT = process.env.PORT ?? 3001
httpServer.listen(PORT, () => console.log(`Server :${PORT}`))
```

Update `packages/server/src/__tests__/auth.test.ts` — change `createApp()` calls to `createApp().app`.

- [ ] **Step 7: Run all server tests — expect PASS**

```bash
cd packages/server && pnpm test
```

- [ ] **Step 8: Commit**

```bash
cd ~/rpg-full && git add . && git commit -m "feat: maps, items, and spells REST API"
```

---

## Phase 2 — Client Foundation

### Task 5: React app scaffold + auth

**Files:**
- Create: `packages/client/src/main.tsx`
- Create: `packages/client/src/App.tsx`
- Create: `packages/client/src/lib/api.ts`
- Create: `packages/client/src/hooks/useAuth.ts`
- Create: `packages/client/src/pages/LoginPage.tsx`

- [ ] **Step 1: Write failing test**

Create `packages/client/src/__tests__/useAuth.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../hooks/useAuth'

global.fetch = vi.fn()

describe('useAuth', () => {
  it('starts unauthenticated', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd packages/client && pnpm test
```

- [ ] **Step 3: Implement api.ts**

Create `packages/client/src/lib/api.ts`:

```typescript
const BASE = '/api'

export async function apiFetch<T>(path: string, options?: RequestInit, token?: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options?.headers },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
```

- [ ] **Step 4: Implement useAuth**

Create `packages/client/src/hooks/useAuth.ts`:

```typescript
import { useState, useCallback } from 'react'
import { apiFetch } from '../lib/api'

interface AuthState { token: string | null; userId: string | null; characterId: string | null }

function parseJwt(token: string) {
  try { return JSON.parse(atob(token.split('.')[1])) } catch { return null }
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ token: null, userId: null, characterId: null })

  const login = useCallback(async (email: string, password: string) => {
    const { accessToken } = await apiFetch<{ accessToken: string }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    })
    const payload = parseJwt(accessToken)
    setState({ token: accessToken, userId: payload?.sub ?? null, characterId: payload?.characterId ?? null })
    return accessToken
  }, [])

  const register = useCallback(async (email: string, password: string, name: string) => {
    const { accessToken } = await apiFetch<{ accessToken: string }>('/auth/register', {
      method: 'POST', body: JSON.stringify({ email, password, name }),
    })
    const payload = parseJwt(accessToken)
    setState({ token: accessToken, userId: payload?.sub ?? null, characterId: payload?.characterId ?? null })
    return accessToken
  }, [])

  const logout = useCallback(async () => {
    await apiFetch('/auth/logout', { method: 'POST' }, state.token ?? undefined)
    setState({ token: null, userId: null, characterId: null })
  }, [state.token])

  return { ...state, isAuthenticated: !!state.token, login, register, logout }
}
```

- [ ] **Step 5: Wire up app**

Create `packages/client/src/main.tsx`:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>
)
```

Create `packages/client/src/App.tsx`:

```tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import LobbyPage from './pages/LobbyPage'
import GamePage from './pages/GamePage'
import MasterPage from './pages/MasterPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/lobby" element={<LobbyPage />} />
      <Route path="/game/:sessionId" element={<GamePage />} />
      <Route path="/master/:sessionId" element={<MasterPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
```

Create `packages/client/src/pages/LoginPage.tsx`:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { login, register } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (mode === 'login') await login(email, password)
      else await register(email, password, name)
      nav('/lobby')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 24 }}>
      <h1>RPG Full</h1>
      <form onSubmit={handleSubmit}>
        {mode === 'register' && <input placeholder="Nome" value={name} onChange={e => setName(e.target.value)} />}
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit">{mode === 'login' ? 'Entrar' : 'Registrar'}</button>
        <button type="button" onClick={() => setMode(m => m === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Criar conta' : 'Ja tenho conta'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  )
}
```

Create stubs for other pages (add content later):

```tsx
// packages/client/src/pages/LobbyPage.tsx
export default function LobbyPage() { return <div>Lobby</div> }

// packages/client/src/pages/GamePage.tsx
export default function GamePage() { return <div>Game</div> }

// packages/client/src/pages/MasterPage.tsx
export default function MasterPage() { return <div>Master</div> }
```

- [ ] **Step 6: Run tests — expect PASS**

```bash
cd packages/client && pnpm test
```

- [ ] **Step 7: Commit**

```bash
cd ~/rpg-full && git add . && git commit -m "feat: client scaffold with auth hook and login page"
```

---

## Phase 3 — Canvas Engine Core

### Task 6: Camera + GameLoop

**Files:**
- Create: `packages/client/src/engine/Camera.ts`
- Create: `packages/client/src/engine/GameLoop.ts`
- Create: `packages/client/src/__tests__/Camera.test.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/client/src/__tests__/Camera.test.ts`:

```typescript
import { Camera } from '../engine/Camera'

describe('Camera', () => {
  it('worldToScreen converts with offset', () => {
    const cam = new Camera(800, 600)
    cam.x = 100; cam.y = 50
    const s = cam.worldToScreen(100, 50)
    expect(s).toEqual({ x: 0, y: 0 })
  })

  it('screenToWorld is inverse of worldToScreen', () => {
    const cam = new Camera(800, 600)
    cam.x = 32; cam.y = 64
    const world = cam.screenToWorld(200, 100)
    const back = cam.worldToScreen(world.x, world.y)
    expect(back.x).toBeCloseTo(200)
    expect(back.y).toBeCloseTo(100)
  })

  it('clamps to map bounds', () => {
    const cam = new Camera(800, 600)
    cam.setMapBounds(10 * 32, 10 * 32)
    cam.moveTo(-100, -100)
    expect(cam.x).toBe(0)
    expect(cam.y).toBe(0)
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd packages/client && pnpm test -- Camera
```

- [ ] **Step 3: Implement Camera**

Create `packages/client/src/engine/Camera.ts`:

```typescript
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
```

Create `packages/client/src/engine/GameLoop.ts`:

```typescript
export class GameLoop {
  private raf = 0
  private last = 0
  private running = false

  start(tick: (dt: number) => void) {
    this.running = true
    const loop = (now: number) => {
      if (!this.running) return
      const dt = Math.min((now - this.last) / 1000, 0.1)
      this.last = now
      tick(dt)
      this.raf = requestAnimationFrame(loop)
    }
    this.last = performance.now()
    this.raf = requestAnimationFrame(loop)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
  }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd packages/client && pnpm test -- Camera
```

- [ ] **Step 5: Commit**

```bash
cd ~/rpg-full && git add . && git commit -m "feat: Camera and GameLoop engine modules"
```

---

### Task 7: TileSet + TileMap

**Files:**
- Create: `packages/client/src/engine/TileSet.ts`
- Create: `packages/client/src/engine/TileMap.ts`
- Create: `packages/client/src/__tests__/TileMap.test.ts`

- [ ] **Step 1: Write failing test**

Create `packages/client/src/__tests__/TileMap.test.ts`:

```typescript
import { TileMap } from '../engine/TileMap'
import { Camera } from '../engine/Camera'

const TILE = 32
const layers = {
  ground: [[1, 2], [3, 4]],
  objects: [[0, 0], [0, 0]],
  overlay: [[0, 0], [0, 0]],
}

describe('TileMap', () => {
  it('returns correct tile index at world position', () => {
    const map = new TileMap(layers, TILE)
    expect(map.getTileAt('ground', 0, 0)).toBe(1)
    expect(map.getTileAt('ground', 1, 0)).toBe(2)
    expect(map.getTileAt('ground', 0, 1)).toBe(3)
  })

  it('sets tile at position', () => {
    const map = new TileMap(layers, TILE)
    map.setTileAt('ground', 1, 1, 99)
    expect(map.getTileAt('ground', 1, 1)).toBe(99)
  })

  it('returns -1 for out-of-bounds', () => {
    const map = new TileMap(layers, TILE)
    expect(map.getTileAt('ground', 10, 10)).toBe(-1)
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd packages/client && pnpm test -- TileMap
```

- [ ] **Step 3: Implement TileSet + TileMap**

Create `packages/client/src/engine/TileSet.ts`:

```typescript
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
```

Create `packages/client/src/engine/TileMap.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd packages/client && pnpm test -- TileMap
```

- [ ] **Step 5: Commit**

```bash
cd ~/rpg-full && git add . && git commit -m "feat: TileSet and TileMap engine modules"
```

---

### Task 8: EntityLayer + GameCanvas

**Files:**
- Create: `packages/client/src/engine/EntityLayer.ts`
- Create: `packages/client/src/components/game/GameCanvas.tsx`
- Create: `packages/client/src/hooks/useGame.ts`

- [ ] **Step 1: Implement EntityLayer**

Create `packages/client/src/engine/EntityLayer.ts`:

```typescript
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
```

- [ ] **Step 2: Implement useGame hook**

Create `packages/client/src/hooks/useGame.ts`:

```typescript
import { useRef, useEffect, useCallback } from 'react'
import { Camera } from '../engine/Camera'
import { GameLoop } from '../engine/GameLoop'
import { TileSet } from '../engine/TileSet'
import { TileMap } from '../engine/TileMap'
import { EntityLayer } from '../engine/EntityLayer'

interface MapData {
  layers: { ground: number[][], objects: number[][], overlay: number[][] }
  tilesetId: string
  width: number
  height: number
}

const TILE = 32

export function useGame(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const camera = useRef(new Camera(800, 600))
  const loop = useRef(new GameLoop())
  const tileSet = useRef(new TileSet())
  const tileMap = useRef<TileMap | null>(null)
  const entities = useRef(new EntityLayer())

  const load = useCallback(async (mapData: MapData) => {
    await tileSet.current.load(`/assets/tilesets/${mapData.tilesetId}.png`, TILE)
    tileMap.current = new TileMap(mapData.layers, TILE)
    camera.current.setMapBounds(mapData.width * TILE, mapData.height * TILE)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    loop.current.start(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (tileMap.current) tileMap.current.render(ctx, tileSet.current, camera.current)
      entities.current.render(ctx, camera.current, TILE)
    })

    return () => loop.current.stop()
  }, [canvasRef])

  return { camera: camera.current, entities: entities.current, tileMap, load }
}
```

- [ ] **Step 3: Implement GameCanvas**

Create `packages/client/src/components/game/GameCanvas.tsx`:

```tsx
import { useRef, useEffect } from 'react'
import { useGame } from '../../hooks/useGame'

interface Props { mapData?: any; style?: React.CSSProperties }

export default function GameCanvas({ mapData, style }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { load } = useGame(canvasRef)

  useEffect(() => { if (mapData) load(mapData) }, [mapData, load])

  return (
    <div style={{ position: 'relative', ...style }}>
      <canvas ref={canvasRef} width={800} height={600} style={{ display: 'block', background: '#111' }} />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
cd ~/rpg-full && git add . && git commit -m "feat: EntityLayer, GameCanvas, and useGame hook"
```

---

## Phase 4 — Multiplayer (Socket.io)

### Task 9: Socket.io server handlers

**Files:**
- Create: `packages/server/src/socket/index.ts`
- Create: `packages/server/src/socket/sessionHandlers.ts`
- Create: `packages/server/src/socket/movementHandlers.ts`
- Modify: `packages/server/src/app.ts`

- [ ] **Step 1: Write failing test**

Create `packages/server/src/__tests__/session.test.ts`:

```typescript
import { createApp } from '../app'
import { io as Client } from 'socket.io-client'

describe('socket session:join', () => {
  let httpServer: any, port: number

  beforeAll(done => {
    const { httpServer: srv } = createApp()
    httpServer = srv.listen(0, () => {
      port = (httpServer.address() as any).port
      done()
    })
  })

  afterAll(done => httpServer.close(done))

  it('emits session:error for invalid session code', done => {
    const client = Client(`http://localhost:${port}`)
    client.on('connect', () => {
      client.emit('session:join', { sessionCode: 'INVALID', characterId: 'char1' })
    })
    client.on('session:error', (data: any) => {
      expect(data.code).toBe('SESSION_NOT_FOUND')
      client.disconnect()
      done()
    })
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd packages/server && pnpm test -- session
```

- [ ] **Step 3: Implement session handlers**

Create `packages/server/src/socket/sessionHandlers.ts`:

```typescript
import { Server, Socket } from 'socket.io'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// In-memory session states: sessionId → SessionState
export const sessionStates = new Map<string, { players: any[] }>()

// Persist state to DB every 30s
setInterval(async () => {
  for (const [sessionId, state] of sessionStates) {
    await prisma.session.update({ where: { id: sessionId }, data: { state } }).catch(() => {})
  }
}, 30_000)

export function registerSessionHandlers(io: Server, socket: Socket) {
  socket.on('session:join', async ({ sessionCode, characterId }: { sessionCode: string; characterId: string }) => {
    const session = await prisma.session.findUnique({ where: { code: sessionCode } })
    if (!session) return socket.emit('session:error', { code: 'SESSION_NOT_FOUND', message: 'Session not found' })
    if (session.status === 'ended') return socket.emit('session:error', { code: 'SESSION_ENDED', message: 'Session ended' })

    const room = `session:${session.id}`
    const roomSockets = await io.in(room).fetchSockets()
    if (roomSockets.length >= 7) return socket.emit('session:error', { code: 'SESSION_FULL', message: 'Session full' })

    await socket.join(room)
    socket.data.sessionId = session.id
    socket.data.characterId = characterId
    socket.data.userId = (socket.handshake.auth?.token
      ? (() => { try { const jwt = require('jsonwebtoken'); return jwt.decode(socket.handshake.auth.token)?.sub } catch { return '' } })()
      : '') ?? ''

    if (!sessionStates.has(session.id)) {
      const saved = session.state as any
      sessionStates.set(session.id, saved?.players ? saved : { players: [] })
    }

    const state = sessionStates.get(session.id)!
    if (!state.players.find((p: any) => p.characterId === characterId)) {
      state.players.push({ userId: socket.data.userId ?? '', characterId, x: 0, y: 0, hp: 100, direction: 'down' })
    }

    socket.emit('session:joined', { sessionId: session.id, players: state.players })
    io.to(room).emit('session:players', { players: state.players })
  })

  socket.on('session:leave', async () => {
    const { sessionId } = socket.data
    if (!sessionId) return
    const state = sessionStates.get(sessionId)
    if (state) state.players = state.players.filter((p: any) => p.characterId !== socket.data.characterId)
    await socket.leave(`session:${sessionId}`)
    io.to(`session:${sessionId}`).emit('session:players', { players: state?.players ?? [] })
  })

  socket.on('disconnect', async () => {
    const { sessionId } = socket.data
    if (!sessionId) return
    const state = sessionStates.get(sessionId)
    if (state) {
      state.players = state.players.filter((p: any) => p.characterId !== socket.data.characterId)
      await prisma.session.update({ where: { id: sessionId }, data: { state } }).catch(() => {})
    }
  })
}
```

Create `packages/server/src/socket/movementHandlers.ts`:

```typescript
import { Server, Socket } from 'socket.io'
import { sessionStates } from './sessionHandlers'

export function registerMovementHandlers(io: Server, socket: Socket) {
  socket.on('player:move', ({ x, y, direction }: { x: number; y: number; direction: string }) => {
    const { sessionId, characterId } = socket.data
    if (!sessionId) return
    const state = sessionStates.get(sessionId)
    if (!state) return
    const player = state.players.find((p: any) => p.characterId === characterId)
    if (player) { player.x = x; player.y = y; player.direction = direction }
    io.to(`session:${sessionId}`).emit('player:state', { players: state.players })
  })
}
```

Create `packages/server/src/socket/index.ts`:

```typescript
import { Server, Socket } from 'socket.io'
import { registerSessionHandlers } from './sessionHandlers'
import { registerMovementHandlers } from './movementHandlers'
import { registerSpellHandlers } from './spellHandlers'
import { registerChestHandlers } from './chestHandlers'

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    registerSessionHandlers(io, socket)
    registerMovementHandlers(io, socket)
    registerSpellHandlers(io, socket)
    registerChestHandlers(io, socket)
  })
}
```

Create stubs for spell/chest handlers (implemented in later tasks):

```typescript
// packages/server/src/socket/spellHandlers.ts
import { Server, Socket } from 'socket.io'
export function registerSpellHandlers(_io: Server, _socket: Socket) {}

// packages/server/src/socket/chestHandlers.ts
import { Server, Socket } from 'socket.io'
export function registerChestHandlers(_io: Server, _socket: Socket) {}
```

Wire socket into app in `packages/server/src/app.ts` — add after io is created:

```typescript
import { registerSocketHandlers } from './socket/index'
// inside createApp(), after io is defined:
registerSocketHandlers(io)
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd packages/server && pnpm test -- session
```

- [ ] **Step 5: Commit**

```bash
cd ~/rpg-full && git add . && git commit -m "feat: Socket.io session and movement handlers"
```

---

### Task 10: Client socket hook

**Files:**
- Create: `packages/client/src/lib/socket.ts`
- Create: `packages/client/src/hooks/useSocket.ts`

- [ ] **Step 1: Implement socket singleton**

Create `packages/client/src/lib/socket.ts`:

```typescript
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(token: string): Socket {
  if (!socket) {
    socket = io({ auth: { token }, transports: ['websocket'] })
  }
  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}
```

- [ ] **Step 2: Implement useSocket**

Create `packages/client/src/hooks/useSocket.ts`:

```typescript
import { useEffect, useRef, useCallback } from 'react'
import { Socket } from 'socket.io-client'
import { getSocket } from '../lib/socket'

export function useSocket(token: string | null) {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!token) return
    socketRef.current = getSocket(token)
    return () => { /* keep socket alive between page navigations */ }
  }, [token])

  const emit = useCallback(<T>(event: string, data?: T) => {
    socketRef.current?.emit(event, data)
  }, [])

  const on = useCallback(<T>(event: string, handler: (data: T) => void) => {
    socketRef.current?.on(event, handler)
    return () => { socketRef.current?.off(event, handler) }
  }, [])

  return { socket: socketRef.current, emit, on }
}
```

- [ ] **Step 3: Commit**

```bash
cd ~/rpg-full && git add . && git commit -m "feat: client socket singleton and useSocket hook"
```

---

## Phase 5 — Map Editor

### Task 11: MapEditor component

**Files:**
- Create: `packages/client/src/components/master/MapEditor.tsx`
- Create: `packages/client/src/__tests__/MapEditor.test.ts`

- [ ] **Step 1: Write failing test for flood fill**

Create `packages/client/src/__tests__/floodFill.test.ts`:

```typescript
import { floodFill } from '../components/master/MapEditor'

describe('floodFill', () => {
  it('fills connected region', () => {
    const grid = [[1, 1, 1], [1, 1, 1], [1, 1, 1]]
    const result = floodFill(grid, 1, 1, 1, 5)
    expect(result.every(row => row.every(v => v === 5))).toBe(true)
  })

  it('does not fill different tiles', () => {
    const grid = [[1, 2, 1], [1, 2, 1], [1, 2, 1]]
    const result = floodFill(grid, 0, 0, 1, 9)
    expect(result[0][1]).toBe(2)  // wall not filled
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd packages/client && pnpm test -- floodFill
```

- [ ] **Step 3: Implement MapEditor with exported floodFill**

Create `packages/client/src/components/master/MapEditor.tsx`:

```tsx
import { useRef, useEffect, useState, useCallback } from 'react'
import { TileMap } from '../../engine/TileMap'
import { TileSet } from '../../engine/TileSet'
import { Camera } from '../../engine/Camera'

type Tool = 'brush' | 'fill' | 'erase' | 'select'
type LayerName = 'ground' | 'objects' | 'overlay'

// Exported for testing
export function floodFill(grid: number[][], col: number, row: number, target: number, replacement: number): number[][] {
  if (target === replacement) return grid
  const result = grid.map(r => [...r])
  const rows = result.length, cols = result[0].length
  const stack = [[col, row]]
  while (stack.length) {
    const [c, r] = stack.pop()!
    if (c < 0 || c >= cols || r < 0 || r >= rows) continue
    if (result[r][c] !== target) continue
    result[r][c] = replacement
    stack.push([c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1])
  }
  return result
}

interface Props {
  tileMap: TileMap
  tileSet: TileSet
  onSave: (layers: ReturnType<TileMap['getLayers']>) => void
}

const TILE = 32
const PALETTE_TILES = 16  // show first 16 tiles in palette

export default function MapEditor({ tileMap, tileSet, onSave }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const camera = useRef(new Camera(800, 600))
  const [tool, setTool] = useState<Tool>('brush')
  const [layer, setLayer] = useState<LayerName>('ground')
  const [selectedTile, setSelectedTile] = useState(1)
  const [history, setHistory] = useState<ReturnType<TileMap['getLayers']>[]>([])
  const isDrawing = useRef(false)

  function render() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    tileMap.render(ctx, tileSet, camera.current)
    // grid overlay
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    for (let c = 0; c < tileMap.cols; c++) {
      for (let r = 0; r < tileMap.rows; r++) {
        const { x, y } = camera.current.worldToScreen(c * TILE, r * TILE)
        ctx.strokeRect(x, y, TILE, TILE)
      }
    }
  }

  useEffect(() => {
    let raf: number
    function loop() { render(); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  })

  function canvasToTile(e: React.MouseEvent) {
    const rect = canvasRef.current!.getBoundingClientRect()
    const world = camera.current.screenToWorld(e.clientX - rect.left, e.clientY - rect.top)
    return { col: Math.floor(world.x / TILE), row: Math.floor(world.y / TILE) }
  }

  function paint(e: React.MouseEvent) {
    const { col, row } = canvasToTile(e)
    if (tool === 'brush') tileMap.setTileAt(layer, col, row, selectedTile)
    else if (tool === 'erase') tileMap.setTileAt(layer, col, row, 0)
    else if (tool === 'fill') {
      const current = tileMap.getTileAt(layer, col, row)
      if (current < 0) return
      const layers = tileMap.getLayers()
      const filled = floodFill(layers[layer], col, row, current, selectedTile)
      for (let r = 0; r < tileMap.rows; r++)
        for (let c = 0; c < tileMap.cols; c++)
          tileMap.setTileAt(layer, c, r, filled[r][c])
    }
  }

  function pushHistory() {
    setHistory(h => [...h.slice(-49), tileMap.getLayers()])
  }

  function undo() {
    if (!history.length) return
    const prev = history[history.length - 1]
    setHistory(h => h.slice(0, -1))
    for (const l of ['ground', 'objects', 'overlay'] as LayerName[])
      for (let r = 0; r < tileMap.rows; r++)
        for (let c = 0; c < tileMap.cols; c++)
          tileMap.setTileAt(l, c, r, prev[l][r][c])
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 120 }}>
        <b>Ferramenta</b>
        {(['brush', 'fill', 'erase'] as Tool[]).map(t => (
          <button key={t} onClick={() => setTool(t)} style={{ fontWeight: tool === t ? 'bold' : 'normal' }}>{t}</button>
        ))}
        <b>Camada</b>
        {(['ground', 'objects', 'overlay'] as LayerName[]).map(l => (
          <button key={l} onClick={() => setLayer(l)} style={{ fontWeight: layer === l ? 'bold' : 'normal' }}>{l}</button>
        ))}
        <b>Tile: {selectedTile}</b>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 24px)', gap: 2 }}>
          {Array.from({ length: PALETTE_TILES }, (_, i) => (
            <div key={i + 1} onClick={() => setSelectedTile(i + 1)}
              style={{ width: 24, height: 24, border: selectedTile === i + 1 ? '2px solid yellow' : '1px solid #555', cursor: 'pointer', background: `hsl(${(i * 40) % 360},60%,40%)` }} />
          ))}
        </div>
        <button onClick={undo}>Desfazer</button>
        <button onClick={() => onSave(tileMap.getLayers())}>Salvar</button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef} width={800} height={600}
        style={{ background: '#222', cursor: 'crosshair' }}
        onMouseDown={e => { pushHistory(); isDrawing.current = true; paint(e) }}
        onMouseMove={e => { if (isDrawing.current) paint(e) }}
        onMouseUp={() => { isDrawing.current = false }}
        onMouseLeave={() => { isDrawing.current = false }}
      />
    </div>
  )
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd packages/client && pnpm test -- floodFill
```

- [ ] **Step 5: Commit**

```bash
cd ~/rpg-full && git add . && git commit -m "feat: MapEditor component with brush, fill, erase, undo"
```

---

## Phase 6 — Ambient Audio

### Task 12: AudioManager

**Files:**
- Create: `packages/client/src/engine/AudioManager.ts`
- Create: `packages/client/src/__tests__/AudioManager.test.ts`

- [ ] **Step 1: Write failing test**

Create `packages/client/src/__tests__/AudioManager.test.ts`:

```typescript
import { AudioManager } from '../engine/AudioManager'

describe('AudioManager', () => {
  it('starts with no active ambient', () => {
    const am = new AudioManager()
    expect(am.currentAmbient).toBeNull()
  })

  it('tracks current ambient name after crossfade call (mocked)', async () => {
    const am = new AudioManager()
    am['buffers'].set('floresta', {} as AudioBuffer)
    am['_context'] = { createBufferSource: () => ({ buffer: null, loop: false, connect: () => {}, start: () => {} }),
                       createGain: () => ({ gain: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {} }, connect: () => {} }),
                       currentTime: 0, destination: {} } as any
    await am.crossfadeTo('floresta', 0)
    expect(am.currentAmbient).toBe('floresta')
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd packages/client && pnpm test -- AudioManager
```

- [ ] **Step 3: Implement AudioManager**

Create `packages/client/src/engine/AudioManager.ts`:

```typescript
export type AmbientName = 'floresta' | 'caverna' | 'cidade' | 'dungeon' | 'batalha' | 'chuva'

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
    console.warn(`AudioManager: could not load ${name}`)
  }

  async crossfadeTo(name: AmbientName, durationMs = 1500) {
    await this.loadAmbient(name)
    const buf = this.buffers.get(name)
    if (!buf) return

    const ctx = this.context
    const duration = durationMs / 1000

    // fade out current
    if (this.currentGain) {
      const g = this.currentGain
      g.gain.setValueAtTime(g.gain.value, ctx.currentTime)
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
      setTimeout(() => { try { this.currentSource?.stop() } catch {} }, durationMs)
    }

    // fade in new
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

  resume() {
    if (this.context.state === 'suspended') this.context.resume()
  }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd packages/client && pnpm test -- AudioManager
```

- [ ] **Step 5: Wire AmbientControl component**

Create `packages/client/src/components/master/AmbientControl.tsx`:

```tsx
import { useRef } from 'react'
import { AudioManager, AmbientName } from '../../engine/AudioManager'

const AMBIENTS: AmbientName[] = ['floresta', 'caverna', 'cidade', 'dungeon', 'batalha', 'chuva']

interface Props { onSelect: (name: AmbientName) => void; current: AmbientName | null }

export default function AmbientControl({ onSelect, current }: Props) {
  return (
    <div>
      <b>Som Ambiente</b>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
        {AMBIENTS.map(a => (
          <button key={a} onClick={() => onSelect(a)}
            style={{ fontWeight: current === a ? 'bold' : 'normal', padding: '4px 8px' }}>
            {a}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
cd ~/rpg-full && git add . && git commit -m "feat: AudioManager Web Audio API + AmbientControl"
```

---

## Phase 7 — Spell Animations

### Task 13: SpellFX (Phaser lazy-load)

**Files:**
- Create: `packages/client/src/engine/SpellFX.ts`

- [ ] **Step 1: Write failing test**

Create `packages/client/src/__tests__/SpellFX.test.ts`:

```typescript
import { SpellFX } from '../engine/SpellFX'

describe('SpellFX', () => {
  it('instantiates without loading Phaser', () => {
    const fx = new SpellFX()
    expect(fx).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd packages/client && pnpm test -- SpellFX
```

- [ ] **Step 3: Implement SpellFX**

Create `packages/client/src/engine/SpellFX.ts`:

```typescript
import { Camera } from './Camera'

export class SpellFX {
  private async createPhaserScene(width: number, height: number): Promise<{ game: any; scene: any; canvas: HTMLCanvasElement }> {
    const Phaser = (await import('phaser')).default

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.style.cssText = `position:absolute;top:0;left:0;pointer-events:none;z-index:10`
    document.body.appendChild(canvas)

    return new Promise(resolve => {
      const game = new Phaser.Game({
        type: Phaser.CANVAS,
        canvas,
        width, height,
        transparent: true,
        scene: {
          create(this: any) { resolve({ game, scene: this, canvas }) }
        }
      })
    })
  }

  private cleanup(game: any, canvas: HTMLCanvasElement, delayMs: number) {
    setTimeout(() => {
      game.destroy(true)
      canvas.remove()
    }, delayMs)
  }

  async lightning(worldX: number, worldY: number, worldTargetX: number, worldTargetY: number, camera: Camera) {
    const { x: sx, y: sy } = camera.worldToScreen(worldX, worldY)
    const { x: tx, y: ty } = camera.worldToScreen(worldTargetX, worldTargetY)
    const { game, scene, canvas } = await this.createPhaserScene(camera.viewW, camera.viewH)

    const gfx = scene.add.graphics()
    let alpha = 1
    const steps = 8
    let frame = 0

    scene.time.addEvent({
      delay: 16, repeat: 37, callback: () => {
        gfx.clear()
        alpha = 1 - frame / 37
        gfx.lineStyle(3, 0xaaddff, alpha)
        gfx.beginPath()
        let lx = sx, ly = sy
        for (let i = 0; i < steps; i++) {
          const nx = lx + (tx - sx) / steps + (Math.random() - 0.5) * 20
          const ny = ly + (ty - sy) / steps + (Math.random() - 0.5) * 20
          gfx.lineTo(nx, ny)
          lx = nx; ly = ny
        }
        gfx.strokePath()
        frame++
      }
    })

    this.cleanup(game, canvas, 650)
  }

  async explosion(worldX: number, worldY: number, camera: Camera, radius = 64) {
    const { x, y } = camera.worldToScreen(worldX, worldY)
    const { game, scene, canvas } = await this.createPhaserScene(camera.viewW, camera.viewH)

    const particles = scene.add.particles(x, y, undefined, {
      speed: { min: radius * 0.5, max: radius * 2.5 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      lifespan: 600,
      quantity: 30,
      tint: [0xff4400, 0xff8800, 0xffdd00],
      blendMode: 'ADD',
    })

    setTimeout(() => particles.stop(), 100)
    this.cleanup(game, canvas, 800)
  }

  async healing(worldX: number, worldY: number, camera: Camera) {
    const { x, y } = camera.worldToScreen(worldX, worldY)
    const { game, scene, canvas } = await this.createPhaserScene(camera.viewW, camera.viewH)

    const gfx = scene.add.graphics()
    let frame = 0

    scene.time.addEvent({
      delay: 16, repeat: 50, callback: () => {
        gfx.clear()
        const alpha = 1 - frame / 50
        for (let i = 0; i < 5; i++) {
          const px = x + (Math.random() - 0.5) * 40
          const py = y - frame * 1.5 + Math.random() * 10
          gfx.fillStyle(0x44ff88, alpha)
          gfx.fillCircle(px, py, 4)
        }
        frame++
      }
    })

    this.cleanup(game, canvas, 900)
  }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd packages/client && pnpm test -- SpellFX
```

- [ ] **Step 5: Implement server SpellService + spell handlers**

Create `packages/server/src/game/SpellService.ts`:

```typescript
import { SPELLS } from '../config/spells'

export interface SpellResult {
  targetId: string | null
  damage: number
  healing: number
}

export function processSpell(spellId: string, targetX: number, targetY: number, players: any[]): SpellResult {
  const spell = SPELLS.find(s => s.id === spellId)
  if (!spell) return { targetId: null, damage: 0, healing: 0 }

  // Find nearest player in range at target coordinates (tileSize=32)
  const tileX = Math.floor(targetX / 32)
  const tileY = Math.floor(targetY / 32)

  const target = players.find(p => {
    const px = Math.floor(p.x / 32), py = Math.floor(p.y / 32)
    return Math.abs(px - tileX) <= 1 && Math.abs(py - tileY) <= 1
  })

  return {
    targetId: target?.characterId ?? null,
    damage: spell.damage ?? 0,
    healing: spell.healing ?? 0,
  }
}
```

Update `packages/server/src/socket/spellHandlers.ts`:

```typescript
import { Server, Socket } from 'socket.io'
import { sessionStates } from './sessionHandlers'
import { processSpell } from '../game/SpellService'

export function registerSpellHandlers(io: Server, socket: Socket) {
  socket.on('spell:cast', ({ spellId, targetX, targetY }: { spellId: string; targetX: number; targetY: number }) => {
    const { sessionId, characterId } = socket.data
    if (!sessionId) return
    const state = sessionStates.get(sessionId)
    if (!state) return

    const result = processSpell(spellId, targetX, targetY, state.players)

    io.to(`session:${sessionId}`).emit('spell:effect', {
      spellId, casterId: characterId,
      originX: state.players.find((p: any) => p.characterId === characterId)?.x ?? 0,
      originY: state.players.find((p: any) => p.characterId === characterId)?.y ?? 0,
      targetX, targetY,
    })

    if (result.targetId) {
      const target = state.players.find((p: any) => p.characterId === result.targetId)
      if (target) {
        target.hp = Math.max(0, Math.min(100, target.hp - result.damage + result.healing))
        io.to(`session:${sessionId}`).emit('entity:damage', {
          entityId: result.targetId, amount: result.damage || -result.healing, newHp: target.hp
        })
      }
    }
  })
}
```

- [ ] **Step 6: Commit**

```bash
cd ~/rpg-full && git add . && git commit -m "feat: SpellFX Phaser animations + SpellService server handler"
```

---

## Phase 8 — Minimap

### Task 14: Minimap engine module

**Files:**
- Create: `packages/client/src/engine/Minimap.ts`
- Create: `packages/client/src/__tests__/Minimap.test.ts`

- [ ] **Step 1: Write failing test**

Create `packages/client/src/__tests__/Minimap.test.ts`:

```typescript
import { Minimap } from '../engine/Minimap'

describe('Minimap', () => {
  it('minimapToWorld converts correctly', () => {
    const mm = new Minimap(150, 150)
    mm.setMapSize(800, 600)
    const w = mm.minimapToWorld(75, 75)
    expect(w.x).toBeCloseTo(400)
    expect(w.y).toBeCloseTo(300)
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd packages/client && pnpm test -- Minimap
```

- [ ] **Step 3: Implement Minimap**

Create `packages/client/src/engine/Minimap.ts`:

```typescript
import { TileMap } from './TileMap'
import { Camera } from './Camera'

// Tile index → color (basic lookup)
const TILE_COLORS: Record<number, string> = {
  0: '#111',  // empty
  1: '#3a6',  // grass
  2: '#777',  // stone
  3: '#964',  // dirt
  4: '#228',  // water
}
const DEFAULT_COLOR = '#555'

export interface MinimapPlayer { userId: string; x: number; y: number; class: string; isLocal: boolean }

export class Minimap {
  private mapW = 1
  private mapH = 1

  constructor(public width: number, public height: number) {}

  setMapSize(mapPixelW: number, mapPixelH: number) {
    this.mapW = mapPixelW
    this.mapH = mapPixelH
  }

  minimapToWorld(mmX: number, mmY: number) {
    return {
      x: (mmX / this.width) * this.mapW,
      y: (mmY / this.height) * this.mapH,
    }
  }

  worldToMinimap(worldX: number, worldY: number) {
    return {
      x: (worldX / this.mapW) * this.width,
      y: (worldY / this.mapH) * this.height,
    }
  }

  render(ctx: CanvasRenderingContext2D, tileMap: TileMap, camera: Camera, players: MinimapPlayer[], isGM: boolean) {
    const TILE = tileMap.tileSize
    ctx.clearRect(0, 0, this.width, this.height)

    // Draw tiles
    const scaleX = this.width / (tileMap.cols * TILE)
    const scaleY = this.height / (tileMap.rows * TILE)
    for (let r = 0; r < tileMap.rows; r++) {
      for (let c = 0; c < tileMap.cols; c++) {
        const tile = tileMap.getTileAt('ground', c, r)
        ctx.fillStyle = TILE_COLORS[tile] ?? DEFAULT_COLOR
        ctx.fillRect(c * TILE * scaleX, r * TILE * scaleY, Math.ceil(TILE * scaleX), Math.ceil(TILE * scaleY))
      }
    }

    // Draw camera viewport rectangle
    const { x: vx, y: vy } = this.worldToMinimap(camera.x, camera.y)
    const vw = (camera.viewW / this.mapW) * this.width
    const vh = (camera.viewH / this.mapH) * this.height
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.lineWidth = 1
    ctx.strokeRect(vx, vy, vw, vh)

    // Draw players
    for (const p of players) {
      // Spec: GM sees all; players see all allies (no fog per player in MVP)
      const { x, y } = this.worldToMinimap(p.x, p.y)
      ctx.fillStyle = p.isLocal ? '#fff' : '#f80'
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd packages/client && pnpm test -- Minimap
```

- [ ] **Step 5: Wire Minimap into HUD**

Create `packages/client/src/components/game/HUD.tsx`:

```tsx
import { useRef, useEffect } from 'react'
import { Minimap, MinimapPlayer } from '../../engine/Minimap'
import { TileMap } from '../../engine/TileMap'
import { Camera } from '../../engine/Camera'

interface Props {
  tileMap: TileMap | null
  camera: Camera
  players: MinimapPlayer[]
  isGM: boolean
  onMinimapClick?: (worldX: number, worldY: number) => void
}

const mm = new Minimap(150, 150)

export default function HUD({ tileMap, camera, players, isGM, onMinimapClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!tileMap) return
    const TILE = tileMap.tileSize
    mm.setMapSize(tileMap.cols * TILE, tileMap.rows * TILE)
    let raf: number
    function loop() {
      const ctx = canvasRef.current?.getContext('2d')
      if (ctx) mm.render(ctx, tileMap!, camera, players, isGM)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [tileMap, camera, players, isGM])

  function handleClick(e: React.MouseEvent) {
    if (!isGM || !onMinimapClick) return
    const rect = canvasRef.current!.getBoundingClientRect()
    const { x, y } = mm.minimapToWorld(e.clientX - rect.left, e.clientY - rect.top)
    onMinimapClick(x, y)
  }

  return (
    <div style={{ position: 'absolute', bottom: 8, right: 8 }}>
      <canvas
        ref={canvasRef} width={150} height={150}
        style={{ border: '2px solid #555', cursor: isGM ? 'crosshair' : 'default' }}
        onClick={handleClick}
      />
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
cd ~/rpg-full && git add . && git commit -m "feat: Minimap engine module and HUD component"
```

---

## Phase 9 — Loot System

### Task 15: LootService + chest socket handler

**Files:**
- Create: `packages/server/src/game/LootService.ts`
- Create: `packages/server/src/__tests__/LootService.test.ts`
- Modify: `packages/server/src/socket/chestHandlers.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/server/src/__tests__/LootService.test.ts`:

```typescript
import { rollLoot, LootTableSchema } from '../game/LootService'

const entries = [
  { itemId: 'item1', quantity: { min: 1, max: 1 }, weight: 1 },
  { itemId: 'item2', quantity: { min: 2, max: 5 }, weight: 2 },
  { itemId: 'item3', quantity: { min: 1, max: 1 }, weight: 0 },
]

describe('rollLoot', () => {
  it('returns guaranteed_min items', () => {
    const result = rollLoot({ mode: 'single_use', guaranteed_min: 2, entries }, [
      { id: 'item1', name: 'Sword', type: 'weapon', rarity: 'common', stats: {} },
      { id: 'item2', name: 'Gold', type: 'gold', rarity: 'common', stats: {} },
    ])
    expect(result.length).toBe(2)
  })

  it('never returns items with weight 0', () => {
    for (let i = 0; i < 20; i++) {
      const result = rollLoot({ mode: 'infinite', guaranteed_min: 1, entries }, [
        { id: 'item1', name: 'S', type: 'weapon', rarity: 'common', stats: {} },
        { id: 'item2', name: 'G', type: 'gold', rarity: 'common', stats: {} },
        { id: 'item3', name: 'X', type: 'misc', rarity: 'common', stats: {} },
      ])
      expect(result.every(r => r.itemId !== 'item3')).toBe(true)
    }
  })

  it('handles guaranteed_min > entries length', () => {
    const result = rollLoot({ mode: 'single_use', guaranteed_min: 10, entries: [entries[0]] }, [
      { id: 'item1', name: 'S', type: 'weapon', rarity: 'common', stats: {} },
    ])
    expect(result.length).toBe(1)
  })

  it('quantity is within min-max range', () => {
    const result = rollLoot({ mode: 'infinite', guaranteed_min: 1, entries: [entries[1]] }, [
      { id: 'item2', name: 'G', type: 'gold', rarity: 'common', stats: {} },
    ])
    expect(result[0].quantity).toBeGreaterThanOrEqual(2)
    expect(result[0].quantity).toBeLessThanOrEqual(5)
  })
})

describe('LootTableSchema', () => {
  it('rejects missing mode', () => {
    const result = LootTableSchema.safeParse({ guaranteed_min: 1, entries: [] })
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd packages/server && pnpm test -- LootService
```

- [ ] **Step 3: Implement LootService**

Create `packages/server/src/game/LootService.ts`:

```typescript
import { z } from 'zod'

export const LootTableSchema = z.object({
  mode: z.enum(['single_use', 'infinite']),
  guaranteed_min: z.number().int().min(0),
  entries: z.array(z.object({
    itemId: z.string(),
    quantity: z.object({ min: z.number().int().min(1), max: z.number().int().min(1) }),
    weight: z.number().min(0),
  })),
})

export type LootTable = z.infer<typeof LootTableSchema>

export interface LootedItem {
  itemId: string
  name: string
  type: string
  rarity: string
  quantity: number
  stats: Record<string, number>
}

function weightedPickWithoutReplacement(entries: LootTable['entries'], count: number): LootTable['entries'] {
  const pool = entries.filter(e => e.weight > 0)
  const picked: LootTable['entries'] = []
  const remaining = [...pool]

  for (let i = 0; i < count && remaining.length > 0; i++) {
    const totalWeight = remaining.reduce((s, e) => s + e.weight, 0)
    let r = Math.random() * totalWeight
    const idx = remaining.findIndex(e => { r -= e.weight; return r <= 0 })
    const chosen = remaining.splice(idx === -1 ? 0 : idx, 1)[0]
    picked.push(chosen)
  }
  return picked
}

export function rollLoot(table: LootTable, itemDb: { id: string; name: string; type: string; rarity: string; stats: any }[]): LootedItem[] {
  const active = table.entries.filter(e => e.weight > 0)
  const effectiveMin = Math.min(table.guaranteed_min, active.length)
  const picked = weightedPickWithoutReplacement(active, effectiveMin)

  return picked.map(entry => {
    const quantity = entry.quantity.min + Math.floor(Math.random() * (entry.quantity.max - entry.quantity.min + 1))
    const item = itemDb.find(i => i.id === entry.itemId)
    return {
      itemId: entry.itemId,
      name: item?.name ?? 'Unknown',
      type: item?.type ?? 'misc',
      rarity: item?.rarity ?? 'common',
      quantity,
      stats: item?.stats ?? {},
    }
  })
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd packages/server && pnpm test -- LootService
```

- [ ] **Step 5: Implement chest socket handler**

Update `packages/server/src/socket/chestHandlers.ts`:

```typescript
import { Server, Socket } from 'socket.io'
import { PrismaClient } from '@prisma/client'
import { sessionStates } from './sessionHandlers'
import { rollLoot, LootTableSchema } from '../game/LootService'

const prisma = new PrismaClient()

function chebyshev(ax: number, ay: number, bx: number, by: number, tileSize: number) {
  return Math.max(Math.abs(Math.floor(ax / tileSize) - bx), Math.abs(Math.floor(ay / tileSize) - by))
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
    if (chebyshev(player.x, player.y, chest.x, chest.y, 32) > 1) return

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
```

- [ ] **Step 6: Run all server tests**

```bash
cd packages/server && pnpm test
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
cd ~/rpg-full && git add . && git commit -m "feat: LootService algorithm and chest:open socket handler"
```

---

### Task 16: ChestEditor component + chests API + sessions ambient handler

**Files:**
- Create: `packages/client/src/components/master/ChestEditor.tsx`
- Create: `packages/server/src/api/chests.ts`
- Modify: `packages/server/src/api/sessions.ts`
- Modify: `packages/server/src/app.ts`

> Note: `map:reveal` socket event (fog of war reveal by GM) is deferred to post-MVP. The event is defined in the spec but not implemented here.

- [ ] **Step 1: Implement ChestEditor**

Create `packages/client/src/components/master/ChestEditor.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { apiFetch } from '../../lib/api'

interface Item { id: string; name: string; type: string; rarity: string }
interface Entry { itemId: string; quantity: { min: number; max: number }; weight: number }
interface LootTable { mode: 'single_use' | 'infinite'; guaranteed_min: number; entries: Entry[] }

interface Props {
  chestId: string
  initialTable: LootTable
  token: string
  onSave?: () => void
  onClose: () => void
}

export default function ChestEditor({ chestId, initialTable, token, onSave, onClose }: Props) {
  const [table, setTable] = useState<LootTable>(initialTable)
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    apiFetch<Item[]>('/items', {}, token).then(setItems).catch(console.error)
  }, [token])

  function addEntry() {
    if (!items[0]) return
    setTable(t => ({ ...t, entries: [...t.entries, { itemId: items[0].id, quantity: { min: 1, max: 1 }, weight: 1 }] }))
  }

  function updateEntry(i: number, patch: Partial<Entry>) {
    setTable(t => ({ ...t, entries: t.entries.map((e, idx) => idx === i ? { ...e, ...patch } : e) }))
  }

  function removeEntry(i: number) {
    setTable(t => ({ ...t, entries: t.entries.filter((_, idx) => idx !== i) }))
  }

  return (
    <div style={{ padding: 16, background: '#333', border: '1px solid #666', borderRadius: 8, minWidth: 360 }}>
      <h3>Configurar Bau</h3>
      <label>Modo:
        <select value={table.mode} onChange={e => setTable(t => ({ ...t, mode: e.target.value as any }))}>
          <option value="single_use">Uma vez por sessao</option>
          <option value="infinite">Infinito</option>
        </select>
      </label>
      <br />
      <label>Minimo garantido:
        <input type="number" min={0} value={table.guaranteed_min}
          onChange={e => setTable(t => ({ ...t, guaranteed_min: +e.target.value }))} />
      </label>

      <table style={{ width: '100%', marginTop: 8 }}>
        <thead><tr><th>Item</th><th>Min</th><th>Max</th><th>Peso</th><th></th></tr></thead>
        <tbody>
          {table.entries.map((entry, i) => (
            <tr key={i}>
              <td>
                <select value={entry.itemId} onChange={e => updateEntry(i, { itemId: e.target.value })}>
                  {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                </select>
              </td>
              <td><input type="number" min={1} value={entry.quantity.min}
                onChange={e => updateEntry(i, { quantity: { ...entry.quantity, min: +e.target.value } })} style={{ width: 50 }} /></td>
              <td><input type="number" min={1} value={entry.quantity.max}
                onChange={e => updateEntry(i, { quantity: { ...entry.quantity, max: +e.target.value } })} style={{ width: 50 }} /></td>
              <td><input type="number" min={0} value={entry.weight}
                onChange={e => updateEntry(i, { weight: +e.target.value })} style={{ width: 50 }} /></td>
              <td><button onClick={() => removeEntry(i)}>X</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button onClick={addEntry}>+ Item</button>
        <button onClick={async () => {
          await apiFetch(`/chests/${chestId}`, { method: 'PUT', body: JSON.stringify({ lootTable: table }) }, token)
          onSave?.()
          onClose()
        }}>Salvar</button>
        <button onClick={onClose}>Cancelar</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add chests REST API**

Create `packages/server/src/api/chests.ts`:

```typescript
import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { requireAuth, requireRole } from '../middleware/auth'
import { LootTableSchema } from '../game/LootService'

const prisma = new PrismaClient()
const router = Router()

const ChestUpdateSchema = z.object({ lootTable: LootTableSchema, name: z.string().optional() })

router.put('/:id', requireAuth, requireRole('gm'), async (req, res) => {
  const parsed = ChestUpdateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const chest = await prisma.chest.update({
    where: { id: req.params.id },
    data: { lootTable: parsed.data.lootTable, ...(parsed.data.name ? { name: parsed.data.name } : {}) },
  })
  res.json(chest)
})

export default router
```

Wire into `packages/server/src/app.ts`:

```typescript
import chestsRouter from './api/chests'
// inside createApp():
app.use('/api/chests', chestsRouter)
```

- [ ] **Step 3: Add ambient endpoint to sessions API**

Create `packages/server/src/api/sessions.ts`:

```typescript
import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth'
import { Server } from 'socket.io'

const AmbientSchema = z.object({
  ambient: z.enum(['floresta', 'caverna', 'cidade', 'dungeon', 'batalha', 'chuva'])
})

export function createSessionsRouter(io: Server) {
  const router = Router()

  router.post('/:id/ambient', requireAuth, requireRole('gm'), async (req: AuthRequest, res) => {
    const parsed = AmbientSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
    io.to(`session:${req.params.id}`).emit('ambient:change', { ambient: parsed.data.ambient })
    res.json({ ok: true })
  })

  return router
}
```

Wire into `app.ts`:

```typescript
import { createSessionsRouter } from './api/sessions'
// inside createApp():
app.use('/api/sessions', createSessionsRouter(io))
```

- [ ] **Step 3: Run all tests**

```bash
cd ~/rpg-full && pnpm test
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
cd ~/rpg-full && git add . && git commit -m "feat: ChestEditor component and sessions ambient API"
```

---

## Phase 10 — Integration: Wire Pages

### Task 17: MasterPage + GamePage integration

**Files:**
- Modify: `packages/client/src/pages/MasterPage.tsx`
- Modify: `packages/client/src/pages/GamePage.tsx`

- [ ] **Step 1: Implement MasterPage**

Replace `packages/client/src/pages/MasterPage.tsx`:

```tsx
import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'
import { AudioManager, AmbientName } from '../engine/AudioManager'
import { SpellFX } from '../engine/SpellFX'
import MapEditor from '../components/master/MapEditor'
import AmbientControl from '../components/master/AmbientControl'
import { apiFetch } from '../lib/api'
import { TileMap } from '../engine/TileMap'
import { TileSet } from '../engine/TileSet'

const audioManager = new AudioManager()
const spellFX = new SpellFX()

export default function MasterPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { token } = useAuth()
  const { emit, on } = useSocket(token)
  const [mapData, setMapData] = useState<any>(null)
  const [tileMap, setTileMap] = useState<TileMap | null>(null)
  const [tileSet] = useState(new TileSet())
  const [currentAmbient, setCurrentAmbient] = useState<AmbientName | null>(null)

  useEffect(() => {
    if (!mapData) return
    const tm = new TileMap(mapData.layers, 32)
    tileSet.load(`/assets/tilesets/${mapData.tilesetId}.png`, 32).then(() => setTileMap(tm))
  }, [mapData, tileSet])

  async function handleSave(layers: any) {
    await apiFetch(`/maps/${mapData.id}`, { method: 'POST', body: JSON.stringify({ layers, sessionId }) }, token!)
  }

  async function handleAmbient(name: AmbientName) {
    audioManager.resume()
    await audioManager.crossfadeTo(name)
    setCurrentAmbient(name)
    await apiFetch(`/sessions/${sessionId}/ambient`, { method: 'POST', body: JSON.stringify({ ambient: name }) }, token!)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16 }}>
      <h2>Painel do Mestre</h2>
      <AmbientControl onSelect={handleAmbient} current={currentAmbient} />
      {tileMap && tileSet && (
        <MapEditor tileMap={tileMap} tileSet={tileSet} onSave={handleSave} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Implement GamePage**

Replace `packages/client/src/pages/GamePage.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'
import { useGame } from '../hooks/useGame'
import { AudioManager, AmbientName } from '../engine/AudioManager'
import { SpellFX } from '../engine/SpellFX'
import HUD from '../components/game/HUD'

const audioManager = new AudioManager()
const spellFX = new SpellFX()

export default function GamePage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { token, characterId } = useAuth()
  const { emit, on } = useSocket(token)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { camera, entities, tileMap, load } = useGame(canvasRef)
  const [players, setPlayers] = useState<any[]>([])

  useEffect(() => {
    const offPlayers = on<{ players: any[] }>('session:players', ({ players }) => {
      setPlayers(players)
      for (const p of players) {
        // p.x and p.y are already in pixel coords (stored and moved in pixels)
        entities.upsert({ id: p.characterId, x: p.x, y: p.y, color: '#4af', label: p.characterId.slice(0, 4) })
      }
    })

    const offAmbient = on<{ ambient: AmbientName }>('ambient:change', async ({ ambient }) => {
      audioManager.resume()
      await audioManager.crossfadeTo(ambient)
    })

    const offSpell = on<any>('spell:effect', ({ spellId, originX, originY, targetX, targetY }) => {
      if (spellId === 'lightning') spellFX.lightning(originX, originY, targetX, targetY, camera)
      else if (spellId === 'explosion') spellFX.explosion(targetX, targetY, camera, 64)
      else if (spellId === 'healing') spellFX.healing(targetX, targetY, camera)
    })

    return () => { offPlayers(); offAmbient(); offSpell() }
  }, [on, entities, camera])

  function handleKeyDown(e: React.KeyboardEvent) {
    const local = players.find(p => p.characterId === characterId)
    if (!local) return
    const STEP = 32
    let { x, y } = local
    let direction = local.direction ?? 'down'
    if (e.key === 'ArrowUp') { y -= STEP; direction = 'up' }
    else if (e.key === 'ArrowDown') { y += STEP; direction = 'down' }
    else if (e.key === 'ArrowLeft') { x -= STEP; direction = 'left' }
    else if (e.key === 'ArrowRight') { x += STEP; direction = 'right' }
    emit('player:move', { x, y, direction })
    camera.follow(x, y)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} tabIndex={0} onKeyDown={handleKeyDown}>
      <canvas ref={canvasRef} width={800} height={600} style={{ display: 'block', background: '#111' }} />
      <HUD tileMap={tileMap.current} camera={camera} players={players.map(p => ({ userId: p.userId ?? p.characterId, x: p.x, y: p.y, class: p.class ?? 'warrior', isLocal: p.characterId === characterId }))} isGM={false} />
    </div>
  )
}
```

- [ ] **Step 3: Final integration test run**

```bash
cd ~/rpg-full && pnpm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
cd ~/rpg-full && git add . && git commit -m "feat: integrate MasterPage and GamePage with all systems"
```

---

## Phase 11 — Dev Environment Validation

### Task 18: End-to-end smoke test

- [ ] **Step 1: Start dev servers**

```bash
cd ~/rpg-full && pnpm dev
```

Expected: client on `http://localhost:5173`, server on `http://localhost:3001`

- [ ] **Step 2: Verify auth flow**

Open `http://localhost:5173`. Register an account. Verify redirect to `/lobby`.

- [ ] **Step 3: Verify server health**

```bash
curl http://localhost:3001/api/spells -H "Authorization: Bearer <token>"
```

Expected: JSON array with lightning, explosion, healing.

- [ ] **Step 4: Final commit**

```bash
cd ~/rpg-full && git add . && git commit -m "chore: verify dev environment smoke test complete"
```

---

## Summary

| Phase | Tasks | Deliverable |
|-------|-------|-------------|
| 1 | 1-4 | Monorepo, DB, Auth, REST APIs |
| 2 | 5 | React client, auth hook, login page |
| 3 | 6-8 | Canvas engine (Camera, TileMap, EntityLayer, GameLoop) |
| 4 | 9-10 | Socket.io server + client hook |
| 5 | 11 | Map editor with tools + undo |
| 6 | 12 | Ambient audio (Web Audio API) |
| 7 | 13 | Spell animations (Phaser lazy) + SpellService |
| 8 | 14 | Minimap engine + HUD |
| 9 | 15-16 | LootService + ChestEditor |
| 10 | 17 | Page integration |
| 11 | 18 | Smoke test |
