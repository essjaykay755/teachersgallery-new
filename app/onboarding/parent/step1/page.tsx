"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Phone } from "lucide-react";
import AvatarInput from "@/app/components/shared/avatar-input";

export default function ParentOnboardingStep1() {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  // Check if user is authenticated and is a parent
  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    
    if (userProfile && userProfile.userType !== "parent") {
      router.push("/");
      return;
    }
    
    // Check if parent data already exists for step 1
    const fetchParentData = async () => {
      try {
        const parentDoc = await getDoc(doc(db, "parents", user.uid));
        
        if (parentDoc.exists()) {
          const data = parentDoc.data();
          
          if (data.fullName) {
            setFullName(data.fullName);
          }
          
          if (data.phoneNumber) {
            setPhoneNumber(data.phoneNumber);
          }
          
          if (data.avatarUrl) {
            setAvatarUrl(data.avatarUrl);
          }
        }
        
        setIsInitializing(false);
      } catch (error) {
        console.error("Error fetching parent data:", error);
        setIsInitializing(false);
      }
    };
    
    fetchParentData();
  }, [user, userProfile, router]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push("/login");
      return;
    }
    
    if (!fullName) {
      setError("Please provide your full name");
      return;
    }
    
    if (!phoneNumber) {
      setError("Phone number is required for parents");
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Create/update parent document
      await setDoc(doc(db, "parents", user.uid), {
        fullName,
        phoneNumber,
        avatarUrl,
        email: user.email,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      
      // Navigate to step 2
      router.push("/onboarding/parent/step2");
    } catch (error: any) {
      console.error("Error in parent onboarding step 1:", error);
      setError(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Welcome to TeachersGallery!</h1>
        <p className="mt-2 text-gray-600">Step 1 of 3: Personal Information</p>
      </div>
      
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information Section */}
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <Phone className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold">Personal Information</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    placeholder="+91 1234567890"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 py-2 px-3 text-gray-500 shadow-sm sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Email address cannot be changed
                  </p>
                </div>
              </div>
            </div>
            
            {/* Profile Picture Section */}
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <h2 className="text-xl font-semibold">Profile Picture</h2>
              </div>
              
              {/* Avatar Input Component */}
              <AvatarInput 
                userId={user?.uid || null}
                initialAvatarUrl={avatarUrl}
                onChange={setAvatarUrl}
                variant="full"
                size="md"
                ref={avatarInputRef}
              />
            </div>
            
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {isLoading ? "Saving..." : "Continue to Step 2"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 