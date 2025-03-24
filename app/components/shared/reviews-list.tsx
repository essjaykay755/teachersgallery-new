"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/shared/avatar";
import { Review } from "@/lib/review-service";
import { formatDistanceToNow } from "date-fns";
import { collection, query, where, getDocs, limit, getFirestore } from "firebase/firestore";
import { getApp } from "firebase/app";
import { useAuth } from "@/lib/auth-context";

interface ReviewsListProps {
  teacherId: string;
  refreshTrigger?: number; // This can be incremented to trigger a refresh
}

export function ReviewsList({ teacherId, refreshTrigger = 0 }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const { user } = useAuth();
  
  // Direct implementation of fetching reviews to bypass service layer issues
  const fetchTeacherReviews = async (teacherId: string) => {
    try {
      console.log(`Directly fetching reviews for teacher: ${teacherId}`);
      console.log(`Current auth state: ${user ? 'Authenticated' : 'Not authenticated'}`);
      
      // Get a fresh reference to Firestore
      const db = getFirestore(getApp());
      const reviewsCollection = collection(db, 'reviews');
      
      // Try the simplest possible query without any filtering at first
      try {
        console.log("Trying to fetch all reviews without filters");
        const allReviewsQuery = query(reviewsCollection, limit(50));
        const allReviewsSnapshot = await getDocs(allReviewsQuery);
        
        console.log(`Successfully fetched ${allReviewsSnapshot.size} total reviews`);
        
        // Filter in memory if needed
        const reviewsList: Review[] = [];
        allReviewsSnapshot.forEach(doc => {
          const data = doc.data();
          // Check if this review is for the current teacher or if we're getting all reviews
          if (!teacherId || data.teacherId === teacherId) {
            reviewsList.push({
              id: doc.id,
              teacherId: data.teacherId || '',
              reviewerId: data.reviewerId || '',
              reviewerName: data.reviewerName || 'Anonymous',
              reviewerType: data.reviewerType || 'student',
              reviewerAvatarUrl: data.reviewerAvatarUrl || '',
              rating: Number(data.rating) || 5,
              comment: data.comment || '',
              createdAt: data.createdAt?.toDate() || new Date(),
            });
          }
        });
        
        // If we filtered, log how many reviews were for this teacher
        if (teacherId) {
          console.log(`Filtered to ${reviewsList.length} reviews for teacher ${teacherId}`);
        }
        
        // Sort reviews by date (newest first)
        return reviewsList.sort((a, b) => {
          const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          return timeB - timeA;
        });
      } catch (allQueryError) {
        console.error("Error with all reviews query:", allQueryError);
        throw allQueryError;
      }
    } catch (error: any) {
      console.error("Fatal error in fetchTeacherReviews:", error);
      throw error;
    }
  };
  
  useEffect(() => {
    console.log(`ReviewsList for teacher ${teacherId} - refreshTrigger: ${refreshTrigger}`);
    
    const loadReviews = async () => {
      try {
        setIsLoading(true);
        setError("");
        setDebugInfo("");
        
        console.log("Starting to fetch reviews directly...");
        const reviewsData = await fetchTeacherReviews(teacherId);
        console.log(`Successfully fetched ${reviewsData.length} reviews`);
        
        setReviews(reviewsData);
      } catch (err: any) {
        console.error("Error fetching reviews:", err);
        
        // Create detailed debug info
        const errCode = err?.code || 'unknown';
        const errMessage = err?.message || 'No message';
        const stackTrace = err?.stack || 'No stack trace';
        const debugText = `Error: ${errCode}\nMessage: ${errMessage}\nStack: ${stackTrace}`;
        setDebugInfo(debugText);
        
        // Set user-friendly error message
        if (err?.code === 'permission-denied') {
          setError("Permission denied. Please try visiting /utils/reviews to initialize the reviews collection.");
        } else if (err?.code === 'unavailable' || err?.code === 'resource-exhausted') {
          setError("Service temporarily unavailable. Please try again later.");
        } else if (err?.code === 'failed-precondition') {
          setError("Firebase is setting up the reviews. This may take a few minutes.");
        } else {
          setError("Failed to load reviews. Please refresh the page.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    // Add a retry mechanism
    let retryCount = 0;
    const maxRetries = 3;
    
    const attemptFetch = async () => {
      try {
        await loadReviews();
      } catch (err) {
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying fetch reviews (${retryCount}/${maxRetries})...`);
          setTimeout(attemptFetch, 1000 * retryCount); // Exponential backoff
        }
      }
    };
    
    attemptFetch();
  }, [teacherId, refreshTrigger, user]);
  
  if (isLoading) {
    return <div className="py-8 text-center">Loading reviews...</div>;
  }
  
  if (error) {
    return (
      <div className="py-8 text-center">
        <div className="text-red-500 mb-4">{error}</div>
        {debugInfo && (
          <details className="text-xs text-left bg-gray-100 p-2 rounded mt-4 mx-auto max-w-md" open>
            <summary className="cursor-pointer">Debug Information</summary>
            <pre className="whitespace-pre-wrap break-words">{debugInfo}</pre>
          </details>
        )}
      </div>
    );
  }
  
  if (reviews.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        No reviews yet. Be the first to review this teacher!
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-gray-200 pb-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={review.reviewerAvatarUrl} alt={review.reviewerName} />
              <AvatarFallback>{review.reviewerName.charAt(0)}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{review.reviewerName}</h4>
                  <p className="text-sm text-gray-500 capitalize">
                    {review.reviewerType}
                  </p>
                </div>
                
                <div className="text-sm text-gray-500">
                  {formatDistanceToNow(review.createdAt, { addSuffix: true })}
                </div>
              </div>
              
              <div className="mt-1 flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              
              <p className="mt-2 text-gray-700">{review.comment}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 