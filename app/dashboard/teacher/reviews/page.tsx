"use client";

import { useState, useEffect } from "react";
import { ReviewsList } from "@/app/components/shared/reviews-list";
import { useAuth } from "@/lib/auth-context";
import { getTeacherReviews } from "@/lib/review-service";
import withAuth, { WithAuthOptions } from "@/lib/withAuth";
import { DashboardShell } from "@/app/components/layout/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { StarIcon } from "lucide-react";
import { Separator } from "@/app/components/ui/separator";

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
  
  return (
    <DashboardShell>
      {isLoading ? (
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading reviews...</p>
          </div>
        </div>
      ) : (
        <div className="p-6 space-y-6">
          <h1 className="text-2xl font-bold">My Reviews</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Number of reviews received from students</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{reviewCount}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Your overall rating from students</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                <p className="text-3xl font-bold">{averageRating.toFixed(1)}</p>
                <div className="flex items-center">
                  <StarIcon className="h-5 w-5 fill-yellow-400 stroke-yellow-400" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>All Reviews</CardTitle>
              <CardDescription>
                Reviews from students who have taken your classes
              </CardDescription>
              <Separator className="mt-2" />
            </CardHeader>
            <CardContent className="pt-4">
              {user && (
                <ReviewsList teacherId={user.uid} />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}

const authOptions: WithAuthOptions = {
  allowedUserTypes: ["teacher"]
};

export default withAuth(TeacherReviews, authOptions); 