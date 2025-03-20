"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CheckCircle, MapPin } from "lucide-react";

export default function TeacherOnboardingStep3() {
  // Location
  const [location, setLocation] = useState("");
  const [areasServed, setAreasServed] = useState("");
  
  // Teaching Details
  const [teachingMode, setTeachingMode] = useState<string[]>([]);
  const [feeRange, setFeeRange] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const { user, userProfile, completeOnboarding } = useAuth();
  const router = useRouter();
  
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
    
    // Check if teacher data already exists for step 3
    const fetchTeacherData = async () => {
      try {
        const teacherDoc = await getDoc(doc(db, "teachers", user.uid));
        
        if (teacherDoc.exists()) {
          const data = teacherDoc.data();
          
          if (data.teachingModes && Array.isArray(data.teachingModes)) {
            setTeachingMode(data.teachingModes);
          }
          
          if (data.educationLevels && Array.isArray(data.educationLevels)) {
            // Assuming educationLevels is not used in the current component
          }
          
          if (data.feesPerHour) setFeeRange(data.feesPerHour.toString());
          if (data.location) setLocation(data.location);
          if (data.areasServed) setAreasServed(data.areasServed);
          if (data.isVisible !== undefined) setIsVisible(data.isVisible);
          if (data.onboardingCompleted) setIsCompleted(true);
        }
        
        setIsInitializing(false);
      } catch (error) {
        console.error("Error fetching teacher data:", error);
        setIsInitializing(false);
      }
    };
    
    fetchTeacherData();
  }, [user, userProfile, router]);
  
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
      router.push("/login");
      return;
    }
    
    if (!location || !areasServed || teachingMode.length === 0 || !feeRange) {
      setError("Please fill in all required fields");
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Update teacher profile document in Firestore with step 3 data
      await setDoc(
        doc(db, "teachers", user.uid),
        {
          teachingModes: teachingMode,
          feesPerHour: parseInt(feeRange) || 0,
          location,
          areasServed,
          isVisible,
          onboardingCompleted: true,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      
      // Mark onboarding as completed using the new method
      await completeOnboarding();
      
      setIsCompleted(true);
    } catch (error: any) {
      console.error("Error in step 3:", error);
      setError(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBackClick = () => {
    router.push("/onboarding/teacher/step2");
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
  
  if (isCompleted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Profile Created Successfully!</h1>
          <p className="text-gray-600 mb-6">
            Your teacher profile has been set up and is now live on the platform.
            You will be redirected to your dashboard shortly.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">Create Your Teacher Profile</h1>
        <p className="mt-2 text-gray-600">Step 3 of 3: Teaching Details</p>
      </div>
      
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Location Section */}
          <div>
            <h2 className="mb-4 text-xl font-semibold">Location & Areas Covered</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Your Location <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    placeholder="City, State"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Enter your city and state, e.g. "Mumbai, Maharashtra"
                </p>
              </div>
              
              <div>
                <label htmlFor="areasServed" className="block text-sm font-medium text-gray-700">
                  Areas Covered <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="areasServed"
                  value={areasServed}
                  onChange={(e) => setAreasServed(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  placeholder="List areas where you can teach (e.g. Andheri, Bandra, etc.)"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Specify neighborhoods or areas where you can travel to teach
                </p>
              </div>
            </div>
          </div>
          
          {/* Teaching Mode Section */}
          <div>
            <h2 className="mb-4 text-xl font-semibold">Teaching Preferences</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode of Teaching <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="relative flex items-start">
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
                      Online Teaching
                    </label>
                    <p className="text-gray-500">Via video calls</p>
                  </div>
                </div>
                
                <div className="relative flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      id="student-home"
                      type="checkbox"
                      checked={teachingMode.includes("Student's Home")}
                      onChange={() => handleTeachingModeChange("Student's Home")}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="student-home" className="font-medium text-gray-700">
                      Student's Home
                    </label>
                    <p className="text-gray-500">You travel to student</p>
                  </div>
                </div>
                
                <div className="relative flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      id="teacher-home"
                      type="checkbox"
                      checked={teachingMode.includes("Teacher's Home")}
                      onChange={() => handleTeachingModeChange("Teacher's Home")}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="teacher-home" className="font-medium text-gray-700">
                      Your Home
                    </label>
                    <p className="text-gray-500">Student comes to you</p>
                  </div>
                </div>
              </div>
              {teachingMode.length === 0 && (
                <p className="mt-2 text-xs text-red-500">
                  Please select at least one teaching mode
                </p>
              )}
            </div>
            
            <div className="mt-6">
              <label htmlFor="feeRange" className="block text-sm font-medium text-gray-700">
                Your Fee Range (per hour) <span className="text-red-500">*</span>
              </label>
              <select
                id="feeRange"
                value={feeRange}
                onChange={(e) => setFeeRange(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                required
              >
                <option value="">Select Fee Range</option>
                <option value="₹200 - ₹300">₹200 - ₹300</option>
                <option value="₹300 - ₹500">₹300 - ₹500</option>
                <option value="₹500 - ₹800">₹500 - ₹800</option>
                <option value="₹800 - ₹1,200">₹800 - ₹1,200</option>
                <option value="₹1,200 - ₹2,000">₹1,200 - ₹2,000</option>
                <option value="₹2,000+">₹2,000+</option>
              </select>
            </div>
          </div>
          
          {/* Profile Visibility */}
          <div>
            <h2 className="mb-4 text-xl font-semibold">Profile Settings</h2>
            <div className="relative flex items-start">
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
          
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}
          
          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={handleBackClick}
              className="rounded-md bg-white px-6 py-2 text-sm font-medium text-gray-700 shadow-sm border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Back
            </button>
            
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-md bg-blue-600 px-6 py-2 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Complete Registration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 