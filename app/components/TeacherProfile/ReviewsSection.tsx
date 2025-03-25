"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/shared/button";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/shared/avatar";
import { useAuth } from "@/lib/auth-context";
import { formatDistanceToNow } from "date-fns";
import { ReviewForm } from "./ReviewForm";
import { getTeacherReviews, Review } from "@/lib/review-service";

interface ReviewsSectionProps {
  teacherId: string;
}

export default function ReviewsSection({ teacherId }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user, userProfile } = useAuth();
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchReviews = async () => {
      try {
        if (!isMounted) return;
        setIsLoading(true);
        setError("");
        
        if (!teacherId) {
          setError("Teacher ID is missing");
          return;
        }
        
        // Get reviews using the service with a timeout to avoid Firebase errors showing to users
        let reviewsList: Review[] = [];
        
        try {
          reviewsList = await Promise.race([
            getTeacherReviews(teacherId),
            new Promise<Review[]>((_, reject) => 
              setTimeout(() => reject(new Error("Timeout fetching reviews")), 10000)
            ) as Promise<Review[]>
          ]);
        } catch (fetchError) {
          console.error("Error during review fetch:", fetchError);
          // Don't set UI error for timeouts or temporary Firebase issues
          reviewsList = [];
        }
        
        if (!isMounted) return;
        setReviews(reviewsList);
      } catch (err: any) {
        console.error("Error fetching reviews:", err);
        if (!isMounted) return;
        
        // Only show user-friendly errors to users, not Firebase internal errors
        const userMessage = "Unable to load reviews at this time. Please try again later.";
        setError(userMessage);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchReviews();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [teacherId, refreshTrigger]);
  
  const handleReviewSuccess = () => {
    setShowForm(false);
    // Trigger refresh to show the new review
    setRefreshTrigger((prev) => prev + 1);
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

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10
    : 0;

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-6">
        <div>
          {reviews.length > 0 && (
            <div className="flex items-center mt-1">
              <div className="flex mr-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(averageRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {averageRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}
        </div>
        
        {user && !showForm && (
          <Button onClick={() => setShowForm(true)}>
            Write a Review
          </Button>
        )}
      </div>
      
      {/* Review Form */}
      {showForm && (
        <div className="mb-8">
          <ReviewForm 
            teacherId={teacherId}
            onSuccess={handleReviewSuccess}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}
      
      {/* Error Display */}
      {error && !showForm && (
        <div className="py-8 text-center">
          <div className="text-red-500 mb-4">{error}</div>
          {error.includes("permissions") && (
            <div className="text-sm text-gray-600">
              Please make sure you are logged in and your account is set up properly.
              <br />
              Only students and parents can submit reviews for teachers.
            </div>
          )}
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && !error && (
        <div className="py-8 text-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
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
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
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