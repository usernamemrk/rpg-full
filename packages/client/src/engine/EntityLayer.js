export class EntityLayer {
    constructor() {
        Object.defineProperty(this, "entities", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
    }
    upsert(entity) { this.entities.set(entity.id, entity); }
    remove(id) { this.entities.delete(id); }
    get(id) { return this.entities.get(id); }
    all() { return Array.from(this.entities.values()); }
    render(ctx, camera, tileSize) {
        for (const e of this.entities.values()) {
            const { x, y } = camera.worldToScreen(e.x, e.y);
            ctx.fillStyle = e.color;
            ctx.fillRect(x + 4, y + 4, tileSize - 8, tileSize - 8);
            if (e.label) {
                ctx.fillStyle = '#fff';
                ctx.font = '10px monospace';
                ctx.fillText(e.label, x + 2, y - 2);
            }
        }
    }
}
//# sourceMappingURL=EntityLayer.js.map