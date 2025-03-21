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
  getDocs,
  Firestore
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
    let mounted = true;
    let unsubscribeFunc: () => void = () => {};
    
    // Only set up listener if we have a user
    if (!user) {
      setNotifications([]);
      return () => {};
    }
    
    // Add small delay to ensure auth is fully initialized
    const timeoutId = setTimeout(() => {
      if (!mounted) return;
      
      try {
        // Use explicit type for the query to avoid type issues
        const notificationsQuery = query(
          collection(db, "notifications"),
          where("userId", "==", user.uid)
        );
        
        // Add explicit error handling for the query
        unsubscribeFunc = onSnapshot(
          notificationsQuery, 
          {
            next: (snapshot) => {
              try {
                if (!mounted) return;
                
                const notificationsData = snapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                })) as Notification[];
                
                setNotifications(notificationsData);
              } catch (error) {
                console.error("Error processing notification data:", error);
                setNotifications([]);
              }
            },
            error: (error) => {
              console.error("Error subscribing to notifications:", error);
              // Don't crash the app for notification errors
              setNotifications([]);
            }
          }
        );
      } catch (error) {
        console.error("Error setting up notifications listener:", error);
      }
    }, 1000); // Add 1 second delay
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      
      try {
        unsubscribeFunc();
      } catch (error) {
        console.error("Error unsubscribing from notifications:", error);
      }
    };
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