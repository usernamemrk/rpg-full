export class TileSet {
    constructor() {
        Object.defineProperty(this, "image", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "tilesPerRow", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
    }
    async load(src, tileSize) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.image = img;
                this.tilesPerRow = Math.floor(img.width / tileSize);
                resolve();
            };
            img.onerror = reject;
            img.src = src;
        });
    }
    drawTile(ctx, index, dx, dy, tileSize) {
        if (index <= 0)
            return;
        if (this.image) {
            const sx = ((index - 1) % this.tilesPerRow) * tileSize;
            const sy = Math.floor((index - 1) / this.tilesPerRow) * tileSize;
            ctx.drawImage(this.image, sx, sy, tileSize, tileSize, dx, dy, tileSize, tileSize);
            return;
        }
        const hue = (index * 37) % 360;
        ctx.fillStyle = `hsl(${hue}, 55%, 38%)`;
        ctx.fillRect(dx, dy, tileSize, tileSize);
        ctx.strokeStyle = `hsl(${hue}, 55%, 28%)`;
        ctx.lineWidth = 1;
        ctx.strokeRect(dx + 0.5, dy + 0.5, tileSize - 1, tileSize - 1);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = `${Math.floor(tileSize * 0.35)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(index), dx + tileSize / 2, dy + tileSize / 2);
        ctx.fillStyle = `hsl(${hue}, 55%, 38%)`;
    }
}
//# sourceMappingURL=TileSet.js.map