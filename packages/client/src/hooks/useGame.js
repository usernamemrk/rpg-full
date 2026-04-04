import { useRef, useEffect, useCallback } from 'react';
import { Camera } from '../engine/Camera';
import { GameLoop } from '../engine/GameLoop';
import { TileSet } from '../engine/TileSet';
import { TileMap } from '../engine/TileMap';
import { EntityLayer } from '../engine/EntityLayer';
const TILE = 32;
export function useGame(canvasRef) {
    const camera = useRef(new Camera(800, 600));
    const loop = useRef(new GameLoop());
    const tileSet = useRef(new TileSet());
    const tileMap = useRef(null);
    const entities = useRef(new EntityLayer());
    const load = useCallback(async (mapData) => {
        await tileSet.current.load(`/assets/tilesets/${mapData.tilesetId}.png`, TILE);
        tileMap.current = new TileMap(mapData.layers, TILE);
        camera.current.setMapBounds(mapData.width * TILE, mapData.height * TILE);
    }, []);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        loop.current.start(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (tileMap.current)
                tileMap.current.render(ctx, tileSet.current, camera.current);
            entities.current.render(ctx, camera.current, TILE);
        });
        return () => loop.current.stop();
    }, [canvasRef]);
    return { camera: camera.current, entities: entities.current, tileMap, load };
}
//# sourceMappingURL=useGame.js.map