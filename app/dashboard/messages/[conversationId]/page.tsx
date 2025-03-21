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
import { Card, CardContent } from "@/app/components/shared/card";
import { ChevronLeft, Send, Paperclip, Phone, Check, X } from "lucide-react";
import { createMessageNotification } from "@/lib/notification-service";
import { createPhoneRequestNotification } from "@/lib/notification-service";
import { 
  updateTypingStatus, 
  subscribeToTypingStatus, 
  markMessagesAsRead 
} from "@/lib/chat-service";
import { TypingIndicator } from "@/app/components/shared/typing-indicator";
import { MessageInput } from "@/app/components/shared/message-input";

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

  // Fetch conversation and initial messages
  useEffect(() => {
    let isMounted = true;
    
    if (!user || !conversationId) {
      if (isMounted) setIsLoading(false);
      return;
    }

    const fetchConversation = async () => {
      try {
        const conversationDoc = await getDoc(doc(db, "conversations", conversationId));
        
        if (!conversationDoc.exists()) {
          if (isMounted) setIsLoading(false);
          return;
        }
        
        const conversationData = conversationDoc.data();
        
        // Check if current user is a participant
        if (!conversationData.participants?.includes(user.uid)) {
          router.push("/dashboard/messages");
          return;
        }
        
        if (isMounted) {
          setConversation(conversationData);
          
          // Get the other participant's ID
          const otherParticipantId = conversationData.participants?.find(
            (p: string) => p !== user.uid
          );
          
          if (otherParticipantId && conversationData.participantTypes) {
            const userType = conversationData.participantTypes[otherParticipantId];
            
            if (userType) {
              const otherUserProfile = await getOtherUserProfile(otherParticipantId, userType);
              setOtherUser(otherUserProfile);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching conversation:", error);
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchConversation();
    
    return () => {
      isMounted = false;
    };
  }, [user, conversationId, router]);

  // Subscribe to messages in real-time
  useEffect(() => {
    if (!user || !conversationId) return;

    let unsubscribe: () => void;

    try {
      const messagesQuery = query(
        collection(db, "conversations", conversationId, "messages"),
        orderBy("createdAt", "asc")
      );

      // Add delay before subscribing to ensure Firestore is ready
      const timeoutId = setTimeout(() => {
        try {
          unsubscribe = onSnapshot(
            messagesQuery, 
            { includeMetadataChanges: false }, // Explicitly disable metadata changes
            // Success callback
            (snapshot) => {
              try {
                const messagesData = snapshot.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data()
                })) as Message[];
                
                setMessages(messagesData);
                setIsLoading(false);
              } catch (parseError) {
                console.error("Error parsing message data:", parseError);
                setIsLoading(false);
              }
            }, 
            // Error callback
            (error) => {
              console.error("Error subscribing to messages:", error.code, error.message);
              // If permission error, show appropriate message
              if (error.code === 'permission-denied') {
                console.log("Permission denied to access this conversation");
              }
              setIsLoading(false);
            }
          );
        } catch (innerError) {
          console.error("Error inside timeout while setting up messages subscription:", innerError);
          setIsLoading(false);
        }
      }, 500); // 500ms delay

      return () => {
        clearTimeout(timeoutId);
        if (unsubscribe) {
          try {
            unsubscribe();
          } catch (error) {
            console.error("Error unsubscribing from messages:", error);
          }
        }
      };
    } catch (setupError) {
      console.error("Error setting up messages subscription:", setupError);
      setIsLoading(false);
      return () => {};
    }
  }, [user, conversationId]);

  // Subscribe to typing status changes
  useEffect(() => {
    if (!user || !conversationId) return;
    
    const unsubscribe = subscribeToTypingStatus(conversationId, (users) => {
      setTypingUsers(users);
    });
    
    return () => unsubscribe();
  }, [user, conversationId]);

  // Mark messages as read when the user views them
  useEffect(() => {
    if (!user || !conversationId || isLoading || messages.length === 0) return;
    
    markMessagesAsRead(conversationId, user.uid);
  }, [user, conversationId, isLoading, messages]);

  // Handle typing debounce
  const handleTyping = () => {
    if (!user || !conversationId) return;
    
    if (!isUserTyping) {
      setIsUserTyping(true);
      updateTypingStatus(conversationId, user.uid, true);
    }
    
    // Clear existing timer
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    
    // Set new timer to stop typing indicator after 3 seconds of inactivity
    typingTimerRef.current = setTimeout(() => {
      setIsUserTyping(false);
      updateTypingStatus(conversationId, user.uid, false);
    }, 3000);
  };
  
  // Clean up typing timer on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        
        // Make sure to clear typing status when navigating away
        if (user && conversationId && isUserTyping) {
          updateTypingStatus(conversationId, user.uid, false);
        }
      }
    };
  }, [user, conversationId, isUserTyping]);
  
  // Check if the other user is typing
  const isOtherUserTyping = useMemo(() => {
    if (!otherUser || !typingUsers) return false;
    
    const typingTimestamp = typingUsers[otherUser.id];
    if (!typingTimestamp) return false;
    
    // Check if typing timestamp is within the last 5 seconds
    const now = new Date();
    const typingTime = typingTimestamp.toDate?.() || new Date(typingTimestamp);
    
    return now.getTime() - typingTime.getTime() < 5000;
  }, [otherUser, typingUsers]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getOtherUserProfile = async (userId: string, userType: string) => {
    try {
      // Normalize user type to ensure collection names are correct
      const normalizedUserType = userType.endsWith('s') ? userType : `${userType}s`;
      
      // First, try to get the user from the direct collection (teachers, students, parents)
      try {
        const profileDoc = await getDoc(doc(db, normalizedUserType, userId));
        
        if (profileDoc.exists()) {
          return {
            id: userId,
            type: userType,
            ...profileDoc.data()
          };
        }
      } catch (error) {
        console.log(`Could not find user in ${normalizedUserType} collection:`, error);
      }
      
      // Try to find user in users collection as fallback
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        
        if (userDoc.exists()) {
          return {
            id: userId,
            type: userType,
            ...userDoc.data()
          };
        }
      } catch (error) {
        console.log(`Could not find user in users collection:`, error);
      }
      
      // Return default if no profile is found
      return { id: userId, type: userType, name: "Unknown User" };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return { id: userId, type: userType, name: "Unknown User" };
    }
  };

  const handleSendMessage = async (text: string, files?: File[]) => {
    if (!user || !text.trim() && (!files || files.length === 0) || isSending) return;

    try {
      setIsSending(true);
      
      // Clear typing status when sending a message
      if (isUserTyping) {
        setIsUserTyping(false);
        updateTypingStatus(conversationId, user.uid, false);
      }
      
      const messageData: any = {
        text: text.trim(),
        senderId: user.uid,
        createdAt: serverTimestamp()
      };
      
      // Upload files if any
      if (files && files.length > 0) {
        const storage = getStorage();
        const fileUrls: string[] = [];
        const fileNames: string[] = [];
        
        // Upload each file and get download URL
        for (const file of files) {
          const fileName = `${Date.now()}_${file.name}`;
          const storageRef = ref(storage, `conversations/${conversationId}/${fileName}`);
          
          await uploadBytes(storageRef, file);
          const downloadUrl = await getDownloadURL(storageRef);
          
          fileUrls.push(downloadUrl);
          fileNames.push(file.name);
        }
        
        messageData.fileUrls = fileUrls;
        messageData.fileNames = fileNames;
      }
      
      console.log(`Sending message to conversation ${conversationId}`, {
        textLength: text.trim().length,
        filesCount: files?.length || 0
      });
      
      try {
        // Add message to the conversation
        const messageRef = await addDoc(
          collection(db, "conversations", conversationId, "messages"),
          messageData
        );
        
        console.log(`Message added successfully with ID: ${messageRef.id}`);
      } catch (messageError: any) {
        console.error(`Error adding message to conversation: ${messageError.code}, ${messageError.message}`);
        alert("Could not send message. Please try again later.");
        throw messageError;
      }
      
      try {
        // Update conversation's last message
        await updateDoc(doc(db, "conversations", conversationId), {
          lastMessage: text.trim() || "Sent an attachment",
          lastMessageAt: serverTimestamp()
        });
        
        console.log("Conversation last message updated successfully");
      } catch (updateError: any) {
        console.error(`Error updating conversation last message: ${updateError.code}, ${updateError.message}`);
        // Don't throw here as the message was already sent
      }
      
      // Get recipient ID
      const recipientId = conversation?.participants?.find((id: string) => id !== user.uid);
      
      if (recipientId) {
        try {
          // Create notification for the recipient
          await createMessageNotification(
            recipientId, 
            user.uid, 
            conversationId, 
            text.trim() || "Sent an attachment"
          );
          
          console.log(`Notification created for recipient ${recipientId}`);
        } catch (notificationError: any) {
          console.error(`Error creating notification: ${notificationError.code}, ${notificationError.message}`);
          // Don't throw here as the message was already sent
        }
      }
      
      setNewMessage("");
    } catch (error: any) {
      console.error("Error sending message:", error.code, error.message);
    } finally {
      setIsSending(false);
    }
  };

  const getDisplayName = (user: any) => {
    return user?.name || user?.fullName || "Unknown User";
  };

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return "";
    
    try {
      const date = timestamp.toDate();
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  // Get user profile
  useEffect(() => {
    if (!user) return;
    
    const fetchUserProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };
    
    fetchUserProfile();
  }, [user]);

  // Check if phone number has been requested already
  useEffect(() => {
    if (!user || !otherUser || !otherUser.type || !otherUser.id) return;
    
    // Only check if current user is student or parent and other user is teacher
    if ((userProfile?.userType === 'student' || userProfile?.userType === 'parent') && 
        otherUser.type === 'teacher') {
      checkPhoneRequestStatus();
    }
  }, [user, otherUser, userProfile]);

  const checkPhoneRequestStatus = async () => {
    if (!user || !otherUser || !otherUser.id) return;
    
    try {
      const requestId = `${user.uid}_${otherUser.id}`;
      const requestDoc = await getDoc(doc(db, "phoneNumberRequests", requestId));
      
      if (requestDoc.exists()) {
        const requestData = requestDoc.data();
        setPhoneRequestStatus(requestData.status);
        setPhoneRequestId(requestId);
        
        // If request is approved, store the phone number
        if (requestData.status === 'approved' && requestData.phoneNumber) {
          setPhoneNumber(requestData.phoneNumber);
        }
      } else {
        setPhoneRequestStatus(null);
        setPhoneRequestId(null);
      }
    } catch (error) {
      console.error("Error checking phone request status:", error);
    }
  };

  const requestPhoneNumber = async () => {
    if (!user || !otherUser || phoneRequestLoading) return;
    
    setPhoneRequestLoading(true);
    
    try {
      const requestId = `${user.uid}_${otherUser.id}`;
      const timestamp = new Date().toISOString();
      
      // Create a new phone number request
      await setDoc(doc(db, 'phoneNumberRequests', requestId), {
        id: requestId,
        requesterId: user.uid,
        requesterType: userProfile?.userType || 'student',
        teacherId: otherUser.id,
        teacherName: otherUser.name || 'Teacher',
        status: 'pending',
        timestamp,
        phoneNumber: null
      });
      
      // Create notification for the teacher
      try {
        await createPhoneRequestNotification(
          otherUser.id,
          user.uid,
          requestId,
          "pending"
        );
      } catch (notifError) {
        console.error("Error creating phone request notification:", notifError);
      }
      
      setPhoneRequestStatus('pending');
      setPhoneRequestId(requestId);
      
      // Add a system message to the conversation
      try {
        console.log(`Adding system message to conversation ${conversationId}`);
        await addDoc(
          collection(db, "conversations", conversationId, "messages"),
          {
            text: "Phone number requested",
            senderId: "system", // Use system as sender ID
            createdAt: serverTimestamp(),
            isSystemMessage: true,
            systemMessageType: "phone_request",
            requestId
          }
        );
        
        // Make sure we update the last message in the conversation
        await updateDoc(doc(db, "conversations", conversationId), {
          lastMessage: "Phone number requested", 
          lastMessageAt: serverTimestamp()
        });
        
        console.log(`System message added successfully`);
      } catch (systemMessageError) {
        console.error("Error adding system message:", systemMessageError);
        // Don't throw here, the request was still created
      }
      
    } catch (error) {
      console.error("Error requesting phone number:", error);
      alert("Failed to request phone number. Please try again.");
    } finally {
      setPhoneRequestLoading(false);
    }
  };

  const handlePhoneRequest = async (action: 'approved' | 'reject') => {
    if (!user || !otherUser || !phoneRequestId || phoneRequestLoading) return;
    
    setPhoneRequestLoading(true);
    
    try {
      const requestDoc = await getDoc(doc(db, "phoneNumberRequests", phoneRequestId));
      
      if (!requestDoc.exists()) {
        console.error("Phone request not found");
        return;
      }
      
      const requestData = requestDoc.data();
      const requesterId = requestData.requesterId;
      
      // Update the request status
      await updateDoc(doc(db, "phoneNumberRequests", phoneRequestId), {
        status: action,
        phoneNumber: action === 'approved' ? otherUser.phoneNumber : null,
        respondedAt: serverTimestamp()
      });
      
      // Create notification for the requester
      try {
        await createPhoneRequestNotification(
          requesterId,
          user.uid,
          phoneRequestId,
          action === 'approved' ? 'approved' : 'rejected'
        );
      } catch (notifError) {
        console.error("Error creating phone request notification:", notifError);
      }
      
      // Add a system message to the conversation
      try {
        const statusText = `Phone number request ${action === 'approved' ? 'approved' : 'rejected'}`;
        console.log(`Adding system message: ${statusText}`);
        
        await addDoc(
          collection(db, "conversations", conversationId, "messages"),
          {
            text: statusText,
            senderId: "system",
            createdAt: serverTimestamp(),
            isSystemMessage: true,
            systemMessageType: action === 'approved' ? "phone_approved" : "phone_rejected",
            requestId: phoneRequestId
          }
        );
        
        // Update the conversation's last message
        await updateDoc(doc(db, "conversations", conversationId), {
          lastMessage: statusText,
          lastMessageAt: serverTimestamp()
        });
        
        console.log("System message added successfully");
      } catch (systemMessageError) {
        console.error("Error adding system message:", systemMessageError);
        // Don't throw here, the request was still processed
      }
      
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
      <div className="flex flex-col h-[calc(100vh-200px)]">
        {/* Header */}
        <div className="flex items-center justify-between py-4 border-b">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </button>
            
            {otherUser && (
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center text-white font-bold">
                  {otherUser.avatarUrl ? (
                    <Image
                      src={otherUser.avatarUrl}
                      alt={getDisplayName(otherUser)}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    getInitials(getDisplayName(otherUser))
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{getDisplayName(otherUser)}</p>
                  <p className="text-xs text-gray-500 capitalize">{otherUser.type}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Phone Request Button for Students/Parents when chatting with Teacher */}
          {otherUser && otherUser.type === 'teacher' && 
           userProfile && (userProfile.userType === 'student' || userProfile.userType === 'parent') && (
            <div className="flex items-center">
              {phoneRequestStatus === null && (
                <button
                  onClick={requestPhoneNumber}
                  disabled={phoneRequestLoading}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                >
                  <Phone className="h-4 w-4" />
                  <span>Request Phone</span>
                </button>
              )}
              
              {phoneRequestStatus === 'pending' && (
                <span className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-100 rounded-md">
                  <Phone className="h-4 w-4" />
                  <span>Request Pending</span>
                </span>
              )}
              
              {phoneRequestStatus === 'approved' && phoneNumber && (
                <div className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-md">
                  <Phone className="h-4 w-4" />
                  <span>Phone: {phoneNumber}</span>
                </div>
              )}
              
              {phoneRequestStatus === 'rejected' && (
                <span className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-md">
                  <Phone className="h-4 w-4" />
                  <span>Request Rejected</span>
                </span>
              )}
            </div>
          )}
          
          {/* Phone Request Management for Teachers */}
          {otherUser && userProfile && userProfile.userType === 'teacher' && 
           phoneRequestStatus === 'pending' && phoneRequestId && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Phone number requested</span>
              <button
                onClick={() => handlePhoneRequest('approved')}
                disabled={phoneRequestLoading}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                <span>Approve</span>
              </button>
              <button
                onClick={() => handlePhoneRequest('reject')}
                disabled={phoneRequestLoading}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                <span>Reject</span>
              </button>
            </div>
          )}
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500">No messages yet</p>
                <p className="text-sm text-gray-400">Start the conversation by sending a message below</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isCurrentUser = message.senderId === user?.uid;
                const isSystemMessage = message.senderId === "system" || message.isSystemMessage;
                
                // System message (like phone request notifications)
                if (isSystemMessage) {
                  return (
                    <div key={message.id} className="flex justify-center">
                      <div className="bg-gray-100 text-gray-600 text-sm py-1 px-3 rounded-full">
                        {message.text}
                      </div>
                    </div>
                  );
                }
                
                // Regular chat message
                return (
                  <div 
                    key={message.id} 
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[75%] px-4 py-2 rounded-lg ${
                        isCurrentUser 
                          ? 'bg-blue-600 text-white rounded-br-none' 
                          : 'bg-gray-100 text-gray-900 rounded-bl-none'
                      }`}
                    >
                      <p>{message.text}</p>
                      
                      {/* File attachments */}
                      {message.fileUrls && message.fileUrls.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {message.fileUrls.map((url, index) => {
                            const fileName = message.fileNames?.[index] || 'Attachment';
                            const isImage = url.match(/\.(jpeg|jpg|gif|png)$/i);
                            
                            return (
                              <div key={index} className="inline-block">
                                {isImage ? (
                                  <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                                    <div className="relative h-32 w-32 rounded-md overflow-hidden">
                                      <Image
                                        src={url}
                                        alt={fileName}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  </a>
                                ) : (
                                  <a 
                                    href={url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 p-2 rounded-md ${
                                      isCurrentUser ? 'bg-blue-700' : 'bg-gray-200'
                                    }`}
                                  >
                                    <Paperclip className={`h-4 w-4 ${
                                      isCurrentUser ? 'text-blue-200' : 'text-gray-500'
                                    }`} />
                                    <span className={`text-sm truncate max-w-[200px] ${
                                      isCurrentUser ? 'text-blue-100' : 'text-gray-800'
                                    }`}>
                                      {fileName}
                                    </span>
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      <p 
                        className={`text-xs mt-1 ${
                          isCurrentUser ? 'text-blue-200' : 'text-gray-500'
                        }`}
                      >
                        {formatMessageTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              
              {/* Typing indicator */}
              {isOtherUserTyping && (
                <TypingIndicator 
                  isTyping={true} 
                  userName={getDisplayName(otherUser)}
                />
              )}
              
              <div ref={messageEndRef} />
            </div>
          )}
        </div>
        
        {/* Message Input */}
        <div className="border-t p-4">
          <MessageInput
            onSend={handleSendMessage}
            onTyping={handleTyping}
            isLoading={isSending}
            disabled={isLoading}
          />
        </div>
      </div>
    </DashboardShell>
  );
}

export default withAuth(ConversationPage, {
  allowedUserTypes: ["teacher", "student", "parent"],
  redirectTo: "/login",
}); 