import { jsx as _jsx } from "react/jsx-runtime";
import { useRef, useEffect } from 'react';
import { useGame } from '../../hooks/useGame';
export default function GameCanvas({ mapData, style }) {
    const canvasRef = useRef(null);
    const { load } = useGame(canvasRef);
    useEffect(() => { if (mapData)
        load(mapData); }, [mapData, load]);
    return (_jsx("div", { style: { position: 'relative', ...style }, children: _jsx("canvas", { ref: canvasRef, width: 800, height: 600, style: { display: 'block', background: '#111' } }) }));
}
//# sourceMappingURL=GameCanvas.js.map