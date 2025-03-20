"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BookOpen, X, Plus, Check } from "lucide-react";

// Common subjects that students might be interested in
const commonSubjects = [
  "Mathematics", "Physics", "Chemistry", "Biology", 
  "English", "Hindi", "History", "Geography", 
  "Computer Science", "Economics", "Business Studies",
  "Accountancy", "Political Science", "Philosophy",
  "Psychology", "Sociology", "Art", "Music"
];

export default function StudentOnboardingStep3() {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState("");
  const [filteredSubjects, setFilteredSubjects] = useState<string[]>([]);
  const [learningGoals, setLearningGoals] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
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
    
    // Check if student data already exists for step 3
    const fetchStudentData = async () => {
      try {
        const studentDoc = await getDoc(doc(db, "profiles", "students", user.uid));
        
        if (studentDoc.exists()) {
          const data = studentDoc.data();
          
          if (data.subjects && Array.isArray(data.subjects)) {
            setSelectedSubjects(data.subjects);
          }
          
          if (data.learningGoals) {
            setLearningGoals(data.learningGoals);
          }
          
          if (data.onboardingCompleted) {
            setIsCompleted(true);
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
  
  // Filter subjects based on input
  useEffect(() => {
    if (subjectInput.trim() === "") {
      setFilteredSubjects([]);
      return;
    }
    
    const filtered = commonSubjects.filter(
      (subject) => 
        subject.toLowerCase().includes(subjectInput.toLowerCase()) && 
        !selectedSubjects.includes(subject)
    );
    
    setFilteredSubjects(filtered);
  }, [subjectInput, selectedSubjects]);
  
  // Handle click outside of dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setFilteredSubjects([]);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const handleSubjectSelect = (subject: string) => {
    if (!selectedSubjects.includes(subject)) {
      setSelectedSubjects([...selectedSubjects, subject]);
      setSubjectInput("");
      setFilteredSubjects([]);
      
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };
  
  const handleRemoveSubject = (subject: string) => {
    setSelectedSubjects(selectedSubjects.filter((s) => s !== subject));
  };
  
  const handleAddCustomSubject = () => {
    if (
      subjectInput.trim() !== "" && 
      !selectedSubjects.includes(subjectInput.trim())
    ) {
      setSelectedSubjects([...selectedSubjects, subjectInput.trim()]);
      setSubjectInput("");
      setFilteredSubjects([]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push("/login");
      return;
    }
    
    if (selectedSubjects.length === 0) {
      setError("Please select at least one subject you want to learn");
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Update student profile document in Firestore with step 3 data
      await setDoc(
        doc(db, "profiles", "students", user.uid),
        {
          subjects: selectedSubjects,
          learningGoals: learningGoals,
          onboardingCompleted: true,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      
      setIsCompleted(true);
      
      // Navigate to dashboard or profile page
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error: any) {
      console.error("Error in step 3:", error);
      setError(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBackClick = () => {
    router.push("/onboarding/student/step2");
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-green-100 p-3">
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">Profile Complete!</h2>
          <p className="mt-2 text-gray-600">
            Redirecting you to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">Create Your Student Profile</h1>
        <p className="mt-2 text-gray-600">Step 3 of 3: Learning Preferences</p>
      </div>
      
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Subjects & Learning Goals</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Subjects You Want to Learn <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex flex-wrap gap-2">
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
                
                <div className="relative mt-2">
                  <div className="flex">
                    <input
                      ref={inputRef}
                      type="text"
                      value={subjectInput}
                      onChange={(e) => setSubjectInput(e.target.value)}
                      placeholder="Type to search or add subjects"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomSubject}
                      className="ml-2 rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {filteredSubjects.length > 0 && (
                    <div
                      ref={dropdownRef}
                      className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5"
                    >
                      {filteredSubjects.map((subject) => (
                        <div
                          key={subject}
                          onClick={() => handleSubjectSelect(subject)}
                          className="cursor-pointer px-4 py-2 hover:bg-blue-100"
                        >
                          {subject}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Select the subjects you're interested in learning
                </p>
              </div>
              
              <div>
                <label htmlFor="learningGoals" className="block text-sm font-medium text-gray-700">
                  Your Learning Goals
                </label>
                <textarea
                  id="learningGoals"
                  value={learningGoals}
                  onChange={(e) => setLearningGoals(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  placeholder="Describe what you hope to achieve with a tutor (e.g., improve grades, prepare for exams, deepen understanding of specific topics)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This helps teachers understand how they can best support your learning journey
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-6">
            <div className="inline-flex items-center justify-center rounded-full bg-blue-50 p-3">
              <div className="rounded-full bg-blue-100 p-2">
                <BookOpen className="h-6 w-6 text-blue-700" />
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              The subjects and goals you specify will help match you with the right teachers
              who specialize in the areas you want to learn.
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
              {isLoading ? "Saving..." : "Complete Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 