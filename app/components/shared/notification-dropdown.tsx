"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCircle, MessageSquare, Phone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '@/lib/notifications-context';
import { Notification } from '@/lib/notifications-context';

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Try/catch the hook usage to prevent app crashes
  let notificationsData = {
    notifications: [] as Notification[],
    unreadCount: 0,
    markAsRead: async (id: string) => {},
    markAllAsRead: async () => {}
  };
  
  try {
    notificationsData = useNotifications();
  } catch (err) {
    console.error("Error using notifications:", err);
    setError("Unable to load notifications");
  }
  
  const { notifications, unreadCount, markAsRead, markAllAsRead } = notificationsData;
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
      }
      
      // Close the dropdown after clicking
      setIsOpen(false);
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
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  // If there was an error with the hook, render minimal UI
  if (error) {
    return (
      <div className="relative">
        <button className="text-white hover:text-blue-300">
          <Bell className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="text-white hover:text-blue-300 relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 text-xs flex items-center justify-center text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
          <div className="flex items-center justify-between py-2 px-4 bg-gray-50 border-b">
            <h3 className="font-medium text-gray-700">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  try {
                    markAllAsRead();
                  } catch (err) {
                    console.error("Error marking all as read:", err);
                  }
                }}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {!notifications || notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`
                      flex items-start p-4 border-b hover:bg-gray-50 cursor-pointer
                      ${!notification.isRead ? 'bg-blue-50' : ''}
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 