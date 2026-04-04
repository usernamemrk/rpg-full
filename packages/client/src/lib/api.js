const BASE = '/api';
export async function apiFetch(path, options, token) {
    const res = await fetch(`${BASE}${path}`, {
        ...options,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options?.headers },
    });
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
//# sourceMappingURL=api.js.map