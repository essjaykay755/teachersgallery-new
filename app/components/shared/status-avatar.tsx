"use client";

import React, { useState, useEffect } from "react";
import { 
  Avatar, 
  AvatarImage, 
  AvatarFallback 
} from "@/app/components/shared/avatar";
import { subscribeToUserOnlineStatus } from "@/lib/presence-service";
import { cn } from "@/lib/utils";

interface StatusAvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  userId?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showStatus?: boolean;
}

export default function StatusAvatar({
  src,
  alt = "",
  fallback = "",
  userId,
  className = "",
  size = "md",
  showStatus = true,
}: StatusAvatarProps) {
  const [isOnline, setIsOnline] = useState(false);
  
  // Subscribe to user's online status
  useEffect(() => {
    if (!userId || !showStatus) return;
    
    const unsubscribe = subscribeToUserOnlineStatus(userId, (status) => {
      console.log(`User ${userId} online status: ${status}`);
      setIsOnline(status);
    });
    
    return () => unsubscribe();
  }, [userId, showStatus]);
  
  // Size classes based on the size prop
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };
  
  // Status indicator size based on avatar size
  const statusSizeClasses = {
    sm: "h-2.5 w-2.5 right-0 bottom-0",
    md: "h-3 w-3 right-0 bottom-0", 
    lg: "h-3.5 w-3.5 right-0 bottom-0",
    xl: "h-4 w-4 right-0 bottom-0",
  };
  
  return (
    <div className="relative inline-block">
      <Avatar className={cn(sizeClasses[size], className)}>
        {src && <AvatarImage src={src} alt={alt} />}
        <AvatarFallback>{fallback || alt.charAt(0)?.toUpperCase() || "?"}</AvatarFallback>
      </Avatar>
      
      {showStatus && userId && (
        <span 
          className={cn(
            "absolute rounded-full border-2 border-white",
            statusSizeClasses[size],
            isOnline ? "bg-green-500" : "bg-gray-400"
          )}
          aria-label={isOnline ? "Online" : "Offline"}
          title={isOnline ? "Online" : "Offline"}
        />
      )}
    </div>
  );
} 