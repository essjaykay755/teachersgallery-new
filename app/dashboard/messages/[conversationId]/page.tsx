"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { DashboardShell } from "@/app/components/layout/dashboard-shell";
import withAuth from "@/lib/withAuth";
import { useAuth } from "@/lib/auth-context";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  updateDoc,
  onSnapshot,
  setDoc,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ChevronLeft, Send, Paperclip, Phone, Check, X, MessageSquare, Clock, Download, ArrowLeft } from "lucide-react";
import { createMessageNotification } from "@/lib/notification-service";
import { createPhoneRequestNotification } from "@/lib/notification-service";
import { 
  updateTypingStatus, 
  subscribeToTypingStatus, 
  markMessagesAsRead 
} from "@/lib/chat-service";
import { TypingIndicator } from "@/app/components/shared/typing-indicator";
import { MessageInput } from "@/app/components/shared/message-input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/app/components/ui/card";
import {
  Avatar,
  AvatarImage,
  AvatarFallback
} from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { Skeleton } from "@/app/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
  fileUrls?: string[];
  fileNames?: string[];
  isSystemMessage?: boolean;
  systemMessageType?: string;
  requestId?: string;
}

// Helper function to get a cache-busted URL
function getCacheBustedUrl(url: string | null | undefined): string {
  if (!url) return "";
  return `${url}?t=${new Date().getTime()}`;
}

function ConversationPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const router = useRouter();
  const [typingUsers, setTypingUsers] = useState<Record<string, any>>({});
  const [isUserTyping, setIsUserTyping] = useState(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [phoneRequestStatus, setPhoneRequestStatus] = useState<string | null>(null);
  const [phoneRequestId, setPhoneRequestId] = useState<string | null>(null);
  const [phoneRequestLoading, setPhoneRequestLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [hasRequestedNumber, setHasRequestedNumber] = useState(false);
  const [isRequestingNumber, setIsRequestingNumber] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  // Memoized check if the other user is typing
  const isOtherUserTyping = useMemo(() => {
    if (!otherUser || !typingUsers) return false;
    
    // Check if there's typing data for the other user
    const typingData = typingUsers[otherUser.id];
    if (!typingData) return false;
    
    // If it's null or false, they're not typing
    if (typingData === null || typingData === false) return false;
    
    // Check if the timestamp is recent (within the last 5 seconds)
    try {
      const typingTimestamp = typingData.toDate ? typingData.toDate() : null;
      if (!typingTimestamp) return false;
      
      const now = new Date();
      const fiveSecondsAgo = new Date(now.getTime() - 5000);
      return typingTimestamp > fiveSecondsAgo;
    } catch (err) {
      console.error("Error checking typing status:", err);
      return false;
    }
  }, [otherUser, typingUsers]);

  useEffect(() => {
    if (user) {
      // Initial data fetch
      fetchConversation();
      fetchUserProfile();
    }
  }, [user, conversationId]);

  useEffect(() => {
    // Scroll to the bottom when messages change
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    
    // Check if we need to show the scroll button
    checkScrollPosition();
  }, [messages]);

  const checkScrollPosition = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const scrolledUp = scrollHeight - scrollTop - clientHeight > 100;
    
    setShowScrollButton(scrolledUp);
  };

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversation = async () => {
    if (!user || !conversationId) return;
    
    try {
      setIsLoading(true);
      
      // Get conversation document
      const conversationDoc = await getDoc(doc(db, "conversations", conversationId));
      
      if (!conversationDoc.exists()) {
        console.error("Conversation not found");
        router.push('/dashboard/messages');
        return;
      }
      
      const conversationData = conversationDoc.data();
      setConversation(conversationData);
      
      // Find the other user ID
      const otherUserId = conversationData.participants.find(
        (p: string) => p !== user.uid
      );
      
      if (!otherUserId) {
        console.error("Other user not found in conversation");
        router.push('/dashboard/messages');
        return;
      }
      
      // Get the other user profile
      const userType = conversationData.participantTypes[otherUserId] || "unknown";
      const otherUserProfile = await getOtherUserProfile(otherUserId, userType);
      
      if (!otherUserProfile) {
        console.error("Failed to fetch other user profile");
        // Set a default profile instead of null
        setOtherUser({ 
          id: otherUserId, 
          type: userType, 
          name: "Unknown User" 
        });
      } else {
        setOtherUser(otherUserProfile);
      }
      
      // Check phone request status for this conversation
      checkPhoneRequestStatus();
      
      // Set up real-time listener for messages
      const messagesQuery = query(
        collection(db, "conversations", conversationId, "messages"),
        orderBy("createdAt", "asc")
      );
      
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messagesData: Message[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          messagesData.push({
            id: doc.id,
            text: data.text || "",
            senderId: data.senderId || "",
            createdAt: data.createdAt,
            fileUrls: data.fileUrls || [],
            fileNames: data.fileNames || [],
            isSystemMessage: data.isSystemMessage || false,
            systemMessageType: data.systemMessageType || "",
            requestId: data.requestId || ""
          });
        });
        
        setMessages(messagesData);
        
        // Mark messages as read
        if (user) {
          markMessagesAsRead(conversationId, user.uid);
          
          // Also update the local conversation state to reflect read status
          if (conversation && conversation.unreadBy && conversation.unreadBy[user.uid]) {
            setConversation({
              ...conversation,
              unreadBy: {
                ...conversation.unreadBy,
                [user.uid]: false
              }
            });
          }
        }
      });
      
      // Set up typing indicator subscription
      const typingUnsubscribe = subscribeToTypingStatus(conversationId, (typingData) => {
        setTypingUsers(typingData);
      });
      
      // Clean up listeners on unmount
      return () => {
        unsubscribe();
        typingUnsubscribe();
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      };
    } catch (error) {
      console.error("Error fetching conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTyping = () => {
    if (!user || !otherUser) return;
    
    // Update typing status to true
    updateTypingStatus(conversationId, user.uid, true);
    
    // Clear previous timer if exists
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    
    // Set timer to update typing status to false after 3 seconds
    typingTimerRef.current = setTimeout(() => {
      updateTypingStatus(conversationId, user.uid, false);
    }, 3000);
    
    // Update local state
    setIsUserTyping(true);
  };

  const getOtherUserProfile = async (userId: string, userType: string) => {
    if (!userId || !userType) {
      console.error("Missing required parameters:", { userId, userType });
      return { id: userId || 'unknown', type: userType || 'unknown', name: "Unknown User" };
    }
    
    try {
      console.log(`Fetching profile for user ID: ${userId}, type: ${userType}`);
      
      // Try getting directly from the main collection first (more likely to have data)
      try {
        const directCollection = userType === "teacher" ? "teachers" : 
                                userType === "student" ? "students" : "parents";
        
        console.log(`Checking direct collection: ${directCollection}`);
        const directDoc = await getDoc(doc(db, directCollection, userId));
        
        if (directDoc.exists()) {
          const data = directDoc.data();
          console.log(`Found user in ${directCollection}:`, data);
          
          // Use the most likely field name for the user name
          const name = data.name || data.fullName || data.displayName || 
                     (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : null) ||
                     "Unknown User";
          
          return {
            id: userId,
            type: userType,
            name: name,
            ...data
          };
        } else {
          console.log(`No document found in ${directCollection}`);
        }
      } catch (directErr) {
        console.error(`Error checking direct collection:`, directErr);
      }
      
      // Fall back to profile collections
      let profileCollectionName;
      if (userType === "teacher") {
        profileCollectionName = "teacherProfiles";
      } else if (userType === "student") {
        profileCollectionName = "studentProfiles";
      } else if (userType === "parent") {
        profileCollectionName = "parentProfiles";
      } else {
        profileCollectionName = "users";
      }
      
      console.log(`Checking profile collection: ${profileCollectionName}`);
      
      const profileQuery = query(
        collection(db, profileCollectionName),
        where("userId", "==", userId)
      );
      
      const profileSnapshot = await getDocs(profileQuery);
      
      if (!profileSnapshot.empty) {
        const data = profileSnapshot.docs[0].data();
        console.log(`Found user in ${profileCollectionName}:`, data);
        
        // Use the most likely field name for the user name
        const name = data.name || data.fullName || data.displayName || 
                   (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : null) ||
                   "Unknown User";
        
        return {
          id: userId,
          type: userType,
          name: name,
          ...data
        };
      }
      
      // Last resort: try the users collection
      try {
        console.log(`Checking users collection`);
        const userDoc = await getDoc(doc(db, "users", userId));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log(`Found user in users collection:`, userData);
          
          const name = userData.displayName || userData.name || userData.email || "Unknown User";
          
          return {
            id: userId,
            type: userType,
            name: name,
            ...userData
          };
        }
      } catch (userErr) {
        console.error("Error checking users collection:", userErr);
      }
      
      console.log(`No profile found for user ${userId} of type ${userType}`);
      return { id: userId, type: userType, name: `${userType.charAt(0).toUpperCase() + userType.slice(1)}` };
    } catch (err) {
      console.error("Error in getOtherUserProfile:", err);
      return { id: userId, type: userType, name: "Unknown User" };
    }
  };

  const handleSendMessage = async (text: string, files?: File[]) => {
    if (!user || !otherUser || (!text.trim() && (!files || files.length === 0)) || isSending) {
      return;
    }
    
    try {
      setIsSending(true);
      
      let fileUrls: string[] = [];
      let fileNames: string[] = [];
      
      // Upload files if any
      if (files && files.length > 0) {
        const storage = getStorage();
        
        for (const file of files) {
          const storagePath = `conversations/${conversationId}/files/${Date.now()}_${file.name}`;
          const storageRef = ref(storage, storagePath);
          
          await uploadBytes(storageRef, file);
          const downloadUrl = await getDownloadURL(storageRef);
          
          fileUrls.push(downloadUrl);
          fileNames.push(file.name);
        }
      }
      
      // Add message to conversation
      const messageRef = await addDoc(
        collection(db, "conversations", conversationId, "messages"),
        {
          text: text.trim(),
          senderId: user.uid,
          createdAt: serverTimestamp(),
          fileUrls,
          fileNames,
          isRead: false
        }
      );
      
      // Update conversation with last message
      await updateDoc(doc(db, "conversations", conversationId), {
        lastMessage: text.trim() || "Sent an attachment",
        lastMessageAt: serverTimestamp(),
        [`unreadBy.${otherUser.id}`]: true
      });
      
      // Clear typing status
      updateTypingStatus(conversationId, user.uid, false);
      
      // Create notification for the other user
      await createMessageNotification({
        recipientId: otherUser.id,
        senderId: user.uid,
        senderName: userProfile?.name || userProfile?.fullName || user.email || "User",
        conversationId,
        messageText: text.trim() || "Sent an attachment"
      });
      
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const getDisplayName = (user: any) => {
    return user?.name || user?.fullName || user?.email || "Unknown User";
  };

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return "";
    
    try {
      const date = timestamp.toDate();
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return "";
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Fetch current user profile for notification purposes
  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      // First, determine the user type
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) return;
      
      const userData = userDoc.data();
      const userType = userData.userType;
      
      let profileCollection;
      if (userType === "teacher") {
        profileCollection = "teacherProfiles";
      } else if (userType === "student") {
        profileCollection = "studentProfiles";
      } else if (userType === "parent") {
        profileCollection = "parentProfiles";
      } else {
        return;
      }
      
      // Get the profile
      const profileQuery = query(
        collection(db, profileCollection),
        where("userId", "==", user.uid)
      );
      
      const profileSnapshot = await getDocs(profileQuery);
      
      if (!profileSnapshot.empty) {
        setUserProfile({
          ...profileSnapshot.docs[0].data(),
          userType
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const checkPhoneRequestStatus = async () => {
    if (!user || !otherUser || !conversationId) return;
    
    try {
      // No phone requests needed if we're the teacher
      if (userProfile?.userType === "teacher") return;
      
      // Only check phone requests for students/parents requesting teacher numbers
      if (otherUser.type !== "teacher") return;
      
      // Check for existing phone request
      const requestsQuery = query(
        collection(db, "phoneRequests"),
        where("requesterId", "==", user.uid),
        where("teacherId", "==", otherUser.id),
        orderBy("createdAt", "desc")
      );
      
      const requestsSnapshot = await getDocs(requestsQuery);
      
      if (!requestsSnapshot.empty) {
        const requestData = requestsSnapshot.docs[0].data();
        setPhoneRequestStatus(requestData.status);
        setPhoneRequestId(requestsSnapshot.docs[0].id);
        
        if (requestData.status === "approved") {
          setPhoneNumber(otherUser.phoneNumber);
          setHasRequestedNumber(true);
        }
      }
    } catch (error) {
      console.error("Error checking phone request status:", error);
    }
  };

  const handleRequestNumber = async () => {
    if (!user || !otherUser || phoneRequestLoading) return;
    
    try {
      setIsRequestingNumber(true);
      
      // Create phone request
      const requestRef = await addDoc(collection(db, "phoneRequests"), {
        requesterId: user.uid,
        requesterType: userProfile?.userType,
        teacherId: otherUser.id,
        status: "pending",
        createdAt: serverTimestamp(),
        conversationId
      });
      
      // Update status
      setPhoneRequestStatus("pending");
      setPhoneRequestId(requestRef.id);
      
      // Add system message to conversation
      await addDoc(collection(db, "conversations", conversationId, "messages"), {
        text: `Phone number requested`,
        senderId: "system",
        isSystemMessage: true,
        systemMessageType: "phone_request",
        requestId: requestRef.id,
        createdAt: serverTimestamp()
      });
      
      // Create notification for teacher
      await createPhoneRequestNotification({
        teacherId: otherUser.id,
        requesterId: user.uid,
        requesterName: userProfile?.name || userProfile?.fullName || user.email || "User",
        conversationId
      });
      
      // Update conversation last message
      await updateDoc(doc(db, "conversations", conversationId), {
        lastMessage: "Phone number requested",
        lastMessageAt: serverTimestamp(),
        [`unreadBy.${otherUser.id}`]: true
      });
    } catch (error) {
      console.error("Error requesting phone number:", error);
      alert("Failed to request phone number. Please try again.");
    } finally {
      setIsRequestingNumber(false);
    }
  };

  const handlePhoneRequest = async (action: 'approved' | 'reject') => {
    if (!phoneRequestId || phoneRequestLoading) return;
    
    try {
      setPhoneRequestLoading(true);
      
      // Update request status
      await updateDoc(doc(db, "phoneRequests", phoneRequestId), {
        status: action,
        updatedAt: serverTimestamp()
      });
      
      // Add system message to conversation
      await addDoc(collection(db, "conversations", conversationId, "messages"), {
        text: `Phone number request ${action === 'approved' ? 'approved' : 'rejected'}`,
        senderId: "system",
        isSystemMessage: true,
        systemMessageType: "phone_request_update",
        status: action,
        requestId: phoneRequestId,
        createdAt: serverTimestamp()
      });
      
      // Update conversation last message
      await updateDoc(doc(db, "conversations", conversationId), {
        lastMessage: `Phone number request ${action === 'approved' ? 'approved' : 'rejected'}`,
        lastMessageAt: serverTimestamp(),
        [`unreadBy.${otherUser.id}`]: true
      });
      
      // Update local state
      setPhoneRequestStatus(action);
      if (action === 'approved') {
        setPhoneNumber(otherUser.phoneNumber);
      }
      
    } catch (error) {
      console.error(`Error ${action === 'approved' ? 'approving' : 'rejecting'} phone request:`, error);
      alert(`Failed to ${action === 'approved' ? 'approve' : 'reject'} phone request. Please try again.`);
    } finally {
      setPhoneRequestLoading(false);
    }
  };

  return (
    <DashboardShell>
      <Card className="flex flex-col h-[calc(100vh-180px)] overflow-hidden">
        <div className="border-b p-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/messages")}
            className="mr-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3 flex-1">
            {isLoading ? (
              // Skeleton loader for the avatar and user info when loading
              <>
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </>
            ) : (
              <>
                <Avatar className="h-10 w-10">
                  {otherUser?.avatarUrl ? (
                    <AvatarImage 
                      src={getCacheBustedUrl(otherUser.avatarUrl)} 
                      alt={otherUser?.name || "User"} 
                    />
                  ) : null}
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {otherUser ? getInitials(otherUser.name || "User") : "?"}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <p className="font-medium">
                    {isLoading ? "Loading..." : (otherUser?.name || "Unknown User")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {otherUser?.type === "teacher" ? "Teacher" : 
                     otherUser?.type === "student" ? "Student" : 
                     otherUser?.type === "parent" ? "Parent" : "User"}
                  </p>
                </div>
              </>
            )}
          </div>
          
          {isLoading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            otherUser?.type === "teacher" && user && (
              userProfile?.userType === "student" || userProfile?.userType === "parent"
            ) && (
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs gap-1"
                onClick={handleRequestNumber}
                disabled={isRequestingNumber || hasRequestedNumber || !otherUser}
              >
                <Phone className="h-3 w-3" />
                {hasRequestedNumber ? "Number Requested" : "Request Number"}
              </Button>
            )
          )}
        </div>
        
        <ScrollArea 
          ref={scrollAreaRef} 
          className="flex-1 p-4"
        >
          {!otherUser ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="h-12 w-12 rounded-full border-t-2 border-blue-500 animate-spin mb-4"></div>
              <p className="text-muted-foreground">Loading conversation...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <MessageSquare className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium">No Messages Yet</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-md">
                Start your conversation with {otherUser.name}. Be polite and clear in your communication.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderId === user?.uid ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.senderId === user?.uid
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="text-sm break-words">{message.text}</div>
                    <div
                      className={`text-xs mt-1 ${
                        message.senderId === user?.uid
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatMessageTime(message.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
              {isOtherUserTyping && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <span className="typing-dot"></span>
                        <span className="typing-dot"></span>
                        <span className="typing-dot"></span>
                      </div>
                      <span className="text-xs text-gray-500">{otherUser?.name || "User"} is typing...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        
        <MessageInput 
          onSend={handleSendMessage} 
          onTyping={handleTyping} 
          isLoading={isSending} 
          disabled={!otherUser?.id}
        />
      </Card>
    </DashboardShell>
  );
}

export default withAuth(ConversationPage, {
  allowedUserTypes: ["teacher", "student", "parent"],
  redirectTo: "/login",
}); 