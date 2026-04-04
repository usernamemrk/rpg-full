import { io } from 'socket.io-client';
let socket = null;
export function getSocket(token) {
    if (!socket) {
        socket = io({ auth: { token }, transports: ['websocket'] });
    }
    return socket;
}
export function disconnectSocket() {
    socket?.disconnect();
    socket = null;
}
//# sourceMappingURL=socket.js.map