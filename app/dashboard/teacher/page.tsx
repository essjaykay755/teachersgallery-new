"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DashboardShell } from "@/app/components/layout/dashboard-shell";
import withAuth from "@/lib/withAuth";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/shared/card";
import { MessageSquare, Phone, Users, Star, Edit, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/shared/avatar";

function TeacherDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchTeacherProfile = async () => {
      try {
        const docRef = doc(db, "teachers", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setTeacherProfile(docSnap.data());
        } else {
          // Teacher profile doesn't exist, redirect to onboarding
          router.push("/onboarding/teacher/step1");
        }
      } catch (error) {
        console.error("Error fetching teacher profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeacherProfile();
  }, [user, router]);

  // Calculate initials for avatar
  const getInitials = (name: string): string => {
    if (!name) return "T";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleEditProfile = () => {
    router.push("/dashboard/teacher/edit");
  };

  const toggleProfileVisibility = async () => {
    if (!user) return;
    
    try {
      const newVisibility = !teacherProfile.isVisible;
      await updateDoc(doc(db, "teachers", user.uid), {
        isVisible: newVisibility
      });
      
      setTeacherProfile((prev: any) => ({
        ...prev,
        isVisible: newVisibility
      }));
    } catch (error) {
      console.error("Error updating profile visibility:", error);
      alert("Failed to update profile visibility. Please try again.");
    }
  };
  
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Teacher Dashboard</h1>
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
        ) : teacherProfile ? (
          <>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6 sm:p-8 bg-blue-50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-white">
                    {teacherProfile.avatarUrl ? (
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={teacherProfile.avatarUrl} alt={teacherProfile.name || "Teacher"} />
                        <AvatarFallback className="text-xl bg-blue-700 text-white">
                          {getInitials(teacherProfile.name || "Teacher")}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-xl font-bold">
                        {getInitials(teacherProfile.name || "Teacher")}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">{teacherProfile.name || "Teacher"}</h2>
                    <p className="text-lg text-gray-700">{teacherProfile.subject || "Teacher"}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {teacherProfile.teachingMode?.map((mode: string) => (
                        <span 
                          key={mode} 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {mode}
                        </span>
                      ))}
                      
                      {teacherProfile.isFeatured && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Featured
                        </span>
                      )}
                      
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        ₹{teacherProfile.feeRange?.min || 0} - ₹{teacherProfile.feeRange?.max || 0}/hr
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Profile Visibility</h3>
                <div className="mt-2 flex items-center">
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">
                      When enabled, your profile will be visible to students and parents
                    </p>
                  </div>
                  <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={teacherProfile.isVisible}
                        onChange={toggleProfileVisibility}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Email:</span> {user?.email}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Phone:</span> {teacherProfile?.phoneNumber || "No phone number set"}
                    </p>
                    <button
                      onClick={() => {
                        const phoneNumber = prompt("Enter your phone number:", teacherProfile?.phoneNumber || "");
                        if (phoneNumber !== null && user) {
                          updateDoc(doc(db, "teachers", user.uid), {
                            phoneNumber: phoneNumber
                          })
                            .then(() => {
                              setTeacherProfile((prev: any) => ({
                                ...prev,
                                phoneNumber
                              }));
                              alert("Phone number updated successfully!");
                            })
                            .catch(error => {
                              console.error("Error updating phone number:", error);
                              alert("Failed to update phone number. Please try again.");
                            });
                        }
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {teacherProfile?.phoneNumber ? "Update" : "Add"} Phone Number
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-bold mb-3">Personal Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{teacherProfile.name || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Contact Email</p>
                    <p className="font-medium">{teacherProfile.email || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="font-medium">{teacherProfile.phoneNumber || "Not provided"}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-bold mb-3">Teaching Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Subjects</p>
                    <p className="font-medium">
                      {teacherProfile.subjects && teacherProfile.subjects.length > 0
                        ? teacherProfile.subjects.join(", ")
                        : teacherProfile.subject || "Not provided"}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Experience</p>
                    <p className="font-medium">
                      {teacherProfile.yearsOfExperience 
                        ? `${teacherProfile.yearsOfExperience} years` 
                        : teacherProfile.experience || "Not provided"}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Teaching Modes</p>
                    <p className="font-medium">
                      {teacherProfile.teachingModes && teacherProfile.teachingModes.length > 0
                        ? teacherProfile.teachingModes.join(", ")
                        : teacherProfile.teachingMode && teacherProfile.teachingMode.length > 0
                          ? teacherProfile.teachingMode.join(", ")
                          : "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-bold mb-3">Location & Fees</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{teacherProfile.location || "Not provided"}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Areas Served</p>
                  <p className="font-medium">{teacherProfile.areasServed || "Not provided"}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Fees Per Hour</p>
                  <p className="font-medium">
                    {teacherProfile.feesPerHour 
                      ? `₹${teacherProfile.feesPerHour}` 
                      : teacherProfile.feeRange 
                        ? `₹${teacherProfile.feeRange.min || 0} - ₹${teacherProfile.feeRange.max || 0}` 
                        : "Not provided"}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <div className="text-2xl font-bold">0</div>
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
                  <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
                  <Users className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-gray-500">Last 30 days</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Rating</CardTitle>
                  <Star className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">N/A</div>
                  <p className="text-xs text-gray-500">From 0 reviews</p>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-8 bg-white shadow rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Complete Your Profile</h3>
            <p className="text-gray-500 mb-4">
              You need to complete your onboarding to set up your teacher profile.
            </p>
            <button
              onClick={() => router.push("/onboarding/teacher/step1")}
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

export default withAuth(TeacherDashboard, {
  allowedUserTypes: ["teacher"],
  redirectTo: "/login"
}); 