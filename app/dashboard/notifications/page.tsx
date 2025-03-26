"use client";

import { useState } from 'react';
import { useNotifications } from '@/lib/notifications-context';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCircle, MessageSquare, Phone, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Notification } from '@/lib/notifications-context';
import { DashboardShell } from '@/app/components/layout/dashboard-shell';

// Main component with error handling
export default function NotificationsPage() {
  return (
    <DashboardShell>
      <SafeNotificationsContent />
    </DashboardShell>
  );
}

// Component that safely handles the notifications context
function SafeNotificationsContent() {
  const [error, setError] = useState<string | null>(null);
  
  // Try to use notifications
  let notifications: Notification[] = [];
  let unreadCount = 0;
  let markAsRead = async (id: string) => {};
  let markAllAsRead = async () => {};
  
  try {
    const notificationsContext = useNotifications();
    if (notificationsContext) {
      notifications = notificationsContext.notifications;
      unreadCount = notificationsContext.unreadCount;
      markAsRead = notificationsContext.markAsRead;
      markAllAsRead = notificationsContext.markAllAsRead;
    }
  } catch (err) {
    console.error("Error using notifications:", err);
    setError("Unable to load notifications. Please refresh the page or try again later.");
  }
  
  // If there was an error with the hook, render error UI
  if (error) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
        <p className="mt-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
        >
          Refresh Page
        </button>
      </div>
    );
  }
  
  return (
    <NotificationsContent 
      notifications={notifications}
      unreadCount={unreadCount}
      markAsRead={markAsRead}
      markAllAsRead={markAllAsRead}
    />
  );
}

// The actual notifications content
function NotificationsContent({ 
  notifications, 
  unreadCount, 
  markAsRead, 
  markAllAsRead
}: { 
  notifications: Notification[],
  unreadCount: number,
  markAsRead: (id: string) => Promise<void>,
  markAllAsRead: () => Promise<void>
}) {
  const router = useRouter();

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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {!notifications || notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg shadow">
          <Bell className="h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-medium text-gray-600">No notifications yet</h2>
          <p className="text-gray-500 mt-1">You don't have any notifications at the moment.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {notifications.map((notification) => (
            <div 
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`
                p-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors
                ${!notification.isRead ? 'bg-blue-50/50' : ''}
              `}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-4 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className={`font-medium ${!notification.isRead ? 'text-blue-800' : 'text-gray-900'}`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatTime(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">
                    {notification.body}
                  </p>
                </div>
                {notification.isRead && (
                  <div className="ml-2 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 