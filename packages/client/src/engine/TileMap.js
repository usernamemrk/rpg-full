export class TileMap {
    constructor(layers, tileSize) {
        Object.defineProperty(this, "tileSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: tileSize
        });
        Object.defineProperty(this, "layers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "cols", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "rows", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.layers = JSON.parse(JSON.stringify(layers)); // defensive copy
        this.rows = layers.ground.length;
        this.cols = layers.ground[0]?.length ?? 0;
    }
    getTileAt(layer, col, row) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols)
            return -1;
        return this.layers[layer][row][col];
    }
    setTileAt(layer, col, row, value) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols)
            return;
        this.layers[layer][row][col] = value;
    }
    getLayers() {
        return JSON.parse(JSON.stringify(this.layers));
    }
    render(ctx, tileSet, camera) {
        const { tileSize } = this;
        const startCol = Math.floor(camera.x / tileSize);
        const startRow = Math.floor(camera.y / tileSize);
        const endCol = Math.min(startCol + Math.ceil(camera.viewW / tileSize) + 1, this.cols);
        const endRow = Math.min(startRow + Math.ceil(camera.viewH / tileSize) + 1, this.rows);
        for (const layer of ['ground', 'objects', 'overlay']) {
            for (let row = startRow; row < endRow; row++) {
                for (let col = startCol; col < endCol; col++) {
                    const tile = this.layers[layer][row][col];
                    if (tile <= 0)
                        continue;
                    const { x, y } = camera.worldToScreen(col * tileSize, row * tileSize);
                    tileSet.drawTile(ctx, tile, x, y, tileSize);
                }
            }
        }
    }
}
//# sourceMappingURL=TileMap.js.map