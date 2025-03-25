"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/shared/button";
import { Star } from "lucide-react";
import { Textarea } from "@/app/components/shared/textarea";
import { addTeacherReview } from "@/lib/review-service";
import { useAuth, UserType } from "@/lib/auth-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ReviewFormProps {
  teacherId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ReviewForm({ teacherId, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewerName, setReviewerName] = useState<string | null>(null);
  
  const { user, userProfile } = useAuth();
  
  // Fetch user's real name from their profile collection when component mounts
  useEffect(() => {
    const fetchUserName = async () => {
      if (!user || !userProfile) return;
      
      try {
        // Determine which collection to query based on user type
        const collectionName = userProfile.userType === 'parent' ? 'parents' : 'students';
        const profileDoc = await getDoc(doc(db, collectionName, user.uid));
        
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          // Use name or fullName field (check both to be safe)
          const name = data.name || data.fullName || null;
          if (name) {
            setReviewerName(name);
          }
        }
      } catch (err) {
        console.error("Error fetching reviewer name:", err);
        // Don't set error - just fall back to displayName if this fails
      }
    };
    
    fetchUserName();
  }, [user, userProfile]);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) {
      setError("You must be logged in to leave a review");
      return;
    }
    
    if (!userProfile) {
      setError("Your profile is not fully loaded. Please refresh the page and try again.");
      return;
    }
    
    // Check if user is a teacher trying to review
    if (userProfile.userType === "teacher") {
      setError("Only students and parents can submit reviews for teachers.");
      return;
    }
    
    if (!comment.trim()) {
      setError("Please enter a review comment");
      return;
    }

    // Check if the user is trying to review their own profile
    if (user.uid === teacherId) {
      setError("You cannot review your own profile");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      console.log("Submitting review with user profile:", {
        uid: user.uid,
        userType: userProfile.userType,
        displayName: reviewerName || user.displayName
      });
      
      // Determine reviewer type - must be either 'student' or 'parent'
      const reviewerType: 'student' | 'parent' = 
        userProfile.userType === 'parent' ? 'parent' : 'student';
      
      // Use fetched name with fallbacks
      const displayName = reviewerName || user.displayName || 'Anonymous';
      
      // Prepare review data
      const reviewData = {
        teacherId,
        reviewerId: user.uid,
        reviewerName: displayName,
        reviewerType,
        rating: Number(rating),
        comment: comment.trim()
      };
      
      // Add avatar URL if available
      if (user.photoURL) {
        Object.assign(reviewData, { reviewerAvatarUrl: user.photoURL });
      }
      
      // Add review through service
      await addTeacherReview(reviewData);
      
      // Call success callback
      onSuccess();
    } catch (err: any) {
      console.error("Error submitting review:", err);
      
      // Provide more helpful error messages
      if (err.message?.includes("permission")) {
        if (userProfile.userType !== "student" && userProfile.userType !== "parent") {
          setError("Only students and parents can submit reviews. Your account type is: " + userProfile.userType);
        } else {
          setError("Permission denied. Make sure you're logged in with a student or parent account that has completed the onboarding process.");
        }
      } else {
        setError(err.message || "Failed to submit review. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Show form only when user is authenticated and is a student or parent
  const showForm = user && userProfile && 
    (userProfile.userType === "student" || userProfile.userType === "parent");
  
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-in fade-in duration-300">
      {!showForm ? (
        <div className="text-center py-4">
          <p className="text-gray-600 mb-2">You need to be logged in as a student or parent to leave a review.</p>
          <Button onClick={onCancel}>OK</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <h3 className="text-xl font-semibold mb-4">Write a Review</h3>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-1">Your rating</p>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 focus:outline-none"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
              Your review
            </label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none border-gray-300"
              placeholder="Share your experience with this teacher..."
              rows={4}
            />
          </div>
          
          {error && (
            <div className="mb-4 text-red-500 text-sm">{error}</div>
          )}
          
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
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
      )}
    </div>
  );
} 