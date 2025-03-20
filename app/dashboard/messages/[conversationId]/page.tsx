"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  onSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent } from "@/app/components/shared/card";
import { ChevronLeft, Send } from "lucide-react";
import { createMessageNotification } from "@/lib/notification-service";

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
}

function ConversationPage({ params }: { params: { conversationId: string } }) {
  const { conversationId } = params;
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const router = useRouter();

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

    const messagesQuery = query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      
      setMessages(messagesData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error subscribing to messages:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getOtherUserProfile = async (userId: string, userType: string) => {
    try {
      // Get profile based on user type
      const profileDoc = await getDoc(doc(db, "profiles", `${userType}s`, userId));
      
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

  const handleSendMessage = async () => {
    if (!user || !newMessage.trim() || isSending) return;

    try {
      setIsSending(true);
      
      // Add message to the conversation
      const messageData = {
        text: newMessage.trim(),
        senderId: user.uid,
        createdAt: serverTimestamp()
      };
      
      await addDoc(
        collection(db, "conversations", conversationId, "messages"),
        messageData
      );
      
      // Update conversation's last message
      await updateDoc(doc(db, "conversations", conversationId), {
        lastMessage: newMessage.trim(),
        lastMessageAt: serverTimestamp()
      });
      
      // Get recipient ID
      const recipientId = conversation?.participants?.find((id: string) => id !== user.uid);
      
      // Create notification for the recipient
      if (recipientId) {
        await createMessageNotification(
          recipientId, 
          user.uid, 
          conversationId, 
          newMessage.trim()
        );
      }
      
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
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

  return (
    <DashboardShell>
      <div className="flex flex-col h-[calc(100vh-200px)]">
        {/* Header */}
        <div className="flex items-center gap-4 py-4 border-b">
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
        
        {/* Messages */}
        <div className="flex-1 py-4 overflow-y-auto">
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
            <div className="space-y-4 px-4">
              {messages.map((message) => {
                const isCurrentUser = message.senderId === user?.uid;
                
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
              <div ref={messageEndRef} />
            </div>
          )}
        </div>
        
        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isSending}
            />
            <button
              onClick={handleSendMessage}
              disabled={isSending || !newMessage.trim()}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

export default withAuth(ConversationPage, {
  allowedUserTypes: ["teacher", "student", "parent"],
  redirectTo: "/login",
}); 