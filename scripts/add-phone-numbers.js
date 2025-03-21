// Script to add phone numbers to all teacher profiles
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs,
  updateDoc,
  doc
} = require('firebase/firestore');

// Your Firebase configuration
const firebaseConfig = {
  // Replace with your Firebase config from .env file
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

// Generate a random Indian phone number
function generatePhoneNumber() {
  const prefixes = ['91', '98', '70', '80', '95'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  let number = prefix;
  
  // Add 8 more random digits
  for (let i = 0; i < 8; i++) {
    number += Math.floor(Math.random() * 10);
  }
  
  return '+91' + number;
}

// Main function to add phone numbers to all teacher profiles
async function addPhoneNumbersToTeachers() {
  try {
    console.log('Starting to add phone numbers to teacher profiles...');
    
    // Get all teacher documents
    const teachersRef = collection(db, 'teachers');
    const teacherDocs = await getDocs(teachersRef);
    
    let updateCount = 0;
    
    // Loop through each teacher and add a phone number if they don't have one
    for (const teacherDoc of teacherDocs.docs) {
      const teacherId = teacherDoc.id;
      const teacherData = teacherDoc.data();
      
      if (!teacherData.phoneNumber) {
        const phoneNumber = generatePhoneNumber();
        
        // Update the teacher document with a phone number
        await updateDoc(doc(db, 'teachers', teacherId), {
          phoneNumber: phoneNumber
        });
        
        console.log(`Added phone number ${phoneNumber} to teacher ${teacherId}`);
        updateCount++;
      } else {
        console.log(`Teacher ${teacherId} already has a phone number: ${teacherData.phoneNumber}`);
      }
    }
    
    console.log(`Done! Added phone numbers to ${updateCount} teacher profiles.`);
  } catch (error) {
    console.error('Error adding phone numbers:', error);
  }
}

// Run the function
addPhoneNumbersToTeachers(); 