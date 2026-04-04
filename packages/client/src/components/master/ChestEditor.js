import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
export default function ChestEditor({ chestId, initialTable, token, onSave, onClose }) {
    const [table, setTable] = useState(initialTable);
    const [items, setItems] = useState([]);
    const [saveError, setSaveError] = useState(null);
    useEffect(() => {
        apiFetch('/items', {}, token).then(setItems).catch(console.error);
    }, [token]);
    function addEntry() {
        if (!items[0])
            return;
        setTable(t => ({ ...t, entries: [...t.entries, { itemId: items[0].id, quantity: { min: 1, max: 1 }, weight: 1 }] }));
    }
    function updateEntry(i, patch) {
        setTable(t => ({ ...t, entries: t.entries.map((e, idx) => idx === i ? { ...e, ...patch } : e) }));
    }
    function removeEntry(i) {
        setTable(t => ({ ...t, entries: t.entries.filter((_, idx) => idx !== i) }));
    }
    return (_jsxs("div", { style: { padding: 16, background: '#333', border: '1px solid #666', borderRadius: 8, minWidth: 360 }, children: [_jsx("h3", { children: "Configurar Bau" }), _jsxs("label", { children: ["Modo:", _jsxs("select", { value: table.mode, onChange: e => setTable(t => ({ ...t, mode: e.target.value })), children: [_jsx("option", { value: "single_use", children: "Uma vez por sessao" }), _jsx("option", { value: "infinite", children: "Infinito" })] })] }), _jsx("br", {}), _jsxs("label", { children: ["Minimo garantido:", _jsx("input", { type: "number", min: 0, value: table.guaranteed_min, onChange: e => setTable(t => ({ ...t, guaranteed_min: +e.target.value })) })] }), _jsxs("table", { style: { width: '100%', marginTop: 8 }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Item" }), _jsx("th", { children: "Min" }), _jsx("th", { children: "Max" }), _jsx("th", { children: "Peso" }), _jsx("th", {})] }) }), _jsx("tbody", { children: table.entries.map((entry, i) => (_jsxs("tr", { children: [_jsx("td", { children: _jsx("select", { value: entry.itemId, onChange: e => updateEntry(i, { itemId: e.target.value }), children: items.map(it => _jsx("option", { value: it.id, children: it.name }, it.id)) }) }), _jsx("td", { children: _jsx("input", { type: "number", min: 1, value: entry.quantity.min, onChange: e => updateEntry(i, { quantity: { ...entry.quantity, min: +e.target.value } }), style: { width: 50 } }) }), _jsx("td", { children: _jsx("input", { type: "number", min: 1, value: entry.quantity.max, onChange: e => updateEntry(i, { quantity: { ...entry.quantity, max: +e.target.value } }), style: { width: 50 } }) }), _jsx("td", { children: _jsx("input", { type: "number", min: 0, value: entry.weight, onChange: e => updateEntry(i, { weight: +e.target.value }), style: { width: 50 } }) }), _jsx("td", { children: _jsx("button", { onClick: () => removeEntry(i), children: "X" }) })] }, entry.itemId + '-' + i))) })] }), _jsxs("div", { style: { marginTop: 8, display: 'flex', gap: 8 }, children: [_jsx("button", { onClick: addEntry, children: "+ Item" }), _jsx("button", { onClick: async () => {
                            try {
                                await apiFetch(`/chests/${chestId}`, { method: 'PUT', body: JSON.stringify({ lootTable: table }) }, token);
                                onSave?.();
                                onClose();
                            }
                            catch (err) {
                                setSaveError(err.message);
                            }
                        }, children: "Salvar" }), saveError && _jsx("span", { style: { color: 'red' }, children: saveError }), _jsx("button", { onClick: onClose, children: "Cancelar" })] })] }));
}
//# sourceMappingURL=ChestEditor.js.map