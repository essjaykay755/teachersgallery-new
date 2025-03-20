"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { User, Phone, Upload } from "lucide-react";

export default function ParentOnboardingStep1() {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const { user, userProfile } = useAuth();
  const router = useRouter();
  
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
            setAvatarPreview(data.avatarUrl);
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
  
  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type is image
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPEG, PNG, etc.)");
      return;
    }
    
    // Validate file size is less than 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }
    
    setAvatarFile(file);
    setError(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push("/login");
      return;
    }
    
    // Validate inputs
    if (!fullName.trim()) {
      setError("Full name is required");
      return;
    }
    
    if (!phoneNumber.trim()) {
      setError("Phone number is required");
      return;
    }
    
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      let avatarUrl = avatarPreview;
      
      // Upload avatar if provided
      if (avatarFile) {
        const avatarRef = ref(storage, `avatars/${user.uid}`);
        await uploadBytes(avatarRef, avatarFile);
        avatarUrl = await getDownloadURL(avatarRef);
      }
      
      // Create or update parent profile document in Firestore
      await setDoc(
        doc(db, "parents", user.uid),
        {
          fullName,
          phoneNumber,
          avatarUrl,
          email: user.email,
          userId: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      
      // Navigate to next step
      router.push("/onboarding/parent/step2");
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
        <h1 className="text-2xl font-bold sm:text-3xl">Create Your Parent Profile</h1>
        <p className="mt-2 text-gray-600">Step 1 of 3: Personal Information</p>
      </div>
      
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <User className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Personal Details</h2>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2">
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
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    className="block w-full rounded-md border border-gray-300 pl-10 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    placeholder="10-digit number"
                    required
                    maxLength={10}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Your phone number will be visible to teachers you connect with
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <Upload className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Profile Picture</h2>
            </div>
            
            <div className="flex flex-col items-center justify-center sm:flex-row sm:items-start sm:space-x-6">
              <div className="relative h-32 w-32 overflow-hidden rounded-full mb-4 sm:mb-0 flex items-center justify-center bg-gray-100">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="Avatar preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <User className="h-16 w-16 text-gray-400" />
                )}
              </div>
              
              <div className="flex-1">
                <label
                  htmlFor="avatar"
                  className="flex w-full cursor-pointer flex-col items-center rounded-md border border-dashed border-gray-300 px-4 py-6 text-center hover:bg-gray-50"
                >
                  <Upload className="mx-auto h-10 w-10 text-gray-400" />
                  <span className="mt-2 block text-sm font-medium text-gray-700">
                    Click to upload a profile picture
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    JPG, PNG, GIF up to 5MB
                  </span>
                  <input
                    id="avatar"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </label>
                <p className="mt-2 text-xs text-gray-500">
                  A profile picture helps teachers recognize you and builds trust
                </p>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}
          
          <div className="flex justify-end pt-4">
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