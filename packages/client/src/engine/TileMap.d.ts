import { Camera } from './Camera';
import { TileSet } from './TileSet';
type LayerName = 'ground' | 'objects' | 'overlay';
interface Layers {
    ground: number[][];
    objects: number[][];
    overlay: number[][];
}
export declare class TileMap {
    tileSize: number;
    private layers;
    readonly cols: number;
    readonly rows: number;
    constructor(layers: Layers, tileSize: number);
    getTileAt(layer: LayerName, col: number, row: number): number;
    setTileAt(layer: LayerName, col: number, row: number, value: number): void;
    getLayers(): Layers;
    render(ctx: CanvasRenderingContext2D, tileSet: TileSet, camera: Camera): void;
}
export {};
//# sourceMappingURL=TileMap.d.ts.map