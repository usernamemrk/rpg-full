import { jsx as _jsx } from "react/jsx-runtime";
import { useRef, useEffect } from 'react';
import { Minimap } from '../../engine/Minimap';
const mm = new Minimap(150, 150);
export default function HUD({ tileMap, camera, players, isGM, onMinimapClick }) {
    const canvasRef = useRef(null);
    const playersRef = useRef(players);
    const cameraRef = useRef(camera);
    const isGMRef = useRef(isGM);
    // Keep refs in sync (no rAF restart needed for these)
    useEffect(() => { playersRef.current = players; }, [players]);
    useEffect(() => { cameraRef.current = camera; }, [camera]);
    useEffect(() => { isGMRef.current = isGM; }, [isGM]);
    useEffect(() => {
        if (!tileMap)
            return;
        const TILE = tileMap.tileSize;
        mm.setMapSize(tileMap.cols * TILE, tileMap.rows * TILE);
        let raf;
        function loop() {
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx)
                mm.render(ctx, tileMap, cameraRef.current, playersRef.current, isGMRef.current);
            raf = requestAnimationFrame(loop);
        }
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [tileMap]);
    function handleClick(e) {
        if (!isGM || !onMinimapClick)
            return;
        if (!canvasRef.current)
            return;
        const rect = canvasRef.current.getBoundingClientRect();
        const { x, y } = mm.minimapToWorld(e.clientX - rect.left, e.clientY - rect.top);
        onMinimapClick(x, y);
    }
    return (_jsx("div", { style: { position: 'absolute', bottom: 8, right: 8 }, children: _jsx("canvas", { ref: canvasRef, width: 150, height: 150, style: { border: '1px solid var(--rune-border)', cursor: isGM ? 'crosshair' : 'default', boxShadow: '0 0 20px rgba(0,0,0,0.6), inset 0 0 8px rgba(0,0,0,0.4)', display: 'block' }, onClick: handleClick }) }));
}
//# sourceMappingURL=HUD.js.map