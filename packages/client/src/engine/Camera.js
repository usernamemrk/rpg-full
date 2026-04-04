export class Camera {
    constructor(viewW, viewH) {
        Object.defineProperty(this, "viewW", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: viewW
        });
        Object.defineProperty(this, "viewH", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: viewH
        });
        Object.defineProperty(this, "x", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "y", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "zoom", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "mapW", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: Infinity
        });
        Object.defineProperty(this, "mapH", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: Infinity
        });
    }
    setMapBounds(mapPixelW, mapPixelH) {
        this.mapW = mapPixelW;
        this.mapH = mapPixelH;
    }
    moveTo(x, y) {
        this.x = Math.max(0, Math.min(x, this.mapW - this.viewW));
        this.y = Math.max(0, Math.min(y, this.mapH - this.viewH));
    }
    follow(worldX, worldY) {
        this.moveTo(worldX - this.viewW / 2, worldY - this.viewH / 2);
    }
    worldToScreen(worldX, worldY) {
        return { x: (worldX - this.x) * this.zoom, y: (worldY - this.y) * this.zoom };
    }
    screenToWorld(screenX, screenY) {
        return { x: screenX / this.zoom + this.x, y: screenY / this.zoom + this.y };
    }
}
//# sourceMappingURL=Camera.js.map