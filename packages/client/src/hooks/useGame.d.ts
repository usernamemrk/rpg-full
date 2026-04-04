import { Camera } from '../engine/Camera';
import { TileMap } from '../engine/TileMap';
import { EntityLayer } from '../engine/EntityLayer';
interface MapData {
    layers: {
        ground: number[][];
        objects: number[][];
        overlay: number[][];
    };
    tilesetId: string;
    width: number;
    height: number;
}
export declare function useGame(canvasRef: React.RefObject<HTMLCanvasElement>): {
    camera: Camera;
    entities: EntityLayer;
    tileMap: import("react").MutableRefObject<TileMap | null>;
    load: (mapData: MapData) => Promise<void>;
};
export {};
//# sourceMappingURL=useGame.d.ts.map