// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, Auth } from "firebase/auth";
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  Firestore, 
  initializeFirestore,
  FirestoreSettings,
  enableIndexedDbPersistence
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
  
  // Use Firestore with standard configuration - disable persistence to avoid errors
  db = getFirestore(firebaseApp);
  
  // Enable offline persistence for Firestore only in production or development (not in testing)
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence not available in this browser');
      } else {
        console.error('Firestore persistence error:', err);
      }
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