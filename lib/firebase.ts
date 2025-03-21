// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, Auth } from "firebase/auth";
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  Firestore, 
  initializeFirestore,
  FirestoreSettings
} from "firebase/firestore";
import { getStorage, connectStorageEmulator, FirebaseStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase with error handling
let firebaseApp: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  if (!getApps().length) {
    console.log("Initializing Firebase app...");
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    console.log("Firebase app already initialized");
    firebaseApp = getApps()[0]; // if already initialized, use that one
  }

  // Initialize Firebase services
  auth = getAuth(firebaseApp);
  
  // Use Firestore with standard configuration - persistence will be enabled
  // automatically in modern Firebase versions
  db = getFirestore(firebaseApp);
  
  // Enable offline persistence for Firestore (with error handling)
  // Note: This is still used but will be deprecated in future versions
  if (typeof window !== 'undefined') {
    // For future update: When Firebase SDK supports FirestoreSettings.cache 
    // in this version, we can replace this with the new approach
    import('firebase/firestore').then(({ enableIndexedDbPersistence }) => {
      enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
          console.warn('Persistence not available in this browser');
        } else {
          console.error('Persistence error:', err);
        }
      });
    });
  }
  
  storage = getStorage(firebaseApp);
} catch (error) {
  console.error("Error initializing Firebase:", error);
  // Initialize with default empty values to prevent undefined errors
  // @ts-ignore - Fallback initialization
  firebaseApp = {} as FirebaseApp;
  // @ts-ignore - Fallback initialization
  auth = {} as Auth;
  // @ts-ignore - Fallback initialization
  db = {} as Firestore;
  // @ts-ignore - Fallback initialization
  storage = {} as FirebaseStorage;
}

export { auth, db, storage }; 