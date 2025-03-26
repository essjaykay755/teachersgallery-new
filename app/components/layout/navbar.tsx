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
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isClientSide, setIsClientSide] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
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
  
  // Effect to fetch user avatar based on user type
  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (!user || !userProfile) return;
      
      try {
        // Get collection based on user type
        const collectionName = userProfile.userType === 'teacher' 
          ? 'teachers' 
          : userProfile.userType === 'student'
            ? 'students'
            : 'parents';
        
        const userDoc = await getDoc(doc(db, collectionName, user.uid));
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.avatarUrl) {
            setAvatarUrl(data.avatarUrl);
          }
        }
      } catch (error) {
        console.error("Error fetching user avatar:", error);
      }
    };
    
    fetchUserAvatar();
  }, [user, userProfile]);
  
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

  // Generate user initials from email
  const getUserInitials = (): string => {
    if (!user?.email) return "U";
    
    const parts = user.email.split('@');
    if (parts.length === 0) return "U";
    
    const name = parts[0];
    if (name.length <= 2) return name.toUpperCase();
    
    return name.substring(0, 2).toUpperCase();
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="focus:outline-none transition-transform hover:scale-105 duration-200">
                      <Avatar className="h-8 w-8 cursor-pointer">
                        <AvatarImage src={avatarUrl || ""} alt={user.email || "User"} />
                        <AvatarFallback className="bg-indigo-500 text-white">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 mt-1">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium text-gray-800">{user.email}</p>
                        {userProfile && (
                          <p className="text-xs text-gray-500 capitalize">{userProfile.userType}</p>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/messages" className="cursor-pointer">
                        Messages
                      </Link>
                    </DropdownMenuItem>
                    {userProfile?.userType === 'teacher' && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/phone-requests" className="cursor-pointer">
                          Phone Requests
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {userProfile?.userType === 'teacher' && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/teacher/reviews" className="cursor-pointer">
                          Reviews
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                <div className="flex items-center gap-3 px-3 py-3 mt-2 border-t border-gray-800">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={avatarUrl || ""} alt={user.email || "User"} />
                    <AvatarFallback className="bg-indigo-500 text-white">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-200">{user.email}</span>
                    {userProfile && (
                      <span className="text-xs text-gray-400 capitalize">{userProfile.userType}</span>
                    )}
                  </div>
                </div>
                
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