"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DashboardShell } from "@/app/components/layout/dashboard-shell";
import withAuth from "@/lib/withAuth";
import { useAuth } from "@/lib/auth-context";
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent } from "@/app/components/shared/card";
import { MessageSquare, ChevronRight } from "lucide-react";

function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchConversations = async () => {
      if (!user) return;
      
      try {
        // Get all conversations where current user is a participant
        const conversationsQuery = query(
          collection(db, "conversations"),
          where("participants", "array-contains", user.uid)
        );
        
        const conversationsSnapshot = await getDocs(conversationsQuery);
        const conversationsData: any[] = [];
        
        // Process each conversation
        for (const convDoc of conversationsSnapshot.docs) {
          const convData = convDoc.data();
          
          // Get the other participant's ID
          const otherParticipantId = convData.participants?.find(
            (p: string) => p !== user.uid
          );
          
          if (!otherParticipantId || !convData.participantTypes) continue;
          
          const userType = convData.participantTypes[otherParticipantId];
          
          if (!userType) continue;
          
          // Get the other participant's info
          const otherUserProfile = await getOtherUserProfile(otherParticipantId, userType);
          
          // Add to conversations array
          conversationsData.push({
            id: convDoc.id,
            ...convData,
            otherUser: otherUserProfile
          });
        }
        
        if (isMounted) {
          setConversations(conversationsData);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchConversations();
    
    return () => {
      isMounted = false;
    };
  }, [user]);
  
  const getOtherUserProfile = async (userId: string, userType: string) => {
    try {
      // Fix: Get profile based on user type (profiles -> userTypes -> userId)
      const profileCollection = `${userType}s`; // "teachers", "students", or "parents"
      const profileDoc = await getDoc(doc(db, profileCollection, userId));
      
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
  
  const handleOpenConversation = (conversationId: string) => {
    router.push(`/dashboard/messages/${conversationId}`);
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
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 text-gray-600">Loading your conversations...</p>
          </div>
        ) : conversations.length > 0 ? (
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <Card 
                key={conversation.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleOpenConversation(conversation.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center text-white font-bold">
                      {conversation.otherUser?.avatarUrl ? (
                        <Image
                          src={conversation.otherUser.avatarUrl}
                          alt={getDisplayName(conversation.otherUser)}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        getInitials(getDisplayName(conversation.otherUser))
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {getDisplayName(conversation.otherUser)}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.lastMessage || "No messages yet"}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <p className="text-xs text-gray-500">
                        {conversation.lastMessageAt ? conversation.lastMessageAt.toDate().toLocaleDateString() : ""}
                      </p>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <MessageSquare className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Messages Yet</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              You haven't started any conversations yet. Browse teachers and send a message to get started.
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Browse Teachers
            </button>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

export default withAuth(MessagesPage, {
  allowedUserTypes: ["teacher", "student", "parent"],
  redirectTo: "/login",
}); 