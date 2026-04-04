import { TileMap } from './TileMap';
import { Camera } from './Camera';
export interface MinimapPlayer {
    userId: string;
    x: number;
    y: number;
    class: string;
    isLocal: boolean;
}
export declare class Minimap {
    width: number;
    height: number;
    private mapW;
    private mapH;
    constructor(width: number, height: number);
    setMapSize(mapPixelW: number, mapPixelH: number): void;
    minimapToWorld(mmX: number, mmY: number): {
        x: number;
        y: number;
    };
    worldToMinimap(worldX: number, worldY: number): {
        x: number;
        y: number;
    };
    render(ctx: CanvasRenderingContext2D, tileMap: TileMap, camera: Camera, players: MinimapPlayer[], isGM: boolean): void;
}
//# sourceMappingURL=Minimap.d.ts.map