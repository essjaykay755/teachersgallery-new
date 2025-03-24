import { db } from './firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, limit, QueryDocumentSnapshot, DocumentData, getDoc, doc, updateDoc } from 'firebase/firestore';

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
 * Gets reviews for a specific teacher with a more basic approach
 */
export const getTeacherReviews = async (teacherId: string): Promise<Review[]> => {
  try {
    console.log(`Fetching reviews for teacher: ${teacherId}`);
    
    // Using a more reliable approach to query reviews
    const reviewsCollection = collection(db, 'reviews');
    
    // First try a basic query with just the teacherId filter
    try {
      const basicQuery = query(reviewsCollection, where('teacherId', '==', teacherId));
      const snapshot = await getDocs(basicQuery);
      
      console.log(`Successfully fetched ${snapshot.docs.length} reviews`);
      
      // Convert and sort in memory to avoid index issues
      const reviews = snapshot.docs.map(reviewConverter);
      
      return reviews.sort((a, b) => {
        // Defensive sorting that handles missing or invalid dates
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return timeB - timeA; // Descending order (newest first)
      });
      
    } catch (primaryError) {
      console.error('Error with primary query approach:', primaryError);
      
      // If the primary approach fails, try an even more basic approach
      try {
        // Get all reviews (limited to a reasonable number)
        const fallbackQuery = query(reviewsCollection, limit(100));
        const allDocs = await getDocs(fallbackQuery);
        
        // Filter in memory
        const filteredDocs = allDocs.docs.filter(
          doc => doc.data().teacherId === teacherId
        );
        
        console.log(`Fallback query: Found ${filteredDocs.length} reviews for teacher`);
        
        // Convert and sort
        const reviews = filteredDocs.map(reviewConverter);
        return reviews.sort((a, b) => {
          const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          return timeB - timeA;
        });
        
      } catch (fallbackError) {
        console.error('Even fallback query failed:', fallbackError);
        throw fallbackError;
      }
    }
  } catch (error) {
    console.error('Fatal error in getTeacherReviews:', error);
    throw error;
  }
};

/**
 * Adds a new review for a teacher
 */
export const addTeacherReview = async (review: Omit<Review, 'id' | 'createdAt'>): Promise<string> => {
  try {
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
    
    const reviewsRef = collection(db, 'reviews');
    
    try {
      // Try with serverTimestamp first
      const docRef = await addDoc(reviewsRef, {
        ...sanitizedReview,
        createdAt: serverTimestamp()
      });
      
      // Update teacher's average rating
      await updateTeacherRating(sanitizedReview.teacherId);
      
      return docRef.id;
    } catch (timestampError) {
      console.error('Error with serverTimestamp, trying fallback:', timestampError);
      
      // Fallback to regular Date if serverTimestamp fails
      const docRef = await addDoc(reviewsRef, {
        ...sanitizedReview,
        createdAt: new Date()
      });
      
      // Update teacher's average rating
      await updateTeacherRating(sanitizedReview.teacherId);
      
      return docRef.id;
    }
  } catch (error) {
    console.error('Error adding review:', error);
    throw error;
  }
};

/**
 * Calculates and updates the average rating for a teacher
 */
export const updateTeacherRating = async (teacherId: string): Promise<number> => {
  try {
    const reviews = await getTeacherReviews(teacherId);
    
    if (reviews.length === 0) {
      return 0;
    }
    
    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    const roundedRating = Math.round(averageRating * 10) / 10; // Round to 1 decimal place
    
    // Update teacher's rating in Firestore
    // First try the teachers collection
    try {
      const teacherRef = doc(db, 'teachers', teacherId);
      const teacherDoc = await getDoc(teacherRef);
      
      if (teacherDoc.exists()) {
        await updateTeacherDocument(teacherRef, roundedRating, reviews.length);
        return roundedRating;
      }
    } catch (error) {
      console.error('Error updating teacher in teachers collection:', error);
    }
    
    // Try the users collection if teachers collection update failed
    try {
      const userRef = doc(db, 'users', teacherId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        await updateTeacherDocument(userRef, roundedRating, reviews.length);
        return roundedRating;
      }
    } catch (error) {
      console.error('Error updating teacher in users collection:', error);
    }
    
    // Try the profiles collection as a last resort
    try {
      const profileRef = doc(db, 'profiles', teacherId);
      const profileDoc = await getDoc(profileRef);
      
      if (profileDoc.exists()) {
        await updateTeacherDocument(profileRef, roundedRating, reviews.length);
        return roundedRating;
      }
    } catch (error) {
      console.error('Error updating teacher in profiles collection:', error);
    }
    
    console.warn(`Could not find teacher document to update rating for teacher ${teacherId}`);
    return roundedRating;
  } catch (error) {
    console.error('Error updating teacher rating:', error);
    throw error;
  }
};

/**
 * Updates teacher's rating in Firestore safely - checks if document exists first
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