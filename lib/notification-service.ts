import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDoc, 
  doc, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { db } from "./firebase";
import { NotificationType } from "./notifications-context";

// Helper function to get a user's full name from various collections
async function getUserFullName(userId: string, userTypeHint?: string): Promise<string> {
  console.log(`Looking up full name for user ID: ${userId}`);
  let fullName = "";
  let userType = userTypeHint || "";
  
  // Helper function to check if a string appears to be an email address
  const isEmail = (str: string): boolean => {
    return /\S+@\S+\.\S+/.test(str);
  };
  
  // Helper function to validate and clean name
  const validateName = (name: string): string | null => {
    if (!name) return null;
    if (isEmail(name)) {
      console.log(`Rejected email as name: ${name}`);
      return null;
    }
    return name;
  };
  
  try {
    // 1. First check users collection
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      userType = userType || userData.userType || "";
      
      // Check for name fields in user document but reject email addresses
      const potentialNames = [
        validateName(userData.name),
        validateName(userData.fullName),
        validateName(userData.displayName),
        (userData.firstName && userData.lastName) ? validateName(`${userData.firstName} ${userData.lastName}`) : null
      ];
      
      fullName = potentialNames.find(name => name !== null) || "";
      
      if (fullName) {
        console.log(`Found name in users collection: ${fullName}`);
        return fullName;
      }
      
      console.log(`No valid name found in users collection, checking profiles...`);
    }
    
    // 2. Next, check the appropriate collection based on user type
    if (userType) {
      const collectionName = userType === 'teacher' ? 'teachers' : 
                            userType === 'parent' ? 'parents' : 'students';
      
      console.log(`Checking ${collectionName} collection...`);
      const profileDoc = await getDoc(doc(db, collectionName, userId));
      
      if (profileDoc.exists()) {
        const profileData = profileDoc.data();
        
        // Check all possible name fields, rejecting email addresses
        const potentialNames = [
          validateName(profileData.name),
          validateName(profileData.fullName),
          validateName(profileData.displayName),
          (profileData.firstName && profileData.lastName) ? validateName(`${profileData.firstName} ${profileData.lastName}`) : null
        ];
        
        fullName = potentialNames.find(name => name !== null) || "";
        
        if (fullName) {
          console.log(`Found name in ${collectionName} collection: ${fullName}`);
          return fullName;
        }
      }
    }
    
    // 3. Check profiles/[type] path if we have a user type
    if (userType) {
      const profilePath = `profiles/${userType}s`;
      console.log(`Checking ${profilePath} collection...`);
      
      try {
        const profileDoc = await getDoc(doc(db, "profiles", `${userType}s`, userId));
        
        if (profileDoc.exists()) {
          const profileData = profileDoc.data();
          
          // Check all possible name fields, rejecting email addresses
          const potentialNames = [
            validateName(profileData.name),
            validateName(profileData.fullName),
            validateName(profileData.displayName),
            (profileData.firstName && profileData.lastName) ? validateName(`${profileData.firstName} ${profileData.lastName}`) : null
          ];
          
          fullName = potentialNames.find(name => name !== null) || "";
          
          if (fullName) {
            console.log(`Found name in ${profilePath} collection: ${fullName}`);
            return fullName;
          }
        }
      } catch (error) {
        console.log(`Error checking ${profilePath}: ${error}`);
      }
    }
    
    // 4. Check direct profiles collection
    console.log(`Checking direct profiles collection...`);
    const profileDoc = await getDoc(doc(db, "profiles", userId));
    
    if (profileDoc.exists()) {
      const profileData = profileDoc.data();
      
      // Check all possible name fields, rejecting email addresses
      const potentialNames = [
        validateName(profileData.name),
        validateName(profileData.fullName),
        validateName(profileData.displayName),
        (profileData.firstName && profileData.lastName) ? validateName(`${profileData.firstName} ${profileData.lastName}`) : null
      ];
      
      fullName = potentialNames.find(name => name !== null) || "";
      
      if (fullName) {
        console.log(`Found name in profiles collection: ${fullName}`);
        return fullName;
      }
    }
    
    // 5. Check collections with userId field
    console.log(`Searching for profiles with userId field matching ${userId}...`);
    const collections = ['teacherProfiles', 'studentProfiles', 'parentProfiles'];
    
    for (const collectionName of collections) {
      const q = query(collection(db, collectionName), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const profileData = querySnapshot.docs[0].data();
        
        // Check all possible name fields, rejecting email addresses
        const potentialNames = [
          validateName(profileData.name),
          validateName(profileData.fullName),
          validateName(profileData.displayName),
          (profileData.firstName && profileData.lastName) ? validateName(`${profileData.firstName} ${profileData.lastName}`) : null
        ];
        
        fullName = potentialNames.find(name => name !== null) || "";
        
        if (fullName) {
          console.log(`Found name in ${collectionName} with userId match: ${fullName}`);
          return fullName;
        }
      }
    }
    
    // 6. If still no name, check if we have a user type and return a generic name
    if (userType) {
      console.log(`No name found, using generic name based on user type: ${userType}`);
      if (userType === 'student') {
        return "A Student";
      } else if (userType === 'parent') {
        return "A Parent";
      } else if (userType === 'teacher') {
        return "A Teacher";
      }
    }
    
    console.log(`No name found for user ${userId}, using generic fallback`);
    return "A User";
  } catch (error) {
    console.error(`Error getting user full name: ${error}`);
    return "A User";
  }
}

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
    // Get the reviewer's full name
    const reviewerName = await getUserFullName(reviewerId);
    
    // Create star rating representation
    const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
    
    console.log(`Creating review notification with reviewer name: ${reviewerName}`);
    
    // Create the notification
    await createNotification(
      teacherId,
      "review",
      `New review from ${reviewerName}`,
      `You received a new ${rating}-star review (${stars})`,
      {
        reviewId,
        reviewerId,
        rating,
        reviewerName
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
    // Make sure provided name isn't an email address
    let senderName: string;
    
    if (providedSenderName && !/\S+@\S+\.\S+/.test(providedSenderName)) {
      senderName = providedSenderName;
    } else {
      // Look up the sender's full name - will already filter out emails
      senderName = await getUserFullName(senderId);
    }
    
    console.log(`Creating message notification with sender name: ${senderName}`);
    
    // Create the notification
    await createNotification(
      recipientId,
      "message",
      `New message from ${senderName}`,
      messageText.length > 50 ? `${messageText.substring(0, 50)}...` : messageText,
      {
        conversationId,
        senderId,
        senderName
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
    status = 'pending',
    conversationId 
  } = params;
  
  try {
    // Make sure provided name isn't an email address
    let requesterName: string;
    
    if (providedRequesterName && !/\S+@\S+\.\S+/.test(providedRequesterName)) {
      requesterName = providedRequesterName;
    } else {
      // Look up the requester's full name - will already filter out emails
      requesterName = await getUserFullName(requesterId);
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
    
    console.log(`Creating phone request notification with requester name: ${requesterName}`);
    
    // Create the notification
    await createNotification(
      status === 'pending' ? teacherId : requesterId,
      "phone_request",
      title,
      body,
      {
        requesterId,
        requestId,
        status,
        conversationId,
        requesterName
      }
    );
  } catch (error) {
    console.error("Error creating phone request notification:", error);
  }
} 