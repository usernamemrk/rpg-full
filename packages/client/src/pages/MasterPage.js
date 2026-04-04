import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { AudioManager } from '../engine/AudioManager';
import { SpellFX } from '../engine/SpellFX';
import MapEditor from '../components/master/MapEditor';
import AmbientControl from '../components/master/AmbientControl';
import { apiFetch } from '../lib/api';
import { TileMap } from '../engine/TileMap';
import { TileSet } from '../engine/TileSet';
const audioManager = new AudioManager();
const spellFX = new SpellFX();
export default function MasterPage() {
    const { sessionId } = useParams();
    const { token } = useAuth();
    const { emit, on } = useSocket(token);
    const nav = useNavigate();
    const [mapData, setMapData] = useState(null);
    const [tileMap, setTileMap] = useState(null);
    const [tileSet] = useState(new TileSet());
    const [currentAmbient, setCurrentAmbient] = useState(null);
    const [sessionCode, setSessionCode] = useState(null);
    const [savingMap, setSavingMap] = useState(false);
    useEffect(() => {
        if (!token || !sessionId)
            return;
        apiFetch(`/sessions/${sessionId}`, {}, token).then(s => {
            setSessionCode(s.code);
            setMapData(s.map);
        }).catch(() => { });
    }, [token, sessionId]);
    useEffect(() => {
        if (!mapData)
            return;
        const tm = new TileMap(mapData.layers, 32);
        tileSet.load(`/assets/tilesets/${mapData.tilesetId}.png`, 32).then(() => setTileMap(tm));
    }, [mapData, tileSet]);
    async function handleSave(layers) {
        setSavingMap(true);
        try {
            await apiFetch(`/maps/${mapData.id}`, { method: 'POST', body: JSON.stringify({ layers, sessionId }) }, token);
        }
        finally {
            setSavingMap(false);
        }
    }
    async function handleAmbient(name) {
        audioManager.resume();
        await audioManager.crossfadeTo(name);
        setCurrentAmbient(name);
        await apiFetch(`/sessions/${sessionId}/ambient`, { method: 'POST', body: JSON.stringify({ ambient: name }) }, token);
    }
    return (_jsxs("div", { style: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--void)', position: 'relative' }, children: [_jsx("div", { className: "bg-atmo", style: { opacity: 0.6 } }), _jsxs("header", { style: {
                    position: 'relative', zIndex: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--rune-border)',
                    background: 'rgba(7,7,11,0.85)',
                    backdropFilter: 'blur(6px)',
                    flexShrink: 0,
                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 16 }, children: [_jsx("button", { className: "btn btn-ghost btn-sm", onClick: () => nav('/lobby'), children: "\u2190 Lobby" }), _jsx("span", { style: { fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--ember)', letterSpacing: '0.06em' }, children: "Painel do Mestre" })] }), sessionCode && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 10 }, children: [_jsx("span", { style: { fontFamily: 'var(--font-heading)', fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--parchment-dim)' }, children: "C\u00F3digo da Sess\u00E3o" }), _jsx("span", { style: {
                                    fontFamily: 'var(--font-heading)', fontSize: '1.1rem', letterSpacing: '0.22em',
                                    color: 'var(--ember-bright)', background: 'rgba(196,137,14,0.1)',
                                    border: '1px solid var(--ember-dim)', padding: '4px 12px',
                                }, children: sessionCode })] })), savingMap && (_jsx("span", { style: { fontFamily: 'var(--font-heading)', fontSize: '0.55rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ember-dim)' }, children: "Salvando..." }))] }), _jsxs("div", { style: { flex: 1, display: 'flex', position: 'relative', zIndex: 10, overflow: 'hidden' }, children: [_jsxs("aside", { style: {
                            width: 220, flexShrink: 0,
                            background: 'rgba(10,10,18,0.92)',
                            borderRight: '1px solid var(--rune-border)',
                            display: 'flex', flexDirection: 'column',
                            overflowY: 'auto',
                        }, children: [_jsx(AmbientControl, { onSelect: handleAmbient, current: currentAmbient }), _jsxs("div", { className: "panel-section", style: { flex: 1 }, children: [_jsx("div", { className: "section-title", children: "Controles" }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 8 }, children: _jsx("button", { className: "btn btn-sm btn-full", onClick: () => handleSave(mapData?.layers ?? []), children: "Salvar Mapa" }) })] })] }), _jsx("div", { style: { flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 24, overflowY: 'auto' }, children: tileMap && tileSet ? (_jsx(MapEditor, { tileMap: tileMap, tileSet: tileSet, onSave: handleSave })) : (_jsx("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--parchment-dim)', fontFamily: 'var(--font-body)', fontSize: '1rem' }, children: mapData ? 'Carregando mapa...' : 'Aguardando dados da sessão...' })) })] })] }));
}
//# sourceMappingURL=MasterPage.js.map