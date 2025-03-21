import {
  doc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDoc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';

// Update typing status
export const updateTypingStatus = async (
  conversationId: string, 
  userId: string, 
  isTyping: boolean
) => {
  try {
    await updateDoc(doc(db, 'conversations', conversationId), {
      [`typingUsers.${userId}`]: isTyping ? serverTimestamp() : null
    });
  } catch (error) {
    console.error('Error updating typing status:', error);
  }
};

// Subscribe to typing status changes
export const subscribeToTypingStatus = (
  conversationId: string,
  callback: (typingUsers: Record<string, any>) => void
) => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    
    return onSnapshot(
      conversationRef,
      { includeMetadataChanges: false },
      (snapshot) => {
        try {
          const data = snapshot.data();
          callback(data?.typingUsers || {});
        } catch (error) {
          console.error('Error processing typing status data:', error);
          // Call callback with empty object to prevent UI errors
          callback({});
        }
      },
      (error) => {
        console.error('Error in typing status subscription:', error.code, error.message);
        // Call callback with empty object to prevent UI errors
        callback({});
      }
    );
  } catch (error) {
    console.error('Error setting up typing status subscription:', error);
    // Return a no-op function for the unsubscribe in case of setup failure
    return () => {};
  }
};

// Mark messages as read
export const markMessagesAsRead = async (
  conversationId: string,
  userId: string
) => {
  try {
    // Update the conversation to indicate this user has read the messages
    await updateDoc(doc(db, 'conversations', conversationId), {
      [`lastReadTimestamp.${userId}`]: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};

// Create or get conversation between users
export const getOrCreateConversation = async (
  currentUserId: string,
  currentUserType: string,
  otherUserId: string,
  otherUserType: string
) => {
  if (!currentUserId || !currentUserType || !otherUserId || !otherUserType) {
    console.error('Missing required parameters for creating conversation:', { 
      currentUserId, currentUserType, otherUserId, otherUserType 
    });
    throw new Error('Missing required parameters for creating conversation');
  }

  try {
    console.log('Attempting to find existing conversation between users:', 
      { currentUserId, otherUserId });

    // Check if a conversation already exists
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUserId)
    );
    
    const snapshot = await getDocs(conversationsQuery);
    let conversationId = null;
    
    // Look for a conversation with both users
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.participants && data.participants.includes(otherUserId)) {
        conversationId = doc.id;
        console.log('Found existing conversation:', conversationId);
      }
    });
    
    // If no conversation exists, create one
    if (!conversationId) {
      // Normalize user types for consistent storage
      const normalizedCurrentUserType = currentUserType.endsWith('s') ? currentUserType : `${currentUserType}s`;
      const normalizedOtherUserType = otherUserType.endsWith('s') ? otherUserType : `${otherUserType}s`;
      
      console.log('Creating new conversation between users:', { 
        currentUserId, normalizedCurrentUserType, 
        otherUserId, normalizedOtherUserType 
      });
      
      const conversationData = {
        participants: [currentUserId, otherUserId],
        participantTypes: {
          [currentUserId]: currentUserType,
          [otherUserId]: otherUserType
        },
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        typingUsers: {},
        lastReadTimestamp: {}
      };
      
      // Create the conversation document
      try {
        const newConversationRef = await addDoc(
          collection(db, 'conversations'), 
          conversationData
        );
        
        conversationId = newConversationRef.id;
        console.log('Successfully created new conversation with ID:', conversationId);
      } catch (createError: any) {
        console.error('Error creating conversation document:', 
          createError.code, createError.message, conversationData);
        throw createError;
      }
    }
    
    return conversationId;
  } catch (error: any) {
    console.error('Error getting or creating conversation:', 
      error.code, error.message);
    throw error;
  }
}; 