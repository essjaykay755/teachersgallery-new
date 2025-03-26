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
import { ArrowLeft, Upload, User, CheckCircle, XCircle, Plus, Trash2, X, Users, MapPin, Book } from "lucide-react";
import AvatarInput from "@/app/components/shared/avatar-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/app/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Label } from "@/app/components/ui/label";

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
  const [activeTab, setActiveTab] = useState("personal");
  
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
        <div className="flex items-center justify-center w-full h-48">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }
  
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Edit Profile</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Saving
                </>
              ) : "Save Changes"}
            </Button>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {successMessage && (
          <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-4">
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
                size="lg"
              />
              <div>
                <CardTitle>Parent Profile</CardTitle>
                <CardDescription>
                  Update your information to find the best teachers for your children
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <Tabs defaultValue="personal" className="w-full" onValueChange={setActiveTab} value={activeTab}>
              <TabsList className="mb-6 grid w-full grid-cols-3">
                <TabsTrigger value="personal" className="flex items-center gap-2">
                  <User className="h-4 w-4" /> 
                  <span className="hidden sm:inline">Personal</span>
                </TabsTrigger>
                <TabsTrigger value="family" className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> 
                  <span className="hidden sm:inline">Family</span>
                </TabsTrigger>
                <TabsTrigger value="requirements" className="flex items-center gap-2">
                  <Book className="h-4 w-4" /> 
                  <span className="hidden sm:inline">Requirements</span>
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit}>
                <TabsContent value="personal">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Your full name"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="Your phone number"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="family">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="childrenAges">Children's Ages</Label>
                        <Input
                          id="childrenAges"
                          type="text"
                          value={childrenAges}
                          onChange={(e) => setChildrenAges(e.target.value)}
                          placeholder="e.g., 8, 12, 15"
                          required
                        />
                        <p className="text-xs text-muted-foreground">Separate multiple ages with commas</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="City, State"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="areasServed">Areas (where you want a teacher)</Label>
                        <Input
                          id="areasServed"
                          type="text"
                          value={areasServed}
                          onChange={(e) => setAreasServed(e.target.value)}
                          placeholder="Neighborhoods, localities"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="requirements">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label>Subjects Required</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedSubjects.map((subject) => (
                          <Badge 
                            key={subject} 
                            variant="secondary"
                            className="py-1 px-3 flex items-center gap-1"
                          >
                            {subject}
                            <button
                              type="button"
                              onClick={() => handleRemoveSubject(subject)}
                              className="ml-1 rounded-full h-4 w-4 inline-flex items-center justify-center hover:bg-muted"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-grow">
                          <Input
                            type="text"
                            value={subjectInput}
                            onChange={(e) => {
                              setSubjectInput(e.target.value);
                              setShowSubjectDropdown(true);
                            }}
                            placeholder="Add a subject your child needs to learn"
                          />
                          {showSubjectDropdown && subjectInput.length > 0 && (
                            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {filteredSubjects.length > 0 ? (
                                filteredSubjects.map((subject) => (
                                  <div
                                    key={subject}
                                    onClick={() => handleSubjectSelect(subject)}
                                    className="relative cursor-pointer select-none px-3 py-2 hover:bg-blue-50 hover:text-blue-700"
                                  >
                                    {subject}
                                  </div>
                                ))
                              ) : (
                                <div className="relative cursor-default select-none px-3 py-2 text-gray-500">
                                  No matching subjects
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <Button type="button" size="icon" onClick={handleAddCustomSubject}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="requirements">Additional Requirements</Label>
                      <Textarea
                        id="requirements"
                        value={requirements}
                        onChange={(e) => setRequirements(e.target.value)}
                        placeholder="Any specific requirements for the teacher, teaching style, schedule preferences, etc."
                        className="min-h-[120px]"
                      />
                    </div>
                  </div>
                </TabsContent>
              </form>
            </Tabs>
          </CardContent>
          <CardFooter className="border-t pt-6 flex justify-between">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Saving
                </>
              ) : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardShell>
  );
}

export default withAuth(ParentEditProfilePage, {
  allowedUserTypes: ["parent"],
  redirectTo: "/login",
}); 