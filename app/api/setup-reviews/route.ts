import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';

// Simple admin route to create review indexes by adding a sample review
export async function GET() {
  try {
    // Check if there are any reviews
    const reviewsCollection = collection(db, 'reviews');
    const testQuery = query(reviewsCollection, limit(1));
    const snapshot = await getDocs(testQuery);
    
    if (snapshot.empty) {
      // Add a sample review to create indexes
      console.log('Creating sample review to generate indexes...');
      await addDoc(reviewsCollection, {
        teacherId: 'test-teacher-id',
        reviewerId: 'system',
        reviewerName: 'System',
        reviewerType: 'student',
        rating: 5,
        comment: 'This is a test review to initialize Firestore indexes.',
        createdAt: new Date()
      });
      
      return NextResponse.json({ 
        status: 'success', 
        message: 'Created sample review to initialize Firestore indexes'
      });
    }
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'Reviews collection already has documents'
    });
  } catch (error) {
    console.error('Error setting up reviews:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Failed to set up reviews',
      error: String(error)
    }, { status: 500 });
  }
} 