"use client";

import { useState } from 'react';
import { useNotifications } from '@/lib/notifications-context';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCircle, MessageSquare, Phone, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Notification } from '@/lib/notifications-context';
import { DashboardShell } from '@/app/components/layout/dashboard-shell';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/app/components/ui/card';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Separator } from '@/app/components/ui/separator';
import { Badge } from '@/app/components/ui/badge';

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
      <div className="p-8">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => window.location.reload()} variant="outline">
              Refresh Page
            </Button>
          </CardFooter>
        </Card>
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <Button onClick={() => markAllAsRead()} variant="outline">
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardDescription>
            {notifications.length} {notifications.length === 1 ? 'notification' : 'notifications'}, {unreadCount} unread
          </CardDescription>
        </CardHeader>
        {!notifications || notifications.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-medium text-muted-foreground">No notifications yet</h2>
            <p className="text-sm text-muted-foreground mt-1">You don't have any notifications at the moment.</p>
          </CardContent>
        ) : (
          <ScrollArea className="h-[500px]">
            <CardContent className="p-0">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div 
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      p-4 flex items-start hover:bg-muted/50 cursor-pointer transition-colors
                      ${!notification.isRead ? 'bg-muted/30' : ''}
                    `}
                  >
                    <div className="flex-shrink-0 mr-4 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-medium ${!notification.isRead ? 'text-primary' : ''}`}>
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <Badge variant="outline" className="bg-primary/10 text-primary text-xs">New</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.body}
                      </p>
                    </div>
                    {notification.isRead && (
                      <div className="ml-2 flex-shrink-0">
                        <CheckCircle className="h-4 w-4 text-muted-foreground/70" />
                      </div>
                    )}
                  </div>
                  {index < notifications.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
} 