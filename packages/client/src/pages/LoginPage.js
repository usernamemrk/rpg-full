import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
function EmberParticles() {
    const particles = Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: `${5 + (i * 5.3) % 90}%`,
        bottom: `${-4 + (i * 7) % 12}%`,
        width: `${2 + (i * 1.3) % 4}px`,
        height: `${2 + (i * 1.3) % 4}px`,
        '--dur': `${6 + (i * 1.7) % 8}s`,
        '--del': `${(i * 0.8) % 7}s`,
        '--drift': `${-40 + (i * 11) % 80}px`,
        '--flick': `${1.2 + (i * 0.4) % 1.8}s`,
    }));
    return (_jsx(_Fragment, { children: particles.map(p => (_jsx("div", { className: "ember-particle", style: { left: p.left, bottom: p.bottom, width: p.width, height: p.height, '--dur': p['--dur'], '--del': p['--del'], '--drift': p['--drift'], '--flick': p['--flick'] } }, p.id))) }));
}
export default function LoginPage() {
    const { login, register } = useAuth();
    const nav = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [mode, setMode] = useState('login');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (mode === 'login')
                await login(email, password);
            else
                await register(email, password, name);
            nav('/lobby');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs("div", { style: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }, children: [_jsx("div", { className: "bg-atmo" }), _jsx("div", { className: "bg-vignette" }), _jsx(EmberParticles, {}), _jsxs("div", { className: "ornate anim-up", style: { position: 'relative', zIndex: 10, width: '100%', maxWidth: 400, margin: '0 16px', padding: '40px 36px' }, children: [_jsxs("div", { style: { textAlign: 'center', marginBottom: 36 }, children: [_jsx("div", { style: {
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '1.9rem',
                                    fontWeight: 700,
                                    color: 'var(--ember-bright)',
                                    letterSpacing: '0.06em',
                                    animation: 'pulse-glow 3.5s ease-in-out infinite',
                                    lineHeight: 1.1,
                                }, children: "VOID" }), _jsx("div", { style: {
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '1.1rem',
                                    fontWeight: 400,
                                    color: 'var(--ember)',
                                    letterSpacing: '0.22em',
                                    marginTop: 2,
                                    opacity: 0.85,
                                }, children: "GRIMOIRE" }), _jsx("div", { style: { width: 48, height: 1, background: 'var(--ember-dim)', margin: '16px auto 0', opacity: 0.5 } })] }), _jsx("div", { style: { display: 'flex', marginBottom: 28, borderBottom: '1px solid var(--rune-border)' }, children: ['login', 'register'].map(m => (_jsx("button", { type: "button", onClick: () => { setMode(m); setError(''); }, style: {
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                borderBottom: mode === m ? '2px solid var(--ember)' : '2px solid transparent',
                                color: mode === m ? 'var(--ember-bright)' : 'var(--parchment-dim)',
                                fontFamily: 'var(--font-heading)',
                                fontSize: '0.62rem',
                                letterSpacing: '0.18em',
                                textTransform: 'uppercase',
                                padding: '0 0 12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                marginBottom: -1,
                            }, children: m === 'login' ? 'Entrar' : 'Criar Conta' }, m))) }), _jsxs("form", { onSubmit: handleSubmit, style: { display: 'flex', flexDirection: 'column', gap: 18 }, children: [mode === 'register' && (_jsxs("div", { className: "anim-up", children: [_jsx("label", { className: "input-label", children: "Nome de Aventureiro" }), _jsx("input", { className: "input", placeholder: "Como ser\u00E1s chamado...", value: name, onChange: e => setName(e.target.value), required: true })] })), _jsxs("div", { children: [_jsx("label", { className: "input-label", children: "Email" }), _jsx("input", { className: "input", type: "email", placeholder: "tua@heran\u00E7a.com", value: email, onChange: e => setEmail(e.target.value), required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "input-label", children: "Senha" }), _jsx("input", { className: "input", type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: password, onChange: e => setPassword(e.target.value), required: true })] }), error && (_jsx("div", { className: "error-msg anim-in", children: error })), _jsx("button", { type: "submit", className: "btn btn-primary btn-full", disabled: loading, style: { marginTop: 4 }, children: loading ? '...' : mode === 'login' ? 'Invocar Acesso' : 'Forjar Identidade' })] }), _jsxs("div", { style: { textAlign: 'center', marginTop: 20 }, children: [_jsx("span", { style: { fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--parchment-dim)' }, children: mode === 'login' ? 'Ainda não tens grimório?' : 'Já possuis o grimório?' }), ' ', _jsx("button", { type: "button", className: "btn-ghost", onClick: () => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }, style: {
                                    background: 'none',
                                    border: 'none',
                                    fontFamily: 'var(--font-heading)',
                                    fontSize: '0.62rem',
                                    letterSpacing: '0.14em',
                                    textTransform: 'uppercase',
                                    color: 'var(--ember)',
                                    cursor: 'pointer',
                                    padding: 0,
                                    textDecoration: 'underline',
                                    textDecorationColor: 'var(--ember-dim)',
                                }, children: mode === 'login' ? 'Criar Conta' : 'Entrar' })] })] })] }));
}
//# sourceMappingURL=LoginPage.js.map