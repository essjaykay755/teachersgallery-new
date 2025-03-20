"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Star, Phone, MessageSquare, Flag, Check, Trophy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/shared/avatar";
import { MessageForm } from "@/app/components/shared/message-form";
import { PhoneRequest } from "@/app/components/shared/phone-request";
import { useAuth } from '@/lib/auth-context';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import { createPhoneRequestNotification } from '@/lib/notification-service';

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
        // Use the correct path structure with a collection for teachers
        const teacherDoc = await getDoc(doc(db, 'teachers', teacherId));
        
        if (teacherDoc.exists()) {
          const data = teacherDoc.data();
          console.log("Raw teacher data:", data);
          
          // Set default values for fields that might be missing
          setTeacher({
            id: teacherId,
            name: data.name || 'Unknown Teacher',
            subject: data.subject || (data.subjects && data.subjects.length ? data.subjects[0] : 'General'),
            location: data.location || 'Location not specified',
            feesPerHour: data.feesPerHour || 0,
            experience: data.experience || data.yearsOfExperience || 0,
            teachingMode: data.teachingMode || data.teachingModes?.[0] || 'Online',
            educationLevels: data.educationLevels || data.qualifications || [],
            rating: data.rating || 4.5,
            reviews: data.reviews || 0,
            students: data.students || 0,
            isVerified: !!data.isVerified,
            isFeatured: !!data.isFeatured,
            avatarUrl: data.avatarUrl || '',
            about: data.about || data.professionalSummary || 'No information provided',
            methodology: data.methodology || 'No information provided',
            subjects: Array.isArray(data.subjects) ? data.subjects : [data.subject || 'General'],
            achievements: Array.isArray(data.achievements) ? data.achievements : []
          });
        } else {
          console.error("Teacher not found");
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching teacher data:", error);
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
      const phoneRequestsQuery = query(
        collection(db, "phoneNumberRequests"),
        where("requesterId", "==", user.uid),
        where("teacherId", "==", teacherId)
      );
      
      const querySnapshot = await getDocs(phoneRequestsQuery);
      
      if (!querySnapshot.empty) {
        const requestData = querySnapshot.docs[0].data();
        setPhoneRequestStatus(requestData.status);
        
        if (requestData.status === 'approved') {
          setPhoneNumber(requestData.phoneNumber || undefined);
        }
      }
    } catch (error) {
      console.error("Error checking phone request status:", error);
    }
  };
  
  const sendMessage = async (message: string) => {
    if (!isAuthenticated || !user || !teacher) {
      throw new Error('You must be logged in to send a message');
    }
    
    const messageId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Create a new message document
    await setDoc(doc(db, 'messages', messageId), {
      id: messageId,
      senderId: user.uid,
      senderName: user.displayName || 'Anonymous',
      recipientId: teacherId,
      recipientName: teacher.name,
      content: message,
      timestamp,
      read: false
    });
    
    return;
  };
  
  const requestPhoneNumber = async () => {
    if (!isAuthenticated || !user || !teacher) {
      throw new Error('You must be logged in to request a phone number');
    }
    
    const requestId = `${user.uid}_${teacherId}`;
    const timestamp = new Date().toISOString();
    
    // Create a new phone number request
    await setDoc(doc(db, 'phoneNumberRequests', requestId), {
      id: requestId,
      requesterId: user.uid,
      requesterName: user.displayName || 'Anonymous',
      teacherId: teacherId,
      teacherName: teacher.name,
      status: 'pending',
      timestamp,
      phoneNumber: null
    });
    
    // Create notification for the teacher
    await createPhoneRequestNotification(
      teacherId,
      user.uid,
      requestId,
      "pending"
    );
    
    return;
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

  // Get initials for avatar fallback
  const initials = teacher.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  const renderStars = () => {
    const rating = teacher.rating || 4.5;
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
                  <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
                  <AvatarFallback className="text-xl bg-blue-700 text-white">{initials}</AvatarFallback>
                </Avatar>
                
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold text-gray-900">{teacher.name}</h1>
                    {teacher.isVerified && (
                      <span className="text-green-600" title="Verified">
                        <Check className="h-5 w-5" />
                      </span>
                    )}
                    {teacher.isFeatured && (
                      <span className="bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded">
                        Featured
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-700 mt-1 font-medium">{teacher.subject} Teacher</p>
                  
                  <div className="flex items-center text-gray-500 text-sm mt-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{teacher.location}</span>
                  </div>
                </div>
              </div>

              <div className="md:ml-auto mt-4 md:mt-0">
                <div className="flex flex-col items-end">
                  <p className="text-2xl font-bold text-blue-600">₹{teacher.feesPerHour}/hr</p>
                  <p className="text-sm text-gray-500">per hour</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 mt-6">
              <div className="flex items-center">
                {renderStars()}
                <span className="ml-2 text-sm text-gray-500">({teacher.reviews || 0} reviews)</span>
              </div>
              
              <div className="flex items-center text-gray-700 text-sm">
                <span className="font-medium">{teacher.experience}+ years</span>
              </div>
              
              <div className="flex items-center text-gray-700 text-sm">
                <span className="font-medium">{teacher.students || 0}+ students</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              <span className={`text-xs font-medium rounded-full px-3 py-1 
                ${teacher.teachingMode === "Online" ? "bg-green-100 text-green-800" : 
                  teacher.teachingMode === "Offline" ? "bg-blue-100 text-blue-800" : 
                  "bg-purple-100 text-purple-800"}`}>
                {teacher.teachingMode}
              </span>
              {Array.isArray(teacher.educationLevels) && teacher.educationLevels.map((level: string) => (
                <span 
                  key={level} 
                  className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full"
                >
                  {level}
                </span>
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
                <h2 className="text-xl font-semibold mb-4">About {teacher.name}</h2>
                <p className="text-gray-700 mb-6">
                  {teacher.about}
                </p>
                <p className="text-gray-700 mb-6">
                  {teacher.methodology}
                </p>
                
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Subjects</h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(teacher.subjects) && teacher.subjects.map((subject: string) => (
                      <span
                        key={subject}
                        className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-sm"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Achievements</h3>
                  {Array.isArray(teacher.achievements) && teacher.achievements.length > 0 ? (
                    <ul className="space-y-2">
                      {teacher.achievements.map((achievement: string, index: number) => (
                        <li key={index} className="flex items-start">
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