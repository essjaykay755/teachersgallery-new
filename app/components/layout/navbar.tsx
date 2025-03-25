"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, MapPin, User, LogOut, Home, MessageSquare, HelpCircle, Star } from "lucide-react";
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
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, userProfile, logout, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    setIsClientSide(true);
    
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
          <div className="flex items-center">
            <NotificationDropdown />
          </div>
        </NotificationsProvider>
      </ClientOnly>
    );
  };

  return (
    <nav 
      className={cn(
        "sticky top-0 z-50 transition-all duration-300 backdrop-blur-xl w-full",
        isScrolled 
          ? "bg-black shadow-lg" 
          : "bg-black",
        className
      )}
    >
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 py-2">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center group">
                <div className="relative w-44 h-11 transition-transform duration-300 group-hover:scale-105">
                  <Image 
                    src="/logo.png" 
                    alt="TeachersGallery" 
                    width={176} 
                    height={44} 
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
                className="flex items-center text-gray-300 relative px-1 py-3 text-sm font-medium group"
              >
                <Home className="h-4 w-4 mr-1.5" />
                <span className="transition-colors duration-200 group-hover:text-blue-400">Find Teachers</span>
              </Link>
              {user && (
                <Link
                  href="/dashboard/messages"
                  className="flex items-center text-gray-300 relative px-1 py-3 text-sm font-medium group"
                >
                  <MessageSquare className="h-4 w-4 mr-1.5" />
                  <span className="transition-colors duration-200 group-hover:text-blue-400">Messages</span>
                </Link>
              )}
              <Link
                href="/faq"
                className="flex items-center text-gray-300 relative px-1 py-3 text-sm font-medium group"
              >
                <HelpCircle className="h-4 w-4 mr-1.5" />
                <span className="transition-colors duration-200 group-hover:text-blue-400">FAQ</span>
              </Link>
            </div>
          </div>
          
          <div className="hidden md:flex items-center flex-1 max-w-xl mx-4">
            <div className="w-full relative group">
              <input
                type="text"
                placeholder="Search teachers by name, subject, or location..."
                className="block w-full max-w-md pl-4 pr-3 py-1.5 rounded-full bg-gray-900/90 border border-gray-700 hover:border-gray-600 focus:border-blue-500 backdrop-blur-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 text-sm text-gray-300 placeholder-gray-400"
              />
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center text-sm text-gray-300 hover:text-white transition-colors duration-200 mr-1">
              <MapPin className="h-4 w-4 mr-1 text-gray-300" />
              <span>Mumbai, Maharashtra</span>
            </div>
            
            {user ? (
              <div className="flex items-center gap-4 relative">
                {renderNotificationComponents()}
                <div className="relative">
                  <button 
                    onClick={toggleProfileMenu}
                    className="flex items-center focus:outline-none transition-transform hover:scale-105 duration-200"
                  >
                    <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-md">
                      <span className="text-sm">
                        {user.email?.substring(0, 2).toUpperCase() || "U"}
                      </span>
                    </div>
                  </button>
                  
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-lg shadow-xl z-50 text-gray-800 animate-fadeIn">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-800">{user.email}</p>
                        {userProfile && (
                          <p className="text-xs text-gray-500 capitalize">{userProfile.userType}</p>
                        )}
                      </div>
                      <Link 
                        href="/dashboard" 
                        className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left transition-colors duration-150"
                      >
                        Dashboard
                      </Link>
                      <Link 
                        href="/dashboard/messages" 
                        className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left transition-colors duration-150"
                      >
                        Messages
                      </Link>
                      {userProfile?.userType === 'teacher' && (
                        <Link 
                          href="/dashboard/phone-requests" 
                          className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left transition-colors duration-150"
                        >
                          Phone Requests
                        </Link>
                      )}
                      {userProfile?.userType === 'teacher' && (
                        <Link 
                          href="/dashboard/teacher/reviews" 
                          className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left transition-colors duration-150"
                        >
                          Reviews
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors duration-150"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  href="/login"
                  className="text-sm font-medium text-gray-300 hover:text-blue-300 transition-colors duration-200"
                >
                  Sign in
                </Link>
                <Link 
                  href="/register"
                  className="text-sm font-medium bg-indigo-500 hover:bg-indigo-600 px-3 py-1 rounded-full shadow-md hover:shadow-indigo-500/20 transition-all duration-200"
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
              className="inline-flex items-center justify-center p-1.5 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors duration-200"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="block h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div
        className={cn("md:hidden transition-all duration-300 ease-in-out", {
          "max-h-screen opacity-100": isMenuOpen,
          "max-h-0 opacity-0 overflow-hidden": !isMenuOpen,
        })}
        id="mobile-menu"
      >
        <div className="p-4 space-y-4 border-t border-gray-700 bg-black">
          <div className="relative">
            <input
              type="text"
              placeholder="Search teachers..."
              className="block w-full pl-4 pr-3 py-2 rounded-full bg-gray-900/90 border border-gray-700 focus:border-blue-500 backdrop-blur-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 text-sm text-gray-300 placeholder-gray-400"
            />
          </div>
          
          <div className="flex items-center text-sm text-gray-300 mb-4">
            <MapPin className="h-4 w-4 mr-1 text-gray-300" />
            <span>Mumbai, Maharashtra</span>
          </div>
          
          <div className="space-y-2">
            <Link
              href="/"
              className="flex items-center text-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-900/80 rounded-lg transition-colors duration-150"
            >
              <Home className="h-4 w-4 mr-2" />
              Find Teachers
            </Link>
            {user && (
              <>
                <Link
                  href="/dashboard/messages"
                  className="flex items-center text-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-900/80 rounded-lg transition-colors duration-150"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messages
                </Link>
                <div className="flex items-center px-3 py-2">
                  {renderNotificationComponents()}
                  <span className="ml-2 text-sm font-medium text-gray-300">Notifications</span>
                </div>
              </>
            )}
            <Link
              href="/faq"
              className="flex items-center text-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-900/80 rounded-lg transition-colors duration-150"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              FAQ
            </Link>
            
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center text-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-900/80 rounded-lg transition-colors duration-150"
                >
                  <User className="h-4 w-4 mr-2" />
                  Your Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:bg-red-500/10 rounded-lg transition-colors duration-150"
                >
                  <div className="flex items-center text-red-400">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </div>
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 mt-4">
                <Link 
                  href="/login"
                  className="block w-full text-center px-3 py-2 text-sm font-medium text-gray-300 border border-gray-600 hover:border-gray-500 hover:bg-gray-900/60 rounded-lg transition-all duration-200"
                >
                  Sign in
                </Link>
                <Link 
                  href="/register"
                  className="block w-full text-center px-3 py-2 text-sm font-medium text-gray-300 bg-indigo-500 hover:bg-indigo-600 rounded-lg shadow-md transition-all duration-200"
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