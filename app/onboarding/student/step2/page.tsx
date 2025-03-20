"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GraduationCap } from "lucide-react";

const classOptions = [
  "Pre-School", "Kindergarten",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
  "Class 11 Science", "Class 11 Commerce", "Class 11 Arts",
  "Class 12 Science", "Class 12 Commerce", "Class 12 Arts",
  "Undergraduate", "Postgraduate", "Professional Course", "Other"
];

export default function StudentOnboardingStep2() {
  const [currentClass, setCurrentClass] = useState("");
  const [otherClass, setOtherClass] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const { user, userProfile } = useAuth();
  const router = useRouter();
  
  // Check if user is authenticated and is a student
  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    
    if (userProfile && userProfile.userType !== "student") {
      router.push("/");
      return;
    }
    
    // Check if student data already exists for step 2
    const fetchStudentData = async () => {
      try {
        const studentDoc = await getDoc(doc(db, "students", user.uid));
        
        if (studentDoc.exists()) {
          const data = studentDoc.data();
          
          if (data.currentClass) {
            if (classOptions.includes(data.currentClass)) {
              setCurrentClass(data.currentClass);
            } else {
              setCurrentClass("Other");
              setOtherClass(data.currentClass);
            }
          }
        }
        
        setIsInitializing(false);
      } catch (error) {
        console.error("Error fetching student data:", error);
        setIsInitializing(false);
      }
    };
    
    fetchStudentData();
  }, [user, userProfile, router]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push("/login");
      return;
    }
    
    const finalClass = currentClass === "Other" ? otherClass : currentClass;
    
    if (!finalClass) {
      setError("Please select your current class");
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Update student profile document in Firestore with step 2 data
      await setDoc(
        doc(db, "students", user.uid),
        {
          currentClass: finalClass,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      
      // Navigate to next step
      router.push("/onboarding/student/step3");
    } catch (error: any) {
      console.error("Error in step 2:", error);
      setError(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBackClick = () => {
    router.push("/onboarding/student/step1");
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
        <h1 className="text-2xl font-bold sm:text-3xl">Create Your Student Profile</h1>
        <p className="mt-2 text-gray-600">Step 2 of 3: Education Details</p>
      </div>
      
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <GraduationCap className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Your Current Class</h2>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="currentClass" className="block text-sm font-medium text-gray-700">
                  Current Class/Grade <span className="text-red-500">*</span>
                </label>
                <select
                  id="currentClass"
                  value={currentClass}
                  onChange={(e) => setCurrentClass(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  required
                >
                  <option value="">Select Your Class</option>
                  {classOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  This helps teachers understand your educational level
                </p>
              </div>
              
              {currentClass === "Other" && (
                <div>
                  <label htmlFor="otherClass" className="block text-sm font-medium text-gray-700">
                    Specify Your Class/Course <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="otherClass"
                    type="text"
                    value={otherClass}
                    onChange={(e) => setOtherClass(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    placeholder="Enter your class or course name"
                    required
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="text-center mt-6">
            <div className="inline-flex items-center justify-center rounded-full bg-blue-50 p-3">
              <div className="rounded-full bg-blue-100 p-2">
                <GraduationCap className="h-6 w-6 text-blue-700" />
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Teachers will use this information to tailor their approach to your educational needs.
              It helps them understand the curriculum and complexity level suitable for you.
            </p>
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
              {isLoading ? "Saving..." : "Continue to Step 3"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 