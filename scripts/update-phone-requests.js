const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, doc, getDoc, updateDoc } = require('firebase/firestore');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateApprovedPhoneRequests() {
  try {
    console.log('Starting to update approved phone requests...');
    
    // Get all approved phone requests
    const requestsQuery = query(
      collection(db, 'phoneNumberRequests'),
      where('status', '==', 'approved')
    );
    
    const requestsSnapshot = await getDocs(requestsQuery);
    console.log(`Found ${requestsSnapshot.docs.length} approved requests`);
    
    let updateCount = 0;
    let noPhoneNumberCount = 0;
    
    // Process each request
    for (const requestDoc of requestsSnapshot.docs) {
      const requestData = requestDoc.data();
      const requestId = requestDoc.id;
      
      // Skip if request already has a phone number
      if (requestData.phoneNumber) {
        console.log(`Request ${requestId} already has phone number: ${requestData.phoneNumber}`);
        continue;
      }
      
      // Get teacher's phone number from their profile
      const teacherId = requestData.teacherId;
      if (!teacherId) {
        console.log(`Request ${requestId} has no teacherId, skipping`);
        continue;
      }
      
      const teacherDoc = await getDoc(doc(db, 'teachers', teacherId));
      
      if (teacherDoc.exists() && teacherDoc.data().phoneNumber) {
        const phoneNumber = teacherDoc.data().phoneNumber;
        
        // Update the request with the phone number
        await updateDoc(doc(db, 'phoneNumberRequests', requestId), {
          phoneNumber: phoneNumber
        });
        
        console.log(`Updated request ${requestId} with phone number ${phoneNumber}`);
        updateCount++;
      } else {
        console.log(`No phone number found for teacher ${teacherId}, skipping request ${requestId}`);
        noPhoneNumberCount++;
      }
    }
    
    console.log(`Done! Updated ${updateCount} requests. ${noPhoneNumberCount} teachers had no phone number.`);
  } catch (error) {
    console.error('Error updating phone requests:', error);
  }
}

// Run the update function
updateApprovedPhoneRequests().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
}); 