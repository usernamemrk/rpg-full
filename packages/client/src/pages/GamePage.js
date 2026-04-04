import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useGame } from '../hooks/useGame';
import { AudioManager } from '../engine/AudioManager';
import { SpellFX } from '../engine/SpellFX';
import HUD from '../components/game/HUD';
import InventoryPanel from '../components/game/InventoryPanel';
const audioManager = new AudioManager();
const spellFX = new SpellFX();
export default function GamePage() {
    const { sessionId } = useParams();
    const { token, characterId } = useAuth();
    const { emit, on } = useSocket(token);
    const canvasRef = useRef(null);
    const { camera, entities, tileMap, load } = useGame(canvasRef);
    const [players, setPlayers] = useState([]);
    const [inventoryOpen, setInventoryOpen] = useState(false);
    useEffect(() => {
        const offPlayers = on('session:players', ({ players }) => {
            setPlayers(players);
            for (const p of players) {
                entities.upsert({ id: p.characterId, x: p.x, y: p.y, color: '#4af', label: p.characterId.slice(0, 4) });
            }
        });
        const offAmbient = on('ambient:change', async ({ ambient }) => {
            audioManager.resume();
            await audioManager.crossfadeTo(ambient);
        });
        const offSpell = on('spell:effect', ({ spellId, originX, originY, targetX, targetY }) => {
            if (spellId === 'lightning')
                spellFX.lightning(originX, originY, targetX, targetY, camera);
            else if (spellId === 'explosion')
                spellFX.explosion(targetX, targetY, camera, 64);
            else if (spellId === 'healing')
                spellFX.healing(targetX, targetY, camera);
        });
        return () => { offPlayers(); offAmbient(); offSpell(); };
    }, [on, entities, camera]);
    function handleKeyDown(e) {
        if (e.key === 'i' || e.key === 'I') {
            setInventoryOpen(v => !v);
            return;
        }
        const local = players.find(p => p.characterId === characterId);
        if (!local)
            return;
        const STEP = 32;
        let { x, y } = local;
        let direction = local.direction ?? 'down';
        if (e.key === 'ArrowUp') {
            y -= STEP;
            direction = 'up';
        }
        else if (e.key === 'ArrowDown') {
            y += STEP;
            direction = 'down';
        }
        else if (e.key === 'ArrowLeft') {
            x -= STEP;
            direction = 'left';
        }
        else if (e.key === 'ArrowRight') {
            x += STEP;
            direction = 'right';
        }
        emit('player:move', { x, y, direction });
        camera.follow(x, y);
    }
    return (_jsxs("div", { style: { minHeight: '100vh', background: 'var(--void)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }, tabIndex: 0, onKeyDown: handleKeyDown, 
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus: true, children: [_jsx("div", { className: "bg-atmo", style: { opacity: 0.4 } }), _jsxs("div", { style: { position: 'relative', zIndex: 10 }, children: [_jsx("canvas", { ref: canvasRef, width: 800, height: 600, style: { display: 'block', background: '#0a0a0f', border: '1px solid var(--rune-border)', boxShadow: '0 0 60px rgba(0,0,0,0.8), 0 0 120px rgba(0,0,0,0.5)' } }), _jsx(HUD, { tileMap: tileMap.current, camera: camera, players: players.map(p => ({ userId: p.userId ?? p.characterId, x: p.x, y: p.y, class: p.class ?? 'warrior', isLocal: p.characterId === characterId })), isGM: false }), _jsx(InventoryPanel, { characterId: characterId ?? '', token: token ?? '', open: inventoryOpen, onClose: () => setInventoryOpen(false) })] })] }));
}
//# sourceMappingURL=GamePage.js.map