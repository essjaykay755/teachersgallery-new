"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DashboardShell } from "@/app/components/layout/dashboard-shell";
import withAuth from "@/lib/withAuth";
import { useAuth } from "@/lib/auth-context";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent } from "@/app/components/shared/card";
import { Check, X, Phone, AlertCircle } from "lucide-react";
import { createPhoneRequestNotification } from "@/lib/notification-service";

function PhoneRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, userProfile } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchPhoneRequests = async () => {
      if (!user || !userProfile) {
        if (isMounted) setIsLoading(false);
        return;
      }
      
      try {
        let requestsQuery;
        
        if (userProfile.userType === "teacher") {
          // For teachers: get requests where they are the recipient
          requestsQuery = query(
            collection(db, "phoneNumberRequests"),
            where("teacherId", "==", user.uid),
            orderBy("timestamp", "desc")
          );
        } else {
          // For students/parents: get requests they have made
          requestsQuery = query(
            collection(db, "phoneNumberRequests"),
            where("requesterId", "==", user.uid),
            orderBy("timestamp", "desc")
          );
        }
        
        const requestsSnapshot = await getDocs(requestsQuery);
        const requestsData: any[] = [];
        
        // Process each request
        for (const reqDoc of requestsSnapshot.docs) {
          const reqData = reqDoc.data();
          
          if (!reqData) continue;
          
          // Get the other user's profile
          const otherUserId = userProfile.userType === "teacher" ? reqData.requesterId : reqData.teacherId;
          
          if (!otherUserId) continue;
          
          const otherUserType = userProfile.userType === "teacher" ? reqData.requesterType : "teacher";
          
          if (!otherUserType) continue;
          
          const otherUserProfile = await getOtherUserProfile(otherUserId, otherUserType);
          
          // Add to requests array
          requestsData.push({
            id: reqDoc.id,
            ...reqData,
            otherUser: otherUserProfile
          });
        }
        
        if (isMounted) {
          setRequests(requestsData);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching phone requests:", error);
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchPhoneRequests();
    
    return () => {
      isMounted = false;
    };
  }, [user, userProfile]);
  
  const getOtherUserProfile = async (userId: string, userType: string) => {
    if (!userId || !userType) {
      return { id: userId, type: userType, name: "Unknown User" };
    }
    
    try {
      // Get profile based on user type
      const profileDoc = await getDoc(doc(db, userType + "s", userId));
      
      if (profileDoc.exists()) {
        return {
          id: userId,
          type: userType,
          ...profileDoc.data()
        };
      }
      
      return { id: userId, type: userType, name: "Unknown User" };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return { id: userId, type: userType, name: "Unknown User" };
    }
  };
  
  const handleApproveRequest = async (requestId: string, requesterId: string) => {
    if (!user || !requestId) return;
    
    try {
      console.log(`Approving request ${requestId} for requester ${requesterId}`);
      
      // Get teacher's phone number from their profile
      const teacherDoc = await getDoc(doc(db, "teachers", user.uid));
      let phoneNumber = null;
      
      if (teacherDoc.exists()) {
        // Get phone number from teacher profile
        phoneNumber = teacherDoc.data().phoneNumber;
        
        // Log for debugging
        console.log("Retrieved teacher phone number:", phoneNumber);
      } else {
        console.error("Teacher document not found:", user.uid);
      }
      
      // If no phone number found, use a fallback message
      if (!phoneNumber || phoneNumber.trim() === "") {
        console.error("Teacher phone number not found in profile for", user.uid);
        phoneNumber = "Contact teacher for details";
      }
      
      console.log(`Updating request ${requestId} with phone number:`, phoneNumber);
      
      // Update the request with status and phone number
      await updateDoc(doc(db, "phoneNumberRequests", requestId), {
        status: "approved",
        phoneNumber: phoneNumber
      });
      
      console.log(`Request ${requestId} updated successfully with status approved and phoneNumber: ${phoneNumber}`);
      
      // Create notification for the requester
      await createPhoneRequestNotification(
        requesterId,
        user.uid,
        requestId,
        "approved"
      );
      
      // Update local state
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status: "approved", phoneNumber } : req
      ));
      
      console.log("Local state updated");
      
    } catch (error) {
      console.error("Error approving request:", error);
    }
  };
  
  const handleRejectRequest = async (requestId: string, requesterId: string) => {
    if (!user || !requestId) return;
    
    try {
      await updateDoc(doc(db, "phoneNumberRequests", requestId), {
        status: "rejected"
      });
      
      // Create notification for the requester
      await createPhoneRequestNotification(
        requesterId,
        user.uid,
        requestId,
        "rejected"
      );
      
      // Update local state
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status: "rejected" } : req
      ));
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };
  
  const getDisplayName = (otherUser: any) => {
    return otherUser?.name || otherUser?.fullName || "Unknown User";
  };
  
  const getInitials = (name: string) => {
    if (!name) return "?";
    
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Phone Number Requests</h1>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 text-gray-600">Loading your requests...</p>
          </div>
        ) : requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4">
                    <div className="flex items-center gap-3 mb-3 sm:mb-0">
                      <div className="relative h-12 w-12 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center text-white font-bold">
                        {request.otherUser.avatarUrl ? (
                          <Image
                            src={request.otherUser.avatarUrl}
                            alt={getDisplayName(request.otherUser)}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          getInitials(getDisplayName(request.otherUser))
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{getDisplayName(request.otherUser)}</h3>
                        <p className="text-sm text-gray-500 capitalize">{request.otherUser.type}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      {/* For teachers: approval controls */}
                      {userProfile?.userType === "teacher" && request.status === "pending" && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleApproveRequest(request.id, request.requesterId)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                          >
                            <Check className="h-4 w-4" />
                            <span>Approve</span>
                          </button>
                          <button 
                            onClick={() => handleRejectRequest(request.id, request.requesterId)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                          >
                            <X className="h-4 w-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                      
                      {/* Status badges */}
                      {request.status === "approved" && (
                        <div className="px-4 py-2 bg-green-50 rounded-md text-green-700 flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          <span>Approved</span>
                        </div>
                      )}
                      {request.status === "rejected" && (
                        <div className="px-4 py-2 bg-red-50 rounded-md text-red-700 flex items-center gap-2">
                          <X className="h-4 w-4" />
                          <span>Rejected</span>
                        </div>
                      )}
                      {request.status === "pending" && userProfile?.userType !== "teacher" && (
                        <div className="px-4 py-2 bg-yellow-50 rounded-md text-yellow-700 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          <span>Pending</span>
                        </div>
                      )}
                    </div>
                    
                    {request.status === "approved" && userProfile?.userType !== "teacher" && (
                      <div className="mt-4 p-3 border border-green-100 bg-green-50 rounded-md">
                        <div className="flex items-center gap-2 text-green-800 font-medium mb-1">
                          <Phone className="h-4 w-4" />
                          <span>Contact Information</span>
                        </div>
                        {request.phoneNumber && request.phoneNumber !== "Contact teacher for details" ? (
                          <p className="text-green-900 font-medium">{request.phoneNumber}</p>
                        ) : (
                          <div className="text-amber-600">
                            <p>The teacher approved your request but no phone number is available.</p>
                            <p className="text-sm mt-1">Please contact them through messages instead.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Phone className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Phone Requests</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {userProfile?.userType === "teacher" 
                ? "You don't have any phone number requests from students or parents yet."
                : "You haven't requested any teacher phone numbers yet."}
            </p>
            {userProfile?.userType !== "teacher" && (
              <button
                onClick={() => router.push("/")}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Browse Teachers
              </button>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

export default withAuth(PhoneRequestsPage, {
  allowedUserTypes: ["teacher", "student", "parent"],
  redirectTo: "/login",
}); 