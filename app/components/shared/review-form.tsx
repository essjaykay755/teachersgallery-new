"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/shared/button";
import { Textarea } from "@/app/components/shared/textarea";
import { useAuth } from "@/lib/auth-context";
import { Star } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { addTeacherReview } from "@/lib/review-service";

interface ReviewFormProps {
  teacherId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewForm({ teacherId, onClose, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
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
    
    if (!user || !userProfile) {
      setError("You must be logged in to leave a review");
      return;
    }
    
    if (rating < 1 || rating > 5) {
      setError("Please select a rating between 1 and 5 stars");
      return;
    }
    
    if (!comment.trim()) {
      setError("Please enter a review comment");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError("");
      setDebugInfo("");
      
      // Use fetched name with fallbacks
      let displayName = reviewerName || user.displayName || 'Anonymous';
      
      // Simplify avatar handling to avoid type errors
      let avatarUrl = user.photoURL || undefined;
      
      // Get reviewer type from userProfile - use a fallback to ensure valid type
      const reviewerType = (userProfile.userType === 'student' || userProfile.userType === 'parent')
        ? userProfile.userType as 'student' | 'parent'
        : 'student';
      
      console.log("Preparing review data:", {
        teacherId,
        reviewerId: user.uid,
        userType: reviewerType,
        displayName: displayName
      });
      
      const reviewData = {
        teacherId,
        reviewerId: user.uid,
        reviewerName: displayName,
        reviewerType,
        rating: Number(rating),
        comment: comment.trim()
      };
      
      // Only add avatarUrl if it exists
      if (avatarUrl) {
        Object.assign(reviewData, { reviewerAvatarUrl: avatarUrl });
      }
      
      // Use the review service instead of direct submission
      await addTeacherReview(reviewData);
      
      onSuccess();
    } catch (err: any) {
      console.error("Error submitting review:", err);
      
      // Create detailed debug info for troubleshooting
      const errCode = err?.code || 'unknown';
      const errMessage = err?.message || 'No message';
      const stackTrace = err?.stack || 'No stack trace';
      const debugText = `Error: ${errCode}\nMessage: ${errMessage}\nStack: ${stackTrace}`;
      setDebugInfo(debugText);
      
      // Extract and display a more specific Firebase error message if available
      if (err?.code) {
        switch (err.code) {
          case 'permission-denied':
            setError("You don't have permission to submit a review. Please try again.");
            break;
          case 'resource-exhausted':
            setError("Too many requests. Please try again later.");
            break;
          case 'unavailable':
            setError("Service temporarily unavailable. Please try again later.");
            break;
          case 'invalid-argument':
            setError(`Invalid data: ${err.message || 'Please check your review details'}`);
            break;
          default:
            setError(`Failed to submit review: ${err.message || 'Unknown error'}`);
        }
      } else {
        setError("Failed to submit review. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4">Write a Review</h3>
      
      <form onSubmit={handleSubmit}>
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
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
            rows={4}
            className="w-full"
          />
        </div>
        
        {error && (
          <div className="mb-4 text-red-500 text-sm">{error}</div>
        )}
        
        {debugInfo && (
          <details className="text-xs text-left bg-gray-100 p-2 rounded mt-2 mb-4">
            <summary className="cursor-pointer">Debug Information</summary>
            <pre className="whitespace-pre-wrap break-words">{debugInfo}</pre>
          </details>
        )}
        
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      </form>
    </div>
  );
} 