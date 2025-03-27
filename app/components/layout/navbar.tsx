"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X, MapPin, User, LogOut, Home, MessageSquare, HelpCircle, Star, Search, Bell, LayoutDashboard, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { NotificationDropdown } from "@/app/components/shared/notification-dropdown";
import { NotificationsProvider, useNotifications } from "@/lib/notifications-context";
import ClientOnly from "@/app/components/client-only";
import { doc, getDoc, collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
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
import { Badge } from "@/app/components/ui/badge";

// Define teacher type for search results
interface TeacherSearchResult {
  id: string;
  name: string;
  subjects?: string[];
  avatarUrl?: string;
  location?: string;
}

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isClientSide, setIsClientSide] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TeacherSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { user, userProfile, logout, isLoading } = useAuth();
  const router = useRouter();
  
  // Get notification information
  let unreadCount = 0;
  try {
    const notificationsContext = useNotifications();
    if (notificationsContext) {
      unreadCount = notificationsContext.unreadCount;
    }
  } catch (error) {
    console.error("Error using notifications in navbar:", error);
    // Continue with zero unread count
  }
  
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
  
  // Effect to handle clicks outside search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
          // Get user's name based on the field name in different collections
          const name = data.fullName || data.name || user.email?.split('@')[0] || 'User';
          setUserName(name);
        }
      } catch (error) {
        console.error("Error fetching user avatar:", error);
      }
    };
    
    fetchUserAvatar();
  }, [user, userProfile]);
  
  // Effect to handle teacher search
  useEffect(() => {
    const searchTimer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchTeachers(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);
    
    return () => clearTimeout(searchTimer);
  }, [searchQuery]);
  
  const searchTeachers = async (searchText: string) => {
    if (searchText.length < 2) return;
    
    setIsSearching(true);
    try {
      const teacherRef = collection(db, "teachers");
      const results: TeacherSearchResult[] = [];
      
      // Search by name (case-insensitive using multiple queries)
      // First, try an exact match query
      const searchTextLower = searchText.toLowerCase();
      const searchTextUpper = searchText.toUpperCase();
      const firstChar = searchText.charAt(0);
      const firstCharLower = firstChar.toLowerCase();
      const firstCharUpper = firstChar.toUpperCase();
      
      // Try lowercase version
      const lowerNameQuery = query(
        teacherRef,
        where("name", ">=", firstCharLower + searchTextLower.substring(1)),
        where("name", "<=", firstCharLower + searchTextLower.substring(1) + '\uf8ff'),
        limit(5)
      );
      
      const lowerSnapshots = await getDocs(lowerNameQuery);
      
      lowerSnapshots.forEach((doc) => {
        const data = doc.data();
        const nameMatch = (data.name || data.fullName || "").toLowerCase().includes(searchTextLower);
        if (nameMatch) {
          results.push({
            id: doc.id,
            name: data.name || data.fullName || "Unknown Teacher",
            subjects: data.subjects || [],
            avatarUrl: data.avatarUrl,
            location: data.location || "Location not specified"
          });
        }
      });
      
      // If we don't have enough results, try uppercase version
      if (results.length < 5) {
        const upperNameQuery = query(
          teacherRef,
          where("name", ">=", firstCharUpper + searchTextLower.substring(1)),
          where("name", "<=", firstCharUpper + searchTextLower.substring(1) + '\uf8ff'),
          limit(5 - results.length)
        );
        
        const upperSnapshots = await getDocs(upperNameQuery);
        
        upperSnapshots.forEach((doc) => {
          // Skip duplicates
          if (results.some(r => r.id === doc.id)) return;
          
          const data = doc.data();
          const nameMatch = (data.name || data.fullName || "").toLowerCase().includes(searchTextLower);
          if (nameMatch) {
            results.push({
              id: doc.id,
              name: data.name || data.fullName || "Unknown Teacher",
              subjects: data.subjects || [],
              avatarUrl: data.avatarUrl,
              location: data.location || "Location not specified"
            });
          }
        });
      }
      
      // If we don't have enough results, try a fullName match
      if (results.length < 5) {
        const fullNameQuery = query(
          teacherRef,
          where("fullName", ">=", searchTextLower),
          where("fullName", "<=", searchTextLower + '\uf8ff'),
          limit(5 - results.length)
        );
        
        const fullNameSnapshots = await getDocs(fullNameQuery);
        
        fullNameSnapshots.forEach((doc) => {
          // Skip duplicates
          if (results.some(r => r.id === doc.id)) return;
          
          const data = doc.data();
          results.push({
            id: doc.id,
            name: data.name || data.fullName || "Unknown Teacher",
            subjects: data.subjects || [],
            avatarUrl: data.avatarUrl,
            location: data.location || "Location not specified"
          });
        });
      }
      
      // If we still don't have results, search by subjects (case-insensitive)
      if (results.length === 0) {
        // Get all possible case variations of the search term for subject search
        const searchVariations = [
          searchTextLower,
          searchTextUpper,
          searchText.charAt(0).toUpperCase() + searchTextLower.substring(1), // Title case
          searchText
        ];
        
        // We can use array-contains-any with up to 10 values
        const subjectQuery = query(
          teacherRef,
          where("subjects", "array-contains-any", searchVariations.slice(0, 10)),
          limit(5)
        );
        
        const subjectSnapshots = await getDocs(subjectQuery);
        
        subjectSnapshots.forEach((doc) => {
          // Skip duplicates
          if (results.some(r => r.id === doc.id)) return;
          
          const data = doc.data();
          results.push({
            id: doc.id,
            name: data.name || data.fullName || "Unknown Teacher",
            subjects: data.subjects || [],
            avatarUrl: data.avatarUrl,
            location: data.location || "Location not specified"
          });
        });
      }
      
      setSearchResults(results);
      setShowSearchResults(results.length > 0);
    } catch (error) {
      console.error("Error searching teachers:", error);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.length >= 2) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };
  
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

  // Generate user initials from name or email
  const getUserInitials = (): string => {
    if (userName) {
      const parts = userName.split(' ');
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    
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
          {/* Left section: Logo, Find Teachers, Messages */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex-shrink-0">
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
            
            {/* Navigation links - only visible on large screens */}
            <div className="hidden lg:flex lg:space-x-6">
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
            </div>
          </div>
          
          {/* Center section: Search */}
          <div className="hidden md:block mx-auto max-w-md w-full px-6">
            <div className="w-full relative group" ref={searchRef}>
              <input
                type="text"
                placeholder="Search teachers by name, subject, or location..."
                className="block w-full pl-4 pr-3 py-1.5 rounded-full bg-gray-900/90 border border-gray-700 hover:border-gray-600 focus:border-blue-500 backdrop-blur-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 text-sm text-gray-300 placeholder-gray-400"
                value={searchQuery}
                onChange={handleSearchInputChange}
                onFocus={() => {
                  if (searchQuery.length >= 2 && searchResults.length > 0) {
                    setShowSearchResults(true);
                  }
                }}
              />
              
              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div className="absolute z-20 mt-1 w-full bg-white rounded-md shadow-lg overflow-hidden">
                  {isSearching ? (
                    <div className="p-4 space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        </div>
                        <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-2/4"></div>
                        </div>
                        <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/5"></div>
                        </div>
                        <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto">
                      {searchResults.map((teacher) => (
                        <form 
                          key={teacher.id}
                          action={`/teachers/${teacher.id}`}
                          method="get"
                          className="block"
                        >
                          <button 
                            type="submit" 
                            className="w-full text-left flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                            data-testid="search-result-item"
                          >
                            <div className="flex-shrink-0">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={teacher.avatarUrl || ""} alt={teacher.name} />
                                <AvatarFallback className="bg-indigo-500 text-white">
                                  {teacher.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="ml-3 flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{teacher.name}</p>
                              <div className="flex items-center">
                                {teacher.subjects && teacher.subjects.length > 0 && (
                                  <p className="text-xs text-gray-500 truncate">
                                    {teacher.subjects.slice(0, 3).join(', ')}
                                    {teacher.subjects.length > 3 ? '...' : ''}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span className="truncate max-w-[100px]">{teacher.location}</span>
                            </div>
                          </button>
                        </form>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 px-3 text-center text-sm text-gray-500">
                      No teachers found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Right section: Location, Notifications, Avatar */}
          <div className="flex items-center gap-5">
            {/* Location badge - only visible on large screens */}
            <div className="hidden lg:flex items-center">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-sm font-medium text-gray-300">Mumbai, Maharashtra</span>
              </div>
            </div>
            
            {/* Notification bell */}
            <div className="flex items-center">
              {isClientSide && renderNotificationComponents()}
            </div>
            
            {/* User Profile/Avatar */}
            {user && isClientSide ? (
              <div className="relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button 
                      className="flex text-sm rounded-full focus:outline-none"
                      id="user-menu"
                      aria-haspopup="true"
                    >
                      <span className="sr-only">Open user menu</span>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={avatarUrl || ""} alt={userName || user.email || "User"} />
                        <AvatarFallback className="bg-indigo-500 text-white">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 mt-1">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium text-gray-800">{userName || user.email}</p>
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
                    <DropdownMenuItem asChild>
                      <Link href="/faq" className="cursor-pointer">
                        FAQ
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : !isLoading && !user ? (
              <div className="hidden lg:flex items-center space-x-2">
                <Link href="/login" className="text-sm text-gray-300 hover:text-white px-3 py-1.5 rounded-md transition-colors duration-150">
                  Sign in
                </Link>
                <Link href="/register" className="text-sm text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-md transition-colors duration-150">
                  Register
                </Link>
              </div>
            ) : null}
            
            {/* Hamburger Menu - mobile and tablet only */}
            <button
              onClick={toggleMenu}
              className="p-1 rounded-md text-gray-300 hover:bg-gray-800 hover:text-white lg:hidden focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile/Tablet Menu - Modified to dropdown style instead of slide-in */}
      <div
        className={cn("lg:hidden transition-all duration-300 ease-in-out", {
          "max-h-screen opacity-100": isMenuOpen,
          "max-h-0 opacity-0 overflow-hidden": !isMenuOpen,
        })}
        id="mobile-menu"
      >
        {/* Mobile search - visible only on smallest screens */}
        <div className="p-4 space-y-3 border-t border-gray-700 bg-black">
          {/* 1. Search Bar (only for mobile, not tablets) */}
          <div className="relative md:hidden" ref={searchRef}>
            <input
              type="text"
              placeholder="Search teachers..."
              className="block w-full pl-4 pr-3 py-2 rounded-full bg-gray-900/90 border border-gray-700 focus:border-blue-500 backdrop-blur-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 text-sm text-gray-300 placeholder-gray-400"
              value={searchQuery}
              onChange={handleSearchInputChange}
              onFocus={() => {
                if (searchQuery.length >= 2 && searchResults.length > 0) {
                  setShowSearchResults(true);
                }
              }}
            />
            
            {/* Mobile Search Results Dropdown */}
            {showSearchResults && (
              <div className="absolute z-20 mt-1 w-full bg-white rounded-md shadow-lg overflow-hidden">
                {isSearching ? (
                  <div className="p-4 space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-2/4"></div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-3/5"></div>
                      </div>
                    </div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto">
                    {searchResults.map((teacher) => (
                      <form 
                        key={teacher.id}
                        action={`/teachers/${teacher.id}`}
                        method="get"
                        className="block"
                      >
                        <button 
                          type="submit" 
                          className="w-full text-left flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                          data-testid="search-result-item-mobile"
                        >
                          <div className="flex-shrink-0">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={teacher.avatarUrl || ""} alt={teacher.name} />
                              <AvatarFallback className="bg-indigo-500 text-white">
                                {teacher.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{teacher.name}</p>
                            <div className="flex items-center">
                              {teacher.subjects && teacher.subjects.length > 0 && (
                                <p className="text-xs text-gray-500 truncate">
                                  {teacher.subjects.slice(0, 2).join(', ')}
                                  {teacher.subjects.length > 2 ? '...' : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      </form>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 px-3 text-center text-sm text-gray-500">
                    No teachers found matching "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Navigation Links - rearranged to match screenshot */}
          <div className="space-y-2 mt-3">
            {/* Location */}
            <div className="flex items-center text-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-900/80 rounded-lg transition-colors duration-150">
              <MapPin className="h-4 w-4 mr-2" />
              <span>Mumbai, Maharashtra</span>
            </div>
            
            {/* Find Teachers */}
            <Link
              href="/"
              className="flex items-center text-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-900/80 rounded-lg transition-colors duration-150"
              onClick={toggleMenu}
            >
              <Home className="h-4 w-4 mr-2" />
              Find Teachers
            </Link>
            
            {/* Dashboard */}
            {user && (
              <Link
                href={`/dashboard/${userProfile?.userType || ""}`}
                className="flex items-center text-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-900/80 rounded-lg transition-colors duration-150"
                onClick={toggleMenu}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            )}
            
            {/* Messages */}
            {user && (
              <Link
                href="/dashboard/messages"
                className="flex items-center text-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-900/80 rounded-lg transition-colors duration-150"
                onClick={toggleMenu}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages
              </Link>
            )}
            
            {/* Notifications */}
            {user && (
              <Link
                href="/dashboard/notifications"
                className="flex items-center text-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-900/80 rounded-lg transition-colors duration-150"
                onClick={toggleMenu}
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2 text-xs py-0.5 px-1.5 rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Link>
            )}
            
            {/* Phone Requests - only for teachers */}
            {user && userProfile?.userType === 'teacher' && (
              <Link
                href="/dashboard/phone-requests"
                className="flex items-center text-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-900/80 rounded-lg transition-colors duration-150"
                onClick={toggleMenu}
              >
                <Phone className="h-4 w-4 mr-2" />
                Phone Requests
              </Link>
            )}
            
            {/* User profile section */}
            {user ? (
              <>
                {/* Profile section with user info */}
                <div className="flex items-center gap-3 px-3 py-3 mt-2 border-t border-gray-800">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={avatarUrl || ""} alt={userName || user.email || "User"} />
                    <AvatarFallback className="bg-indigo-500 text-white">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-200">{userName || user.email}</span>
                    {userProfile && (
                      <span className="text-xs text-gray-400 capitalize">{userProfile.userType}</span>
                    )}
                  </div>
                </div>
                
                {/* Your Profile */}
                <Link
                  href="/dashboard"
                  className="flex items-center text-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-900/80 rounded-lg transition-colors duration-150"
                  onClick={toggleMenu}
                >
                  <User className="h-4 w-4 mr-2" />
                  Your Profile
                </Link>
                
                {/* FAQ */}
                <Link
                  href="/faq"
                  className="flex items-center text-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-900/80 rounded-lg transition-colors duration-150"
                  onClick={toggleMenu}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  FAQ
                </Link>
                
                {/* Sign out */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                    toggleMenu();
                  }}
                  className="w-full text-left flex items-center px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors duration-150"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 mt-4">
                <Link
                  href="/faq"
                  className="flex items-center text-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-900/80 rounded-lg transition-colors duration-150"
                  onClick={toggleMenu}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  FAQ
                </Link>
                
                <Link 
                  href="/login"
                  className="block w-full text-center px-3 py-2 text-sm font-medium text-gray-300 border border-gray-600 hover:border-gray-500 hover:bg-gray-900/60 rounded-lg transition-all duration-200"
                  onClick={toggleMenu}
                >
                  Sign in
                </Link>
                <Link 
                  href="/register"
                  className="block w-full text-center px-3 py-2 text-sm font-medium text-gray-300 bg-indigo-500 hover:bg-indigo-600 rounded-lg shadow-md transition-all duration-200"
                  onClick={toggleMenu}
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