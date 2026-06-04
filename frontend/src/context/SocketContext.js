import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      if (user?.role === 'admin') {
        newSocket.emit('join-admin');
      }
    });

    newSocket.on('new-order', (order) => {
      if (user?.role === 'admin') {
        toast.success(`New order: ${order.orderNumber}`);
      }
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [user]);

  const joinOrderRoom = (orderId) => {
    if (socket) socket.emit('join-order', orderId);
  };

  return (
    <SocketContext.Provider value={{ socket, joinOrderRoom }}>
      {children}
    </SocketContext.Provider>
  );
};
