"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { 
  User,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  UserCredential
} from "firebase/auth";
import { doc, getDoc, setDoc, collection } from "firebase/firestore";
import { auth, db } from "./firebase";
import { useRouter } from "next/navigation";
import Cookies from 'js-cookie';

// Define user types
export type UserType = "teacher" | "student" | "parent";

// Define user profile interface with common fields
export interface UserProfile {
  email: string;
  userType: UserType;
  createdAt: number;
  onboardingCompleted?: boolean;
}

// Define auth context interface
interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  signup: (email: string, password: string, userType: UserType) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  checkOnboardingStatus: () => Promise<boolean>;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Handle signup
  const signup = async (email: string, password: string, userType: UserType) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile document in Firestore
      const userProfile: UserProfile = {
        email,
        userType,
        createdAt: Date.now(),
        onboardingCompleted: false,
      };
      
      // Try to create the user document, with specific error handling
      try {
        await setDoc(doc(db, "users", userCredential.user.uid), userProfile);
        
        // Set a session cookie
        Cookies.set('session', 'true', { expires: 7 });
        
        // Set custom headers for middleware
        document.cookie = `x-user-type=${userType}; path=/;`;
        document.cookie = `x-onboarding-completed=false; path=/;`;
        
      } catch (firestoreError: any) {
        console.error("Firestore write error:", firestoreError);
        
        // If it's a permission error, throw a more specific error
        if (firestoreError.code === 'permission-denied') {
          throw new Error("Firebase permissions error. Please check your Firestore rules.");
        }
        
        throw firestoreError;
      }
      
      return userCredential;
    } catch (authError: any) {
      console.error("Authentication error:", authError);
      throw authError;
    }
  };

  // Handle login
  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Handle logout
  const logout = async () => {
    await signOut(auth);
    Cookies.remove('session');
    document.cookie = "x-user-type=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "x-onboarding-completed=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    return;
  };
  
  // Complete onboarding
  const completeOnboarding = async () => {
    if (!user) return;
    
    try {
      await setDoc(doc(db, "users", user.uid), {
        onboardingCompleted: true
      }, { merge: true });
      
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          onboardingCompleted: true
        });
      }
      
      // Update custom header for middleware
      document.cookie = `x-onboarding-completed=true; path=/;`;
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error("Error completing onboarding:", error);
      throw error;
    }
  };
  
  // Check onboarding status
  const checkOnboardingStatus = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile;
        return !!data.onboardingCompleted;
      }
      return false;
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      return false;
    }
  };

  // Watch for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Set session cookie
        Cookies.set('session', 'true', { expires: 7 });
        
        // Fetch user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            setUserProfile(data);
            
            // Set custom headers for middleware
            document.cookie = `x-user-type=${data.userType}; path=/;`;
            document.cookie = `x-onboarding-completed=${!!data.onboardingCompleted}; path=/;`;
            
            // If the user is newly registered and hasn't completed onboarding, redirect to onboarding
            if (!data.onboardingCompleted) {
              // Check if user has any profile data
              const profileRef = collection(db, "profiles", data.userType + "s");
              const profileDoc = await getDoc(doc(profileRef, user.uid));
              
              if (!profileDoc.exists()) {
                router.push(`/onboarding/${data.userType}/step1`);
              }
            }
          } else {
            console.warn("User document does not exist in Firestore");
          }
        } catch (error: any) {
          console.error("Error fetching user profile:", error);
          if (error.code === 'permission-denied') {
            console.error("Permission denied. Check Firestore rules.");
          }
        }
      } else {
        setUserProfile(null);
        Cookies.remove('session');
        document.cookie = "x-user-type=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "x-onboarding-completed=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const value = {
    user,
    userProfile,
    isLoading,
    signup,
    login,
    logout,
    completeOnboarding,
    checkOnboardingStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Create a hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 