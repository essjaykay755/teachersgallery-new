"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';

export interface WithAuthOptions {
  allowedUserTypes?: Array<"teacher" | "student" | "parent">;
  redirectTo?: string;
}

export default function withAuth<P extends {}>(
  Component: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const { allowedUserTypes, redirectTo = '/login' } = options;
  
  const WithAuthComponent = (props: P) => {
    const { user, userProfile, isLoading } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
      if (!isLoading) {
        // Redirect if not authenticated
        if (!user) {
          router.push(redirectTo);
          return;
        }
        
        // Redirect if not the right user type
        if (allowedUserTypes && userProfile && 
            !allowedUserTypes.includes(userProfile.userType)) {
          router.push('/');
          return;
        }
      }
    }, [user, userProfile, isLoading, router]);
    
    // Show nothing while loading or if not authenticated
    if (isLoading || !user) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }
    
    // If we have allowedUserTypes and the user doesn't match, show access denied
    if (allowedUserTypes && userProfile && 
        !allowedUserTypes.includes(userProfile.userType)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
            <p className="mt-2 text-gray-600">
              You do not have permission to access this page.
            </p>
          </div>
        </div>
      );
    }
    
    // Render the protected component
    return <Component {...props} />;
  };
  
  // Set displayName for debugging purposes
  const displayName = Component.displayName || Component.name || 'Component';
  WithAuthComponent.displayName = `withAuth(${displayName})`;
  
  return WithAuthComponent;
} 