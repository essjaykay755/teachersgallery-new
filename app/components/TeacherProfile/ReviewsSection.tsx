"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/shared/button";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/shared/avatar";
import { useAuth } from "@/lib/auth-context";
import { formatDistanceToNow } from "date-fns";
import { getFirestore, collection, query, where, getDocs, limit, addDoc, serverTimestamp } from "firebase/firestore";
import { getApp } from "firebase/app";
import { Textarea } from "@/app/components/shared/textarea";

interface ReviewsSectionProps {
  teacherId: string;
}

interface Review {
  id: string;
  teacherId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerType: string;
  reviewerAvatarUrl?: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export default function ReviewsSection({ teacherId }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user, userProfile } = useAuth();
  
  // Direct implementation to fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        setError("");
        setDebugInfo("");
        
        if (!teacherId) {
          setError("Teacher ID is missing");
          return;
        }
        
        // Get a direct reference to Firestore
        const db = getFirestore(getApp());
        
        // Use a simple query to get all reviews
        const reviewsCollection = collection(db, 'reviews');
        const snapshot = await getDocs(query(reviewsCollection));
        
        // Filter and convert reviews
        const reviewsList: Review[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.teacherId === teacherId) {
            const reviewDate = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
            reviewsList.push({
              id: doc.id,
              teacherId: data.teacherId || '',
              reviewerId: data.reviewerId || '',
              reviewerName: data.reviewerName || 'Anonymous',
              reviewerType: data.reviewerType || 'student',
              reviewerAvatarUrl: data.reviewerAvatarUrl || '',
              rating: typeof data.rating === 'number' ? data.rating : 5,
              comment: data.comment || '',
              createdAt: reviewDate,
            });
          }
        });
        
        // Sort by date
        reviewsList.sort((a, b) => {
          const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          return timeB - timeA;
        });
        
        setReviews(reviewsList);
      } catch (err: any) {
        console.error("Error fetching reviews:", err);
        setError("Unable to load reviews. Please try again later.");
        setDebugInfo(JSON.stringify(err, null, 2));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReviews();
  }, [teacherId, refreshTrigger]);
  
  const handleSubmitReview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user || !userProfile) {
      setError("You must be logged in to leave a review");
      return;
    }
    
    if (!comment.trim()) {
      setError("Please enter a review comment");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError("");
      
      // Get a direct reference to Firestore
      const db = getFirestore(getApp());
      const reviewsCollection = collection(db, 'reviews');
      
      // Prepare review data
      const reviewData = {
        teacherId,
        reviewerId: user.uid,
        reviewerName: user.displayName || 'Anonymous',
        reviewerType: userProfile.userType || 'student',
        rating: Number(rating),
        comment: comment.trim(),
        createdAt: serverTimestamp()
      };
      
      // Add avatar if available
      if (user.photoURL) {
        Object.assign(reviewData, { reviewerAvatarUrl: user.photoURL });
      }
      
      // Add directly to Firestore
      await addDoc(reviewsCollection, reviewData);
      
      // Reset form and refresh reviews
      setComment("");
      setRating(5);
      setShowForm(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Error submitting review:", err);
      setError("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Safe formatter for review dates
  const formatReviewDate = (date: Date) => {
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return "recently";
    }
  };

  // Safe getter for reviewer initials
  const getReviewerInitials = (name: string) => {
    if (!name || typeof name !== 'string') return '?';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Student Reviews</h2>
        
        {user && !showForm && (
          <Button onClick={() => setShowForm(true)}>
            Write a Review
          </Button>
        )}
      </div>
      
      {/* Review Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-xl font-bold mb-4">Write a Review</h3>
          
          <form onSubmit={handleSubmitReview}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Your Rating</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="comment" className="block text-sm font-medium mb-2">
                Your Review
              </label>
              <Textarea
                id="comment"
                placeholder="Share your experience with this teacher..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full"
              />
            </div>
            
            {error && (
              <div className="mb-4 text-red-500 text-sm">{error}</div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !comment.trim()}
              >
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </form>
        </div>
      )}
      
      {/* Error Display */}
      {error && !showForm && (
        <div className="py-8 text-center">
          <div className="text-red-500 mb-4">{error}</div>
          {debugInfo && (
            <details className="text-xs text-left bg-gray-100 p-2 rounded mt-4 mx-auto max-w-md">
              <summary className="cursor-pointer">Debug Information</summary>
              <pre className="whitespace-pre-wrap break-words">{debugInfo}</pre>
            </details>
          )}
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="py-8 text-center">Loading reviews...</div>
      )}
      
      {/* No Reviews State */}
      {!isLoading && !error && reviews.length === 0 && (
        <div className="py-8 text-center text-gray-500">
          No reviews yet. Be the first to review this teacher!
        </div>
      )}
      
      {/* Reviews List */}
      {!isLoading && !error && reviews.length > 0 && (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  {review.reviewerAvatarUrl ? (
                    <AvatarImage 
                      src={review.reviewerAvatarUrl} 
                      alt={review.reviewerName} 
                    />
                  ) : null}
                  <AvatarFallback>{getReviewerInitials(review.reviewerName)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{review.reviewerName || 'Anonymous'}</h4>
                      <p className="text-sm text-gray-500 capitalize">
                        {review.reviewerType || 'User'}
                      </p>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      {formatReviewDate(review.createdAt)}
                    </div>
                  </div>
                  
                  <div className="mt-1 flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  
                  <p className="mt-2 text-gray-700">{review.comment || 'No comment provided'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 