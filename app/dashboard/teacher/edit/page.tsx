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
import { ArrowLeft, Upload } from "lucide-react";

function TeacherEditProfilePage() {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [subject, setSubject] = useState("");
  const [experience, setExperience] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [location, setLocation] = useState("");
  const [areasServed, setAreasServed] = useState("");
  const [teachingMode, setTeachingMode] = useState<string[]>([]);
  const [feeRange, setFeeRange] = useState({ min: "", max: "" });
  const [isVisible, setIsVisible] = useState(true);
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { user } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    const fetchTeacherProfile = async () => {
      if (!user) return;
      
      try {
        const teacherDoc = await getDoc(doc(db, "teachers", user.uid));
        
        if (teacherDoc.exists()) {
          const data = teacherDoc.data();
          console.log("Raw teacher data from Firestore:", data);
          
          setFullName(data.name || "");
          setPhoneNumber(data.phoneNumber || "");
          
          // Check both field names for subjects
          setSubject(data.subject || (data.subjects && data.subjects.length > 0 ? data.subjects[0] : ""));
          
          // Check both field names for experience
          setExperience(data.experience || data.yearsOfExperience || "");
          
          // Handle qualifications as string or array
          if (data.qualifications) {
            if (typeof data.qualifications === 'string') {
              setQualifications(data.qualifications);
            } else if (Array.isArray(data.qualifications)) {
              // Convert array to string format for display
              setQualifications(
                data.qualifications
                  .map(q => {
                    if (typeof q === 'string') return q;
                    return `${q.degree || ''} from ${q.institution || ''} (${q.year || ''})`;
                  })
                  .join('\n')
              );
            }
          }
          
          setLocation(data.location || "");
          setAreasServed(data.areasServed || "");
          
          // Check both field names for teaching mode
          setTeachingMode(
            data.teachingMode || 
            data.teachingModes || 
            []
          );
          
          // Check both field names for fees
          if (data.feesPerHour !== undefined) {
            setFeeRange({
              min: data.feesPerHour.toString(),
              max: data.feesPerHour.toString()
            });
          } else if (data.feeRange) {
            setFeeRange({
              min: data.feeRange.min?.toString() || "",
              max: data.feeRange.max?.toString() || ""
            });
          }
          
          setIsVisible(data.isVisible === undefined ? true : data.isVisible);
          
          if (data.avatarUrl) {
            setAvatarPreview(data.avatarUrl);
          }
        }
      } catch (error) {
        console.error("Error fetching teacher profile:", error);
        setError("Failed to load your profile data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeacherProfile();
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
  
  const handleTeachingModeChange = (mode: string) => {
    if (teachingMode.includes(mode)) {
      setTeachingMode(teachingMode.filter((m) => m !== mode));
    } else {
      setTeachingMode([...teachingMode, mode]);
    }
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
    
    if (!phoneNumber.trim()) {
      setError("Phone number is required");
      return;
    }
    
    if (!subject.trim()) {
      setError("Subject is required");
      return;
    }
    
    if (teachingMode.length === 0) {
      setError("Please select at least one teaching mode");
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      let avatarUrl = avatarPreview;
      
      // Upload new avatar if selected
      if (avatarFile) {
        const avatarRef = ref(storage, `avatars/teachers/${user.uid}/${avatarFile.name}`);
        await uploadBytes(avatarRef, avatarFile);
        avatarUrl = await getDownloadURL(avatarRef);
      }
      
      // Prepare teacher data
      const teacherData: {
        name: string;
        phoneNumber: string;
        subject: string;
        subjects?: string[];
        experience: string;
        yearsOfExperience?: string;
        qualifications: string;
        location: string;
        areasServed: string;
        teachingMode: string[];
        teachingModes?: string[];
        feeRange: { min: number; max: number };
        feesPerHour?: number;
        isVisible: boolean;
        updatedAt: number;
        avatarUrl?: string;
      } = {
        name: fullName,
        phoneNumber,
        subject, // Keep for backward compatibility
        subjects: [subject], // Add as array for newer format
        experience, // Keep for backward compatibility
        yearsOfExperience: experience, // Add for newer format
        qualifications,
        location,
        areasServed,
        teachingMode, // Keep for backward compatibility
        teachingModes: teachingMode, // Add for newer format
        feeRange: {
          min: parseInt(feeRange.min) || 0,
          max: parseInt(feeRange.max) || 0
        },
        feesPerHour: parseInt(feeRange.min) || 0, // Add for newer format
        isVisible,
        updatedAt: Date.now(),
      };
      
      if (avatarUrl) {
        teacherData.avatarUrl = avatarUrl;
      }
      
      // Update Firestore
      await updateDoc(doc(db, "teachers", user.uid), teacherData);
      
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
    router.push("/dashboard/teacher");
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
                  Phone Number *
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
                  Years of Experience
                </label>
                <input
                  id="experience"
                  type="number"
                  min="0"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
            
            {/* Qualifications */}
            <div>
              <label htmlFor="qualifications" className="block text-sm font-medium text-gray-700 mb-1">
                Qualifications
              </label>
              <textarea
                id="qualifications"
                rows={3}
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Degrees, certifications, etc."
              />
            </div>
            
            {/* Location */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="City, State"
                />
              </div>
              
              <div>
                <label htmlFor="areasServed" className="block text-sm font-medium text-gray-700 mb-1">
                  Areas Served
                </label>
                <input
                  id="areasServed"
                  type="text"
                  value={areasServed}
                  onChange={(e) => setAreasServed(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Neighborhoods, districts, etc."
                />
              </div>
            </div>
            
            {/* Teaching Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teaching Mode *
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      id="online"
                      type="checkbox"
                      checked={teachingMode.includes("Online")}
                      onChange={() => handleTeachingModeChange("Online")}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="online" className="font-medium text-gray-700">
                      Online
                    </label>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      id="offline"
                      type="checkbox"
                      checked={teachingMode.includes("Offline")}
                      onChange={() => handleTeachingModeChange("Offline")}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="offline" className="font-medium text-gray-700">
                      Offline
                    </label>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      id="hybrid"
                      type="checkbox"
                      checked={teachingMode.includes("Hybrid")}
                      onChange={() => handleTeachingModeChange("Hybrid")}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="hybrid" className="font-medium text-gray-700">
                      Hybrid
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Fee Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fee Range (₹ per hour)
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="minFee" className="sr-only">
                    Minimum Fee
                  </label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 sm:text-sm">₹</span>
                    </div>
                    <input
                      id="minFee"
                      type="number"
                      min="0"
                      value={feeRange.min}
                      onChange={(e) => setFeeRange({ ...feeRange, min: e.target.value })}
                      className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Min"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-500 sm:text-sm">/hr</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="maxFee" className="sr-only">
                    Maximum Fee
                  </label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 sm:text-sm">₹</span>
                    </div>
                    <input
                      id="maxFee"
                      type="number"
                      min="0"
                      value={feeRange.max}
                      onChange={(e) => setFeeRange({ ...feeRange, max: e.target.value })}
                      className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Max"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-500 sm:text-sm">/hr</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Profile Visibility */}
            <div>
              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    id="visibility"
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => setIsVisible(!isVisible)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="visibility" className="font-medium text-gray-700">
                    Make my profile visible in search results
                  </label>
                  <p className="text-gray-500">
                    When enabled, students and parents can find and contact you
                  </p>
                </div>
              </div>
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

import { User, CheckCircle, XCircle } from "lucide-react";

export default withAuth(TeacherEditProfilePage, {
  allowedUserTypes: ["teacher"],
  redirectTo: "/login",
}); 