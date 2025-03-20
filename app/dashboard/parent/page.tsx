"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DashboardShell } from "@/app/components/layout/dashboard-shell";
import withAuth from "@/lib/withAuth";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/shared/card";
import { MessageSquare, School, Users, Edit } from "lucide-react";

function ParentDashboardPage() {
  const [parentProfile, setParentProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    const fetchParentProfile = async () => {
      if (!user) return;
      
      try {
        const parentDoc = await getDoc(doc(db, "profiles", "parents", user.uid));
        
        if (parentDoc.exists()) {
          setParentProfile(parentDoc.data());
        }
      } catch (error) {
        console.error("Error fetching parent profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchParentProfile();
  }, [user]);
  
  const handleEditProfile = () => {
    router.push("/dashboard/parent/edit");
  };
  
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Parent Dashboard</h1>
          <button
            onClick={handleEditProfile}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Edit className="mr-2 h-4 w-4" /> Edit Profile
          </button>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 text-gray-600">Loading your profile...</p>
          </div>
        ) : parentProfile ? (
          <>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6 sm:p-8 bg-blue-50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-white">
                    {parentProfile.avatarUrl ? (
                      <Image
                        src={parentProfile.avatarUrl}
                        alt={parentProfile.fullName || "Parent"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-xl font-bold">
                        {parentProfile.fullName?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "P"}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">{parentProfile.fullName || "Parent"}</h2>
                    <p className="text-lg text-gray-700">
                      Parent of {parentProfile.children?.length || 0} {parentProfile.children?.length === 1 ? 'child' : 'children'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Email:</span> {user?.email}
                  </p>
                  {parentProfile.phoneNumber && (
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Phone:</span> {parentProfile.phoneNumber}
                    </p>
                  )}
                </div>
              </div>
              
              {parentProfile.children && parentProfile.children.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Children</h3>
                  <div className="space-y-4">
                    {parentProfile.children.map((child: any, index: number) => (
                      <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{child.name}</h4>
                          <p className="text-sm text-gray-500">
                            {child.age} years • {child.currentClass}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-gray-500">Unread messages</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Contacted Teachers</CardTitle>
                  <School className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-gray-500">Teachers you've contacted</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Children</CardTitle>
                  <Users className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{parentProfile.children?.length || 0}</div>
                  <p className="text-xs text-gray-500">Registered in your profile</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Featured Teachers</h3>
              <p className="text-gray-500 mb-4">
                Discover top-rated teachers for your children.
              </p>
              <button
                onClick={() => router.push("/")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Browse Teachers
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-8 bg-white shadow rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Complete Your Profile</h3>
            <p className="text-gray-500 mb-4">
              You need to complete your onboarding to set up your parent profile.
            </p>
            <button
              onClick={() => router.push("/onboarding/parent/step1")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Complete Onboarding
            </button>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

export default withAuth(ParentDashboardPage, {
  allowedUserTypes: ["parent"],
  redirectTo: "/login",
}); 