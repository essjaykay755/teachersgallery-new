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
import { ArrowLeft, Upload, User, CheckCircle, XCircle, Plus, Trash2, X } from "lucide-react";
import AvatarInput from "@/app/components/shared/avatar-input";

const classOptions = [
  "Pre-School", "Kindergarten",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
  "Class 11 Science", "Class 11 Commerce", "Class 11 Arts",
  "Class 12 Science", "Class 12 Commerce", "Class 12 Arts",
  "Undergraduate", "Postgraduate", "Other"
];

type ChildInfo = {
  id: string;
  name: string;
  age: string;
  currentClass: string;
  otherClass?: string;
};

function ParentEditProfilePage() {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [childrenAges, setChildrenAges] = useState("");
  const [location, setLocation] = useState("");
  const [areasServed, setAreasServed] = useState("");
  
  // Subjects
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState("");
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  
  // Requirements
  const [requirements, setRequirements] = useState("");
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { user } = useAuth();
  const router = useRouter();
  
  // Define common subjects to filter
  const commonSubjects = [
    "Mathematics", "English", "Science", "Physics", "Chemistry", "Biology",
    "History", "Geography", "Computer Science", "Economics", "Business Studies",
    "Accounting", "Psychology", "Sociology", "Political Science", "Hindi",
    "French", "Spanish", "German", "Music", "Art", "Physical Education"
  ];

  // Filter subjects based on input
  const filteredSubjects = commonSubjects.filter(
    (subject) =>
      subject.toLowerCase().includes(subjectInput.toLowerCase()) &&
      !selectedSubjects.includes(subject)
  );
  
  useEffect(() => {
    const fetchParentProfile = async () => {
      if (!user) return;
      
      try {
        const parentDoc = await getDoc(doc(db, "parents", user.uid));
        
        if (parentDoc.exists()) {
          const data = parentDoc.data();
          
          // Basic info
          setFullName(data.name || "");
          setPhoneNumber(data.phoneNumber || "");
          
          // Children info
          setChildrenAges(data.childrenAges || "");
          
          // Location info
          setLocation(data.location || "");
          setAreasServed(data.areasServed || "");
          
          // Subjects
          if (data.subjects && Array.isArray(data.subjects)) {
            setSelectedSubjects(data.subjects);
          }
          
          // Requirements
          setRequirements(data.requirements || "");
          
          if (data.avatarUrl) {
            setAvatarUrl(data.avatarUrl);
          }
        }
      } catch (error) {
        console.error("Error fetching parent profile:", error);
        setError("Failed to load your profile data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchParentProfile();
  }, [user]);
  
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
    
    if (!childrenAges.trim()) {
      setError("Children's ages are required");
      return;
    }
    
    if (!location.trim()) {
      setError("Location is required");
      return;
    }
    
    if (selectedSubjects.length === 0) {
      setError("Please select at least one subject");
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      // Prepare parent data
      const parentData: any = {
        name: fullName,
        phoneNumber,
        
        // Children info
        childrenAges,
        
        // Location info
        location,
        areasServed,
        
        // Requirements
        subjects: selectedSubjects,
        requirements,
        
        updatedAt: Date.now(),
      };
      
      // Add avatarUrl to the parent data
      parentData.avatarUrl = avatarUrl;
      
      // Update Firestore
      await updateDoc(doc(db, "parents", user.uid), parentData);
      
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
    router.push("/dashboard/parent");
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
                onChange={async (url) => {
                  if (url && url !== avatarUrl) {
                    console.log("Avatar updated:", url);
                    setAvatarUrl(url);
                    
                    // Save the updated avatar URL immediately
                    if (user) {
                      try {
                        await updateDoc(doc(db, "parents", user.uid), {
                          avatarUrl: url,
                          updatedAt: Date.now(),
                        });
                        console.log("Avatar saved to Firestore");
                      } catch (error) {
                        console.error("Error saving avatar:", error);
                      }
                    }
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
            
            {/* Section: Children & Location Information */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Family & Location Information</h2>
              
              {/* Children Ages */}
              <div className="mb-6">
                <label htmlFor="childrenAges" className="block text-sm font-medium text-gray-700 mb-1">
                  Children's Ages *
                </label>
                <input
                  id="childrenAges"
                  type="text"
                  value={childrenAges}
                  onChange={(e) => setChildrenAges(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., 8, 12, 15"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Separate multiple ages with commas</p>
              </div>
              
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
                    Areas (where you want a teacher)
                  </label>
                  <input
                    id="areasServed"
                    type="text"
                    value={areasServed}
                    onChange={(e) => setAreasServed(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Neighborhoods, localities"
                  />
                </div>
              </div>
            </div>
            
            {/* Section: Teaching Requirements */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Teaching Requirements</h2>
              
              {/* Subjects */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subjects Required *
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
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      value={subjectInput}
                      onChange={(e) => {
                        setSubjectInput(e.target.value);
                        setShowSubjectDropdown(true);
                      }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Add a subject your child needs to learn"
                    />
                    {showSubjectDropdown && subjectInput.length > 0 && (
                      <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {filteredSubjects.length > 0 ? (
                          filteredSubjects.map((subject) => (
                            <div
                              key={subject}
                              onClick={() => handleSubjectSelect(subject)}
                              className="relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-blue-100"
                            >
                              {subject}
                            </div>
                          ))
                        ) : (
                          <div className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-500">
                            No matching subjects
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomSubject}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Requirements */}
              <div>
                <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Requirements
                </label>
                <textarea
                  id="requirements"
                  rows={4}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Any specific requirements for the teacher, teaching style, schedule preferences, etc."
                />
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

export default withAuth(ParentEditProfilePage, {
  allowedUserTypes: ["parent"],
  redirectTo: "/login",
}); 