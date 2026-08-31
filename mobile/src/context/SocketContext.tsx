import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { config } from '@/constants/config';
import { useAuth } from '@/hooks/useAuth';
import { usePreview } from '@/preview';

type ReconnectListener = () => void;

type SocketContextValue = {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
  subscribeReconnect: (callback: ReconnectListener) => () => void;
};

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated, isLoading } = useAuth();
  const { isPreviewMode } = usePreview();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectListenersRef = useRef(new Set<ReconnectListener>());
  const hasConnectedRef = useRef(false);

  const subscribeReconnect = useCallback((callback: ReconnectListener) => {
    reconnectListenersRef.current.add(callback);
    return () => {
      reconnectListenersRef.current.delete(callback);
    };
  }, []);

  const notifyReconnect = useCallback(() => {
    reconnectListenersRef.current.forEach((callback) => callback());
  }, []);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !token || isPreviewMode) {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
        setConnectionError(null);
        hasConnectedRef.current = false;
      }
      return;
    }

    hasConnectedRef.current = false;

    const nextSocket = io(config.socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socketRef.current = nextSocket;
    setSocket(nextSocket);

    const handleConnect = () => {
      setIsConnected(true);
      setConnectionError(null);

      if (hasConnectedRef.current) {
        notifyReconnect();
      }

      hasConnectedRef.current = true;
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleConnectError = (error: Error) => {
      setConnectionError(error.message || 'Connection failed');
      setIsConnected(false);
    };

    nextSocket.on('connect', handleConnect);
    nextSocket.on('disconnect', handleDisconnect);
    nextSocket.on('connect_error', handleConnectError);

    return () => {
      nextSocket.off('connect', handleConnect);
      nextSocket.off('disconnect', handleDisconnect);
      nextSocket.off('connect_error', handleConnectError);
      nextSocket.removeAllListeners();
      nextSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      setConnectionError(null);
      hasConnectedRef.current = false;
    };
  }, [isAuthenticated, isLoading, isPreviewMode, notifyReconnect, token]);

  const value = useMemo(
    () => ({
      socket,
      isConnected,
      connectionError,
      subscribeReconnect,
    }),
    [socket, isConnected, connectionError, subscribeReconnect],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within SocketProvider');
  }
  return context;
}

export function useSocket() {
  return useSocketContext();
}
