"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Users, Plus, Trash2 } from "lucide-react";

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

export default function ParentOnboardingStep2() {
  const [children, setChildren] = useState<ChildInfo[]>([]);
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
    
    // Check if parent data already exists for step 2
    const fetchParentData = async () => {
      try {
        const parentDoc = await getDoc(doc(db, "parents", user.uid));
        
        if (parentDoc.exists()) {
          const data = parentDoc.data();
          
          if (data.children && Array.isArray(data.children)) {
            setChildren(data.children);
          } else {
            // Add one empty child form by default
            addChild();
          }
        } else {
          // Add one empty child form by default
          addChild();
        }
        
        setIsInitializing(false);
      } catch (error) {
        console.error("Error fetching parent data:", error);
        setIsInitializing(false);
        
        // Add one empty child form by default
        addChild();
      }
    };
    
    fetchParentData();
  }, [user, userProfile, router]);
  
  const addChild = () => {
    const newChild: ChildInfo = {
      id: Date.now().toString(),
      name: "",
      age: "",
      currentClass: "",
    };
    
    setChildren([...children, newChild]);
  };
  
  const removeChild = (id: string) => {
    if (children.length <= 1) {
      setError("You need to provide information for at least one child");
      return;
    }
    
    setChildren(children.filter((child) => child.id !== id));
  };
  
  const updateChild = (id: string, field: keyof ChildInfo, value: string) => {
    setChildren(
      children.map((child) => {
        if (child.id === id) {
          if (field === "currentClass" && value === "Other") {
            return { ...child, [field]: value, otherClass: "" };
          } else if (field === "currentClass" && child.otherClass) {
            const { otherClass, ...rest } = child;
            return { ...rest, [field]: value };
          } else {
            return { ...child, [field]: value };
          }
        }
        return child;
      })
    );
  };
  
  const validateChildren = () => {
    // Check if all required fields are filled
    for (const child of children) {
      if (!child.name.trim()) {
        setError("All children must have a name");
        return false;
      }
      
      if (!child.age.trim()) {
        setError("All children must have an age");
        return false;
      }
      
      if (!child.currentClass) {
        setError("Please select a class for each child");
        return false;
      }
      
      if (child.currentClass === "Other" && (!child.otherClass || !child.otherClass.trim())) {
        setError("Please specify the class/course for each child");
        return false;
      }
    }
    
    setError(null);
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push("/login");
      return;
    }
    
    if (!validateChildren()) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Prepare children data for storage
      const processedChildren = children.map((child) => {
        const finalClass = child.currentClass === "Other" && child.otherClass 
          ? child.otherClass 
          : child.currentClass;
          
        const { otherClass, ...rest } = child;
        return {
          ...rest,
          currentClass: finalClass,
        };
      });
      
      // Update parent profile document in Firestore with step 2 data
      await setDoc(
        doc(db, "parents", user.uid),
        {
          children: processedChildren,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      
      // Navigate to next step
      router.push("/onboarding/parent/step3");
    } catch (error: any) {
      console.error("Error in step 2:", error);
      setError(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBackClick = () => {
    router.push("/onboarding/parent/step1");
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
        <p className="mt-2 text-gray-600">Step 2 of 3: Child Information</p>
      </div>
      
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold">Child Information</h2>
              </div>
              
              <button
                type="button"
                onClick={addChild}
                className="inline-flex items-center rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Another Child
              </button>
            </div>
            
            <div className="space-y-6">
              {children.map((child, index) => (
                <div key={child.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Child {index + 1}</h3>
                    
                    <button
                      type="button"
                      onClick={() => removeChild(child.id)}
                      className="inline-flex items-center rounded-full p-1 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor={`name-${child.id}`} className="block text-sm font-medium text-gray-700">
                        Child's Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id={`name-${child.id}`}
                        type="text"
                        value={child.name}
                        onChange={(e) => updateChild(child.id, "name", e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        placeholder="Enter child's name"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor={`age-${child.id}`} className="block text-sm font-medium text-gray-700">
                        Age <span className="text-red-500">*</span>
                      </label>
                      <input
                        id={`age-${child.id}`}
                        type="number"
                        min="1"
                        max="25"
                        value={child.age}
                        onChange={(e) => updateChild(child.id, "age", e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        placeholder="Enter age"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor={`class-${child.id}`} className="block text-sm font-medium text-gray-700">
                        Current Class/Grade <span className="text-red-500">*</span>
                      </label>
                      <select
                        id={`class-${child.id}`}
                        value={child.currentClass}
                        onChange={(e) => updateChild(child.id, "currentClass", e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Class</option>
                        {classOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {child.currentClass === "Other" && (
                      <div>
                        <label htmlFor={`otherClass-${child.id}`} className="block text-sm font-medium text-gray-700">
                          Specify Class/Course <span className="text-red-500">*</span>
                        </label>
                        <input
                          id={`otherClass-${child.id}`}
                          type="text"
                          value={child.otherClass || ""}
                          onChange={(e) => updateChild(child.id, "otherClass", e.target.value)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          placeholder="Enter class or course"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center mt-6">
            <div className="inline-flex items-center justify-center rounded-full bg-blue-50 p-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Users className="h-6 w-6 text-blue-700" />
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              This information helps teachers understand your children's educational needs
              and tailor their teaching approach accordingly.
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