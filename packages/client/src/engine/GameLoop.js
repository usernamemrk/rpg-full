export class GameLoop {
    constructor() {
        Object.defineProperty(this, "raf", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "last", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "running", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
    }
    start(tick) {
        this.running = true;
        const loop = (now) => {
            if (!this.running)
                return;
            const dt = Math.min((now - this.last) / 1000, 0.1);
            this.last = now;
            tick(dt);
            this.raf = requestAnimationFrame(loop);
        };
        this.last = performance.now();
        this.raf = requestAnimationFrame(loop);
    }
    stop() {
        this.running = false;
        cancelAnimationFrame(this.raf);
    }
}
//# sourceMappingURL=GameLoop.js.map