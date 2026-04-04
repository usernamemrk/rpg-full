import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../lib/socket';
export function useSocket(token) {
    const socketRef = useRef(null);
    useEffect(() => {
        if (!token)
            return;
        socketRef.current = getSocket(token);
        return () => { };
    }, [token]);
    const emit = useCallback((event, data) => {
        socketRef.current?.emit(event, data);
    }, []);
    const on = useCallback((event, handler) => {
        socketRef.current?.on(event, handler);
        return () => { socketRef.current?.off(event, handler); };
    }, []);
    return { socket: socketRef.current, emit, on };
}
//# sourceMappingURL=useSocket.js.map