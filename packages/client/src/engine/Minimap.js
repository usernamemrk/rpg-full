// Tile index → color (basic lookup)
const TILE_COLORS = {
    0: '#111', // empty
    1: '#3a6', // grass
    2: '#777', // stone
    3: '#964', // dirt
    4: '#228', // water
};
const DEFAULT_COLOR = '#555';
export class Minimap {
    constructor(width, height) {
        Object.defineProperty(this, "width", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: width
        });
        Object.defineProperty(this, "height", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: height
        });
        Object.defineProperty(this, "mapW", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "mapH", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
    }
    setMapSize(mapPixelW, mapPixelH) {
        this.mapW = mapPixelW;
        this.mapH = mapPixelH;
    }
    minimapToWorld(mmX, mmY) {
        return {
            x: (mmX / this.width) * this.mapW,
            y: (mmY / this.height) * this.mapH,
        };
    }
    worldToMinimap(worldX, worldY) {
        return {
            x: (worldX / this.mapW) * this.width,
            y: (worldY / this.mapH) * this.height,
        };
    }
    render(ctx, tileMap, camera, players, isGM) {
        const TILE = tileMap.tileSize;
        ctx.clearRect(0, 0, this.width, this.height);
        // Draw tiles
        const scaleX = this.width / (tileMap.cols * TILE);
        const scaleY = this.height / (tileMap.rows * TILE);
        for (let r = 0; r < tileMap.rows; r++) {
            for (let c = 0; c < tileMap.cols; c++) {
                const tile = tileMap.getTileAt('ground', c, r);
                ctx.fillStyle = TILE_COLORS[tile] ?? DEFAULT_COLOR;
                ctx.fillRect(c * TILE * scaleX, r * TILE * scaleY, Math.ceil(TILE * scaleX), Math.ceil(TILE * scaleY));
            }
        }
        // Draw camera viewport rectangle
        const { x: vx, y: vy } = this.worldToMinimap(camera.x, camera.y);
        const vw = (camera.viewW / this.mapW) * this.width;
        const vh = (camera.viewH / this.mapH) * this.height;
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(vx, vy, vw, vh);
        // Draw players
        for (const p of players) {
            const { x, y } = this.worldToMinimap(p.x, p.y);
            ctx.fillStyle = p.isLocal ? '#fff' : '#f80';
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
//# sourceMappingURL=Minimap.js.map