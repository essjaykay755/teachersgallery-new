"use client";

import { useState, useEffect } from "react";
import { subscribeToUserOnlineStatus } from "@/lib/presence-service";

/**
 * Hook to subscribe to a user's online status
 * @param userId The ID of the user to track
 * @returns An object with the user's online status
 */
export function useOnlineStatus(userId?: string) {
  const [isOnline, setIsOnline] = useState(false);
  
  useEffect(() => {
    if (!userId) return;
    
    const unsubscribe = subscribeToUserOnlineStatus(userId, (status) => {
      setIsOnline(status);
    });
    
    return () => unsubscribe();
  }, [userId]);
  
  return { isOnline };
} 