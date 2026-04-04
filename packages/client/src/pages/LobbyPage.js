import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../lib/api';
export default function LobbyPage() {
    const { token, logout } = useAuth();
    const nav = useNavigate();
    const [maps, setMaps] = useState([]);
    const [selectedMap, setSelectedMap] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState('player');
    // New map form
    const [showNewMap, setShowNewMap] = useState(false);
    const [newMapName, setNewMapName] = useState('');
    const [newMapW, setNewMapW] = useState(20);
    const [newMapH, setNewMapH] = useState(20);
    const [mapError, setMapError] = useState('');
    const [mapLoading, setMapLoading] = useState(false);
    function loadMaps() {
        if (!token)
            return;
        apiFetch('/maps', {}, token).then(m => {
            setMaps(m);
            if (m.length > 0 && !selectedMap)
                setSelectedMap(m[0].id);
        }).catch(() => { });
    }
    useEffect(() => { loadMaps(); }, [token]);
    async function handleCreateMap() {
        if (!newMapName.trim()) {
            setMapError('Nome obrigatório');
            return;
        }
        setMapError('');
        setMapLoading(true);
        try {
            const m = await apiFetch('/maps', {
                method: 'POST',
                body: JSON.stringify({ name: newMapName.trim(), width: newMapW, height: newMapH }),
            }, token);
            setMaps(prev => [m, ...prev]);
            setSelectedMap(m.id);
            setShowNewMap(false);
            setNewMapName('');
        }
        catch (e) {
            setMapError(e instanceof Error ? e.message : String(e));
        }
        finally {
            setMapLoading(false);
        }
    }
    async function handleCreateSession() {
        if (!selectedMap) {
            setError('Seleciona um mapa primeiro');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const session = await apiFetch('/sessions', {
                method: 'POST',
                body: JSON.stringify({ mapId: selectedMap }),
            }, token);
            nav(`/master/${session.id}`);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
        finally {
            setLoading(false);
        }
    }
    async function handleJoinSession() {
        if (!joinCode.trim()) {
            setError('Digite o código da sessão');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const session = await apiFetch(`/sessions/code/${joinCode.trim().toUpperCase()}`, {}, token);
            nav(`/game/${session.id}`);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
        finally {
            setLoading(false);
        }
    }
    async function handleLogout() {
        await logout();
        nav('/');
    }
    return (_jsxs("div", { style: { minHeight: '100vh', position: 'relative', overflow: 'hidden' }, children: [_jsx("div", { className: "bg-atmo" }), _jsx("div", { className: "bg-vignette" }), _jsxs("header", { style: {
                    position: 'relative', zIndex: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 28px',
                    borderBottom: '1px solid var(--rune-border)',
                    background: 'rgba(7,7,11,0.7)',
                    backdropFilter: 'blur(6px)',
                }, children: [_jsxs("div", { children: [_jsx("span", { style: { fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--ember)', letterSpacing: '0.08em' }, children: "VOID GRIMOIRE" }), _jsx("span", { style: { fontFamily: 'var(--font-heading)', fontSize: '0.55rem', letterSpacing: '0.18em', color: 'var(--parchment-dim)', display: 'block', textTransform: 'uppercase', marginTop: 1 }, children: "Taverna dos Aventureiros" })] }), _jsx("button", { className: "btn btn-ghost btn-sm", onClick: handleLogout, children: "Sair" })] }), _jsxs("main", { style: { position: 'relative', zIndex: 10, maxWidth: 820, margin: '0 auto', padding: '48px 20px' }, children: [_jsx("h1", { className: "anim-up", style: { fontFamily: 'var(--font-heading)', fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--ember-dim)', marginBottom: 36 }, children: "Escolha seu Destino" }), _jsx("div", { className: "anim-up anim-del1", style: { display: 'flex', gap: 0, marginBottom: 32, borderBottom: '1px solid var(--rune-border)' }, children: [['player', 'Aventureiro — Entrar em Sessão'], ['gm', 'Mestre — Criar Sessão']].map(([t, label]) => (_jsx("button", { type: "button", onClick: () => { setTab(t); setError(''); }, style: {
                                background: 'transparent', border: 'none',
                                borderBottom: tab === t ? '2px solid var(--ember)' : '2px solid transparent',
                                color: tab === t ? 'var(--ember-bright)' : 'var(--parchment-dim)',
                                fontFamily: 'var(--font-heading)', fontSize: '0.6rem',
                                letterSpacing: '0.16em', textTransform: 'uppercase',
                                padding: '0 24px 14px', cursor: 'pointer', transition: 'all 0.2s', marginBottom: -1,
                            }, children: label }, t))) }), tab === 'player' && (_jsxs("div", { className: "ornate anim-up anim-del2", style: { padding: '32px', maxWidth: 460 }, children: [_jsx("div", { style: { fontFamily: 'var(--font-heading)', fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ember-dim)', marginBottom: 8 }, children: "C\u00F3digo da Sess\u00E3o" }), _jsx("p", { style: { fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--parchment-dim)', marginBottom: 16, lineHeight: 1.5 }, children: "O Mestre compartilha um c\u00F3digo de 6 caracteres. Digite abaixo para entrar na aventura." }), _jsx("label", { className: "input-label", children: "C\u00F3digo" }), _jsx("input", { className: "input", placeholder: "EX: ABCD12", value: joinCode, onChange: e => setJoinCode(e.target.value.toUpperCase()), maxLength: 8, style: { letterSpacing: '0.22em', fontFamily: 'var(--font-heading)', fontSize: '1.1rem', textAlign: 'center', marginBottom: 20 }, onKeyDown: e => e.key === 'Enter' && handleJoinSession() }), error && _jsx("div", { className: "error-msg", style: { marginBottom: 16 }, children: error }), _jsx("button", { className: "btn btn-primary btn-full", onClick: handleJoinSession, disabled: loading, children: loading ? '...' : 'Cruzar o Portal' })] })), tab === 'gm' && (_jsxs("div", { className: "anim-up anim-del2", style: { display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 520 }, children: [_jsxs("div", { className: "ornate", style: { padding: '28px' }, children: [_jsx("div", { style: { fontFamily: 'var(--font-heading)', fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ember-dim)', marginBottom: 16 }, children: "Escolher Mapa" }), maps.length === 0 && !showNewMap && (_jsx("p", { style: { fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--parchment-dim)', marginBottom: 16, lineHeight: 1.5 }, children: "Nenhum mapa criado ainda. Crie seu primeiro mapa abaixo." })), maps.length > 0 && (_jsx("div", { style: { display: 'grid', gap: 8, marginBottom: 16 }, children: maps.map(m => (_jsxs("button", { type: "button", onClick: () => setSelectedMap(m.id), style: {
                                                background: selectedMap === m.id ? 'rgba(196,137,14,0.12)' : 'rgba(8,8,16,0.6)',
                                                border: `1px solid ${selectedMap === m.id ? 'var(--ember)' : 'var(--rune-border)'}`,
                                                color: selectedMap === m.id ? 'var(--ember-bright)' : 'var(--parchment)',
                                                padding: '10px 16px', cursor: 'pointer', textAlign: 'left',
                                                transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            }, children: [_jsx("span", { style: { fontFamily: 'var(--font-body)', fontSize: '1rem' }, children: m.name }), _jsxs("span", { style: { fontFamily: 'var(--font-heading)', fontSize: '0.55rem', letterSpacing: '0.12em', color: 'var(--parchment-dim)' }, children: [m.width, "\u00D7", m.height] })] }, m.id))) })), !showNewMap ? (_jsx("button", { className: "btn btn-ghost btn-sm", onClick: () => setShowNewMap(true), style: { width: '100%', borderStyle: 'dashed' }, children: "+ Criar novo mapa" })) : (_jsxs("div", { style: { background: 'rgba(8,8,16,0.6)', border: '1px solid var(--rune-border)', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }, children: [_jsx("div", { style: { fontFamily: 'var(--font-heading)', fontSize: '0.55rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ember-dim)' }, children: "Novo Mapa" }), _jsxs("div", { children: [_jsx("label", { className: "input-label", children: "Nome" }), _jsx("input", { className: "input", placeholder: "Ru\u00EDnas de Etherhold...", value: newMapName, onChange: e => setNewMapName(e.target.value), onKeyDown: e => e.key === 'Enter' && handleCreateMap() })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }, children: [_jsxs("div", { children: [_jsx("label", { className: "input-label", children: "Largura (tiles)" }), _jsx("input", { className: "input", type: "number", min: 5, max: 100, value: newMapW, onChange: e => setNewMapW(Number(e.target.value)) })] }), _jsxs("div", { children: [_jsx("label", { className: "input-label", children: "Altura (tiles)" }), _jsx("input", { className: "input", type: "number", min: 5, max: 100, value: newMapH, onChange: e => setNewMapH(Number(e.target.value)) })] })] }), mapError && _jsx("div", { className: "error-msg", children: mapError }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("button", { className: "btn btn-primary", style: { flex: 1 }, onClick: handleCreateMap, disabled: mapLoading, children: mapLoading ? '...' : 'Forjar Mapa' }), _jsx("button", { className: "btn btn-ghost", onClick: () => { setShowNewMap(false); setMapError(''); }, children: "Cancelar" })] })] }))] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 8 }, children: [error && _jsx("div", { className: "error-msg", children: error }), _jsx("button", { className: "btn btn-primary btn-full", onClick: handleCreateSession, disabled: loading || !selectedMap, children: loading ? '...' : 'Abrir Portal' })] })] }))] })] }));
}
//# sourceMappingURL=LobbyPage.js.map