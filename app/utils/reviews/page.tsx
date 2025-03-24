"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/shared/button";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, limit } from "firebase/firestore";

export default function ReviewsUtilityPage() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [reviewCount, setReviewCount] = useState<number | null>(null);

  // Get review count on page load
  useEffect(() => {
    const fetchReviewCount = async () => {
      try {
        const reviewsCollection = collection(db, 'reviews');
        const snapshot = await getDocs(query(reviewsCollection, limit(100)));
        setReviewCount(snapshot.size);
      } catch (error) {
        console.error("Error fetching review count:", error);
        setMessage("Error fetching review count: " + String(error));
      }
    };

    fetchReviewCount();
  }, []);

  // Initialize reviews collection
  const setupReviews = async () => {
    setIsLoading(true);
    setMessage("Setting up reviews collection...");
    
    try {
      const response = await fetch('/api/setup-reviews');
      const data = await response.json();
      
      setMessage(`Setup result: ${data.message}`);
      
      // Refresh review count
      const reviewsCollection = collection(db, 'reviews');
      const snapshot = await getDocs(query(reviewsCollection, limit(100)));
      setReviewCount(snapshot.size);
    } catch (error) {
      console.error("Error setting up reviews:", error);
      setMessage("Error setting up reviews: " + String(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Reviews Utility</h1>
      
      <div className="mb-8 p-4 border rounded shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Review Collection Status</h2>
        <p className="mb-4">
          {reviewCount === null 
            ? "Loading review count..." 
            : `Found ${reviewCount} reviews in the database.`}
        </p>
        
        <div className="flex gap-4">
          <Button 
            onClick={setupReviews} 
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Initialize Review Collection"}
          </Button>
        </div>
        
        {message && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <p className="font-mono text-sm">{message}</p>
          </div>
        )}
      </div>
      
      <div className="mb-8 p-4 border rounded shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Troubleshooting</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Make sure Firestore rules allow reading and writing reviews</li>
          <li>Check that the user is authenticated</li>
          <li>Verify that the user has the correct role (student or parent)</li>
          <li>Ensure Firebase is properly initialized</li>
          <li>Check if composite indexes are set up for the reviews collection</li>
        </ul>
      </div>
      
      <div className="p-4 border rounded shadow-sm bg-yellow-50">
        <h2 className="text-xl font-semibold mb-2">Firebase Rules for Reviews</h2>
        <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto text-xs">
{`match /reviews/{reviewId} {
  // Anyone can read reviews
  allow read: if true;
  
  // Only authenticated users can create reviews
  allow create: if request.auth != null && 
                 request.resource.data.reviewerId == request.auth.uid &&
                 exists(/databases/$(database)/documents/users/$(request.auth.uid));
  
  // Only the reviewer can edit or delete their own review
  allow update, delete: if request.auth != null &&
                         resource.data.reviewerId == request.auth.uid;
}`}
        </pre>
      </div>
    </div>
  );
} 