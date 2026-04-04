import { Socket } from 'socket.io-client';
interface UseSocketReturn {
    socket: Socket | null;
    emit: <T>(event: string, data?: T) => void;
    on: <T>(event: string, handler: (data: T) => void) => () => void;
}
export declare function useSocket(token: string | null): UseSocketReturn;
export {};
//# sourceMappingURL=useSocket.d.ts.map