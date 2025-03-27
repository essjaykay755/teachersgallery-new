import { db } from './firebase';
import { 
  doc, 
  setDoc, 
  serverTimestamp, 
  onSnapshot,
  getDoc,
  query,
  collection,
  where,
  Timestamp
} from 'firebase/firestore';
import { getDatabase, ref, onValue, set } from 'firebase/database';

// Time in milliseconds after which we consider a user offline
const OFFLINE_THRESHOLD = 30 * 1000; // Reduced to 30 seconds for faster offline detection

/**
 * Update the user's online status in Firestore
 */
export const updateOnlineStatus = async (userId: string, isOnline: boolean) => {
  if (!userId) return;
  
  try {
    const userStatusRef = doc(db, 'userStatus', userId);
    const clientTimestamp = new Date();
    
    await setDoc(userStatusRef, {
      online: isOnline,
      lastSeen: serverTimestamp(),
      updatedAt: serverTimestamp(),
      clientTime: clientTimestamp.getTime(), // Add client timestamp for reliable comparison
      lastHeartbeat: clientTimestamp.getTime() // Add explicit heartbeat timestamp
    }, { merge: true });
    
    console.log(`User ${userId} status updated to ${isOnline ? 'online' : 'offline'}`);
  } catch (error) {
    console.error('Error updating online status:', error);
  }
};

/**
 * Set up presence tracking for a user
 */
export const setupPresenceTracking = (userId: string) => {
  if (!userId) return () => {};
  
  try {
    // Set initial online status
    updateOnlineStatus(userId, true);
    
    // Set up page visibility change listener
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      updateOnlineStatus(userId, isVisible);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up before unload listener - use sync code to ensure it runs
    const handleBeforeUnload = () => {
      // Create a sync XMLHttpRequest to force immediate execution
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/offline', false); // false makes it synchronous
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({ userId }));
      
      // Also try to update status directly
      const userStatusRef = doc(db, 'userStatus', userId);
      const clientTimestamp = new Date();
      
      try {
        setDoc(userStatusRef, {
          online: false,
          lastSeen: clientTimestamp,
          updatedAt: clientTimestamp,
          clientTime: clientTimestamp.getTime(),
          lastHeartbeat: 0 // Force offline
        }, { merge: true });
      } catch (e) {
        console.error('Error in sync offline update', e);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Add focus/blur listeners for additional reliability
    window.addEventListener('focus', () => updateOnlineStatus(userId, true));
    window.addEventListener('blur', () => updateOnlineStatus(userId, false));
    
    // Return cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('focus', () => updateOnlineStatus(userId, true));
      window.removeEventListener('blur', () => updateOnlineStatus(userId, false));
      updateOnlineStatus(userId, false);
    };
  } catch (error) {
    console.error('Error setting up presence tracking:', error);
    return () => {};
  }
};

/**
 * Get current online status for a user
 */
export const getUserOnlineStatus = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    const userStatusRef = doc(db, 'userStatus', userId);
    const statusDoc = await getDoc(userStatusRef);
    
    if (!statusDoc.exists()) return false;
    
    const data = statusDoc.data();
    const lastSeen = data.lastSeen?.toDate();
    
    if (!lastSeen) return false;
    
    // Calculate time since last seen using both server and client timestamps
    // for more reliable comparison across time zones and devices
    const now = new Date();
    const clientTime = data.clientTime || 0;
    const heartbeat = data.lastHeartbeat || 0;
    const serverTime = lastSeen.getTime();
    
    // Check the most recent activity timestamp
    const lastActivity = Math.max(serverTime, clientTime, heartbeat);
    const timeSinceLastSeen = now.getTime() - lastActivity;
    
    // Consider a user online only if they are explicitly marked online 
    // and have been seen very recently
    return (data.online === true) && (timeSinceLastSeen < OFFLINE_THRESHOLD);
  } catch (error) {
    console.error('Error getting user online status:', error);
    return false;
  }
};

/**
 * Subscribe to a user's online status
 */
export const subscribeToUserOnlineStatus = (
  userId: string, 
  callback: (isOnline: boolean) => void
) => {
  if (!userId) return () => {};
  
  try {
    const userStatusRef = doc(db, 'userStatus', userId);
    
    return onSnapshot(userStatusRef, (doc) => {
      if (!doc.exists()) {
        callback(false);
        return;
      }
      
      const data = doc.data();
      const lastSeen = data.lastSeen?.toDate();
      
      if (!lastSeen) {
        callback(false);
        return;
      }
      
      // Calculate time since last activity using all timestamps
      const now = new Date();
      const clientTime = data.clientTime || 0;
      const heartbeat = data.lastHeartbeat || 0;
      const serverTime = lastSeen.getTime();
      
      // Use the most recent activity timestamp
      const lastActivity = Math.max(serverTime, clientTime, heartbeat);
      const timeSinceLastSeen = now.getTime() - lastActivity;
      
      // Use strict comparison and check recent activity
      const isUserOnline = data.online === true && timeSinceLastSeen < OFFLINE_THRESHOLD;
      console.log(`User ${userId} online calculation:`, {
        online: data.online,
        timeSinceLastSeen: Math.round(timeSinceLastSeen/1000) + 's',
        threshold: Math.round(OFFLINE_THRESHOLD/1000) + 's',
        isOnline: isUserOnline
      });
      
      callback(isUserOnline);
    }, error => {
      console.error('Error in online status subscription:', error);
      // Fallback to offline when there's an error
      callback(false);
    });
  } catch (error) {
    console.error('Error subscribing to user online status:', error);
    return () => {};
  }
};

// Keep alive function to periodically update the user's online status
export const startPresenceKeepAlive = (userId: string) => {
  if (!userId) return () => {};
  
  // Update immediately to ensure status is current
  updateOnlineStatus(userId, true);
  
  // Use a shorter interval for more responsive status updates
  const interval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      // Update the heartbeat timestamp
      const userStatusRef = doc(db, 'userStatus', userId);
      const clientTimestamp = new Date();
      
      setDoc(userStatusRef, {
        online: true,
        lastHeartbeat: clientTimestamp.getTime()
      }, { merge: true }).catch(error => {
        console.error('Error updating heartbeat:', error);
      });
    }
  }, 10000); // Heartbeat every 10 seconds when page is visible
  
  return () => clearInterval(interval);
}; 