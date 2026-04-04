import { TileMap } from '../../engine/TileMap';
import { TileSet } from '../../engine/TileSet';
export declare function floodFill(grid: number[][], col: number, row: number, target: number, replacement: number): number[][];
interface Props {
    tileMap: TileMap;
    tileSet: TileSet;
    onSave: (layers: ReturnType<TileMap['getLayers']>) => void;
}
export default function MapEditor({ tileMap, tileSet, onSave }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=MapEditor.d.ts.map