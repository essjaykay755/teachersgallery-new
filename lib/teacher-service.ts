import { db } from './firebase';
import { collection, query, where, getDocs, orderBy, limit, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  location: string;
  feesPerHour: number;
  experience: number;
  teachingMode: string;
  educationLevels: string[];
  rating: number;
  isVerified: boolean;
  isFeatured: boolean;
  avatarUrl: string;
  featuredExpiry?: Date;
}

/**
 * Converts a Firestore document to a Teacher object
 */
const teacherConverter = (doc: QueryDocumentSnapshot<DocumentData>): Teacher => {
  const data = doc.data();
  
  console.log('Teacher document data:', JSON.stringify(data));
  
  // Handle different possible field structures
  const getSubject = (): string => {
    if (Array.isArray(data.subjects) && data.subjects.length > 0) return data.subjects[0];
    if (typeof data.subject === 'string') return data.subject;
    if (typeof data.primarySubject === 'string') return data.primarySubject;
    return '';
  };
  
  const getLocation = (): string => {
    let location = '';
    let area = '';
    
    if (typeof data.location === 'string') location = data.location;
    if (typeof data.city === 'string') location = data.city;
    
    if (Array.isArray(data.areasCovered) && data.areasCovered.length > 0) area = data.areasCovered[0];
    if (typeof data.area === 'string') area = data.area;
    
    if (location && area) return `${location}, ${area}`;
    return location || area || 'Location not specified';
  };
  
  const getEducationLevels = (): string[] => {
    if (Array.isArray(data.qualifications)) return data.qualifications;
    if (Array.isArray(data.educationLevels)) return data.educationLevels;
    if (Array.isArray(data.levels)) return data.levels;
    return [];
  };
  
  // Check for featured status
  const isFeatured = !!data.isFeatured;
  const hasFeaturedExpiry = data.featuredExpiry && typeof data.featuredExpiry.toDate === 'function';
  const featuredExpiry = hasFeaturedExpiry ? data.featuredExpiry.toDate() : null;
  const isCurrentlyFeatured = isFeatured && (!featuredExpiry || featuredExpiry > new Date());
  
  return {
    id: doc.id,
    name: data.name || data.fullName || data.teacherName || 'Unknown Teacher',
    subject: getSubject(),
    location: getLocation(),
    feesPerHour: Number(data.feesPerHour) || 0,
    experience: Number(data.experience) || Number(data.yearsOfExperience) || 0,
    teachingMode: data.teachingMode || data.mode || 'Online',
    educationLevels: getEducationLevels(),
    rating: Number(data.rating) || 4.8, // Default rating until rating system is implemented
    isVerified: !!data.isVerified,
    isFeatured: isCurrentlyFeatured,
    avatarUrl: data.avatarUrl || data.photoURL || '',
    featuredExpiry: featuredExpiry,
  };
};

/**
 * Fetches all visible teacher profiles, with featured teachers first
 */
export const getTeachers = async (): Promise<Teacher[]> => {
  try {
    let allTeachers: QueryDocumentSnapshot<DocumentData>[] = [];
    
    // Check correct teachers collection
    console.log("Checking 'teachers' collection...");
    const teachersRef = collection(db, 'teachers');
    const teachersSnapshot = await getDocs(teachersRef);
    console.log(`Found ${teachersSnapshot.docs.length} documents in teachers collection`);
    allTeachers = [...teachersSnapshot.docs];
    
    // If no teachers found, also check profiles as fallback
    if (teachersSnapshot.docs.length === 0) {
      console.log("No teachers found in 'teachers' collection, checking 'profiles' collection as fallback...");
      const profilesRef = collection(db, 'profiles');
      const profilesSnapshot = await getDocs(profilesRef);
      console.log(`Found ${profilesSnapshot.docs.length} documents in profiles collection`);
      allTeachers = [...allTeachers, ...profilesSnapshot.docs];
      
      // Also check users collection as another fallback
      console.log("Checking 'users' collection as fallback...");
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      console.log(`Found ${usersSnapshot.docs.length} documents in users collection`);
      allTeachers = [...allTeachers, ...usersSnapshot.docs];
    }
    
    // Convert and filter in memory to be more lenient
    const allProfiles = allTeachers.map(doc => {
      const data = doc.data();
      console.log(`Document ID: ${doc.id}, Data:`, data);
      return { doc, data };
    });
    
    // Filter for teachers only after checking data
    const teacherDocs = allProfiles
      .filter(({ data }) => {
        // For the teachers collection, we don't need to check userType since all docs are teachers
        if (data.onboardingCompleted || data.name || data.subjects || data.teachingMode) {
          return true;
        }
        
        // For other collections, check for teacher type in multiple possible field names
        const isTeacher = 
          data.userType === 'teacher' || 
          data.type === 'teacher' || 
          data.role === 'teacher';
          
        // If we can't determine the user type but the document has teaching-related fields,
        // assume it's a teacher
        const hasTeacherFields = 
          data.subjects || 
          data.teachingMode || 
          data.feesPerHour || 
          data.qualifications;
          
        return isTeacher || hasTeacherFields;
      })
      .map(({ doc }) => doc);
    
    console.log(`Found ${teacherDocs.length} teacher documents after filtering`);
    
    const teachers = teacherDocs.map(teacherConverter);
    console.log('Processed teacher objects:', teachers);
    
    // Sort featured teachers first, then by name
    return teachers.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return [];
  }
}; 