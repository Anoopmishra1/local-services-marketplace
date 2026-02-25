import { io } from 'socket.io-client';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket;

export const getSocket = () => {
    if (!socket) {
        socket = io(SOCKET_URL, { transports: ['websocket'], autoConnect: false });
    }
    return socket;
};

export const connectSocket = (userId) => {
    const s = getSocket();
    if (!s.connected) s.connect();
    return s;
};

export const disconnectSocket = () => {
    if (socket?.connected) socket.disconnect();
};
