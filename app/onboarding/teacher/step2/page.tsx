"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BookOpen, Plus, X } from "lucide-react";

const subjectOptions = [
  "Mathematics", "Physics", "Chemistry", "Biology", "English",
  "Hindi", "History", "Geography", "Computer Science", "Economics",
  "Business Studies", "Accountancy", "Political Science", "Psychology",
  "Sociology", "Music", "Art", "Physical Education", "Foreign Languages",
  "Engineering", "Medicine", "Law", "Commerce", "Science",
  "Humanities", "Test Preparation"
];

export default function TeacherOnboardingStep2() {
  // Experience
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [professionalSummary, setProfessionalSummary] = useState("");
  
  // Subjects
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState("");
  const [filteredSubjects, setFilteredSubjects] = useState<string[]>([]);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  
  // Qualifications
  const [qualifications, setQualifications] = useState<
    { degree: string; institution: string; year: string }[]
  >([{ degree: "", institution: "", year: "" }]);
  
  // Work History
  const [workHistory, setWorkHistory] = useState<
    { position: string; organization: string; startDate: string; endDate: string; description: string; current: boolean }[]
  >([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const { user, userProfile } = useAuth();
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
    
    // Check if teacher data already exists for step 2
    const fetchTeacherData = async () => {
      try {
        const teacherDoc = await getDoc(doc(db, "teachers", user.uid));
        
        if (teacherDoc.exists()) {
          const data = teacherDoc.data();
          
          if (data.yearsOfExperience) setYearsOfExperience(data.yearsOfExperience);
          if (data.professionalSummary) setProfessionalSummary(data.professionalSummary);
          if (data.subjects && Array.isArray(data.subjects)) setSelectedSubjects(data.subjects);
          if (data.qualifications && Array.isArray(data.qualifications)) {
            setQualifications(data.qualifications.length > 0 
              ? data.qualifications 
              : [{ degree: "", institution: "", year: "" }]);
          }
          if (data.workHistory && Array.isArray(data.workHistory)) {
            setWorkHistory(data.workHistory.length > 0 ? data.workHistory : [{ position: "", organization: "", startDate: "", endDate: "", description: "", current: false }]);
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
  
  // Filter subjects based on input
  useEffect(() => {
    if (subjectInput.trim() === "") {
      setFilteredSubjects([]);
      return;
    }
    
    const filtered = subjectOptions.filter(
      (subject) => 
        subject.toLowerCase().includes(subjectInput.toLowerCase()) && 
        !selectedSubjects.includes(subject)
    );
    
    setFilteredSubjects(filtered);
  }, [subjectInput, selectedSubjects]);
  
  const handleSubjectSelect = (subject: string) => {
    if (!selectedSubjects.includes(subject)) {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
    setSubjectInput("");
    setShowSubjectDropdown(false);
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
  
  const handleAddWorkHistoryEntry = () => {
    setWorkHistory([
      ...workHistory,
      { position: "", organization: "", startDate: "", endDate: "", description: "", current: false }
    ]);
  };
  
  const handleRemoveWorkHistoryEntry = (index: number) => {
    setWorkHistory(workHistory.filter((_, i) => i !== index));
  };
  
  const handleWorkHistoryChange = (index: number, field: string, value: string | boolean) => {
    const updatedWorkHistory = [...workHistory];
    updatedWorkHistory[index] = {
      ...updatedWorkHistory[index],
      [field]: value
    };
    
    // If setting current to true, clear the end date
    if (field === 'current' && value === true) {
      updatedWorkHistory[index].endDate = '';
    }
    
    setWorkHistory(updatedWorkHistory);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push("/login");
      return;
    }
    
    if (
      !yearsOfExperience || 
      !professionalSummary || 
      selectedSubjects.length === 0 || 
      !validateQualifications()
    ) {
      setError("Please fill in all required fields");
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Update teacher profile document in Firestore with step 2 data
      await setDoc(
        doc(db, "teachers", user.uid),
        {
          yearsOfExperience,
          professionalSummary,
          subjects: selectedSubjects,
          qualifications: qualifications.filter(
            (q) => q.degree && q.institution && q.year
          ),
          workHistory: workHistory.filter(w => w.position || w.organization),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      
      // Navigate to next step
      router.push("/onboarding/teacher/step3");
    } catch (error: any) {
      console.error("Error in step 2:", error);
      setError(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  
  const validateQualifications = () => {
    return qualifications.some(
      (q) => q.degree && q.institution && q.year
    );
  };
  
  const handleBackClick = () => {
    router.push("/onboarding/teacher/step1");
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
        <p className="mt-2 text-gray-600">Step 2 of 3: Experience & Qualifications</p>
      </div>
      
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Experience Section */}
          <div>
            <h2 className="mb-4 text-xl font-semibold">Teaching Experience</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700">
                  Years of Experience <span className="text-red-500">*</span>
                </label>
                <select
                  id="yearsOfExperience"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
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
            </div>
            
            <div className="mt-4">
              <label htmlFor="professionalSummary" className="block text-sm font-medium text-gray-700">
                Professional Summary <span className="text-red-500">*</span>
              </label>
              <textarea
                id="professionalSummary"
                value={professionalSummary}
                onChange={(e) => setProfessionalSummary(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Briefly describe your teaching experience and approach..."
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                This will be displayed on your profile and helps students understand your teaching background.
              </p>
            </div>
          </div>
          
          {/* Subjects Section */}
          <div>
            <h2 className="mb-4 text-xl font-semibold">Subjects You Teach</h2>
            <div className="relative">
              <label htmlFor="subjects" className="block text-sm font-medium text-gray-700">
                Add Subjects <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex items-center">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <BookOpen className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={subjectInput}
                    onChange={(e) => {
                      setSubjectInput(e.target.value);
                      setShowSubjectDropdown(true);
                    }}
                    onFocus={() => setShowSubjectDropdown(true)}
                    className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    placeholder="Search or enter subject"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomSubject}
                  className="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </button>
              </div>
              
              {/* Subject dropdown */}
              {showSubjectDropdown && filteredSubjects.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                  {filteredSubjects.map((subject) => (
                    <div
                      key={subject}
                      onClick={() => handleSubjectSelect(subject)}
                      className="cursor-pointer hover:bg-gray-100 px-4 py-2"
                    >
                      {subject}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Selected subjects */}
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedSubjects.map((subject) => (
                <div
                  key={subject}
                  className="inline-flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm"
                >
                  {subject}
                  <button
                    type="button"
                    onClick={() => handleRemoveSubject(subject)}
                    className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            {selectedSubjects.length === 0 && (
              <p className="mt-2 text-xs text-red-500">
                Please add at least one subject that you teach
              </p>
            )}
          </div>
          
          {/* Qualifications Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Educational Qualifications</h2>
              <button
                type="button"
                onClick={handleAddQualification}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Another
              </button>
            </div>
            
            <div className="space-y-4">
              {qualifications.map((qualification, index) => (
                <div key={index} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-sm font-medium">Qualification #{index + 1}</h3>
                    {qualifications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQualification(index)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label htmlFor={`degree-${index}`} className="block text-sm font-medium text-gray-700">
                        Degree/Certificate <span className="text-red-500">*</span>
                      </label>
                      <input
                        id={`degree-${index}`}
                        type="text"
                        value={qualification.degree}
                        onChange={(e) => handleQualificationChange(index, "degree", e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        placeholder="B.Ed, M.Sc, etc."
                        required={index === 0}
                      />
                    </div>
                    <div>
                      <label htmlFor={`institution-${index}`} className="block text-sm font-medium text-gray-700">
                        Institution <span className="text-red-500">*</span>
                      </label>
                      <input
                        id={`institution-${index}`}
                        type="text"
                        value={qualification.institution}
                        onChange={(e) => handleQualificationChange(index, "institution", e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        placeholder="University/Institution name"
                        required={index === 0}
                      />
                    </div>
                    <div>
                      <label htmlFor={`year-${index}`} className="block text-sm font-medium text-gray-700">
                        Year <span className="text-red-500">*</span>
                      </label>
                      <input
                        id={`year-${index}`}
                        type="text"
                        value={qualification.year}
                        onChange={(e) => handleQualificationChange(index, "year", e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        placeholder="Year of completion"
                        required={index === 0}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Work History Section */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Work History</h3>
              <button
                type="button"
                onClick={handleAddWorkHistoryEntry}
                className="inline-flex items-center rounded-md bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Experience
              </button>
            </div>
            
            {workHistory.length === 0 ? (
              <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 py-8 text-center">
                <p className="text-gray-500">No work history added yet.</p>
                <button
                  type="button"
                  onClick={handleAddWorkHistoryEntry}
                  className="mt-2 text-sm text-blue-600 hover:underline"
                >
                  + Add your work experience
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {workHistory.map((work, index) => (
                  <div key={`work-${index}`} className="relative rounded-md border border-gray-200 bg-white p-4">
                    <button
                      type="button"
                      onClick={() => handleRemoveWorkHistoryEntry(index)}
                      className="absolute right-2 top-2 text-gray-400 hover:text-red-500"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Position/Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={work.position}
                          onChange={(e) => handleWorkHistoryChange(index, 'position', e.target.value)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          placeholder="e.g., Mathematics Teacher"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Organization <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={work.organization}
                          onChange={(e) => handleWorkHistoryChange(index, 'organization', e.target.value)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          placeholder="e.g., ABC School"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Start Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={work.startDate}
                          onChange={(e) => handleWorkHistoryChange(index, 'startDate', e.target.value)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          placeholder="e.g., June 2018"
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between">
                          <label className="block text-sm font-medium text-gray-700">
                            End Date
                          </label>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`current-${index}`}
                              checked={work.current}
                              onChange={(e) => handleWorkHistoryChange(index, 'current', e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor={`current-${index}`} className="ml-2 text-sm text-gray-600">
                              Current
                            </label>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={work.endDate}
                          onChange={(e) => handleWorkHistoryChange(index, 'endDate', e.target.value)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          placeholder="e.g., May 2022"
                          disabled={work.current}
                        />
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <textarea
                          rows={3}
                          value={work.description}
                          onChange={(e) => handleWorkHistoryChange(index, 'description', e.target.value)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          placeholder="Describe your responsibilities and achievements"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <p className="mt-2 text-sm text-gray-500">
              Add your teaching positions and relevant work experience. This helps students understand your background.
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