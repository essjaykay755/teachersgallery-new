import { db } from './firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, limit, QueryDocumentSnapshot, DocumentData, getDoc, doc, updateDoc } from 'firebase/firestore';
import { createReviewNotification } from './notification-service';

export interface Review {
  id: string;
  teacherId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerType: 'student' | 'parent';
  reviewerAvatarUrl?: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

/**
 * Converts a Firestore document to a Review object
 */
const reviewConverter = (doc: QueryDocumentSnapshot<DocumentData>): Review => {
  const data = doc.data();
  
  return {
    id: doc.id,
    teacherId: data.teacherId || '',
    reviewerId: data.reviewerId || '',
    reviewerName: data.reviewerName || 'Anonymous',
    reviewerType: data.reviewerType || 'student',
    reviewerAvatarUrl: data.reviewerAvatarUrl || '',
    rating: Number(data.rating) || 5,
    comment: data.comment || '',
    createdAt: data.createdAt?.toDate() || new Date(),
  };
};

/**
 * Gets reviews for a specific teacher with enhanced error handling
 */
export const getTeacherReviews = async (teacherId: string): Promise<Review[]> => {
  try {
    if (!teacherId) {
      console.warn('getTeacherReviews called with empty teacherId');
      return [];
    }
    
    console.log(`Fetching reviews for teacher: ${teacherId}`);
    
    // Using a single simple query approach with error handling
    try {
      const reviewsCollection = collection(db, 'reviews');
      const reviewsQuery = query(reviewsCollection, where('teacherId', '==', teacherId));
      
      const snapshot = await getDocs(reviewsQuery);
      console.log(`Successfully fetched ${snapshot.docs.length} reviews`);
      
      if (snapshot.empty) {
        return [];
      }
      
      // Convert and sort in memory with defensive programming to avoid errors
      const reviews = snapshot.docs.map(doc => {
        try {
          return reviewConverter(doc);
        } catch (docParseError) {
          console.error('Error parsing review document:', docParseError);
          // Return a minimal valid review object instead of failing completely
          return {
            id: doc.id,
            teacherId: teacherId,
            reviewerId: '',
            reviewerName: 'Anonymous',
            reviewerType: 'student' as const,
            rating: 5,
            comment: 'Error loading review content',
            createdAt: new Date(),
          };
        }
      });
      
      // Defensive sorting that handles invalid dates
      return reviews.sort((a, b) => {
        // Ensure both dates are valid before comparison
        const timeA = a.createdAt instanceof Date && !isNaN(a.createdAt.getTime()) 
          ? a.createdAt.getTime() 
          : 0;
        const timeB = b.createdAt instanceof Date && !isNaN(b.createdAt.getTime()) 
          ? b.createdAt.getTime() 
          : 0;
        return timeB - timeA; // Descending order (newest first)
      });
    } catch (queryError) {
      console.error('Error querying reviews:', queryError);
      
      // Don't propagate Firebase errors to UI - return empty array instead
      return [];
    }
  } catch (error) {
    console.error('Fatal error in getTeacherReviews:', error);
    
    // Don't propagate errors to UI
    return [];
  }
};

/**
 * Adds a new review for a teacher with enhanced error handling
 */
export const addTeacherReview = async (review: Omit<Review, 'id' | 'createdAt'>): Promise<string> => {
  try {
    console.log('Starting review submission process with data:', { 
      teacherId: review.teacherId,
      reviewerId: review.reviewerId,
      reviewerType: review.reviewerType
    });
    
    // Sanitize and validate review data
    const sanitizedReview = {
      teacherId: review.teacherId || '',
      reviewerId: review.reviewerId || '',
      reviewerName: review.reviewerName || 'Anonymous',
      reviewerType: (review.reviewerType === 'student' || review.reviewerType === 'parent') 
        ? review.reviewerType 
        : 'student',
      rating: Number(review.rating) || 5,
      comment: (review.comment || '').trim(),
    };
    
    // Add reviewerAvatarUrl only if it exists
    if (review.reviewerAvatarUrl) {
      Object.assign(sanitizedReview, { reviewerAvatarUrl: review.reviewerAvatarUrl });
    }
    
    // Validate required fields
    if (!sanitizedReview.teacherId) {
      throw new Error('Teacher ID is required');
    }
    if (!sanitizedReview.reviewerId) {
      throw new Error('Reviewer ID is required');
    }
    if (sanitizedReview.rating < 1 || sanitizedReview.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    if (!sanitizedReview.comment) {
      throw new Error('Review comment is required');
    }
    
    // Check if reviewer is trying to review themselves
    if (sanitizedReview.reviewerId === sanitizedReview.teacherId) {
      throw new Error('You cannot review your own profile');
    }
    
    // Verify reviewer type is valid
    if (sanitizedReview.reviewerType !== 'student' && sanitizedReview.reviewerType !== 'parent') {
      throw new Error('Only students and parents can submit reviews');
    }
    
    console.log('Review data passed validation, proceeding to write to Firestore');
    
    const reviewsRef = collection(db, 'reviews');
    
    // Use a regular Date consistently
    const docRef = await addDoc(reviewsRef, {
      ...sanitizedReview,
      createdAt: new Date()
    });
    
    console.log('Review successfully added with ID:', docRef.id);
    
    // Try to update teacher's rating, but don't block if it fails
    // Use setTimeout to make this non-blocking and prevent Firebase errors from showing to the user
    setTimeout(() => {
      updateTeacherRating(sanitizedReview.teacherId)
        .catch(ratingError => {
          console.error('Error updating teacher rating, but review was created:', ratingError);
        });
    }, 100);
    
    // Create a notification for the teacher (non-blocking)
    setTimeout(() => {
      createReviewNotification(
        sanitizedReview.teacherId,
        sanitizedReview.reviewerId,
        docRef.id,
        sanitizedReview.rating
      ).catch(notifError => {
        console.error('Error creating review notification, but review was created:', notifError);
      });
    }, 200);
    
    return docRef.id;
  } catch (error: any) {
    console.error('Error adding review:', error);
    
    // Enhanced error handling with clearer messages
    if (error.code === 'permission-denied') {
      console.error('Firebase permission denied error. Check Firestore rules for reviews collection.');
      throw new Error('You do not have permission to submit reviews. Please make sure you are logged in with a student or parent account.');
    } else if (error.code?.includes('firestore')) {
      throw new Error(`Firebase error: ${error.message || 'Unknown Firebase error'}`);
    } else {
      throw new Error(`Failed to submit review: ${error.message || 'Unknown error'}`);
    }
  }
};

/**
 * Calculates and updates the average rating for a teacher
 */
export const updateTeacherRating = async (teacherId: string): Promise<number> => {
  try {
    // Get all reviews for this teacher
    let reviews: Review[] = [];
    
    try {
      reviews = await getTeacherReviews(teacherId);
    } catch (error) {
      console.error('Error fetching reviews for rating calculation:', error);
      return 0;
    }
    
    if (!reviews || reviews.length === 0) {
      return 0;
    }
    
    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    const roundedRating = Math.round(averageRating * 10) / 10; // Round to 1 decimal place
    
    let updateSuccessful = false;
    
    // Try to update teacher document in different collections
    const collectionsToTry = ['teachers', 'users', 'profiles'];
    
    for (const collectionName of collectionsToTry) {
      if (updateSuccessful) break;
      
      try {
        const docRef = doc(db, collectionName, teacherId);
        const docSnapshot = await getDoc(docRef);
        
        if (docSnapshot.exists()) {
          try {
            await updateDoc(docRef, {
              rating: roundedRating,
              reviews: reviews.length
            });
            console.log(`Successfully updated rating in ${collectionName} collection.`);
            updateSuccessful = true;
          } catch (updateError) {
            console.error(`Error updating rating in ${collectionName}:`, updateError);
            
            // Try with string values as fallback
            try {
              await updateDoc(docRef, {
                rating: String(roundedRating),
                reviews: String(reviews.length)
              });
              console.log(`Successfully updated rating (as strings) in ${collectionName} collection.`);
              updateSuccessful = true;
            } catch (stringUpdateError) {
              console.error(`Error updating rating as strings in ${collectionName}:`, stringUpdateError);
            }
          }
        }
      } catch (collectionError) {
        console.error(`Error checking ${collectionName} collection:`, collectionError);
      }
    }
    
    if (!updateSuccessful) {
      console.warn(`Could not update rating for teacher ${teacherId} in any collection.`);
    }
    
    return roundedRating;
  } catch (error) {
    console.error('Error in updateTeacherRating:', error);
    // Don't throw the error upward to avoid breaking the review submission flow
    return 0;
  }
};

/**
 * Updates teacher's rating in Firestore safely - checks if document exists first
 * This function is deprecated and kept for reference only
 */
const updateTeacherDocument = async (docRef: any, rating: number, reviewCount: number) => {
  try {
    // Check if document exists before trying to update
    const docSnapshot = await getDoc(docRef);
    if (docSnapshot.exists()) {
      try {
        await updateDoc(docRef, {
          rating: rating,
          reviews: reviewCount
        });
        return true;
      } catch (updateError) {
        console.error(`Error updating document at path ${docRef.path}:`, updateError);
        
        // If there's a specific error with the data format, try a different approach
        try {
          // Convert numbers to strings if needed
          await updateDoc(docRef, {
            rating: String(rating),
            reviews: String(reviewCount)
          });
          return true;
        } catch (fallbackError) {
          console.error(`Fallback update also failed for ${docRef.path}:`, fallbackError);
          return false;
        }
      }
    }
    return false;
  } catch (error) {
    console.error(`Error checking document at path ${docRef.path}:`, error);
    return false;
  }
}; 