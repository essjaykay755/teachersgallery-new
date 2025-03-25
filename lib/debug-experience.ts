// Utility to debug experience data in Firebase
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

/**
 * Logs the experience field from all teacher documents
 */
export const debugTeacherExperience = async () => {
  try {
    console.log("---- DEBUGGING TEACHER EXPERIENCE DATA ----");
    
    // Check teachers collection
    console.log("Checking 'teachers' collection...");
    const teachersRef = collection(db, 'teachers');
    const teachersSnapshot = await getDocs(teachersRef);
    
    console.log(`Found ${teachersSnapshot.docs.length} documents in teachers collection`);
    
    // Log experience fields for each document
    teachersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`Teacher ${doc.id} (${data.name || 'Unknown'}):`, {
        experience: data.experience,
        typeOfExperience: typeof data.experience,
        yearsOfExperience: data.yearsOfExperience,
        typeOfYearsOfExperience: typeof data.yearsOfExperience,
        experienceYears: data.experienceYears,
        typeOfExperienceYears: typeof data.experienceYears,
      });
    });
    
    // Also check profiles collection
    console.log("\nChecking 'profiles' collection...");
    const profilesRef = collection(db, 'profiles');
    const profilesSnapshot = await getDocs(profilesRef);
    
    console.log(`Found ${profilesSnapshot.docs.length} documents in profiles collection`);
    
    // Log experience fields for teacher profiles
    profilesSnapshot.docs
      .filter(doc => {
        const data = doc.data();
        return data.userType === 'teacher' || data.role === 'teacher';
      })
      .forEach(doc => {
        const data = doc.data();
        console.log(`Teacher Profile ${doc.id} (${data.name || 'Unknown'}):`, {
          experience: data.experience,
          typeOfExperience: typeof data.experience,
          yearsOfExperience: data.yearsOfExperience,
          typeOfYearsOfExperience: typeof data.yearsOfExperience,
          experienceYears: data.experienceYears,
          typeOfExperienceYears: typeof data.experienceYears,
        });
      });
      
    console.log("---- END OF DEBUGGING ----");
  } catch (error) {
    console.error("Error debugging teacher experience:", error);
  }
};

// Export for use in a Next.js API route or client-side debugging
export default debugTeacherExperience; 