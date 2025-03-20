"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  Timestamp,
  getDocs
} from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth-context";

// Define notification types
export type NotificationType = "message" | "phone_request";

// Define notification interface
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: Timestamp;
  data?: {
    conversationId?: string;
    requestId?: string;
    senderId?: string;
    [key: string]: any;
  };
}

// Define notifications context interface
interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

// Create notifications context
const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// Create notifications provider component
export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  
  // Calculate unread count
  const unreadCount = notifications.filter(notif => !notif.isRead).length;
  
  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        isRead: true
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const unreadNotificationsQuery = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        where("isRead", "==", false)
      );
      
      const snapshot = await getDocs(unreadNotificationsQuery);
      
      const updatePromises = snapshot.docs.map(doc => 
        updateDoc(doc.ref, { isRead: true })
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };
  
  // Subscribe to user's notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      setNotifications(notificationsData);
    }, (error) => {
      console.error("Error subscribing to notifications:", error);
    });
    
    return () => unsubscribe();
  }, [user]);
  
  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
  
  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

// Create a hook to use the notifications context
export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
} 