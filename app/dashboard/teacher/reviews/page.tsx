"use client";

import { useState, useEffect } from "react";
import { ReviewsList } from "@/app/components/shared/reviews-list";
import { useAuth } from "@/lib/auth-context";
import { getTeacherReviews } from "@/lib/review-service";
import withAuth, { WithAuthOptions } from "@/lib/withAuth";

function TeacherReviews() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [reviewCount, setReviewCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  
  useEffect(() => {
    const fetchReviewStats = async () => {
      if (!user) return;
      
      try {
        const reviews = await getTeacherReviews(user.uid);
        setReviewCount(reviews.length);
        
        if (reviews.length > 0) {
          const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
          setAverageRating(Math.round((totalRating / reviews.length) * 10) / 10);
        }
      } catch (error) {
        console.error("Error fetching review stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReviewStats();
  }, [user]);
  
  if (isLoading) {
    return <div className="p-6">Loading reviews...</div>;
  }
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Reviews</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Total Reviews</h3>
          <p className="text-3xl font-bold">{reviewCount}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Average Rating</h3>
          <p className="text-3xl font-bold">{averageRating.toFixed(1)}</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">All Reviews</h2>
        
        {user && (
          <ReviewsList teacherId={user.uid} />
        )}
      </div>
    </div>
  );
}

const authOptions: WithAuthOptions = {
  allowedUserTypes: ["teacher"]
};

export default withAuth(TeacherReviews, authOptions); 