"use client";

import { useState, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth, UserType } from "@/lib/auth-context";
import { 
  User, Settings, MessageSquare, 
  Phone, CreditCard, LogOut,
  Menu, X, LayoutDashboard, UserCircle
} from "lucide-react";

interface DashboardShellProps {
  children: ReactNode;
}

interface NavItem {
  title: string;
  href: string;
  icon: ReactNode;
  forUserTypes: UserType[];
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { userProfile, logout } = useAuth();
  
  const isTeacher = userProfile?.userType === "teacher";
  
  const navigationItems = [
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
      title: "Phone Requests",
      href: "/dashboard/phone-requests",
      icon: Phone,
      active: pathname === "/dashboard/phone-requests",
    },
    {
      title: "Profile",
      href: `/dashboard/${userProfile?.userType}/edit`,
      icon: UserCircle,
      active: pathname === `/dashboard/${userProfile?.userType}/edit`,
    },
  ];
  
  // Add a payment link only for teachers
  if (isTeacher) {
    navigationItems.push({
      title: "Featured Status",
      href: "/dashboard/payments",
      icon: CreditCard,
      active: pathname === "/dashboard/payments",
    });
  }
  
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobile sidebar toggle */}
      <div className="fixed inset-0 flex z-40 lg:hidden" role="dialog" aria-modal="true">
        <div 
          className={cn(
            "fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ease-in-out duration-300",
            sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        ></div>
        
        <div 
          className={cn(
            "relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white transform transition ease-in-out duration-300",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <div className="flex-shrink-0 flex items-center px-4">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              TeachersGallery
            </Link>
          </div>
          
          <div className="mt-5 flex-1 h-0 overflow-y-auto">
            <nav className="px-2 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-base font-medium rounded-md",
                    item.active
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5",
                      item.active ? "text-blue-700" : "text-gray-400 group-hover:text-gray-500"
                    )}
                  />
                  <span className="ml-3">{item.title}</span>
                </Link>
              ))}
              
              <button
                onClick={logout}
                className="w-full group flex items-center px-2 py-2 text-base font-medium rounded-md text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-5 w-5 text-red-500" />
                <span className="ml-3">Logout</span>
              </button>
            </nav>
          </div>
        </div>
        
        <div className="flex-shrink-0 w-14" aria-hidden="true">
          {/* Dummy element to force sidebar to shrink to fit close icon */}
        </div>
      </div>
      
      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-white border-b">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                TeachersGallery
              </Link>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 space-y-1">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                      item.active
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5",
                        item.active ? "text-blue-700" : "text-gray-400 group-hover:text-gray-500"
                      )}
                    />
                    <span className="ml-3">{item.title}</span>
                  </Link>
                ))}
                
                <button
                  onClick={logout}
                  className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5 text-red-500" />
                  <span className="ml-3">Logout</span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200 lg:hidden">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 flex justify-center px-4 lg:px-0">
            <div className="flex-1 flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600 lg:hidden">
                TeachersGallery
              </Link>
            </div>
          </div>
        </div>
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
} 