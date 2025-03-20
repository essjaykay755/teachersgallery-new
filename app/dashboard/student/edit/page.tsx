"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DashboardShell } from "@/app/components/layout/dashboard-shell";
import withAuth from "@/lib/withAuth";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { ArrowLeft, Upload, User, CheckCircle, XCircle } from "lucide-react";

const classOptions = [
  "Pre-School", "Kindergarten",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
  "Class 11 Science", "Class 11 Commerce", "Class 11 Arts",
  "Class 12 Science", "Class 12 Commerce", "Class 12 Arts",
  "Undergraduate", "Postgraduate", "Professional Course", "Other"
];

function StudentEditProfilePage() {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [currentClass, setCurrentClass] = useState("");
  const [otherClass, setOtherClass] = useState("");
  const [school, setSchool] = useState("");
  const [interests, setInterests] = useState("");
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { user } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (!user) return;
      
      try {
        const studentDoc = await getDoc(doc(db, "students", user.uid));
        
        if (studentDoc.exists()) {
          const data = studentDoc.data();
          setFullName(data.fullName || "");
          setPhoneNumber(data.phoneNumber || "");
          
          if (data.currentClass) {
            if (classOptions.includes(data.currentClass)) {
              setCurrentClass(data.currentClass);
            } else {
              setCurrentClass("Other");
              setOtherClass(data.currentClass);
            }
          }
          
          setSchool(data.school || "");
          setInterests(data.interests || "");
          
          if (data.avatarUrl) {
            setAvatarPreview(data.avatarUrl);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching student profile:", error);
        setIsLoading(false);
      }
    };
    
    fetchStudentProfile();
  }, [user]);
  
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
      setError("You must be logged in to update your profile");
      return;
    }
    
    // Validate required fields
    if (!fullName.trim()) {
      setError("Full name is required");
      return;
    }
    
    if (currentClass === "Other" && !otherClass.trim()) {
      setError("Please specify your class");
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      let avatarUrl = avatarPreview;
      
      // Upload new avatar if selected
      if (avatarFile) {
        const avatarRef = ref(storage, `avatars/students/${user.uid}`);
        await uploadBytes(avatarRef, avatarFile);
        avatarUrl = await getDownloadURL(avatarRef);
      }
      
      // Prepare student data
      const studentData: {
        fullName: string;
        phoneNumber: string;
        currentClass: string;
        school: string;
        interests: string;
        updatedAt: number;
        avatarUrl?: string;
      } = {
        fullName,
        phoneNumber,
        currentClass: currentClass === "Other" ? otherClass : currentClass,
        school,
        interests,
        updatedAt: Date.now(),
      };
      
      if (avatarUrl) {
        studentData.avatarUrl = avatarUrl;
      }
      
      // Update Firestore
      await updateDoc(doc(db, "students", user.uid), studentData);
      
      setSuccessMessage("Profile updated successfully");
      
      // Clear success message after a few seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancel = () => {
    router.push("/dashboard/student");
  };
  
  if (isLoading) {
    return (
      <DashboardShell>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading your profile...</p>
        </div>
      </DashboardShell>
    );
  }
  
  return (
    <DashboardShell>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={handleCancel}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Edit Profile</h1>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Picture
              </label>
              <div className="flex items-center space-x-6">
                <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-gray-200">
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt="Profile preview"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600">
                      <User className="h-12 w-12" />
                    </div>
                  )}
                </div>
                
                <div>
                  <label
                    htmlFor="avatar-upload"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Change Photo
                  </label>
                  <input
                    id="avatar-upload"
                    name="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="sr-only"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    JPEG or PNG. Max 5MB.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
            
            {/* Education */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="currentClass" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Class *
                </label>
                <select
                  id="currentClass"
                  value={currentClass}
                  onChange={(e) => setCurrentClass(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                >
                  <option value="">Select your class</option>
                  {classOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              
              {currentClass === "Other" && (
                <div>
                  <label htmlFor="otherClass" className="block text-sm font-medium text-gray-700 mb-1">
                    Specify Class *
                  </label>
                  <input
                    id="otherClass"
                    type="text"
                    value={otherClass}
                    onChange={(e) => setOtherClass(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>
              )}
              
              <div>
                <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">
                  School/College
                </label>
                <input
                  id="school"
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Name of your school or college"
                />
              </div>
            </div>
            
            {/* Interests */}
            <div>
              <label htmlFor="interests" className="block text-sm font-medium text-gray-700 mb-1">
                Subjects of Interest
              </label>
              <textarea
                id="interests"
                rows={3}
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Subjects you're interested in learning"
              />
            </div>
            
            {/* Error/Success messages */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <XCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {successMessage && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">{successMessage}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Form Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}

export default withAuth(StudentEditProfilePage, {
  allowedUserTypes: ["student"],
  redirectTo: "/login",
}); 