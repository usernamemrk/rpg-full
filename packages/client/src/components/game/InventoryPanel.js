import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
const RARITY_COLOR = {
    common: 'var(--parchment-dim)',
    uncommon: '#5a9a5a',
    rare: 'var(--ember)',
    epic: '#9966cc',
    legendary: '#e8c820',
};
export default function InventoryPanel({ characterId, token, open, onClose }) {
    const [items, setItems] = useState(null);
    useEffect(() => {
        if (!open || items !== null)
            return;
        apiFetch(`/inventory/${characterId}`, {}, token)
            .then(setItems)
            .catch(() => setItems([]));
    }, [open, characterId, token, items]);
    if (!open)
        return null;
    return (_jsxs("div", { style: {
            position: 'absolute', bottom: 16, left: 16, width: 260,
            maxHeight: 380, overflowY: 'auto',
            background: 'rgba(10,10,18,0.95)',
            border: '1px solid var(--rune-border)',
            zIndex: 20,
        }, children: [_jsxs("div", { style: {
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', borderBottom: '1px solid var(--rune-border)',
                }, children: [_jsx("span", { style: { fontFamily: 'var(--font-heading)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ember-dim)' }, children: "Invent\u00E1rio" }), _jsx("button", { "aria-label": "\u00D7", onClick: onClose, style: { background: 'none', border: 'none', color: 'var(--parchment-dim)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0 2px' }, children: "\u00D7" })] }), _jsxs("div", { style: { padding: '8px 0' }, children: [items === null && (_jsx("div", { style: { padding: '12px 14px', fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--parchment-dim)' }, children: "Carregando..." })), items !== null && items.length === 0 && (_jsx("div", { style: { padding: '12px 14px', fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--parchment-dim)' }, children: "Nenhum item encontrado." })), items !== null && items.map(entry => (_jsxs("div", { style: {
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '7px 14px', borderBottom: '1px solid rgba(196,137,14,0.07)',
                        }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: 'var(--parchment)' }, children: entry.item.name }), _jsxs("div", { style: { display: 'flex', gap: 5, marginTop: 3 }, children: [_jsx("span", { style: { fontFamily: 'var(--font-heading)', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--parchment-dim)', background: 'rgba(255,255,255,0.06)', padding: '1px 5px' }, children: entry.item.type }), _jsx("span", { style: { fontFamily: 'var(--font-heading)', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: RARITY_COLOR[entry.item.rarity] ?? 'var(--parchment-dim)', background: 'rgba(255,255,255,0.06)', padding: '1px 5px' }, children: entry.item.rarity })] })] }), _jsxs("span", { style: { fontFamily: 'var(--font-heading)', fontSize: '0.65rem', color: 'var(--parchment-dim)', minWidth: 24, textAlign: 'right' }, children: ["\u00D7", entry.quantity] })] }, entry.id)))] })] }));
}
//# sourceMappingURL=InventoryPanel.js.map