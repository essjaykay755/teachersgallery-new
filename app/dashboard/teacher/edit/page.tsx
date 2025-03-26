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
import { ArrowLeft, Upload, User, CheckCircle, XCircle, Plus, X, Pencil, School, BookOpen, MapPin, Clock, CreditCard, ExternalLink } from "lucide-react";
import AvatarInput from "@/app/components/shared/avatar-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/app/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Switch } from "@/app/components/ui/switch";
import { Label } from "@/app/components/ui/label";
import { Checkbox } from "@/app/components/ui/checkbox";

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
  
  // Work History
  const [workHistory, setWorkHistory] = useState<
    { position: string; organization: string; startDate: string; endDate: string; description: string; current: boolean }[]
  >([]);
  
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
  const [activeTab, setActiveTab] = useState("personal");
  
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
          
          // Work History
          if (data.workHistory && Array.isArray(data.workHistory)) {
            setWorkHistory(data.workHistory);
          } else {
            setWorkHistory([]);
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
  
  const handleAddWorkHistoryEntry = () => {
    setWorkHistory([
      ...workHistory,
      { position: "", organization: "", startDate: "", endDate: "", description: "", current: false }
    ]);
  };
  
  const removeWorkHistoryEntry = (index: number) => {
    setWorkHistory(workHistory.filter((_, i) => i !== index));
  };
  
  const updateWorkHistoryEntry = (index: number, field: string, value: string | boolean) => {
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
        
        // Only include non-empty work history entries
        workHistory: workHistory.filter(
          (w) => w.position || w.organization || w.startDate
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
                        await updateDoc(doc(db, "teachers", user.uid), {
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
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>
                  Update your information to help students and parents find you
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <Tabs defaultValue="personal" className="w-full" onValueChange={setActiveTab} value={activeTab}>
              <TabsList className="mb-6 grid w-full grid-cols-4">
                <TabsTrigger value="personal" className="flex items-center gap-2">
                  <User className="h-4 w-4" /> 
                  <span className="hidden sm:inline">Personal</span>
                </TabsTrigger>
                <TabsTrigger value="professional" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> 
                  <span className="hidden sm:inline">Professional</span>
                </TabsTrigger>
                <TabsTrigger value="experience" className="flex items-center gap-2">
                  <School className="h-4 w-4" /> 
                  <span className="hidden sm:inline">Experience</span>
                </TabsTrigger>
                <TabsTrigger value="teaching" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> 
                  <span className="hidden sm:inline">Teaching</span>
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
                    
                    <div className="space-y-2">
                      <Label htmlFor="professionalSummary">Professional Summary</Label>
                      <Textarea
                        id="professionalSummary"
                        value={professionalSummary}
                        onChange={(e) => setProfessionalSummary(e.target.value)}
                        placeholder="Tell students and parents about your teaching experience and approach"
                        className="min-h-[120px]"
                      />
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={isVisible}
                          onCheckedChange={(checked) => setIsVisible(checked)}
                          id="visibility"
                        />
                        <Label htmlFor="visibility" className="cursor-pointer">
                          Make my profile visible in search results
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground pl-10">
                        When enabled, students and parents can find and contact you
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="professional">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                      <Select 
                        value={yearsOfExperience} 
                        onValueChange={setYearsOfExperience}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your experience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Less than 1 year">Less than 1 year</SelectItem>
                          <SelectItem value="1-2 years">1-2 years</SelectItem>
                          <SelectItem value="3-5 years">3-5 years</SelectItem>
                          <SelectItem value="6-10 years">6-10 years</SelectItem>
                          <SelectItem value="More than 10 years">More than 10 years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Subjects You Teach</Label>
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
                        <Input
                          type="text"
                          value={subjectInput}
                          onChange={(e) => {
                            setSubjectInput(e.target.value);
                            setShowSubjectDropdown(true);
                          }}
                          className="flex-grow"
                          placeholder="Add a subject you teach"
                        />
                        <Button type="button" size="icon" onClick={handleAddCustomSubject}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Qualifications</Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={handleAddQualification}
                          className="h-8 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Qualification
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {qualifications.map((qualification, index) => (
                          <Card key={index} className="shadow-none border border-muted">
                            <CardContent className="p-4">
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div className="space-y-2">
                                  <Label className="text-xs">Degree/Certificate</Label>
                                  <Input
                                    type="text"
                                    value={qualification.degree}
                                    onChange={(e) =>
                                      handleQualificationChange(index, "degree", e.target.value)
                                    }
                                    placeholder="e.g., B.Sc., M.Ed."
                                    className="h-9"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs">Institution</Label>
                                  <Input
                                    type="text"
                                    value={qualification.institution}
                                    onChange={(e) =>
                                      handleQualificationChange(index, "institution", e.target.value)
                                    }
                                    placeholder="University/College name"
                                    className="h-9"
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="flex-grow space-y-2">
                                    <Label className="text-xs">Year</Label>
                                    <Input
                                      type="text"
                                      value={qualification.year}
                                      onChange={(e) =>
                                        handleQualificationChange(index, "year", e.target.value)
                                      }
                                      placeholder="e.g., 2020"
                                      className="h-9"
                                    />
                                  </div>
                                  
                                  {qualifications.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveQualification(index)}
                                      className="mt-5 h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="experience">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Work History</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddWorkHistoryEntry}
                        className="h-8 gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Add Experience
                      </Button>
                    </div>
                    
                    {workHistory.length === 0 ? (
                      <div className="border border-dashed border-muted rounded-lg p-8 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <School className="h-8 w-8 text-muted-foreground" />
                          <h3 className="text-muted-foreground font-medium">No work history added</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            Add your teaching experience to showcase your expertise
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddWorkHistoryEntry}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Work Experience
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {workHistory.map((work, index) => (
                          <Card key={`work-${index}`} className="shadow-none border border-muted">
                            <CardHeader className="p-4 pb-0 flex flex-row items-start justify-between">
                              <div className="flex flex-col space-y-1">
                                <h4 className="font-medium">{work.position || "New Position"}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {work.organization || "Organization"} • {work.startDate || "Start Date"} 
                                  {work.current ? " - Present" : work.endDate ? ` - ${work.endDate}` : ""}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeWorkHistoryEntry(index)}
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </CardHeader>
                            <CardContent className="p-4">
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                  <Label>Position</Label>
                                  <Input
                                    type="text"
                                    value={work.position}
                                    onChange={(e) => updateWorkHistoryEntry(index, 'position', e.target.value)}
                                    placeholder="e.g., Mathematics Teacher"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label>Organization</Label>
                                  <Input
                                    type="text"
                                    value={work.organization}
                                    onChange={(e) => updateWorkHistoryEntry(index, 'organization', e.target.value)}
                                    placeholder="e.g., ABC School"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label>Start Date</Label>
                                  <Input
                                    type="text"
                                    value={work.startDate}
                                    onChange={(e) => updateWorkHistoryEntry(index, 'startDate', e.target.value)}
                                    placeholder="e.g., June 2018"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <Label>End Date</Label>
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`current-${index}`}
                                        checked={work.current}
                                        onCheckedChange={(checked) => 
                                          updateWorkHistoryEntry(index, 'current', checked === true)
                                        }
                                      />
                                      <label htmlFor={`current-${index}`} className="text-sm cursor-pointer">
                                        Current
                                      </label>
                                    </div>
                                  </div>
                                  <Input
                                    type="text"
                                    value={work.endDate}
                                    onChange={(e) => updateWorkHistoryEntry(index, 'endDate', e.target.value)}
                                    placeholder="e.g., May 2022"
                                    disabled={work.current}
                                  />
                                </div>
                                
                                <div className="sm:col-span-2 space-y-2">
                                  <Label>Description</Label>
                                  <Textarea
                                    rows={3}
                                    value={work.description}
                                    onChange={(e) => updateWorkHistoryEntry(index, 'description', e.target.value)}
                                    placeholder="Describe your responsibilities and achievements"
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="teaching">
                  <div className="space-y-6">
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
                        <Label htmlFor="areasServed">Areas Served</Label>
                        <Input
                          id="areasServed"
                          type="text"
                          value={areasServed}
                          onChange={(e) => setAreasServed(e.target.value)}
                          placeholder="Neighborhoods, districts, etc."
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Label>Teaching Mode</Label>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="online"
                            checked={teachingMode.includes("Online")}
                            onCheckedChange={(checked: boolean) => {
                              handleTeachingModeChange("Online");
                            }}
                          />
                          <label htmlFor="online" className="text-sm cursor-pointer">
                            Online
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="offline"
                            checked={teachingMode.includes("Offline")}
                            onCheckedChange={(checked: boolean) => {
                              handleTeachingModeChange("Offline");
                            }}
                          />
                          <label htmlFor="offline" className="text-sm cursor-pointer">
                            Offline
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="hybrid"
                            checked={teachingMode.includes("Hybrid")}
                            onCheckedChange={(checked: boolean) => {
                              handleTeachingModeChange("Hybrid");
                            }}
                          />
                          <label htmlFor="hybrid" className="text-sm cursor-pointer">
                            Hybrid
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Label>Fee Range (₹ per hour)</Label>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="minFee" className="text-xs">Minimum Fee</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                            <Input
                              id="minFee"
                              type="number"
                              min="0"
                              value={feeRange.min}
                              onChange={(e) => setFeeRange({ ...feeRange, min: e.target.value })}
                              className="pl-7"
                              placeholder="Min"
                              required
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">/hr</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="maxFee" className="text-xs">Maximum Fee</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                            <Input
                              id="maxFee"
                              type="number"
                              min="0"
                              value={feeRange.max}
                              onChange={(e) => setFeeRange({ ...feeRange, max: e.target.value })}
                              className="pl-7"
                              placeholder="Max"
                              required
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">/hr</span>
                          </div>
                        </div>
                      </div>
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

export default withAuth(TeacherEditProfilePage, {
  allowedUserTypes: ["teacher"],
  redirectTo: "/login",
}); 