"use client";

import { useState, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications-context";
import { 
  User, Settings, MessageSquare, 
  Phone, CreditCard, LogOut,
  Menu, X, LayoutDashboard, UserCircle, Star, Bell
} from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Separator } from "@/app/components/ui/separator";

interface DashboardShellProps {
  children: ReactNode;
}

// Wrapper that handles errors
export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <SafeDashboardShell>
      {children}
    </SafeDashboardShell>
  );
}

// This component tries to use the NotificationsProvider and falls back gracefully
function SafeDashboardShell({ children }: DashboardShellProps) {
  // Get unread notification count safely
  let unreadCount = 0;
  try {
    const notificationsContext = useNotifications();
    if (notificationsContext) {
      unreadCount = notificationsContext.unreadCount;
    }
  } catch (error) {
    console.error("Error using notifications in dashboard shell:", error);
    // Continue with zero unread count
  }
  
  return <DashboardShellContent unreadCount={unreadCount} children={children} />;
}

// The actual dashboard shell content
function DashboardShellContent({ children, unreadCount }: DashboardShellProps & { unreadCount: number }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { userProfile, logout } = useAuth();
  
  const isTeacher = userProfile?.userType === "teacher";
  
  // Define the type for navigation items
  type NavigationItem = {
    title: string;
    href: string;
    icon: any;
    active: boolean;
    badge?: number;
    disabled?: boolean;
  };
  
  const navigationItems: NavigationItem[] = [
    {
      title: "Dashboard",
      href: `/dashboard/${userProfile?.userType || ""}`,
      icon: LayoutDashboard,
      active: pathname === `/dashboard/${userProfile?.userType}`,
    },
    {
      title: "Messages",
      href: "/dashboard/messages",
      icon: MessageSquare,
      active: pathname === "/dashboard/messages" || pathname.startsWith("/dashboard/messages/"),
    },
    {
      title: "Notifications",
      href: "/dashboard/notifications",
      icon: Bell,
      active: pathname === "/dashboard/notifications",
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
  ];
  
  // Add Phone Requests only for teachers
  if (isTeacher) {
    navigationItems.push({
      title: "Phone Requests",
      href: "/dashboard/phone-requests",
      icon: Phone,
      active: pathname === "/dashboard/phone-requests",
    });
    
    // Add Reviews section for teachers
    navigationItems.push({
      title: "Reviews",
      href: "/dashboard/teacher/reviews",
      icon: Star,
      active: pathname === "/dashboard/teacher/reviews",
    });
  }
  
  navigationItems.push({
    title: "Profile",
    href: `/dashboard/${userProfile?.userType}/edit`,
    icon: UserCircle,
    active: pathname === `/dashboard/${userProfile?.userType}/edit`,
  });
  
  // Add a payment link only for teachers
  if (isTeacher) {
    navigationItems.push({
      title: "Featured",
      href: "#",
      icon: CreditCard,
      active: false,
      disabled: true,
    });
  }

  // Render a vertical tab navigation item
  const renderTabItem = (item: any) => (
    <Link
      key={item.href}
      href={item.disabled ? "#" : item.href}
      onClick={(e) => {
        if (item.disabled) {
          e.preventDefault();
        }
      }}
      className={cn(
        "flex items-center gap-3 py-2.5 px-4 text-sm rounded-md mx-2 my-0.5 transition-all",
        item.active 
          ? "text-blue-600 bg-blue-50 font-medium" 
          : "text-gray-700 hover:bg-gray-100",
        item.disabled && "opacity-80 cursor-not-allowed hover:bg-transparent"
      )}
    >
      <item.icon className={cn("h-[18px] w-[18px]", item.active ? "text-blue-600" : "text-gray-500")} />
      <span className="flex-1">{item.title}</span>
      {item.badge && (
        <Badge variant="destructive" className="ml-auto text-xs py-0.5 px-1.5 rounded-full">
          {item.badge > 9 ? '9+' : item.badge}
        </Badge>
      )}
      {item.disabled && (
        <span className="ml-auto flex items-center">
          <Badge variant="outline" className="text-xs py-0.5 px-2 rounded-full bg-blue-50 text-blue-600 border-blue-100">
            Soon
          </Badge>
        </span>
      )}
    </Link>
  );
  
  // Render a mobile navigation card
  const renderMobileNavCard = (item: NavigationItem) => (
    <Link
      key={item.href}
      href={item.disabled ? "#" : item.href}
      onClick={(e) => {
        if (item.disabled) {
          e.preventDefault();
        }
      }}
      className={cn(
        "flex flex-col items-center justify-center p-3 rounded-lg transition-all w-28 shrink-0 h-24",
        item.active 
          ? "bg-blue-50 border-blue-100 border text-blue-600" 
          : "bg-white border border-gray-100 text-gray-700 hover:bg-gray-50",
        item.disabled && "opacity-80 cursor-not-allowed hover:bg-white"
      )}
    >
      <div className={cn(
        "p-2 rounded-full mb-1.5",
        item.active ? "bg-blue-100" : "bg-gray-100"
      )}>
        <item.icon className={cn(
          "h-5 w-5", 
          item.active ? "text-blue-600" : "text-gray-500"
        )} />
      </div>
      <span className="text-xs font-medium text-center">{item.title}</span>
      {item.badge && (
        <Badge variant="destructive" className="mt-1 text-xs py-0.5 px-1.5 rounded-full">
          {item.badge > 9 ? '9+' : item.badge}
        </Badge>
      )}
      {item.disabled && (
        <Badge variant="outline" className="mt-1 text-xs py-0.5 px-1.5 rounded-full bg-blue-50 text-blue-600 border-blue-100">
          Soon
        </Badge>
      )}
    </Link>
  );

  // Handle logout with navigation
  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback navigation even if there's an error
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Remove the mobile header as it's redundant */}
      
      {/* Mobile menu overlay */}
      <div 
        className={cn(
          "fixed inset-0 z-50 bg-gray-800/70 lg:hidden transition-opacity",
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileMenuOpen(false)}
      />
      
      {/* Mobile menu */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-lg transition-transform lg:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <Link href="/" className="text-xl font-semibold text-blue-600">
            TeachersGallery
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="flex flex-col py-2 px-2">
            {navigationItems.map(renderTabItem)}
            <Separator className="my-2 mx-2" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 py-2.5 px-4 text-sm rounded-md mx-2 my-0.5 text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut className="h-[18px] w-[18px]" />
              <span>Logout</span>
            </button>
          </div>
        </ScrollArea>
      </div>
      
      {/* Container with vertical tabbed navigation and content */}
      <div className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Vertical tabbed navigation - desktop only */}
          <div className="hidden lg:block w-60 shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-2 h-fit">
              <div className="flex flex-col">
                {navigationItems.map(renderTabItem)}
                <Separator className="my-2 mx-2" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 py-2.5 px-4 text-sm rounded-md mx-2 my-0.5 text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Main content with mobile navigation cards */}
          <div className="flex-1">
            {/* Mobile navigation cards - only shown on small screens */}
            {/* Removed for mobile and handled in navbar, but kept for desktop */}
            <div className="hidden md:block lg:hidden mb-6">
              <div className="overflow-x-auto pb-2 -mx-4 px-4">
                <div className="flex space-x-3">
                  {navigationItems.map(renderMobileNavCard)}
                  {/* Logout button as a card */}
                  <button
                    onClick={handleLogout}
                    className="flex flex-col items-center justify-center p-3 rounded-lg bg-white border border-gray-100 text-red-600 hover:bg-red-50 transition-all w-28 shrink-0 h-24"
                  >
                    <div className="p-2 rounded-full bg-red-50 mb-1.5">
                      <LogOut className="h-5 w-5 text-red-500" />
                    </div>
                    <span className="text-xs font-medium">Logout</span>
                  </button>
                </div>
              </div>
              <div className="h-1 w-full bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 rounded-full mt-2 mb-4" />
            </div>
            
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 