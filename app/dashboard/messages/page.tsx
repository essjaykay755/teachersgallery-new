"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DashboardShell } from "@/app/components/layout/dashboard-shell";
import withAuth from "@/lib/withAuth";
import { useAuth } from "@/lib/auth-context";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  getDoc,
  doc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MessageSquare, ChevronRight, Clock } from "lucide-react";
import { getCacheBustedUrl } from "@/lib/utils";
import { 
  Card, 
  CardContent 
} from "@/app/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/app/components/ui/avatar";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Skeleton } from "@/app/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import StatusAvatar from "@/app/components/shared/status-avatar";

function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, userProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Query conversations where current user is a participant
      const conversationsQuery = query(
        collection(db, "conversations"),
        where("participants", "array-contains", user.uid),
        orderBy("lastMessageAt", "desc")
      );
      
      const conversationsSnapshot = await getDocs(conversationsQuery);
      const conversationsData: any[] = [];
      
      for (const doc of conversationsSnapshot.docs) {
        const conversationData = doc.data();
        
        // Find the other user ID (not the current user)
        const otherUserId = conversationData.participants.find((uid: string) => uid !== user.uid);
        
        if (otherUserId) {
          // Get other user's profile
          const otherUserProfile = await getOtherUserProfile(otherUserId, conversationData.participantTypes[otherUserId]);
          
          if (otherUserProfile) {
            conversationsData.push({
              id: doc.id,
              otherUser: otherUserProfile,
              lastMessage: conversationData.lastMessage,
              lastMessageAt: conversationData.lastMessageAt,
              unread: conversationData.unreadBy?.[user.uid] || false
            });
          }
        }
      }
      
      setConversations(conversationsData);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getOtherUserProfile = async (userId: string, userType: string) => {
    try {
      let collectionName;
      if (userType === "teacher") {
        collectionName = "teachers"; // Use the main collections first
      } else if (userType === "student") {
        collectionName = "students";
      } else if (userType === "parent") {
        collectionName = "parents";
      } else {
        return null;
      }
      
      // Try to get the user from the main collection first
      try {
        const directDoc = await getDoc(doc(db, collectionName, userId));
        
        if (directDoc.exists()) {
          return {
            id: userId,
            type: userType,
            ...directDoc.data()
          };
        }
      } catch (error) {
        console.log(`Error checking ${collectionName} collection:`, error);
      }
      
      // Fall back to profiles collections if the main collection doesn't have the data
      let profileCollectionName = "teacherProfiles"; // Default value to avoid undefined
      if (userType === "teacher") {
        profileCollectionName = "teacherProfiles";
      } else if (userType === "student") {
        profileCollectionName = "studentProfiles";
      } else if (userType === "parent") {
        profileCollectionName = "parentProfiles";
      }
      
      const profileQuery = query(
        collection(db, profileCollectionName),
        where("userId", "==", userId)
      );
      
      const profileSnapshot = await getDocs(profileQuery);
      
      if (profileSnapshot.empty) {
        return { id: userId, type: userType, name: "Unknown User" };
      }
      
      return {
        id: userId,
        type: userType,
        ...profileSnapshot.docs[0].data()
      };
    } catch (err) {
      console.error("Error fetching other user profile:", err);
      return { id: userId, type: userType, name: "Unknown User" };
    }
  };

  const handleOpenConversation = (conversationId: string) => {
    router.push(`/dashboard/messages/${conversationId}`);
  };

  const getDisplayName = (otherUser: any) => {
    // First try to get the name from various possible fields
    const name = otherUser?.name || otherUser?.fullName || otherUser?.displayName;
    
    if (name) {
      return name;
    }
    
    // If no name is found, create a formatted display with user type
    const userType = otherUser?.type || 'user';
    const formattedType = userType.charAt(0).toUpperCase() + userType.slice(1);
    
    return `${formattedType} ${otherUser?.id?.substring(0, 6)}`;
  };
  
  const getInitials = (name: string) => {
    if (!name) return "?";
    
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatLastActive = (timestamp: any) => {
    if (!timestamp) return "";
    try {
      return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
    } catch (error) {
      return "";
    }
  };
  
  return (
    <DashboardShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        </div>
        
        <Card className="border rounded-lg shadow-sm">
          {isLoading ? (
            <div className="w-full">
              <div className="border-b px-4 py-2">
                <div className="w-[200px] h-9 bg-muted rounded-md" />
              </div>
              
              <div className="space-y-0">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-4 border-b flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-4 w-[80%]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : conversations.length > 0 ? (
            <Tabs defaultValue="all" className="w-full">
              <div className="border-b px-4 py-2">
                <TabsList className="grid w-[200px] grid-cols-2">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">Unread</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="all" className="m-0">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  {conversations.map((conversation) => (
                    <div 
                      key={conversation.id}
                      onClick={() => handleOpenConversation(conversation.id)}
                      className={`
                        p-4 border-b last:border-0 flex items-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer
                        ${conversation.unread ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}
                      `}
                    >
                      <StatusAvatar
                        src={getCacheBustedUrl(conversation.otherUser?.avatarUrl)}
                        alt={getDisplayName(conversation.otherUser)}
                        fallback={getInitials(getDisplayName(conversation.otherUser))}
                        userId={conversation.otherUser?.id}
                        size="lg"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">
                            {getDisplayName(conversation.otherUser)}
                            {conversation.unread && (
                              <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-blue-600"></span>
                            )}
                          </p>
                          <div className="flex items-center text-xs text-muted-foreground gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatLastActive(conversation.lastMessageAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-muted-foreground truncate max-w-[80%]">
                            {conversation.lastMessage || "No messages yet"}
                          </p>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="unread" className="m-0">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  {conversations.filter(c => c.unread).length > 0 ? (
                    conversations
                      .filter(c => c.unread)
                      .map((conversation) => (
                        <div 
                          key={conversation.id}
                          onClick={() => handleOpenConversation(conversation.id)}
                          className="p-4 border-b last:border-0 flex items-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer bg-blue-50/50 dark:bg-blue-950/20"
                        >
                          <StatusAvatar
                            src={getCacheBustedUrl(conversation.otherUser?.avatarUrl)}
                            alt={getDisplayName(conversation.otherUser)}
                            fallback={getInitials(getDisplayName(conversation.otherUser))}
                            userId={conversation.otherUser?.id}
                            size="lg"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium truncate">
                                {getDisplayName(conversation.otherUser)}
                                <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-blue-600"></span>
                              </p>
                              <div className="flex items-center text-xs text-muted-foreground gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatLastActive(conversation.lastMessageAt)}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-sm text-muted-foreground truncate max-w-[80%]">
                                {conversation.lastMessage || "No messages yet"}
                              </p>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                      <MessageSquare className="h-10 w-10 text-muted-foreground mb-4" />
                      <p className="font-medium text-lg mb-1">No unread messages</p>
                      <p className="text-sm text-muted-foreground">All your messages have been read.</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <MessageSquare className="h-16 w-16 text-primary mb-4 opacity-80" />
              <h3 className="text-xl font-medium mb-2">No Messages Yet</h3>
              
              {userProfile?.userType === 'teacher' ? (
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  You haven't received any messages yet. Students and parents will be able to contact you here.
                </p>
              ) : (
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  You haven't started any conversations yet. Browse teachers and send a message to get started.
                </p>
              )}
              
              {userProfile?.userType !== 'teacher' && (
                <Button onClick={() => router.push("/")} className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Browse Teachers
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}

export default withAuth(MessagesPage, {
  allowedUserTypes: ["teacher", "student", "parent"],
  redirectTo: "/login",
}); 