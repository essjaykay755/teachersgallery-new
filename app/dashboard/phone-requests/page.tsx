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
  updateDoc, 
  serverTimestamp,
  addDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Check, X, Phone, AlertCircle, User } from "lucide-react";
import { createPhoneRequestNotification } from "@/lib/notification-service";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Separator } from "@/app/components/ui/separator";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";

// Add a helper function for cache-busting after the import statements
// but before any component definitions
function getCacheBustedUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  // Skip cache busting for Google Storage URLs as it can cause issues
  if (url.includes('firebasestorage.googleapis.com')) {
    console.log('Firebase Storage URL detected, returning without cache busting:', url);
    return url;
  }
  
  // Force a new URL by adding both timestamp and a random number
  const separator = url.includes('?') ? '&' : '?';
  const cacheBuster = `${separator}v=${Date.now()}-${Math.random()}`;
  
  // Handle already cache-busted URLs 
  if (url.includes('v=')) {
    // Replace existing v= parameter with new one
    return url.replace(/v=[^&]+/, `v=${Date.now()}-${Math.random()}`);
  }
  
  return `${url}${cacheBuster}`;
}

function PhoneRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Debug avatar URLs when requests change
  useEffect(() => {
    if (requests.length > 0) {
      console.log('===== Avatar URL Debugging =====');
      requests.forEach(request => {
        console.log(`User: ${request.otherUser?.id}, Type: ${request.otherUser?.type}, Name: ${request.otherUser?.name}, Avatar URL: ${request.otherUser?.avatarUrl}`);
      });
      console.log('================================');
    }
  }, [requests]);
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchPhoneRequests = async () => {
      if (!user || !userProfile) {
        if (isMounted) setIsLoading(false);
        return;
      }
      
      console.log("Current user profile:", userProfile);
      
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
        
        // Debug for each request data
        console.log(`Found ${requestsSnapshot.docs.length} phone requests`);
        
        // Process each request
        for (const reqDoc of requestsSnapshot.docs) {
          try {
            const reqData = reqDoc.data();
            
            if (!reqData) {
              console.log(`Request ${reqDoc.id} has no data, skipping`);
              continue;
            }
            
            console.log("Phone request data:", reqData);
            
            // Get the other user's profile
            const otherUserId = userProfile.userType === "teacher" ? reqData.requesterId : reqData.teacherId;
            
            if (!otherUserId) {
              console.log(`Request ${reqDoc.id} missing user ID, skipping`);
              continue;
            }
            
            // Get the correct user type from the request data
            let otherUserType = "";
            if (userProfile.userType === "teacher") {
              otherUserType = reqData.requesterType || "student"; // Use requesterType from request data
            } else {
              otherUserType = "teacher"; // The other user must be a teacher
            }
            
            if (!otherUserType) {
              console.log(`Request ${reqDoc.id} missing user type, skipping`);
              continue;
            }
            
            try {
              // Debug the collections for this user
              await debugUserDocuments(otherUserId);
              
              // Get user profile with error handling
              const otherUserProfile = await getOtherUserProfile(otherUserId, otherUserType);
              
              // Add to requests array with debug info
              const requestWithDebugInfo = {
                id: reqDoc.id,
                ...reqData,
                otherUser: otherUserProfile,
                debugInfo: {
                  currentUserType: userProfile.userType,
                  otherUserType: otherUserType,
                  otherUserId: otherUserId
                }
              };
              
              console.log("Adding phone request with debug info:", requestWithDebugInfo);
              requestsData.push(requestWithDebugInfo);
            } catch (profileError) {
              console.error(`Error processing user profile for request ${reqDoc.id}:`, profileError);
              // Still add the request with minimal profile data
              requestsData.push({
                id: reqDoc.id,
                ...reqData,
                otherUser: { 
                  id: otherUserId, 
                  type: otherUserType, 
                  name: "Unknown User" 
                }
              });
            }
          } catch (requestError) {
            console.error(`Error processing request document:`, requestError);
            // Continue with next request
          }
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
      // First try to get the user document directly to see what collections exist
      let userData: any = null;
      let avatar = null;
      let userName = "Unknown User";
      
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          userData = userDoc.data();
          console.log(`User document exists in 'users' collection:`, userData);
          
          // Try to get avatar and name from user data
          avatar = userData.photoURL || userData.avatarUrl || null;
          userName = userData.displayName || userData.name || userData.email || null;
        } else {
          console.log(`No user document found in 'users' collection for ${userId}`);
        }
      } catch (userErr) {
        console.log(`Permission error accessing users collection:`, userErr);
      }
      
      // Get profile based on user type
      const collectionName = userType + "s"; // e.g., "students", "parents", "teachers"
      console.log(`Fetching profile from collection: ${collectionName} for user ID: ${userId}`);
      
      try {
        const profileDoc = await getDoc(doc(db, collectionName, userId));
        
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          console.log(`Profile data found in ${collectionName}:`, data);
          
          // Update avatar if found in profile
          if (data.avatarUrl) {
            avatar = data.avatarUrl;
            console.log(`Found avatar URL in profile: ${avatar}`);
          }
          
          // Try different possible name fields
          userName = data.name || 
                   data.fullName || 
                   data.displayName || 
                   data.userName || 
                   (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : null) ||
                   userName ||
                   "Unknown User";
                     
          console.log(`Name determined for user ${userId}:`, userName);
          
          // Return profile data
          return {
            id: userId,
            type: userType,
            name: userName,
            avatarUrl: avatar,
            ...data
          };
        }
      } catch (profileErr) {
        console.log(`Permission error accessing ${collectionName} collection:`, profileErr);
      }
      
      // If we have userData but no profile, use that
      if (userData) {
        console.log(`Using data from users collection for ${userId}`);
        return {
          id: userId,
          type: userType,
          name: userName,
          avatarUrl: avatar,
          ...userData
        };
      }
      
      // If we couldn't find any data, just return the basic info
      return { 
        id: userId, 
        type: userType, 
        name: userName, 
        avatarUrl: null 
      };
    } catch (error) {
      console.error(`Error fetching user profile:`, error);
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
        phoneNumber: phoneNumber,
        respondedAt: serverTimestamp()
      });
      
      console.log(`Request ${requestId} updated successfully with status approved and phoneNumber: ${phoneNumber}`);
      
      // Create notification for the requester
      await createPhoneRequestNotification(
        requesterId,
        user.uid,
        requestId,
        "approved"
      );
      
      // Find the conversation between the teacher and student/parent
      try {
        const conversationsQuery = query(
          collection(db, "conversations"),
          where("participants", "array-contains", user.uid)
        );
        
        const conversationsSnapshot = await getDocs(conversationsQuery);
        let conversationId = null;
        
        // Find the conversation with the requester
        for (const convDoc of conversationsSnapshot.docs) {
          const participants = convDoc.data().participants || [];
          if (participants.includes(requesterId)) {
            conversationId = convDoc.id;
            break;
          }
        }
        
        // If conversation found, add a system message
        if (conversationId) {
          console.log(`Adding system message to conversation ${conversationId}`);
          
          // Add the system message
          await addDoc(
            collection(db, "conversations", conversationId, "messages"),
            {
              text: "Phone number request approved",
              senderId: user.uid,
              createdAt: serverTimestamp(),
              isSystemMessage: true,
              systemMessageType: "phone_approved",
              requestId
            }
          );
          
          // Update the conversation's last message
          await updateDoc(doc(db, "conversations", conversationId), {
            lastMessage: "Phone number request approved",
            lastMessageAt: serverTimestamp()
          });
          
          console.log("System message added successfully");
        } else {
          console.log("No conversation found between teacher and requester");
        }
      } catch (systemMessageError) {
        console.error("Error adding system message:", systemMessageError);
        // Don't throw here, the request was still updated
      }
      
      // Update local state
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status: "approved", phoneNumber } : req
      ));
      
      console.log("Local state updated");
      
    } catch (error) {
      console.error("Error approving phone request:", error);
    }
  };
  
  const handleRejectRequest = async (requestId: string, requesterId: string) => {
    if (!user || !requestId) return;
    
    try {
      // Update the request with rejected status
      await updateDoc(doc(db, "phoneNumberRequests", requestId), {
        status: "rejected",
        respondedAt: serverTimestamp()
      });
      
      // Create notification for the requester
      await createPhoneRequestNotification(
        requesterId,
        user.uid,
        requestId,
        "rejected"
      );
      
      // Find the conversation between the teacher and student/parent
      try {
        const conversationsQuery = query(
          collection(db, "conversations"),
          where("participants", "array-contains", user.uid)
        );
        
        const conversationsSnapshot = await getDocs(conversationsQuery);
        let conversationId = null;
        
        // Find the conversation with the requester
        for (const convDoc of conversationsSnapshot.docs) {
          const participants = convDoc.data().participants || [];
          if (participants.includes(requesterId)) {
            conversationId = convDoc.id;
            break;
          }
        }
        
        // If conversation found, add a system message
        if (conversationId) {
          // Add the system message
          await addDoc(
            collection(db, "conversations", conversationId, "messages"),
            {
              text: "Phone number request rejected",
              senderId: user.uid,
              createdAt: serverTimestamp(),
              isSystemMessage: true,
              systemMessageType: "phone_rejected",
              requestId
            }
          );
          
          // Update the conversation's last message
          await updateDoc(doc(db, "conversations", conversationId), {
            lastMessage: "Phone number request rejected",
            lastMessageAt: serverTimestamp()
          });
        }
      } catch (systemMessageError) {
        console.error("Error adding system message:", systemMessageError);
        // Don't throw here, the request was still updated
      }
      
      // Update local state
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status: "rejected" } : req
      ));
      
    } catch (error) {
      console.error("Error rejecting phone request:", error);
    }
  };
  
  const getDisplayName = (otherUser: any) => {
    if (!otherUser) return "Unknown User";
    
    // Try different fields that might contain the name
    return otherUser.name || 
           otherUser.fullName || 
           otherUser.displayName || 
           otherUser.email || 
           "Unknown User";
  };
  
  const getInitials = (name: string) => {
    if (!name || name === "Unknown User") return "?";
    
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase().substring(0, 2);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const filteredRequests = activeTab === "all" 
    ? requests 
    : requests.filter(req => req.status === activeTab);
  
  // Count requests by status
  const pendingRequests = requests.filter(req => req.status === "pending").length;
  const approvedRequests = requests.filter(req => req.status === "approved").length;
  
  // Add a debug function to check all possible collections for a user
  const debugUserDocuments = async (userId: string) => {
    try {
      const collections = ['users', 'teachers', 'students', 'parents'];
      
      console.log(`----- Checking documents for user ID: ${userId} -----`);
      
      for (const collectionName of collections) {
        try {
          const docRef = doc(db, collectionName, userId);
          const docSnapshot = await getDoc(docRef);
          
          if (docSnapshot.exists()) {
            console.log(`FOUND: Document exists in '${collectionName}' collection`);
            console.log('Document data:', docSnapshot.data());
          } else {
            console.log(`NOT FOUND: No document in '${collectionName}' collection`);
          }
        } catch (error) {
          console.error(`Error accessing ${collectionName} collection:`, error);
        }
      }
      
      console.log(`----- End of document check for ${userId} -----`);
    } catch (error) {
      console.error('Error checking user documents:', error);
    }
  };
  
  return (
    <DashboardShell>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Phone Number Requests</h1>
        
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>
              {userProfile?.userType === "teacher"
                ? "Review and respond to students who want to contact you directly"
                : "Track the status of your phone number requests to teachers"}
            </CardDescription>
          </CardHeader>
          
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">
                  All
                  {requests.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {requests.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pending
                  {pendingRequests > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800">
                      {pendingRequests}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Approved
                  {approvedRequests > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                      {approvedRequests}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value={activeTab} className="pt-3">
              {isLoading ? (
                <CardContent className="flex justify-center items-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading requests...</p>
                  </div>
                </CardContent>
              ) : filteredRequests.length === 0 ? (
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Phone className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-medium">No phone requests found</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md">
                    {userProfile?.userType === "teacher"
                      ? "When students or parents request your phone number, they will appear here."
                      : "When you request a teacher's phone number, it will appear here."}
                  </p>
                </CardContent>
              ) : (
                <ScrollArea className="h-[500px]">
                  {filteredRequests.map((request, index) => (
                    <div key={request.id}>
                      <CardContent className="p-0">
                        <div className="p-4">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10">
                              {request.otherUser?.avatarUrl && (
                                <AvatarImage 
                                  src={getCacheBustedUrl(request.otherUser.avatarUrl)} 
                                  alt={getDisplayName(request.otherUser)}
                                  onError={(e) => {
                                    console.log("Avatar image error:", e);
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                              <AvatarFallback>{getInitials(getDisplayName(request.otherUser))}</AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-medium">{getDisplayName(request.otherUser)}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {request.otherUser?.type.charAt(0).toUpperCase() + request.otherUser?.type.slice(1)}
                                  </p>
                                </div>
                                <div className="flex items-center">
                                  {getStatusBadge(request.status)}
                                </div>
                              </div>
                              
                              {request.status === "approved" && request.phoneNumber && (
                                <div className="mt-2 p-3 bg-muted rounded-md">
                                  <div className="flex items-center">
                                    <Phone className="h-4 w-4 mr-2 text-primary" />
                                    <span className="font-medium">{request.phoneNumber}</span>
                                  </div>
                                </div>
                              )}
                              
                              {userProfile?.userType === "teacher" && request.status === "pending" && (
                                <div className="mt-3 flex space-x-2">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" className="text-red-500 border-red-200 hover:border-red-300 hover:bg-red-50">
                                        <X className="h-4 w-4 mr-1" /> Reject
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Reject Phone Request</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to reject this phone number request? The student will be notified about your decision.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                          className="bg-red-500 hover:bg-red-600"
                                          onClick={() => handleRejectRequest(request.id, request.requesterId)}
                                        >
                                          Reject
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                  
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" className="text-green-500 border-green-200 hover:border-green-300 hover:bg-green-50">
                                        <Check className="h-4 w-4 mr-1" /> Approve
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Approve Phone Request</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          By approving this request, your phone number will be shared with the student. They will be notified about your decision.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                          className="bg-green-500 hover:bg-green-600"
                                          onClick={() => handleApproveRequest(request.id, request.requesterId)}
                                        >
                                          Approve
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      {index < filteredRequests.length - 1 && <Separator />}
                    </div>
                  ))}
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </DashboardShell>
  );
}

export default withAuth(PhoneRequestsPage, {
  allowedUserTypes: ["teacher", "student", "parent"],
  redirectTo: "/login"
}); 