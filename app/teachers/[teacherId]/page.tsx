"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Star, Phone, MessageSquare, Flag, Check, Trophy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/shared/avatar";
import { MessageForm } from "@/app/components/shared/message-form";
import { PhoneRequest } from "@/app/components/shared/phone-request";
import { useAuth } from '@/lib/auth-context';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import { createPhoneRequestNotification, createMessageNotification } from '@/lib/notification-service';
import { getOrCreateConversation } from '@/lib/chat-service';

interface TeacherData {
  id: string;
  name: string;
  subject?: string;
  location?: string;
  feesPerHour?: number;
  experience?: number;
  teachingMode?: string;
  educationLevels?: string[];
  rating?: number;
  reviews?: number;
  students?: number;
  isVerified?: boolean;
  isFeatured?: boolean;
  avatarUrl?: string;
  about?: string;
  methodology?: string;
  subjects?: string[];
  achievements?: string[];
  feeRange?: { min: number; max: number };
}

interface TeachersRecord {
  [key: string]: TeacherData;
}

// Remove the mock data and replace with a state to hold the fetched teacher data
export default function TeacherProfile() {
  const params = useParams();
  const teacherId = typeof params.teacherId === 'string' ? params.teacherId : '';
  
  const [activeTab, setActiveTab] = useState('about');
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [showPhoneRequest, setShowPhoneRequest] = useState(false);
  const [phoneRequestStatus, setPhoneRequestStatus] = useState<'not_requested' | 'pending' | 'approved' | 'rejected'>('not_requested');
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>(undefined);
  const [teacher, setTeacher] = useState<TeacherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { user, userProfile } = useAuth();
  const isAuthenticated = user !== null;
  
  // Fetch teacher data from Firestore when component mounts
  useEffect(() => {
    if (!teacherId) {
      setIsLoading(false);
      return;
    }
    
    const fetchTeacherData = async () => {
      try {
        setIsLoading(true);
        
        // Try main teachers collection first
        let teacherDoc = await getDoc(doc(db, 'teachers', teacherId));
        
        // If not found, try users collection
        if (!teacherDoc.exists()) {
          console.log(`Teacher not found in 'teachers' collection, trying 'users' collection...`);
          teacherDoc = await getDoc(doc(db, 'users', teacherId));
        }
        
        // If still not found, try profiles collection
        if (!teacherDoc.exists()) {
          console.log(`Teacher not found in 'users' collection, trying 'profiles' collection...`);
          teacherDoc = await getDoc(doc(db, 'profiles', teacherId));
        }
        
        if (teacherDoc.exists()) {
          const data = teacherDoc.data();
          console.log("Raw teacher data:", data);
          
          // Handle subject data safely
          let subjects: string[] = [];
          if (Array.isArray(data.subjects)) {
            subjects = data.subjects;
          } else if (typeof data.subject === 'string') {
            subjects = [data.subject];
          } else if (typeof data.primarySubject === 'string') {
            subjects = [data.primarySubject];
          } else {
            subjects = ['General'];
          }
          
          // Handle education levels safely
          let educationLevels: string[] = [];
          if (Array.isArray(data.educationLevels)) {
            educationLevels = data.educationLevels;
          } else if (Array.isArray(data.qualifications)) {
            educationLevels = data.qualifications;
          } else if (Array.isArray(data.levels)) {
            educationLevels = data.levels;
          } else {
            educationLevels = [];
          }
          
          // Handle achievements safely
          let achievements: string[] = [];
          if (Array.isArray(data.achievements)) {
            achievements = data.achievements.filter(item => typeof item === 'string');
          } else {
            achievements = [];
          }
          
          // Set teacher data with safe defaults
          setTeacher({
            id: teacherId,
            name: data.name || data.fullName || data.teacherName || 'Unknown Teacher',
            subject: subjects[0] || 'General',
            location: data.location || data.city || 'Location not specified',
            feesPerHour: Number(data.feesPerHour) || 0,
            experience: Number(data.experience) || Number(data.yearsOfExperience) || 0,
            teachingMode: data.teachingMode || data.teachingModes?.[0] || 'Online',
            educationLevels: educationLevels,
            rating: Number(data.rating) || 4.5,
            reviews: Number(data.reviews) || 0,
            students: Number(data.students) || 0,
            isVerified: !!data.isVerified,
            isFeatured: !!data.isFeatured,
            avatarUrl: data.avatarUrl || data.photoURL || '',
            about: data.about || data.professionalSummary || 'No information provided',
            methodology: data.methodology || 'No information provided',
            subjects: subjects,
            achievements: achievements,
            feeRange: data.feeRange || { min: 0, max: 0 }
          });
        } else {
          console.error("Teacher not found in any collection");
          // Set default empty teacher to avoid null references
          setTeacher({
            id: teacherId,
            name: 'Teacher Not Found',
            subject: 'N/A',
            location: 'N/A',
            feesPerHour: 0,
            experience: 0,
            teachingMode: 'N/A',
            educationLevels: [],
            rating: 0,
            reviews: 0,
            students: 0,
            isVerified: false,
            isFeatured: false,
            avatarUrl: '',
            about: 'Teacher profile not found.',
            methodology: '',
            subjects: [],
            achievements: [],
            feeRange: { min: 0, max: 0 }
          });
        }
      } catch (error) {
        console.error("Error fetching teacher data:", error);
        // Set default empty teacher on error
        setTeacher({
          id: teacherId,
          name: 'Error Loading Profile',
          subject: 'N/A',
          location: 'N/A',
          feesPerHour: 0,
          experience: 0,
          teachingMode: 'N/A',
          educationLevels: [],
          rating: 0,
          reviews: 0,
          students: 0,
          isVerified: false,
          isFeatured: false,
          avatarUrl: '',
          about: 'There was an error loading this teacher profile.',
          methodology: '',
          subjects: [],
          achievements: [],
          feeRange: { min: 0, max: 0 }
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeacherData();
  }, [teacherId]);
  
  // Check existing phone request status when component mounts
  useEffect(() => {
    if (isAuthenticated && user && teacher && teacherId) {
      checkPhoneRequestStatus();
    }
  }, [isAuthenticated, user, teacher, teacherId]);
  
  const checkPhoneRequestStatus = async () => {
    if (!user || !userProfile || userProfile.userType === 'teacher') return;
    
    try {
      console.log(`Checking phone request status for teacher ${teacherId} by user ${user.uid}`);
      
      const phoneRequestsQuery = query(
        collection(db, "phoneNumberRequests"),
        where("requesterId", "==", user.uid),
        where("teacherId", "==", teacherId)
      );
      
      const querySnapshot = await getDocs(phoneRequestsQuery);
      
      if (!querySnapshot.empty) {
        const requestDoc = querySnapshot.docs[0];
        const requestId = requestDoc.id;
        const requestData = requestDoc.data();
        
        console.log(`Found request ${requestId} with status: ${requestData.status}`);
        setPhoneRequestStatus(requestData.status);
        
        if (requestData.status === 'approved') {
          console.log("Request approved, checking for phone number:", requestData);
          
          if (requestData.phoneNumber && requestData.phoneNumber.trim() !== "") {
            setPhoneNumber(requestData.phoneNumber);
            console.log("Phone number retrieved from request:", requestData.phoneNumber);
          } else {
            console.warn("Request approved but no phone number available in request");
            
            // Try to fetch the teacher's phone number directly
            console.log(`Fetching teacher ${teacherId} profile to get phone number`);
            const teacherDoc = await getDoc(doc(db, "teachers", teacherId));
            
            if (teacherDoc.exists()) {
              const teacherData = teacherDoc.data();
              console.log("Teacher profile data:", teacherData);
              
              if (teacherData.phoneNumber && teacherData.phoneNumber.trim() !== "") {
                const teacherPhoneNumber = teacherData.phoneNumber;
                console.log("Retrieved teacher phone from profile:", teacherPhoneNumber);
                setPhoneNumber(teacherPhoneNumber);
                
                // Update the request with the phone number
                console.log(`Updating request ${requestId} with phone number:`, teacherPhoneNumber);
                
                await updateDoc(doc(db, "phoneNumberRequests", requestId), {
                  phoneNumber: teacherPhoneNumber
                });
                
                console.log(`Request ${requestId} updated with teacher's phone number`);
              } else {
                console.warn("No phone number found in teacher profile");
                setPhoneNumber("Contact teacher for details");
              }
            } else {
              console.warn(`Teacher profile ${teacherId} not found`);
              setPhoneNumber("Contact teacher for details");
            }
          }
        }
      } else {
        console.log("No phone request found for this teacher");
      }
    } catch (error) {
      console.error("Error checking phone request status:", error);
    }
  };
  
  const sendMessage = async (message: string) => {
    if (!isAuthenticated || !user || !teacher) {
      throw new Error('You must be logged in to send a message');
    }
    
    try {
      // Get user type
      const userType = userProfile?.userType || 'student';
      
      console.log('Attempting to create or get conversation with teacher:', {
        currentUserId: user.uid,
        currentUserType: userType,
        teacherId: teacherId,
      });
      
      // Get or create a conversation
      try {
        const conversationId = await getOrCreateConversation(
          user.uid,
          userType,
          teacherId,
          'teacher'
        );
        
        console.log('Successfully got conversation ID:', conversationId);
        
        // Add message to the conversation
        try {
          await addDoc(collection(db, "conversations", conversationId, "messages"), {
            text: message,
            senderId: user.uid,
            createdAt: serverTimestamp()
          });
          
          console.log('Message added to conversation');
          
          // Update conversation's last message
          await updateDoc(doc(db, "conversations", conversationId), {
            lastMessage: message,
            lastMessageAt: serverTimestamp()
          });
          
          // Create notification for the teacher
          try {
            await createMessageNotification(
              teacherId,
              user.uid,
              conversationId,
              message
            );
            console.log('Notification created for teacher');
          } catch (notificationError) {
            console.error("Error creating notification:", notificationError);
            // Don't fail the overall operation if notification fails
          }
          
          // Redirect to the conversation
          window.location.href = `/dashboard/messages/${conversationId}`;
          
          return;
        } catch (messageError: any) {
          console.error("Error adding message to conversation:", messageError.code, messageError.message);
          alert("Could not send message. Please try again.");
          throw messageError;
        }
      } catch (conversationError: any) {
        console.error("Error creating conversation:", conversationError.code, conversationError.message);
        alert("Could not create conversation with teacher. Please try again later.");
        throw conversationError;
      }
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };
  
  const requestPhoneNumber = async () => {
    if (!isAuthenticated || !user || !teacher) {
      throw new Error('You must be logged in to request a phone number');
    }
    
    try {
      const requestId = `${user.uid}_${teacherId}`;
      const timestamp = new Date().toISOString();
      
      // Create a new phone number request
      await setDoc(doc(db, 'phoneNumberRequests', requestId), {
        id: requestId,
        requesterId: user.uid,
        requesterType: userProfile?.userType || 'student',
        teacherId: teacherId,
        teacherName: teacher.name,
        status: 'pending',
        timestamp,
        phoneNumber: null
      });
      
      // Create notification for the teacher with error handling
      try {
        await createPhoneRequestNotification(
          teacherId,
          user.uid,
          requestId,
          "pending"
        );
        console.log("Phone request notification created successfully");
      } catch (notifError) {
        console.error("Error creating phone request notification:", notifError);
        // Don't throw, continue with the process even if notification fails
      }
      
      // Add a system message to the conversation
      try {
        // Get or create conversation with the teacher
        const userType = userProfile?.userType || 'student';
        
        console.log('Getting conversation to add phone request system message');
        const conversationId = await getOrCreateConversation(
          user.uid,
          userType,
          teacherId,
          'teacher'
        );
        
        console.log(`Adding system message to conversation ${conversationId}`);
        
        // Add the system message
        await addDoc(
          collection(db, "conversations", conversationId, "messages"),
          {
            text: "Phone number requested",
            senderId: "system",
            createdAt: serverTimestamp(),
            isSystemMessage: true,
            systemMessageType: "phone_request",
            requestId
          }
        );
        
        // Update the conversation's last message
        await updateDoc(doc(db, "conversations", conversationId), {
          lastMessage: "Phone number requested",
          lastMessageAt: serverTimestamp()
        });
        
        console.log("System message added successfully");
      } catch (systemMessageError) {
        console.error("Error adding system message:", systemMessageError);
        // Don't throw here, the request was still created
      }
      
      setPhoneRequestStatus('pending');
      return;
    } catch (error) {
      console.error("Error requesting phone number:", error);
      throw error;
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-3 text-gray-600">Loading teacher profile...</p>
      </div>
    );
  }
  
  if (!teacher) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Teacher not found</h1>
        <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
          Return to homepage
        </Link>
      </div>
    );
  }

  // Calculate initials for avatar fallback
  const initials = teacher.name
    .split(" ")
    .map((n) => n[0] || "")
    .join("")
    .toUpperCase()
    .substring(0, 2);
    
  const renderStars = () => {
    const rating = typeof teacher.rating === 'number' && !isNaN(teacher.rating) 
      ? teacher.rating 
      : 4.5;
      
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <main className="bg-gray-50 min-h-screen pb-10">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-600 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Back to Teachers</span>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Teacher header */}
          <div className="p-6 pb-4 border-b">
            <div className="flex flex-col md:flex-row md:items-center">
              <div className="flex items-start gap-4 mb-4 md:mb-0">
                <Avatar className="h-20 w-20 border-2 border-gray-200">
                  <AvatarImage src={teacher.avatarUrl} alt={teacher.name || 'Teacher'} />
                  <AvatarFallback className="text-xl bg-blue-700 text-white">{initials}</AvatarFallback>
                </Avatar>
                
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold text-gray-900">{teacher.name || 'Teacher'}</h1>
                    {!!teacher.isVerified && (
                      <span className="text-green-600" title="Verified">
                        <Check className="h-5 w-5" />
                      </span>
                    )}
                    {!!teacher.isFeatured && (
                      <span className="bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded">
                        Featured
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-700 mt-1 font-medium">{teacher.subject || 'General'} Teacher</p>
                  
                  <div className="flex items-center text-gray-500 text-sm mt-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{teacher.location || 'Location not specified'}</span>
                  </div>
                </div>
              </div>

              <div className="md:ml-auto mt-4 md:mt-0">
                <div className="flex flex-col items-end">
                  <p className="text-2xl font-bold text-blue-600">
                    ₹{
                      typeof teacher.feesPerHour === 'number' && teacher.feesPerHour > 0 
                        ? teacher.feesPerHour 
                        : teacher.feeRange?.min || 0
                    }/hr
                  </p>
                  <p className="text-sm text-gray-500">per hour</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 mt-6">
              <div className="flex items-center">
                {renderStars()}
                <span className="ml-2 text-sm text-gray-500">({typeof teacher.reviews === 'number' ? teacher.reviews : 0} reviews)</span>
              </div>
              
              <div className="flex items-center text-gray-700 text-sm">
                <span className="font-medium">{typeof teacher.experience === 'number' ? teacher.experience : 0}+ years</span>
              </div>
              
              <div className="flex items-center text-gray-700 text-sm">
                <span className="font-medium">{typeof teacher.students === 'number' ? teacher.students : 0}+ students</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              <span className={`text-xs font-medium rounded-full px-3 py-1 
                ${teacher.teachingMode === "Online" ? "bg-green-100 text-green-800" : 
                  teacher.teachingMode === "Offline" ? "bg-blue-100 text-blue-800" : 
                  "bg-purple-100 text-purple-800"}`}>
                {teacher.teachingMode || 'Online'}
              </span>
              {Array.isArray(teacher.educationLevels) && teacher.educationLevels.length > 0 && teacher.educationLevels.map((level: string, index: number) => (
                typeof level === 'string' ? (
                  <span 
                    key={`level-${index}`} 
                    className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full"
                  >
                    {level}
                  </span>
                ) : null
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('about')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'about' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                About
              </button>
              <button
                onClick={() => setActiveTab('experience')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'experience' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Experience
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'reviews' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Reviews
              </button>
            </div>
          </div>

          {/* Tab content */}
          <div className="p-6">
            {activeTab === 'about' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">About {teacher.name || 'Teacher'}</h2>
                <p className="text-gray-700 mb-6">
                  {teacher.about || 'No information provided'}
                </p>
                <p className="text-gray-700 mb-6">
                  {teacher.methodology || 'No teaching methodology provided'}
                </p>
                
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Subjects</h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(teacher.subjects) && teacher.subjects.length > 0 
                      ? teacher.subjects
                          .filter((subject: any) => typeof subject === 'string')
                          .map((subject: string, index: number) => (
                            <span
                              key={`subject-${index}`}
                              className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-sm"
                            >
                              {subject}
                            </span>
                          ))
                      : (
                          <span className="text-gray-500 italic">No subjects listed</span>
                        )
                    }
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Achievements</h3>
                  {Array.isArray(teacher.achievements) && teacher.achievements.length > 0 ? (
                    <ul className="space-y-2">
                      {teacher.achievements
                        .filter((achievement: any) => typeof achievement === 'string')
                        .map((achievement: string, index: number) => (
                          <li key={`achievement-${index}`} className="flex items-start">
                            <Trophy className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{achievement}</span>
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">No achievements listed yet.</p>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'experience' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Experience</h2>
                <p className="text-gray-500 italic">This section is coming soon.</p>
              </div>
            )}
            
            {activeTab === 'reviews' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Reviews</h2>
                <p className="text-gray-500 italic">This section is coming soon.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Contact options */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Contact Teacher</h2>
          
          {!isAuthenticated ? (
            <div className="text-center p-4 border border-blue-200 bg-blue-50 rounded-md mb-4">
              <p className="text-blue-700">
                <Link href="/login" className="font-medium hover:underline">
                  Login
                </Link>{' '}
                or{' '}
                <Link href="/register" className="font-medium hover:underline">
                  Register
                </Link>{' '}
                to contact this teacher.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Choose how you'd like to contact this teacher:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button 
                  onClick={() => {
                    setShowMessageForm(true);
                    setShowPhoneRequest(false);
                  }}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-colors ${
                    showMessageForm 
                      ? 'bg-blue-600 text-white' 
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>Message Teacher</span>
                </button>
                
                <button 
                  onClick={() => {
                    setShowPhoneRequest(true);
                    setShowMessageForm(false);
                  }}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-colors ${
                    showPhoneRequest 
                      ? 'bg-blue-600 text-white' 
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Phone className="h-5 w-5" />
                  <span>Request Phone Number</span>
                </button>
              </div>
              
              {showMessageForm && (
                <MessageForm 
                  recipientId={teacherId} 
                  recipientName={teacher.name}
                  onSend={sendMessage}
                />
              )}
              
              {showPhoneRequest && (
                <PhoneRequest 
                  teacherId={teacherId} 
                  teacherName={teacher.name}
                  onRequest={requestPhoneNumber}
                  initialStatus={phoneRequestStatus}
                  phoneNumber={phoneNumber}
                />
              )}
            </>
          )}
        </div>
        
        {/* Report option */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 text-yellow-500 mt-1">
              <Flag className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-gray-900">Report this Teacher</h3>
              <p className="text-sm text-gray-600 mt-1">
                If you find any inappropriate content or behavior, please report it.
              </p>
              <button className="mt-2 text-red-600 text-sm font-medium hover:underline">
                Report an issue
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 