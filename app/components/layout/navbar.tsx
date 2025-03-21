"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Search, MapPin, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { NotificationDropdown } from "@/app/components/shared/notification-dropdown";
import { NotificationsProvider } from "@/lib/notifications-context";
import ClientOnly from "@/app/components/client-only";

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isClientSide, setIsClientSide] = useState(false);
  const { user, userProfile, logout, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    setIsClientSide(true);
  }, []);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Render notification components only when user is authenticated
  const renderNotificationComponents = () => {
    if (!user) return null;
    
    return (
      <ClientOnly>
        <NotificationsProvider>
          <NotificationDropdown />
        </NotificationsProvider>
      </ClientOnly>
    );
  };

  return (
    <nav className={cn("bg-black text-white sticky top-0 z-50", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <div className="relative w-24 h-6">
                  <Image 
                    src="/logo.png" 
                    alt="TeachersGallery" 
                    width={96} 
                    height={24} 
                    className="object-contain w-full h-full"
                    onError={(e) => {
                      e.currentTarget.src = "";
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              </Link>
            </div>
            <div className="hidden md:flex md:space-x-8 ml-10">
              <Link
                href="/"
                className="flex items-center text-white hover:text-blue-300 px-1 text-sm font-medium"
              >
                <span className="flex items-center gap-1">Find Teachers</span>
              </Link>
              {user && (
                <Link
                  href="/dashboard/messages"
                  className="flex items-center text-white hover:text-blue-300 px-1 text-sm font-medium"
                >
                  <span>Messages</span>
                </Link>
              )}
              <Link
                href="/faq"
                className="flex items-center text-white hover:text-blue-300 px-1 text-sm font-medium"
              >
                <span>FAQ</span>
              </Link>
            </div>
          </div>
          
          <div className="hidden md:flex items-center flex-1 max-w-xl mx-4">
            <div className="w-full relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search teachers by name, subject, or location..."
                className="block w-full pl-10 pr-3 py-2 rounded-md bg-gray-800 border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-white placeholder-gray-400"
              />
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center text-sm text-white">
              <MapPin className="h-4 w-4 mr-1" />
              <span>Mumbai, Maharashtra</span>
            </div>
            
            {user ? (
              <div className="flex items-center gap-4 relative">
                {renderNotificationComponents()}
                <div className="relative">
                  <button 
                    onClick={toggleProfileMenu}
                    className="flex items-center focus:outline-none"
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                      <span className="text-sm">
                        {user.email?.substring(0, 2).toUpperCase() || "U"}
                      </span>
                    </div>
                  </button>
                  
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-md shadow-lg z-50 text-gray-800">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium">{user.email}</p>
                        {userProfile && (
                          <p className="text-xs text-gray-500 capitalize">{userProfile.userType}</p>
                        )}
                      </div>
                      <Link 
                        href="/dashboard" 
                        className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
                      >
                        Dashboard
                      </Link>
                      <Link 
                        href="/dashboard/messages" 
                        className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
                      >
                        Messages
                      </Link>
                      {userProfile?.userType === 'teacher' && (
                        <Link 
                          href="/dashboard/phone-requests" 
                          className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
                        >
                          Phone Requests
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  href="/login"
                  className="text-sm font-medium text-white hover:text-blue-300"
                >
                  Sign in
                </Link>
                <Link 
                  href="/register"
                  className="text-sm font-medium bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
          
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div
        className={cn("md:hidden", {
          block: isMenuOpen,
          hidden: !isMenuOpen,
        })}
        id="mobile-menu"
      >
        <div className="p-4 space-y-4 border-t border-gray-700">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search teachers..."
              className="block w-full pl-10 pr-3 py-2 rounded-md bg-gray-800 border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-white placeholder-gray-400"
            />
          </div>
          
          <div className="flex items-center text-sm text-white mb-4">
            <MapPin className="h-4 w-4 mr-1" />
            <span>Mumbai, Maharashtra</span>
          </div>
          
          <div className="space-y-2">
            <Link
              href="/"
              className="block px-3 py-2 text-base font-medium text-white hover:bg-gray-700 rounded-md"
            >
              Find Teachers
            </Link>
            {user && (
              <>
                <Link
                  href="/dashboard/messages"
                  className="block px-3 py-2 text-base font-medium text-white hover:bg-gray-700 rounded-md"
                >
                  Messages
                </Link>
                <div className="px-3 py-2 flex items-center">
                  {renderNotificationComponents()}
                  <span className="ml-2 text-base font-medium text-white">Notifications</span>
                </div>
              </>
            )}
            <Link
              href="/faq"
              className="block px-3 py-2 text-base font-medium text-white hover:bg-gray-700 rounded-md"
            >
              FAQ
            </Link>
            
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="block px-3 py-2 text-base font-medium text-white hover:bg-gray-700 rounded-md"
                >
                  Your Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left block px-3 py-2 text-base font-medium text-white hover:bg-gray-700 rounded-md"
                >
                  <div className="flex items-center">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </div>
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 mt-4">
                <Link 
                  href="/login"
                  className="block w-full text-center px-3 py-2 text-base font-medium text-white border border-gray-600 hover:bg-gray-700 rounded-md"
                >
                  Sign in
                </Link>
                <Link 
                  href="/register"
                  className="block w-full text-center px-3 py-2 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 