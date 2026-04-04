import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../lib/api';
const TOKEN_KEY = 'rpg_access_token';
function parseJwt(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3)
            return null;
        return JSON.parse(atob(parts[1]));
    }
    catch {
        return null;
    }
}
export function useAuth() {
    const [state, setState] = useState({ token: null, userId: null, characterId: null });
    useEffect(() => {
        const stored = localStorage.getItem(TOKEN_KEY);
        if (stored) {
            const payload = parseJwt(stored);
            if (payload)
                setState({ token: stored, userId: payload.sub ?? null, characterId: payload.characterId ?? null });
        }
    }, []);
    const login = useCallback(async (email, password) => {
        const { accessToken } = await apiFetch('/auth/login', {
            method: 'POST', body: JSON.stringify({ email, password }),
        });
        const payload = parseJwt(accessToken);
        setState({ token: accessToken, userId: payload?.sub ?? null, characterId: payload?.characterId ?? null });
        localStorage.setItem(TOKEN_KEY, accessToken);
        return accessToken;
    }, []);
    const register = useCallback(async (email, password, name) => {
        const { accessToken } = await apiFetch('/auth/register', {
            method: 'POST', body: JSON.stringify({ email, password, name }),
        });
        const payload = parseJwt(accessToken);
        setState({ token: accessToken, userId: payload?.sub ?? null, characterId: payload?.characterId ?? null });
        localStorage.setItem(TOKEN_KEY, accessToken);
        return accessToken;
    }, []);
    const logout = useCallback(async () => {
        const token = localStorage.getItem(TOKEN_KEY);
        await apiFetch('/auth/logout', { method: 'POST' }, token ?? undefined);
        localStorage.removeItem(TOKEN_KEY);
        setState({ token: null, userId: null, characterId: null });
    }, []);
    return { ...state, isAuthenticated: !!state.token, login, register, logout };
}
//# sourceMappingURL=useAuth.js.map