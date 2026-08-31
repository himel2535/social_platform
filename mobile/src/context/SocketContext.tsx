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

type SocketContextValue = {
  socket: Socket | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated, isLoading } = useAuth();
  const { isPreviewMode } = usePreview();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !token || isPreviewMode) {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const nextSocket = io(config.socketUrl, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current = nextSocket;
    setSocket(nextSocket);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    nextSocket.on('connect', handleConnect);
    nextSocket.on('disconnect', handleDisconnect);

    return () => {
      nextSocket.off('connect', handleConnect);
      nextSocket.off('disconnect', handleDisconnect);
      nextSocket.removeAllListeners();
      nextSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [isAuthenticated, isLoading, isPreviewMode, token]);

  const value = useMemo(
    () => ({
      socket,
      isConnected,
    }),
    [socket, isConnected],
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
