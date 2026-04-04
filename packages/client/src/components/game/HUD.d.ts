import { MinimapPlayer } from '../../engine/Minimap';
import { TileMap } from '../../engine/TileMap';
import { Camera } from '../../engine/Camera';
interface Props {
    tileMap: TileMap | null;
    camera: Camera;
    players: MinimapPlayer[];
    isGM: boolean;
    onMinimapClick?: (worldX: number, worldY: number) => void;
}
export default function HUD({ tileMap, camera, players, isGM, onMinimapClick }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=HUD.d.ts.map