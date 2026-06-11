import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext) || { socket: null, joinOrderRoom: () => {} };
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      if (userRef.current?.role === 'admin') {
        newSocket.emit('join-admin');
      }
    });

    newSocket.on('new-order', (order) => {
      if (userRef.current?.role === 'admin') {
        toast.success(`New order: ${order.orderNumber}`);
      }
    });

    newSocket.on('connect_error', () => {});

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  const joinOrderRoom = (orderId) => {
    if (socket) socket.emit('join-order', orderId);
  };

  return (
    <SocketContext.Provider value={{ socket, joinOrderRoom }}>
      {children}
    </SocketContext.Provider>
  );
};
