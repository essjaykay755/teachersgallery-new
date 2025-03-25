"use client";

import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Star, Phone, MessageSquare, Flag, Check, Trophy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/shared/avatar";
import { MessageForm } from "@/app/components/shared/message-form";
import { PhoneRequest } from "@/app/components/shared/phone-request";
import { useAuth } from '@/lib/auth-context';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createPhoneRequestNotification, createMessageNotification } from '@/lib/notification-service';
import { getOrCreateConversation } from '@/lib/chat-service';
import { Button } from "@/app/components/shared/button";
import ReviewsSection from "@/app/components/TeacherProfile/ReviewsSection";
import { getTeacherReviews, Review } from '@/lib/review-service';

// Define RequestStatus type to match what's in PhoneRequest
type RequestStatus = 'not_requested' | 'pending' | 'approved' | 'rejected';

// Error boundary component to catch React rendering errors
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-300 bg-red-50 rounded-md my-4">
          <h2 className="text-xl font-bold text-red-700 mb-2">Something went wrong</h2>
          <details className="text-sm whitespace-pre-wrap">
            <summary className="cursor-pointer mb-2">View error details</summary>
            <p className="font-mono bg-gray-100 p-2 rounded">{this.state.error?.toString()}</p>
            <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto text-xs">
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          <button 
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

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
  workHistory?: Array<{
    position: string;
    organization: string;
    startDate: string;
    endDate: string;
    description: string;
    current?: boolean;
  }>;
}

// Simplified teacher profile component
export default function TeacherProfile() {
  const params = useParams();
  const teacherId = typeof params.teacherId === 'string' ? params.teacherId : '';
  
  const [activeTab, setActiveTab] = useState('about');
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [showPhoneRequest, setShowPhoneRequest] = useState(false);
  const [phoneRequestStatus, setPhoneRequestStatus] = useState<RequestStatus>('not_requested');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [teacher, setTeacher] = useState<TeacherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  
  const { user, userProfile } = useAuth();
  const isAuthenticated = user !== null;
  const router = useRouter();
  
  // Fetch teacher data from Firestore when component mounts
  useEffect(() => {
    if (!teacherId) {
      console.error("Teacher ID is missing");
      setIsLoading(false);
      return;
    }
    
    const fetchTeacherData = async () => {
      try {
        // Fetch teacher profile
        const teacherDoc = await getDoc(doc(db, 'teachers', teacherId));
        
        if (!teacherDoc.exists()) {
          console.error("Teacher not found");
          return;
        }
        
        const teacherData = {
          id: teacherId,
          ...teacherDoc.data(),
        } as TeacherData;
        
        setTeacher(teacherData);
        
        // Fetch reviews for the teacher to display the count and average rating
        try {
          const teacherReviews = await getTeacherReviews(teacherId);
          setReviews(teacherReviews);
          setReviewsCount(teacherReviews.length);
          
          if (teacherReviews.length > 0) {
            const totalRating = teacherReviews.reduce((sum, review) => sum + review.rating, 0);
            const avg = Math.round((totalRating / teacherReviews.length) * 10) / 10;
            setAverageRating(avg);
          }
        } catch (reviewError) {
          console.error("Error fetching reviews:", reviewError);
        }
        
        // Check if the user is logged in
        if (user) {
          // Check if there's an existing phone request from this user to this teacher
          const phoneRequestsQuery = query(
            collection(db, 'phoneNumberRequests'),
            where('teacherId', '==', teacherId),
            where('requesterId', '==', user.uid)
          );
          
          const phoneRequestsSnapshot = await getDocs(phoneRequestsQuery);
          
          if (!phoneRequestsSnapshot.empty) {
            // Get the latest request
            const latestRequest = phoneRequestsSnapshot.docs[0].data();
            setPhoneRequestStatus(latestRequest.status);
            
            if (latestRequest.status === 'approved' && latestRequest.phoneNumber) {
              setPhoneNumber(latestRequest.phoneNumber);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching teacher data:", error);
        // Set a default teacher object to avoid errors in the UI
        setTeacher({
          id: teacherId,
          name: 'Error Loading Profile',
          subject: 'N/A',
          location: 'N/A',
          feesPerHour: 0,
          experience: 0,
          isVerified: false,
          isFeatured: false,
          avatarUrl: '',
          about: 'There was an error loading this teacher profile.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeacherData();
  }, [teacherId, user]);
  
  // Replace simplified send message function with actual implementation
  const sendMessage = async (message: string): Promise<void> => {
    if (!isAuthenticated || !user || !teacher) {
      throw new Error('You must be logged in to send a message');
    }
    
    try {
      // Create or get existing conversation
      const conversationId = await getOrCreateConversation(
        user.uid,
        userProfile?.userType || 'student',
        teacherId,
        'teacher'
      );
      
      // Add message to the conversation
      const messageRef = await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        text: message,
        senderId: user.uid,
        createdAt: serverTimestamp(),
      });
      
      // Create notification for the recipient
      await createMessageNotification(
        teacherId,
        user.uid,
        conversationId,
        message
      );
      
      setShowMessageForm(false);
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };
  
  // Replace simplified request phone number function with actual implementation
  const requestPhoneNumber = async (): Promise<void> => {
    if (!isAuthenticated || !user || !teacher) {
      throw new Error('You must be logged in to request a phone number');
    }
    
    try {
      // Add request to Firestore
      const requestRef = await addDoc(collection(db, 'phoneNumberRequests'), {
        teacherId,
        requesterId: user.uid,
        status: 'pending',
        timestamp: serverTimestamp()
      });
      
      // Create notification for the teacher
      await createPhoneRequestNotification(
        teacherId,
        user.uid,
        requestRef.id,
        'pending'
      );
      
      setPhoneRequestStatus('pending');
      setShowPhoneRequest(false);
    } catch (error) {
      console.error("Error requesting phone number:", error);
      throw error;
    }
  };
  
  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-20">
          <div className="animate-pulse">
            <div className="h-32 w-32 bg-gray-200 rounded-full mx-auto mb-6"></div>
            <div className="h-8 bg-gray-200 rounded max-w-sm mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded max-w-xs mx-auto"></div>
          </div>
          <p className="mt-8 text-gray-500">Loading teacher profile...</p>
        </div>
      </div>
    );
  }
  
  if (!teacher) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Teacher Not Found</h2>
          <p className="text-gray-500 mb-6">The teacher profile you're looking for doesn't exist.</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Calculate initials for avatar fallback
  const initials = teacher.name
    ? teacher.name.split(" ").map(n => n[0] || "").join("").toUpperCase().substring(0, 2)
    : "??";

  return (
    <ErrorBoundary>
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Back button */}
        <Link href="/" className="flex items-center text-gray-600 hover:text-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to All Teachers
        </Link>

        {/* Teacher header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center">
            {/* Avatar */}
            <Avatar className="w-24 h-24 mr-6 mb-4 md:mb-0">
              {teacher.avatarUrl ? (
                <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
              ) : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center mb-2">
                <h1 className="text-2xl font-bold mr-3">{teacher.name}</h1>
                {teacher.isVerified && (
                  <span className="inline-flex items-center bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-2 mt-1 md:mt-0">
                    <Check className="w-3 h-3 mr-1" />
                    Verified
                  </span>
                )}
                {teacher.isFeatured && (
                  <span className="inline-flex items-center bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mt-1 md:mt-0">
                    <Trophy className="w-3 h-3 mr-1" />
                    Featured
                  </span>
                )}
              </div>
              <h2 className="text-lg text-gray-600 mb-2">{teacher.subject} Teacher</h2>
              <div className="flex flex-wrap items-center text-sm text-gray-500 mb-3">
                <div className="flex items-center mr-4 mb-2 md:mb-0">
                  <MapPin className="w-4 h-4 mr-1" />
                  {teacher.location}
                </div>
                <div className="mr-4 mb-2 md:mb-0">
                  {teacher.experience} {teacher.experience === 1 ? 'year' : 'years'} experience
                </div>
                {reviewsCount > 0 && (
                  <div className="flex items-center">
                    <div className="flex mr-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star}
                          className={`h-4 w-4 ${
                            star <= Math.round(averageRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span>{averageRating.toFixed(1)} ({reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'})</span>
                  </div>
                )}
              </div>
              <div className="text-lg font-bold text-blue-600">
                ₹{teacher.feesPerHour}/hr
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col space-y-2 w-full md:w-auto mt-4 md:mt-0">
              <Button 
                className="w-full md:w-auto"
                onClick={() => setShowMessageForm(true)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </Button>
              
              <Button 
                variant="outline"
                className="w-full md:w-auto"
                onClick={() => setShowPhoneRequest(true)}
              >
                <Phone className="w-4 h-4 mr-2" />
                Request Phone Number
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs and content */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'about' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('about')}
            >
              About
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'experience' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('experience')}
            >
              Experience
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'reviews' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews
            </button>
          </div>

          {/* Tab content */}
          <div className="p-6">
            {activeTab === 'about' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">About</h3>
                <p className="text-gray-700 mb-6">{teacher.about}</p>
              </div>
            )}
            
            {activeTab === 'experience' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Work Experience</h3>
                <p className="text-gray-500">No work experience information available</p>
              </div>
            )}
            
            {activeTab === 'reviews' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Reviews</h3>
                <ReviewsSection teacherId={teacherId} />
              </div>
            )}
          </div>
        </div>

        {/* Message Form Modal */}
        {showMessageForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Send Message to {teacher.name}</h2>
                <MessageForm 
                  recipientId={teacherId}
                  recipientName={teacher.name}
                  onSend={sendMessage}
                />
                <button 
                  onClick={() => setShowMessageForm(false)}
                  className="mt-4 w-full py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Phone Request Modal */}
        {showPhoneRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Request Phone Number</h2>
                <PhoneRequest 
                  teacherId={teacherId}
                  teacherName={teacher.name}
                  onRequest={requestPhoneNumber}
                  initialStatus={phoneRequestStatus}
                  phoneNumber={phoneNumber}
                />
                <button 
                  onClick={() => setShowPhoneRequest(false)}
                  className="mt-4 w-full py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
} 