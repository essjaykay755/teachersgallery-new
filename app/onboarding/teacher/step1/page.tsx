"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AvatarInput from "@/app/components/shared/avatar-input";

export default function TeacherOnboardingStep1() {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  // Check if user is authenticated and is a teacher
  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    
    if (userProfile && userProfile.userType !== "teacher") {
      router.push("/");
      return;
    }
    
    // Check if teacher data already exists
    const fetchTeacherData = async () => {
      try {
        const teacherDoc = await getDoc(doc(db, "teachers", user.uid));
        
        if (teacherDoc.exists()) {
          const data = teacherDoc.data();
          setFullName(data.name || "");
          setPhoneNumber(data.phoneNumber || "");
          if (data.avatarUrl) {
            setAvatarUrl(data.avatarUrl);
          }
        }
        
        setIsInitializing(false);
      } catch (error) {
        console.error("Error fetching teacher data:", error);
        setIsInitializing(false);
      }
    };
    
    fetchTeacherData();
  }, [user, userProfile, router]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push("/login");
      return;
    }
    
    if (!fullName || !phoneNumber) {
      setError("Please fill in all required fields");
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Create teacher profile document in Firestore
      await setDoc(doc(db, "teachers", user.uid), {
        name: fullName,
        email: user.email,
        phoneNumber,
        avatarUrl,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      
      // Navigate to next step
      router.push("/onboarding/teacher/step2");
    } catch (error: any) {
      console.error("Error in step 1:", error);
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
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">Create Your Teacher Profile</h1>
        <p className="mt-2 text-gray-600">Step 1 of 3: Personal Information</p>
      </div>
      
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Input Component */}
          <AvatarInput 
            userId={user?.uid || null}
            initialAvatarUrl={avatarUrl}
            onChange={(url) => {
              setAvatarUrl(url);
              if (url && url !== avatarUrl) {
                console.log("Onboarding avatar updated:", url);
              }
            }}
            variant="full"
            size="md"
            ref={avatarInputRef}
          />
          
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="John Doe"
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
                className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500 shadow-sm"
                disabled
              />
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="+91 1234567890"
                required
              />
              <p className="mt-1 text-xs text-gray-500">This will be shared with students only upon your approval</p>
            </div>
          </div>
          
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-md bg-blue-600 px-6 py-2 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Continue to Step 2"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 