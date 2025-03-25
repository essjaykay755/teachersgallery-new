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
export type NotificationType = "message" | "phone_request" | "review";

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

  // Helper function to safely create onSnapshot listener
  const createSafeListener = (userId: string) => {
    try {
      // Only attempt to create a listener if db is available
      if (!db) {
        console.error("Firestore db not initialized");
        return () => {};
      }

      // Create notification collection query with error handling
      const notificationsRef = collection(db, "notifications");
      if (!notificationsRef) {
        console.error("Failed to get notifications collection reference");
        return () => {};
      }

      // Create query with strict error checking at each step
      const notificationsQuery = query(
        notificationsRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );

      console.log(`Setting up notifications listener for user ${userId}`);

      // Create onSnapshot with comprehensive error handling
      return onSnapshot(
        notificationsQuery,
        {
          next: (snapshot) => {
            try {
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
            console.error("Error in notifications listener:", error);
            // Don't crash the app for notification errors
            setNotifications([]);
          }
        }
      );
    } catch (error) {
      console.error("Failed to create notifications listener:", error);
      return () => {}; // Return empty function as fallback
    }
  };
  
  // Subscribe to user's notifications
  useEffect(() => {
    let mounted = true;
    let unsubscribeFunc: (() => void) | null = null;
    
    // Only set up listener if we have a user with valid UID
    if (!user || !user.uid) {
      setNotifications([]);
      return () => {};
    }
    
    const setupListener = () => {
      try {
        // Clear any existing listener
        if (unsubscribeFunc) {
          try {
            unsubscribeFunc();
          } catch (error) {
            console.error("Error cleaning up existing listener:", error);
          }
          unsubscribeFunc = null;
        }
        
        if (!mounted) return;
        
        // Use our safer listener creation function
        unsubscribeFunc = createSafeListener(user.uid);
      } catch (error) {
        console.error("Error in setupListener:", error);
      }
    };
    
    // Add a retry mechanism with backoff
    let retryCount = 0;
    const maxRetries = 3;
    const setupWithRetry = () => {
      try {
        setupListener();
      } catch (error) {
        console.error(`Attempt ${retryCount + 1} failed:`, error);
        if (retryCount < maxRetries && mounted) {
          retryCount++;
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          setTimeout(setupWithRetry, delay);
        }
      }
    };
    
    // Initial delay to ensure auth is fully initialized
    setTimeout(setupWithRetry, 1000);
    
    return () => {
      mounted = false;
      
      if (unsubscribeFunc) {
        try {
          console.log("Unsubscribing from notifications listener");
          unsubscribeFunc();
        } catch (error) {
          console.error("Error unsubscribing from notifications:", error);
        }
      }
    };
  }, [user?.uid]); // Only depend on user.uid
  
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