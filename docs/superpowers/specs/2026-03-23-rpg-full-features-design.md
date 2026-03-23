# RPG Full — Design Spec
**Data:** 2026-03-23
**Status:** Aprovado
**Escopo:** Projeto RPG multiplayer online top-down 2D com 5 features principais

---

## Contexto

RPG multiplayer online em tempo real para até 6 jogadores + 1 mestre (GM) por sessão. Perspectiva top-down 2D com tiles. O mestre tem painel dedicado com controle total sobre mapa, loot, spawns e eventos. Jogadores têm contas persistentes com personagens salvos no banco.

---

## Seção 1: Arquitetura Geral

### Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Vite + React + TypeScript |
| Engine do jogo | Canvas HTML5 puro |
| Animações de magias | Phaser.js (carregado sob demanda) |
| Comunicação real-time | Socket.io |
| Backend | Node.js + Express |
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
│           ├── api/         # Rotas REST (auth, characters, maps, sessions)
│           ├── socket/      # Handlers de eventos Socket.io
│           ├── game/        # Lógica de jogo (LootService, SpellService)
│           └── prisma/      # Schema + migrations
├── package.json             # workspace root
└── pnpm-workspace.yaml
```

### Fluxo de Dados

```
Browser ──REST──► Express API    (auth, CRUD de personagens/mapas)
Browser ──WS────► Socket.io      (jogo em tempo real)
Socket.io ──────► Room por sessão (máx 7 conexões: 6 jogadores + 1 GM)
```

---

## Seção 2: Engine do Jogo + Editor de Mapa

### Canvas Engine

```
client/src/engine/
├── GameLoop.ts      # requestAnimationFrame, delta time
├── Camera.ts        # scroll, zoom, seguir personagem
├── TileMap.ts       # renderiza grid de tiles no canvas
├── TileSet.ts       # spritesheet, índice de tiles
├── EntityLayer.ts   # personagens, NPCs, baus sobre o mapa
└── Minimap.ts       # canvas secundario 150x150px, canto inferior direito
```

O mapa e representado como uma **matriz 2D de inteiros** (`number[][]`) com 3 layers renderizadas em ordem: `ground`, `objects`, `overlay`.

### Editor Visual de Mapa

- Mesmo `TileMap.ts` do jogo em modo edição — sem engine separado
- Toolbar lateral: paleta de tiles do spritesheet (grid clicavel)
- Tile selecionado + clique/arrastar no canvas pinta a celula
- Ferramentas: pincel (1 tile), balde (flood fill), borracha, selecao retangular
- Camadas: seletor de layer ativa (ground / objects / overlay)
- Historico: desfazer/refazer com stack de ate 50 estados
- Salvar: `POST /api/maps/:id` → Prisma persiste JSON da matriz

### Schema do Mapa

```prisma
model Map {
  id        String   @id @default(cuid())
  name      String
  width     Int
  height    Int
  tilesetId String
  layers    Json     // { ground: number[][], objects: number[][], overlay: number[][] }
  createdBy String
  createdAt DateTime @default(now())
}
```

### Evento Socket.io ao Salvar

```
map:updated  →  broadcast para todos na sessao  →  clientes recarregam o mapa
```

---

## Seção 3: Multiplayer em Tempo Real + Autenticacao

### Endpoints REST de Auth

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | /api/auth/register | Cria usuario + hash bcrypt |
| POST | /api/auth/login | Retorna JWT + seta cookie refresh |
| POST | /api/auth/refresh | Renova access token |
| POST | /api/auth/logout | Invalida refresh token |

### Eventos Socket.io

```
// Sessao
session:join       → jogador entra na sala (valida JWT no handshake)
session:leave      → jogador sai
session:players    → broadcast da lista atual

// Movimento
player:move        → { x, y, direction } — servidor valida e re-emite
player:state       → sync periodico de posicoes (60ms)

// Magias
spell:cast         → { spellId, targetX, targetY }
spell:effect       → broadcast para animacao nos clientes
entity:damage      → { entityId, amount, newHp }

// Mapa
map:updated        → mestre salvou mapa
map:reveal         → mestre revela area (fog of war)

// Loot
chest:open         → jogador abre bau
chest:loot         → { chestId, items[] } emitido so para o jogador
chest:opened       → broadcast (anima bau aberto)

// Ambiente
ambient:change     → mestre muda som ambiente da sessao
```

### Permissoes

Role `gm` vs `player` no JWT payload. Servidor valida role antes de processar eventos exclusivos do mestre (`map:updated`, `map:reveal`, `ambient:change`, configuracao de loot).

### Schema Prisma

```prisma
model User {
  id           String      @id @default(cuid())
  email        String      @unique
  passwordHash String
  characters   Character[]
}

model Character {
  id      String @id @default(cuid())
  name    String
  class   String
  hp      Int
  maxHp   Int
  level   Int    @default(1)
  userId  String
  user    User   @relation(fields: [userId], references: [id])
}

model Session {
  id      String   @id @default(cuid())
  code    String   @unique
  gmId    String
  mapId   String
  state   Json
}

model Chest {
  id        String @id @default(cuid())
  mapId     String
  x         Int
  y         Int
  opened    Boolean @default(false)
  lootTable Json
}

model Item {
  id    String @id @default(cuid())
  name  String
  type  String
  rarity String
  stats Json
}
```

---

## Seção 4: Sons Ambiente + Animacoes de Magias + Minimap

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
- Loop infinito: `BufferSourceNode.loop = true`
- AudioContext criado na primeira interacao do usuario (politica de autoplay)
- Sons disponiveis: `floresta`, `caverna`, `cidade`, `dungeon`, `batalha`, `chuva`
- Acionado pelo evento `ambient:change` recebido via Socket.io

### Animacoes de Magias — Phaser.js

```
client/src/engine/SpellFX.ts

SpellFX
  lightning(x, y, targetX, targetY)  → segmentos quebrados + brilho + fade 600ms
  explosion(x, y, radius)            → particulas radiais + anel de choque + fumaca
  healing(x, y)                      → particulas verdes ascendentes + brilho pulsante
```

- Phaser carregado via **dynamic import** apenas quando `spell:effect` e recebido
- Instanciado em canvas **transparente sobreposto** ao canvas principal (position absolute, z-index superior)
- Apos animacao concluir → `Phaser.Scene` destruida, canvas removido do DOM
- Acionado pelo evento Socket.io `spell:effect` em todos os clientes simultaneamente

### Minimap

```
client/src/engine/Minimap.ts
```

- Canvas secundario `150x150px`, fixo no canto inferior direito do HUD
- Re-renderizado a cada frame: itera `ground` layer, mapeia tile → cor solida (lookup table)
- Personagens: pontos coloridos por classe
- Ponto branco: posicao do jogador local; retangulo translucido: area visivel da camera
- Visibilidade: mestre ve todos os jogadores; jogadores veem apenas aliados no campo de visao
- Clique no minimap: camera principal salta para aquela coordenada (apenas mestre)

---

## Seção 5: Sistema de Loot dos Baus

### Painel de Configuracao (Mestre)

Componente `client/src/components/master/ChestEditor.tsx` — abre ao clicar num bau no editor de mapa.

Campos configureis:
- Nome do bau
- Modo: `single_use` (abre uma vez) ou `infinite` (reabrivel)
- Minimo garantido de itens por abertura
- Tabela de itens: item, quantidade (min-max), peso relativo

### Schema da Loot Table (JSON)

```ts
interface LootTable {
  mode: 'single_use' | 'infinite'
  guaranteed_min: number
  entries: {
    itemId: string
    quantity: { min: number; max: number }
    weight: number          // peso relativo — nao porcentagem fixa
  }[]
}
```

### Algoritmo de Sorteio — Servidor

Implementado em `server/src/game/LootService.ts`:

1. Filtra entries com peso > 0
2. Sorteia `guaranteed_min` itens por weighted random sem reposicao
3. Para cada item sorteado, gera quantidade aleatoria entre `min` e `max`
4. Bau `single_use` → `opened: true` no banco apos primeiro sorteio

### Fluxo Completo

```
Jogador clica no bau
  → chest:open { chestId }
  → servidor valida: jogador adjacente? bau nao aberto?
  → LootService.roll(lootTable) → items[]
  → chest:loot { chestId, items }  →  emitido APENAS para aquele socket
  → chest:opened { chestId }       →  broadcast (anima bau)
  → CharacterInventory += items    →  salvo no banco
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
