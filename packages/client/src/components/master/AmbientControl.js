import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const AMBIENTS = [
    { name: 'floresta', icon: '🌿', label: 'Floresta' },
    { name: 'caverna', icon: '🕯', label: 'Caverna' },
    { name: 'cidade', icon: '🏰', label: 'Cidade' },
    { name: 'dungeon', icon: '💀', label: 'Dungeon' },
    { name: 'batalha', icon: '⚔', label: 'Batalha' },
    { name: 'chuva', icon: '🌧', label: 'Chuva' },
];
export default function AmbientControl({ onSelect, current }) {
    return (_jsxs("div", { className: "panel-section", children: [_jsx("div", { className: "section-title", children: "Som Ambiente" }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }, children: AMBIENTS.map(({ name, icon, label }) => {
                    const active = current === name;
                    return (_jsxs("button", { onClick: () => onSelect(name), style: {
                            background: active ? 'rgba(196,137,14,0.15)' : 'rgba(8,8,16,0.5)',
                            border: `1px solid ${active ? 'var(--ember)' : 'var(--rune-border)'}`,
                            color: active ? 'var(--ember-bright)' : 'var(--parchment-dim)',
                            padding: '8px 4px',
                            cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                            transition: 'all 0.2s',
                            boxShadow: active ? '0 0 12px rgba(196,137,14,0.2)' : 'none',
                        }, children: [_jsx("span", { style: { fontSize: '1.1rem', lineHeight: 1 }, children: icon }), _jsx("span", { style: { fontFamily: 'var(--font-heading)', fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase' }, children: label })] }, name));
                }) })] }));
}
//# sourceMappingURL=AmbientControl.js.map