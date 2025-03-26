"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCircle, MessageSquare, Phone, Star, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '@/lib/notifications-context';
import { Notification } from '@/lib/notifications-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Button } from "@/app/components/ui/button";
import { Avatar } from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";
import Link from 'next/link';

// This component safely catches errors
export function NotificationDropdown() {
  try {
    return <NotificationDropdownContent />;
  } catch (error) {
    console.error("Error in NotificationDropdown:", error);
    // Render a minimal bell icon without any functionality
    return (
      <div className="relative">
        <button className="text-white hover:text-blue-300">
          <Bell className="h-4 w-4" />
        </button>
      </div>
    );
  }
}

// This is the actual content component
function NotificationDropdownContent() {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Format notification time
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate();
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return '';
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read
      await markAsRead(notification.id);
      
      // Navigate based on notification type
      if (notification.type === 'message' && notification.data?.conversationId) {
        router.push(`/dashboard/messages/${notification.data.conversationId}`);
      } else if (notification.type === 'phone_request') {
        // Always redirect to phone-requests page for any phone request notification
        router.push('/dashboard/phone-requests');
      } else if (notification.type === 'review') {
        // Direct to teacher reviews page
        router.push('/dashboard/teacher/reviews');
      }
    } catch (err) {
      console.error("Error handling notification click:", err);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'phone_request':
        return <Phone className="h-5 w-5 text-green-500" />;
      case 'review':
        return <Star className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="text-white hover:text-blue-300 relative focus:outline-none" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 px-1 w-4 h-4 text-[10px] flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-t-md">
          <DropdownMenuLabel className="font-medium text-gray-700 py-0">Notifications</DropdownMenuLabel>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                onClick={() => {
                  try {
                    markAllAsRead();
                  } catch (err) {
                    console.error("Error marking all as read:", err);
                  }
                }}
                variant="ghost"
                size="sm"
                className="text-xs text-blue-600 hover:text-blue-800 h-6 py-0 px-2 whitespace-nowrap"
              >
                Mark all as read
              </Button>
            )}
            <Link 
              href="/dashboard/notifications" 
              className="flex items-center text-xs text-blue-600 hover:text-blue-800 h-6 py-0 px-2 font-medium whitespace-nowrap"
            >
              <span>View all</span>
              <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </div>
        </div>
        <DropdownMenuSeparator className="mb-0" />
        
        <div className="max-h-[28rem] overflow-y-auto py-1">
          {!notifications || notifications.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`
                    p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 h-auto flex items-start
                    ${!notification.isRead ? 'bg-blue-50/50' : ''}
                  `}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex-shrink-0 mr-3">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${!notification.isRead ? 'text-blue-800' : 'text-gray-900'}`}>
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {notification.body}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                  {notification.isRead && (
                    <div className="ml-2 flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 