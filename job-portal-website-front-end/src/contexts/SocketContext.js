import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { MyUserContext } from "../configs/Contexts";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [user] = useContext(MyUserContext);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  
  const [companyStatusUpdate, setCompanyStatusUpdate] = useState(null);

  useEffect(() => {
    if (!user) {
      
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
        setCompanyStatusUpdate(null);
      }
      return;
    }

    
    const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || "http://localhost:5000";
    const newSocket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      setConnected(true);

      
      newSocket.emit("register", user.id);
    });

    newSocket.on("disconnect", () => {
      setConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("✗ Socket.IO connection error:", error);
      setConnected(false);
    });

    
    newSocket.on("new_notification", (data) => {
      
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(data.content, {
          body: "",
          icon: "/logo192.png",
          tag: `notification-${data.id}`,
        });
      }
    });

    
    newSocket.on("company_status_changed", (data) => {
      setCompanyStatusUpdate({ ...data, receivedAt: Date.now() });
    });

    setSocket(newSocket);

    
    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const emitNewMessageSent = (recipientId, senderName, senderRole, companyName, message, companyId = null) => {
    if (socket && connected) {
      socket.emit("new_message_sent", {
        recipient_id: recipientId,
        sender_id: user.id,
        sender_name: senderName,
        sender_role: senderRole,
        company_name: companyName,
        company_id: companyId,
        message: message,
        timestamp: Date.now(),
      });
    }
  };

  const value = {
    socket,
    connected,
    companyStatusUpdate,
    emitNewMessageSent,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
