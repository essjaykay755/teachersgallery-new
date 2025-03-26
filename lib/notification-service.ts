import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDoc, 
  doc 
} from "firebase/firestore";
import { db } from "./firebase";
import { NotificationType } from "./notifications-context";

// Create a notification for a user
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: any
) {
  try {
    await addDoc(collection(db, "notifications"), {
      userId,
      type,
      title,
      body,
      isRead: false,
      createdAt: serverTimestamp(),
      data
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

// Create a review notification for teachers
export async function createReviewNotification(
  teacherId: string,
  reviewerId: string,
  reviewId: string,
  rating: number
) {
  try {
    // Get reviewer info to include in notification
    const reviewerDoc = await getDoc(doc(db, "users", reviewerId));
    let reviewerType = "";
    
    if (reviewerDoc.exists()) {
      reviewerType = reviewerDoc.data().userType || "";
    }
    
    // Determine collection based on user type
    const userCollection = reviewerType === 'parent' ? 'parents' : 'students';
    
    // Try to get the reviewer profile
    let reviewerProfileDoc = await getDoc(doc(db, userCollection, reviewerId));
    
    // Fallback: try the nested profiles path if the direct path doesn't exist
    if (!reviewerProfileDoc.exists()) {
      try {
        reviewerProfileDoc = await getDoc(doc(db, "profiles", userCollection, reviewerId));
      } catch (pathError) {
        console.error("Error accessing legacy profile path:", pathError);
      }
    }
    
    let reviewerName = "Someone";
    if (reviewerProfileDoc && reviewerProfileDoc.exists()) {
      reviewerName = reviewerProfileDoc.data().name || 
                    reviewerProfileDoc.data().fullName || 
                    "Someone";
    }
    
    // Create star rating representation
    const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
    
    // Create the notification
    await createNotification(
      teacherId,
      "review", // Note: We need to add this type to NotificationType
      `New review from ${reviewerName}`,
      `You received a new ${rating}-star review (${stars})`,
      {
        reviewId,
        reviewerId,
        rating
      }
    );
    
    console.log(`Successfully created review notification for teacher ${teacherId}`);
  } catch (error) {
    console.error("Error creating review notification:", error);
    // Don't throw the error to avoid breaking the review submission flow
  }
}

// Create a message notification
export interface MessageNotificationParams {
  recipientId: string;
  senderId: string;
  senderName?: string;
  conversationId: string;
  messageText: string;
}

export async function createMessageNotification(params: MessageNotificationParams) {
  const { recipientId, senderId, senderName: providedSenderName, conversationId, messageText } = params;
  
  try {
    let senderName = providedSenderName;
    
    // If sender name not provided, try to fetch it
    if (!senderName) {
      // Get sender info to include in notification
      const senderDoc = await getDoc(doc(db, "users", senderId));
      let senderType = "";
      
      if (senderDoc.exists()) {
        senderType = senderDoc.data().userType;
      }
      
      // Get sender profile
      // Use direct collection path instead of nested path
      const userCollection = senderType === 'teacher' ? 'teachers' : 
                            senderType === 'parent' ? 'parents' : 'students';
      
      // Try to get the user profile from the direct collection first
      let senderProfileDoc = await getDoc(doc(db, userCollection, senderId));
      
      // Fallback: try the nested profiles path if the direct path doesn't exist
      if (!senderProfileDoc.exists()) {
        console.log(`Profile not found in ${userCollection}, trying legacy path...`);
        try {
          // Only try this if necessary, with proper error handling
          senderProfileDoc = await getDoc(doc(db, "profiles", `${senderType}s`, senderId));
        } catch (pathError) {
          console.error("Error accessing legacy profile path:", pathError);
        }
      }
      
      if (senderProfileDoc && senderProfileDoc.exists()) {
        senderName = senderProfileDoc.data().name || 
                    senderProfileDoc.data().fullName || 
                    "Someone";
      } else {
        senderName = "Someone";
      }
    }
    
    // Create the notification
    await createNotification(
      recipientId,
      "message",
      `New message from ${senderName}`,
      messageText.length > 50 ? `${messageText.substring(0, 50)}...` : messageText,
      {
        conversationId,
        senderId
      }
    );
  } catch (error) {
    console.error("Error creating message notification:", error);
  }
}

// Create a phone request notification
export interface PhoneRequestNotificationParams {
  teacherId: string;
  requesterId: string;
  requesterName?: string;
  requestId?: string;
  status?: string;
  conversationId?: string;
}

export async function createPhoneRequestNotification(params: PhoneRequestNotificationParams) {
  const { 
    teacherId, 
    requesterId, 
    requesterName: providedRequesterName, 
    requestId, 
    status = "pending",
    conversationId
  } = params;
  
  try {
    let requesterName = providedRequesterName;
    
    // If requester name not provided, try to fetch it
    if (!requesterName) {
      // Get requester info
      const requesterDoc = await getDoc(doc(db, "users", requesterId));
      let requesterType = "";
      
      if (requesterDoc.exists()) {
        requesterType = requesterDoc.data().userType || "";
      }
      
      // If requesterType is empty, default to student
      if (!requesterType) {
        requesterType = 'student';
      }
      
      // Normalize type to ensure collection name is correct
      const userCollection = requesterType === 'teacher' ? 'teachers' : 
                            requesterType === 'parent' ? 'parents' : 'students';
      
      // Get requester profile from the direct collection
      let requesterProfileDoc = await getDoc(doc(db, userCollection, requesterId));
      
      if (requesterProfileDoc.exists()) {
        requesterName = requesterProfileDoc.data().name || 
                       requesterProfileDoc.data().fullName || 
                       "Someone";
      } else {
        // If no profile found in the direct collection, try looking in general profiles collection
        try {
          const fallbackProfileDoc = await getDoc(doc(db, "profiles", requesterId));
          if (fallbackProfileDoc.exists()) {
            requesterName = fallbackProfileDoc.data().name || 
                           fallbackProfileDoc.data().fullName || 
                           "Someone";
          } else {
            requesterName = "Someone";
          }
        } catch (error) {
          requesterName = "Someone";
          console.error("Error fetching requester fallback profile:", error);
        }
      }
    }
    
    // Determine notification text based on status
    let title, body;
    if (status === 'pending') {
      title = `Phone number requested`;
      body = `${requesterName} has requested your phone number`;
    } else if (status === 'approved') {
      title = `Phone request approved`;
      body = `Your request for phone number has been approved`;
    } else if (status === 'rejected') {
      title = `Phone request rejected`;
      body = `Your request for phone number has been rejected`;
    } else {
      title = `Phone request update`;
      body = `Your phone request status has been updated`;
    }
    
    // Create the notification
    await createNotification(
      teacherId,
      "phone_request",
      title,
      body,
      {
        requesterId,
        requestId,
        status,
        conversationId
      }
    );
  } catch (error) {
    console.error("Error creating phone request notification:", error);
  }
} 