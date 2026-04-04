export declare class Camera {
    viewW: number;
    viewH: number;
    x: number;
    y: number;
    zoom: number;
    private mapW;
    private mapH;
    constructor(viewW: number, viewH: number);
    setMapBounds(mapPixelW: number, mapPixelH: number): void;
    moveTo(x: number, y: number): void;
    follow(worldX: number, worldY: number): void;
    worldToScreen(worldX: number, worldY: number): {
        x: number;
        y: number;
    };
    screenToWorld(screenX: number, screenY: number): {
        x: number;
        y: number;
    };
}
//# sourceMappingURL=Camera.d.ts.map