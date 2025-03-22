"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/app/components/layout/dashboard-shell";
import withAuth from "@/lib/withAuth";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/shared/card";
import { MessageSquare, School, Edit, ChevronRight, Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/shared/avatar";

function StudentDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [phoneRequests, setPhoneRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchStudentProfile = async () => {
      try {
        const docRef = doc(db, "students", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setStudentProfile(docSnap.data());
        } else {
          // Student profile doesn't exist, redirect to onboarding
          router.push("/onboarding/student/step1");
        }
      } catch (error) {
        console.error("Error fetching student profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchPhoneRequests = async () => {
      try {
        const q = query(
          collection(db, "phoneNumberRequests"),
          where("requesterId", "==", user.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const requests: any[] = [];
        
        querySnapshot.forEach((doc) => {
          requests.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setPhoneRequests(requests);
      } catch (error) {
        console.error("Error fetching phone requests:", error);
      }
    };

    fetchStudentProfile();
    fetchPhoneRequests();
  }, [user, router]);

  // Calculate initials for avatar
  const getInitials = (name: string): string => {
    if (!name) return "S";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleEditProfile = () => {
    router.push("/dashboard/student/edit");
  };

  return (
    <DashboardShell>
      <div className="py-6 space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <button
            onClick={handleEditProfile}
            className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Edit className="mr-2 h-4 w-4" /> Edit Profile
          </button>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 text-gray-600">Loading your profile...</p>
          </div>
        ) : studentProfile ? (
          <>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6 sm:p-8 bg-blue-50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-white">
                    {studentProfile.avatarUrl ? (
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={studentProfile.avatarUrl} alt={studentProfile.fullName || "Student"} />
                        <AvatarFallback className="text-xl bg-blue-700 text-white">
                          {getInitials(studentProfile.fullName || "Student")}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-xl font-bold">
                        {getInitials(studentProfile.fullName || "Student")}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{studentProfile.fullName || "Student"}</h2>
                    <p className="text-gray-600 mt-1">Class {studentProfile.class || "Not specified"}</p>
                    {studentProfile.school && (
                      <p className="text-gray-600 mt-1">{studentProfile.school}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Email:</span> {user?.email}
                  </p>
                  {studentProfile.phoneNumber && (
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Phone:</span> {studentProfile.phoneNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-gray-500">Unread messages</p>
                  <button 
                    onClick={() => router.push("/dashboard/messages")}
                    className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
                  >
                    View Messages <ChevronRight className="h-3 w-3 ml-1" />
                  </button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Phone Requests</CardTitle>
                  <Phone className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{phoneRequests.length}</div>
                  <p className="text-xs text-gray-500">Pending requests</p>
                  <button 
                    onClick={() => router.push("/dashboard/phone-requests")}
                    className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
                  >
                    View Requests <ChevronRight className="h-3 w-3 ml-1" />
                  </button>
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
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Featured Teachers</h3>
              <p className="text-gray-500 mb-4">
                Discover top-rated teachers for your subjects of interest.
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
          <div className="text-center py-8">
            <p className="text-gray-600">No profile found. Please complete your onboarding.</p>
            <button
              onClick={() => router.push("/onboarding/student/step1")}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Start Onboarding
            </button>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

export default withAuth(StudentDashboard, {
  allowedUserTypes: ["student"],
  redirectTo: "/login"
}); 