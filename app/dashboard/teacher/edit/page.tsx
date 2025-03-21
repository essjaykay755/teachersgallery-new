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
import { ArrowLeft, Upload, User, CheckCircle, XCircle, Plus, X } from "lucide-react";
import AvatarInput from "@/app/components/shared/avatar-input";

function TeacherEditProfilePage() {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [professionalSummary, setProfessionalSummary] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  
  // Subjects
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState("");
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  
  // Qualifications
  const [qualifications, setQualifications] = useState<
    { degree: string; institution: string; year: string }[]
  >([{ degree: "", institution: "", year: "" }]);
  
  // Teaching details
  const [location, setLocation] = useState("");
  const [areasServed, setAreasServed] = useState("");
  const [teachingMode, setTeachingMode] = useState<string[]>([]);
  const [feeRange, setFeeRange] = useState({ min: "", max: "" });
  const [isVisible, setIsVisible] = useState(true);
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
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
          
          // Basic info
          setFullName(data.name || "");
          setPhoneNumber(data.phoneNumber || "");
          
          // Professional info
          setProfessionalSummary(data.professionalSummary || "");
          setYearsOfExperience(data.yearsOfExperience || "");
          
          // Subjects
          if (data.subjects && Array.isArray(data.subjects)) {
            setSelectedSubjects(data.subjects);
          } else if (data.subject) {
            setSelectedSubjects([data.subject]);
          }
          
          // Qualifications
          if (data.qualifications) {
            if (Array.isArray(data.qualifications)) {
              // If qualifications is an array of objects with degree, institution, year
              if (data.qualifications.length > 0 && typeof data.qualifications[0] === 'object') {
                setQualifications(data.qualifications);
              } else {
                // If it's an array of strings, convert to our format
                setQualifications(
                  data.qualifications.map((q: string) => ({ 
                    degree: q, 
                    institution: "", 
                    year: "" 
                  }))
                );
              }
            } else if (typeof data.qualifications === 'string') {
              // If it's a string, add as a single qualification
              setQualifications([{ 
                degree: data.qualifications, 
                institution: "", 
                year: "" 
              }]);
            }
          }
          
          // Teaching details
          setLocation(data.location || "");
          setAreasServed(data.areasServed || "");
          
          // Check both field names for teaching mode
          if (data.teachingModes && Array.isArray(data.teachingModes)) {
            setTeachingMode(data.teachingModes);
          } else if (data.teachingMode && Array.isArray(data.teachingMode)) {
            setTeachingMode(data.teachingMode);
          }
          
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
            setAvatarUrl(data.avatarUrl);
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
  
  const handleTeachingModeChange = (mode: string) => {
    if (teachingMode.includes(mode)) {
      setTeachingMode(teachingMode.filter((m) => m !== mode));
    } else {
      setTeachingMode([...teachingMode, mode]);
    }
  };
  
  const handleAddQualification = () => {
    setQualifications([
      ...qualifications,
      { degree: "", institution: "", year: "" },
    ]);
  };
  
  const handleRemoveQualification = (index: number) => {
    if (qualifications.length === 1) return;
    
    setQualifications(qualifications.filter((_, i) => i !== index));
  };
  
  const handleQualificationChange = (
    index: number,
    field: "degree" | "institution" | "year",
    value: string
  ) => {
    const newQualifications = [...qualifications];
    newQualifications[index][field] = value;
    setQualifications(newQualifications);
  };
  
  const handleSubjectSelect = (subject: string) => {
    if (!selectedSubjects.includes(subject)) {
      setSelectedSubjects([...selectedSubjects, subject]);
      setSubjectInput("");
      setShowSubjectDropdown(false);
    }
  };
  
  const handleRemoveSubject = (subject: string) => {
    setSelectedSubjects(selectedSubjects.filter((s) => s !== subject));
  };
  
  const handleAddCustomSubject = () => {
    if (subjectInput.trim() !== "" && !selectedSubjects.includes(subjectInput.trim())) {
      setSelectedSubjects([...selectedSubjects, subjectInput.trim()]);
      setSubjectInput("");
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
    
    if (selectedSubjects.length === 0) {
      setError("Please select at least one subject");
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
      
      // avatarUrl is already in state, so no need to reassign or upload
      
      // Prepare teacher data
      const teacherData: any = {
        name: fullName,
        phoneNumber,
        
        // Professional info
        professionalSummary,
        yearsOfExperience,
        subjects: selectedSubjects,
        subject: selectedSubjects[0], // For backward compatibility
        
        // Only include non-empty qualifications
        qualifications: qualifications.filter(
          (q) => q.degree || q.institution || q.year
        ),
        
        // Teaching details
        location,
        areasServed,
        teachingMode, // For backward compatibility
        teachingModes: teachingMode,
        
        // Fee information
        feeRange: {
          min: parseInt(feeRange.min) || 0,
          max: parseInt(feeRange.max) || 0
        },
        feesPerHour: parseInt(feeRange.min) || 0,
        
        // Visibility
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
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Avatar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Picture
              </label>
              <AvatarInput 
                userId={user?.uid || null}
                initialAvatarUrl={avatarUrl}
                onChange={(url) => {
                  setAvatarUrl(url);
                  if (url && url !== avatarUrl) {
                    console.log("Avatar updated:", url);
                  }
                }}
                variant="compact"
                size="md"
              />
            </div>
            
            {/* Section: Personal Information */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
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
              </div>
            </div>
            
            {/* Section: Professional Information */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h2>
              
              {/* Years of Experience */}
              <div className="mb-6">
                <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 mb-1">
                  Years of Experience *
                </label>
                <select
                  id="yearsOfExperience"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                >
                  <option value="">Select Experience</option>
                  <option value="Less than 1 year">Less than 1 year</option>
                  <option value="1-2 years">1-2 years</option>
                  <option value="3-5 years">3-5 years</option>
                  <option value="6-10 years">6-10 years</option>
                  <option value="More than 10 years">More than 10 years</option>
                </select>
              </div>
              
              {/* Professional Summary */}
              <div className="mb-6">
                <label htmlFor="professionalSummary" className="block text-sm font-medium text-gray-700 mb-1">
                  Professional Summary *
                </label>
                <textarea
                  id="professionalSummary"
                  rows={4}
                  value={professionalSummary}
                  onChange={(e) => setProfessionalSummary(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Describe your teaching experience and approach"
                  required
                />
              </div>
              
              {/* Subjects */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subjects You Teach *
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedSubjects.map((subject) => (
                    <div
                      key={subject}
                      className="flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                    >
                      {subject}
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(subject)}
                        className="ml-1 rounded-full p-1 hover:bg-blue-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={subjectInput}
                    onChange={(e) => {
                      setSubjectInput(e.target.value);
                      setShowSubjectDropdown(true);
                    }}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Add a subject you teach"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSubject}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Qualifications */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Qualifications
                  </label>
                  <button
                    type="button"
                    onClick={handleAddQualification}
                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </button>
                </div>
                
                {qualifications.map((qualification, index) => (
                  <div key={index} className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-4 p-3 border border-gray-200 rounded-md">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Degree/Certificate
                      </label>
                      <input
                        type="text"
                        value={qualification.degree}
                        onChange={(e) =>
                          handleQualificationChange(index, "degree", e.target.value)
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="e.g., B.Sc., M.Ed."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Institution
                      </label>
                      <input
                        type="text"
                        value={qualification.institution}
                        onChange={(e) =>
                          handleQualificationChange(index, "institution", e.target.value)
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="University/College name"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-grow">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Year
                        </label>
                        <input
                          type="text"
                          value={qualification.year}
                          onChange={(e) =>
                            handleQualificationChange(index, "year", e.target.value)
                          }
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="e.g., 2020"
                        />
                      </div>
                      
                      {qualifications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQualification(index)}
                          className="mb-1 p-2 text-red-600 hover:text-red-800 focus:outline-none"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Section: Location & Teaching Details */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Location & Teaching Details</h2>
              
              {/* Location */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-6">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="City, State"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="areasServed" className="block text-sm font-medium text-gray-700 mb-1">
                    Areas Served *
                  </label>
                  <input
                    id="areasServed"
                    type="text"
                    value={areasServed}
                    onChange={(e) => setAreasServed(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Neighborhoods, districts, etc."
                    required
                  />
                </div>
              </div>
              
              {/* Teaching Mode */}
              <div className="mb-6">
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
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fee Range (₹ per hour) *
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
                        required
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
                        required
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
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}

export default withAuth(TeacherEditProfilePage, {
  allowedUserTypes: ["teacher"],
  redirectTo: "/login",
}); 