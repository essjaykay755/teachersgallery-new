"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
  const { userProfile, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && userProfile) {
      // Redirect to the appropriate dashboard based on user type
      switch (userProfile.userType) {
        case "teacher":
          router.push("/dashboard/teacher");
          break;
        case "student":
          router.push("/dashboard/student");
          break;
        case "parent":
          router.push("/dashboard/parent");
          break;
        default:
          // If for some reason userType is invalid, redirect to home
          router.push("/");
      }
    }
  }, [userProfile, isLoading, router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-3 text-gray-600">Loading your dashboard...</p>
      </div>
    </div>
  );
} 