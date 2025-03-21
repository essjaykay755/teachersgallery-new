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

// Create a message notification
export async function createMessageNotification(
  recipientId: string,
  senderId: string,
  conversationId: string,
  message: string
) {
  try {
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
    
    let senderName = "Someone";
    if (senderProfileDoc && senderProfileDoc.exists()) {
      senderName = senderProfileDoc.data().name || 
                  senderProfileDoc.data().fullName || 
                  "Someone";
    }
    
    // Create the notification
    await createNotification(
      recipientId,
      "message",
      `New message from ${senderName}`,
      message.length > 50 ? `${message.substring(0, 50)}...` : message,
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
export async function createPhoneRequestNotification(
  recipientId: string,
  requesterId: string,
  requestId: string,
  status: string
) {
  try {
    // Get requester info
    const requesterDoc = await getDoc(doc(db, "users", requesterId));
    let requesterType = "";
    
    if (requesterDoc.exists()) {
      requesterType = requesterDoc.data().userType || "";
    }
    
    // If requesterType is empty, try to guess from the status context
    if (!requesterType) {
      // If status is 'pending', then the requester is likely a student or parent
      // If status is 'approved' or 'rejected', the requester is likely receiving notification from a teacher
      requesterType = status === 'pending' ? 'student' : 'teacher';
    }
    
    // Normalize type to ensure collection name is correct
    const userCollection = requesterType === 'teacher' ? 'teachers' : 
                          requesterType === 'parent' ? 'parents' : 'students';
    
    // Get requester profile from the direct collection
    let requesterProfileDoc = await getDoc(doc(db, userCollection, requesterId));
    
    let requesterName = "Someone";
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
        }
      } catch (profileError) {
        console.error("Error accessing fallback profile:", profileError);
      }
    }
    
    let title = "";
    let body = "";
    
    // Set title and body based on status
    if (status === "pending") {
      title = `New phone number request`;
      body = `${requesterName} has requested your phone number`;
    } else if (status === "approved") {
      title = `Phone request approved`;
      body = `Your request for phone number has been approved`;
    } else if (status === "rejected") {
      title = `Phone request rejected`;
      body = `Your request for phone number has been rejected`;
    }
    
    // Create the notification
    if (title && body) {
      await createNotification(
        recipientId,
        "phone_request",
        title,
        body,
        {
          requestId,
          requesterId
        }
      );
      
      console.log(`Successfully created notification for ${recipientId} about phone request ${requestId}`);
    }
  } catch (error) {
    console.error("Error creating phone request notification:", error);
    // Re-throw error only in development to help with debugging
    if (process.env.NODE_ENV === 'development') {
      throw error;
    }
  }
} 