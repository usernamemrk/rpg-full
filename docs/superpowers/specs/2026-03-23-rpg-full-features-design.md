# RPG Full — Design Spec
**Data:** 2026-03-23
**Status:** Aprovado (v4 — revisao final)
**Escopo:** Projeto RPG multiplayer online top-down 2D com 5 features principais

---

## Contexto

RPG multiplayer online em tempo real para ate 6 jogadores + 1 mestre (GM) por sessao. Perspectiva top-down 2D com tiles. O mestre tem painel dedicado com controle total sobre mapa, loot, spawns e eventos. Jogadores tem contas persistentes com personagens salvos no banco.

---

## Secao 1: Arquitetura Geral

### Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Vite + React + TypeScript |
| Engine do jogo | Canvas HTML5 puro |
| Animacoes de magias | Phaser.js (carregado sob demanda) |
| Comunicacao real-time | Socket.io |
| Backend | Node.js + Express |
| Validacao de schema | Zod |
| ORM | Prisma |
| Banco de dados | PostgreSQL |
| Auth | JWT (access 15min) + refresh token (httpOnly cookie, 7d) |

### Estrutura do Monorepo

```
rpg-full/
├── packages/
│   ├── client/              # Vite + React + Canvas
│   │   └── src/
│   │       ├── engine/      # Canvas engine, audio, spell FX
│   │       ├── components/  # UI React (login, lobby, HUD, painel mestre)
│   │       ├── hooks/       # useSocket, useAuth, useGame
│   │       └── pages/       # Login, Lobby, Game, Master
│   └── server/              # Node.js + Express + Socket.io + Prisma
│       └── src/
│           ├── api/         # Rotas REST (auth, characters, maps, sessions, items, spells)
│           ├── socket/      # Handlers de eventos Socket.io
│           ├── game/        # LootService, SpellService
│           ├── config/      # spells.ts — catalogo estatico de magias
│           └── prisma/      # Schema + migrations + seed
├── package.json             # workspace root
└── pnpm-workspace.yaml
```

### Fluxo de Dados

```
Browser ──REST──► Express API    (auth, CRUD de personagens/mapas/itens)
Browser ──WS────► Socket.io      (jogo em tempo real)
Socket.io ──────► Room por sessao (max 7 conexoes: 6 jogadores + 1 GM)
```

---

## Secao 2: Engine do Jogo + Editor de Mapa

### Canvas Engine

```
client/src/engine/
├── GameLoop.ts      # requestAnimationFrame, delta time
├── Camera.ts        # scroll, zoom, seguir personagem — expoe worldToScreen/screenToWorld
├── TileMap.ts       # renderiza grid de tiles no canvas
├── TileSet.ts       # spritesheet, indice de tiles
├── EntityLayer.ts   # personagens, NPCs, baus sobre o mapa
└── Minimap.ts       # canvas secundario 150x150px, canto inferior direito
```

O mapa e representado como uma **matriz 2D de inteiros** (`number[][]`) com 3 layers em ordem: `ground`, `objects`, `overlay`.

`Camera` expoe:
- `worldToScreen(worldX, worldY): { x, y }`
- `screenToWorld(screenX, screenY): { x, y }`

### Editor Visual de Mapa

- Mesmo `TileMap.ts` do jogo em modo edicao
- Toolbar lateral: paleta de tiles do spritesheet (grid clicavel)
- Tile selecionado + clique/arrastar pinta a celula
- Ferramentas: pincel, balde (flood fill), borracha, selecao retangular
- Camadas: seletor de layer ativa (ground / objects / overlay)
- Historico: stack de 50 estados **client-side em memoria** (perdido ao recarregar — esperado)
- Salvar: `POST /api/maps/:id` com body `{ layers, sessionId }` → Prisma persiste → servidor emite `map:updated { mapId }` para a room `session:<sessionId>` → cliente re-busca o mapa via `GET /api/maps/:id`

### Tileset

`tilesetId` e o nome de um arquivo estatico em `packages/client/public/assets/tilesets/<tilesetId>.png`. Nao ha modelo `Tileset` no banco.

### Schema do Mapa

```prisma
model Map {
  id          String    @id @default(cuid())
  name        String
  width       Int
  height      Int
  tilesetId   String
  layers      Json      // { ground: number[][], objects: number[][], overlay: number[][] }
  createdById String
  createdBy   User      @relation("MapCreator", fields: [createdById], references: [id])
  createdAt   DateTime  @default(now())
  chests      Chest[]
  sessions    Session[]
}
```

---

## Secao 3: Multiplayer em Tempo Real + Autenticacao

### JWT Payload

```ts
interface JWTPayload {
  sub: string          // userId
  role: 'gm' | 'player'
  characterId: string
  sessionId?: string
  iat: number
  exp: number
}
```

### Endpoints REST

| Metodo | Rota | Body / Params | Descricao |
|--------|------|---------------|-----------|
| POST | /api/auth/register | `{ email, password, name }` | Cria usuario |
| POST | /api/auth/login | `{ email, password }` | Retorna JWT + seta cookie refresh |
| POST | /api/auth/refresh | — | Renova access token via cookie |
| POST | /api/auth/logout | — | Invalida refresh token |
| GET  | /api/maps/:id | — | Retorna dados do mapa |
| POST | /api/maps/:id | `{ layers: LayersJson, sessionId: string }` | Salva mapa e emite map:updated |
| GET  | /api/items | — | Lista catalogo de itens |
| POST | /api/items | `{ name, type, rarity, stats }` | Cria item (role: gm) |
| GET  | /api/spells | — | Lista catalogo de magias (fonte: config estatica) |
| POST | /api/sessions/:id/ambient | `{ ambient: AmbientName }` | Muda som; valida role gm; emite ambient:change |

Todos os bodies sao validados com **Zod** no servidor antes de processar.

### Magias — Configuracao Estatica

Magias nao tem modelo no banco. Sao definidas em `server/src/config/spells.ts`:

```ts
interface SpellDefinition {
  id: string           // ex: 'lightning', 'explosion', 'healing'
  name: string
  damage?: number
  healing?: number
  range: number        // em tiles
  fxType: 'lightning' | 'explosion' | 'healing'
}

export const SPELLS: SpellDefinition[] = [ /* catalogo */ ]
```

`SpellService` busca a definicao em `SPELLS` pelo `spellId`, calcula dano/cura e emite os eventos resultantes. `GET /api/spells` expoe o catalogo para o cliente.

### Eventos Socket.io

```ts
// Sessao
session:join    client→server  { sessionCode: string, characterId: string }
session:joined  server→client  { sessionId: string, players: SessionPlayer[] }
session:error   server→client  { code: 'SESSION_FULL'|'SESSION_NOT_FOUND'|'SESSION_ENDED'|'UNAUTHORIZED', message: string }
session:leave   client→server  {}
// Apos session:leave ou desconexao: servidor emite session:players (lista atualizada) para a room
session:players server→client  { players: SessionPlayer[] }

// DTOs
interface SessionPlayer {
  userId: string
  characterId: string
  name: string
  class: string
  x: number
  y: number
  hp: number
}

// Movimento
// Intervalo de emissao pelo cliente: 60ms
// Servidor valida apenas limites do mapa (sem colisao de parede no MVP — aceitavel)
// Clientes aplicam interpolacao linear entre estados recebidos
player:move     client→server  { x: number, y: number, direction: 'up'|'down'|'left'|'right' }
player:state    server→client  { players: { userId: string, x: number, y: number, direction: string }[] }

// Magias
spell:cast      client→server  { spellId: string, targetX: number, targetY: number }
spell:effect    server→client  { spellId: string, casterId: string, originX: number, originY: number, targetX: number, targetY: number }
entity:damage   server→client  { entityId: string, amount: number, newHp: number }

// Mapa
map:updated     server→client  { mapId: string }  // cliente re-busca via GET /api/maps/:id
map:reveal      server→client  { x: number, y: number, radius: number }

// Loot
chest:open      client→server  { chestId: string }
chest:loot      server→client  { chestId: string, items: LootedItem[] }   // apenas para o socket do jogador
chest:opened    server→client  { chestId: string }                         // broadcast

interface LootedItem {
  itemId: string
  name: string
  type: string
  rarity: string
  quantity: number
  stats: Record<string, number>
}

// Ambiente
ambient:change  server→client  { ambient: 'floresta'|'caverna'|'cidade'|'dungeon'|'batalha'|'chuva' }
```

### Session.state e Posicao dos Jogadores

```ts
interface SessionState {
  players: {
    userId: string
    characterId: string
    x: number
    y: number
    hp: number
    direction: string
  }[]
}
```

**Persistencia:** mantido **em memoria** durante o jogo. Persistido no banco a cada **30 segundos** e ao receber `session:leave` ou desconexao.

### Schema Prisma Completo

```prisma
enum SessionStatus {
  active
  ended
}

model User {
  id              String      @id @default(cuid())
  email           String      @unique
  passwordHash    String
  characters      Character[]
  mapsCreated     Map[]       @relation("MapCreator")
  sessionsAsGm    Session[]   @relation("SessionGM")
}

model Character {
  id             String          @id @default(cuid())
  name           String
  class          String
  hp             Int
  maxHp          Int
  // level e definido pelo GM manualmente ou via seed; sem sistema de XP/progressao no MVP
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
  state       Json          // SessionState — persistido a cada 30s e ao encerrar
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
  id          String        @id @default(cuid())
  name        String
  width       Int
  height      Int
  tilesetId   String
  layers      Json
  createdById String
  createdBy   User          @relation("MapCreator", fields: [createdById], references: [id])
  createdAt   DateTime      @default(now())
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
  lootTable   Json         // LootTable — validado com Zod ao salvar
  chestStates ChestState[]
}

model Item {
  id             String          @id @default(cuid())
  name           String
  type           String          // 'weapon' | 'armor' | 'potion' | 'gold' | 'misc'
  rarity         String          // 'common' | 'uncommon' | 'rare' | 'legendary'
  stats          Json            // { damage?, defense?, healing?, value? }
  inventoryItems InventoryItem[]
}
```

### Seed de Itens

`packages/server/src/prisma/seed.ts` popula `Item` com catalogo base (armas, armaduras, pocoes, ouro). GM cria itens adicionais via `POST /api/items`. `LootTable.entries[].itemId` deve referenciar um `Item` existente.

### Validacao de lootTable com Zod

Ao salvar um bau (`PUT /api/chests/:id`), o body e validado com:

```ts
const LootTableSchema = z.object({
  mode: z.enum(['single_use', 'infinite']),
  guaranteed_min: z.number().int().min(0),
  entries: z.array(z.object({
    itemId: z.string(),
    quantity: z.object({ min: z.number().int().min(1), max: z.number().int().min(1) }),
    weight: z.number().min(0)
  }))
})
```

---

## Secao 4: Sons Ambiente + Animacoes de Magias + Minimap

### Sons Ambiente — Web Audio API

```
client/src/engine/AudioManager.ts

AudioManager
  loadAmbient(name)     → fetch + decodeAudioData → AudioBuffer em cache
  playAmbient(name)     → BufferSourceNode → GainNode → AudioContext.destination
  crossfadeTo(name, ms) → fade out atual + fade in novo em paralelo (1500ms)
  setVolume(0..1)       → GainNode.gain.setValueAtTime
```

- Formatos: `.ogg` (primario) + `.mp3` (fallback)
- Loop: `BufferSourceNode.loop = true`
- AudioContext criado na primeira interacao do usuario (politica autoplay)
- Sons: `floresta`, `caverna`, `cidade`, `dungeon`, `batalha`, `chuva`
- Acionado por `ambient:change` via Socket.io

### Animacoes de Magias — Phaser.js

```
client/src/engine/SpellFX.ts

SpellFX
  lightning(screenX, screenY, screenTargetX, screenTargetY)
  explosion(screenX, screenY, radius)
  healing(screenX, screenY)
```

- Recebe world coords de `spell:effect` e chama `Camera.worldToScreen()` antes de renderizar
- Phaser carregado via dynamic import ao receber `spell:effect`
- Canvas transparente sobreposto (position absolute, mesmas dimensoes, z-index superior)
- Apos animacao: `Phaser.Scene` destruida, canvas removido do DOM

### Minimap

```
client/src/engine/Minimap.ts
```

- Canvas `150x150px` fixo no canto inferior direito do HUD
- Itera `ground` layer a cada frame, mapeia tile → cor solida
- Pontos coloridos por classe; ponto branco = jogador local; retangulo translucido = area visivel
- Visibilidade: mestre ve todos; jogadores veem todos os aliados (sem fog individual no MVP)
- Clique: `minimapToWorld(x, y)` → `Camera.moveTo(worldX, worldY)` (apenas mestre)

---

## Secao 5: Sistema de Loot dos Baus

### Validacao de Adjacencia

Servidor le `Session.state.players` (em memoria) e verifica Chebyshev distance ≤ 1 entre o personagem e o bau (`Chest.x`, `Chest.y`).

### Painel de Configuracao (Mestre)

`client/src/components/master/ChestEditor.tsx` — abre ao clicar num bau no editor.

Campos:
- Nome do bau
- Modo: `single_use` ou `infinite`
- `guaranteed_min`
- Tabela de itens: seleciona do catalogo via `GET /api/items`, define quantidade e peso

### Schema da Loot Table

```ts
interface LootTable {
  mode: 'single_use' | 'infinite'
  guaranteed_min: number
  entries: {
    itemId: string
    quantity: { min: number; max: number }
    weight: number
  }[]
}
```

### Algoritmo de Sorteio

`server/src/game/LootService.ts`:

1. Parse e valida `lootTable` com `LootTableSchema` (Zod)
2. Filtra entries com `weight > 0`
3. `effectiveMin = Math.min(guaranteed_min, entries.length)`
4. Weighted random sem reposicao para `effectiveMin` itens
5. Quantidade aleatoria entre `min` e `max` por item
6. Busca dados completos via Prisma para montar `LootedItem[]`
7. `single_use`: upsert `ChestState { opened: true }` no banco
8. `infinite`: nenhum `ChestState` e criado ou verificado

### Fluxo Completo

```
chest:open { chestId }
  → adjacencia: Chebyshev(player, chest) ≤ 1?
  → mode=single_use: ChestState.opened=false?  |  mode=infinite: prossegue direto
  → LootService.roll(lootTable) → LootedItem[]
  → chest:loot { chestId, items }  →  socket do jogador
  → chest:opened { chestId }       →  broadcast
  → InventoryItem upsert           →  Prisma
```

---

## Resumo das Features

| Feature | Arquivo principal | Tecnologia |
|---------|-------------------|-----------|
| Editor de mapa | `engine/TileMap.ts` + `components/master/MapEditor.tsx` | Canvas HTML5 |
| Sons ambiente | `engine/AudioManager.ts` | Web Audio API |
| Animacoes de magias | `engine/SpellFX.ts` | Phaser.js (lazy) |
| Loot dos baus | `game/LootService.ts` + `components/master/ChestEditor.tsx` | Node.js + React |
| Minimap | `engine/Minimap.ts` | Canvas HTML5 |
