import { db } from './firebase';
import { collection, query, where, getDocs, orderBy, limit, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { getTeacherReviews } from './review-service';

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  subjects?: string[];
  location: string;
  feesPerHour: number;
  feeRange?: {
    min: number;
    max: number;
  };
  experience: number;
  teachingMode: string;
  educationLevels: string[];
  rating: number;
  reviews?: number;
  students?: number;
  isVerified: boolean;
  isFeatured: boolean;
  isVisible: boolean;
  avatarUrl: string;
  featuredExpiry?: Date;
  about?: string;
  methodology?: string;
  achievements?: string[];
  education?: Array<{
    year?: string;
    degree?: string;
    institution?: string;
  }>;
  workHistory?: Array<{
    position: string;
    organization: string;
    startDate: string;
    endDate: string;
    description: string;
    current?: boolean;
  }>;
}

/**
 * Converts a Firestore document to a Teacher object
 */
const teacherConverter = (doc: QueryDocumentSnapshot<DocumentData>): Teacher => {
  const data = doc.data();
  
  console.log('Teacher document data for ' + doc.id + ':', data);
  console.log('Raw teaching mode value:', data.teachingMode);
  console.log('Raw experience value:', data.experience);
  console.log('Raw yearsOfExperience value:', data.yearsOfExperience);
  console.log('Raw rating value:', data.rating);
  
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
  
  const getTeachingModes = (): string => {
    if (Array.isArray(data.teachingModes)) {
      return data.teachingModes.join(', ');
    }
    if (Array.isArray(data.teachingMode)) {
      return data.teachingMode.join(', ');
    }
    if (typeof data.teachingMode === 'string') {
      return data.teachingMode;
    }
    if (data.mode) {
      if (Array.isArray(data.mode)) {
        return data.mode.join(', ');
      }
      return String(data.mode);
    }
    return 'Online';
  };
  
  return {
    id: doc.id,
    name: data.name || data.fullName || data.teacherName || 'Unknown Teacher',
    subject: getSubject(),
    subjects: Array.isArray(data.subjects) ? data.subjects : (data.subject ? [data.subject] : []),
    location: getLocation(),
    feesPerHour: Number(data.feesPerHour) || 0,
    feeRange: data.feeRange || null,
    experience: Number(data.experience) || Number(data.yearsOfExperience) || Number(data.experienceYears) || 0,
    teachingMode: getTeachingModes(),
    educationLevels: getEducationLevels() || [],
    rating: Number(data.rating) || 0, // Only use actual rating from DB, don't generate synthetic ones
    reviews: Number(data.reviewsCount) || Number(data.reviews) || 0, // Only use actual review count
    students: Number(data.studentsCount) || Number(data.students) || 0,
    isVerified: !!data.isVerified,
    isFeatured: isCurrentlyFeatured,
    isVisible: data.isVisible !== false, // Default to true unless explicitly set to false
    avatarUrl: data.avatarUrl || data.photoURL || '',
    featuredExpiry: featuredExpiry,
    about: data.about || data.bio || data.description || '',
    methodology: data.methodology || data.teachingMethodology || '',
    achievements: Array.isArray(data.achievements) ? data.achievements : [],
    education: Array.isArray(data.education) ? data.education : 
              (data.education ? [data.education] : []),
    workHistory: data.workHistory || [],
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
          // Check if isVisible is explicitly set to false
          if (data.isVisible === false) {
            return false;
          }
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
          
        // Check visibility for teachers from other collections too  
        if (data.isVisible === false) {
          return false;
        }
          
        return isTeacher || hasTeacherFields;
      })
      .map(({ doc }) => doc);
    
    console.log(`Found ${teacherDocs.length} teacher documents after filtering`);
    
    // Convert and validate each teacher document
    let validTeachers: Teacher[] = [];
    
    for (const doc of teacherDocs) {
      try {
        // First get basic teacher data
        const teacher = teacherConverter(doc);
        
        // Then fetch actual reviews for this teacher
        try {
          const reviews = await getTeacherReviews(teacher.id);
          
          if (reviews && reviews.length > 0) {
            // Calculate average rating from actual reviews
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = totalRating / reviews.length;
            const roundedRating = Math.round(averageRating * 10) / 10; // Round to 1 decimal place
            
            // Update the teacher object with real rating data
            teacher.rating = roundedRating;
            teacher.reviews = reviews.length;
            
            console.log(`Updated teacher ${teacher.name} with actual reviews data: rating=${roundedRating}, count=${reviews.length}`);
          }
        } catch (reviewError) {
          console.error(`Error fetching reviews for teacher ${teacher.id}:`, reviewError);
          // Keep using the default/generated values if there was an error
        }
        
        // Log the final rating that will be displayed
        console.log(`Teacher ${teacher.id} (${teacher.name}): Final Rating = ${teacher.rating}, Reviews = ${teacher.reviews}`);
        validTeachers.push(teacher);
      } catch (err) {
        console.error(`Error converting teacher document ${doc.id}:`, err);
        // Skip the problematic document and continue
      }
    }
    
    console.log(`Successfully converted ${validTeachers.length} teacher documents`);
    
    // Sort featured teachers first, then by name
    return validTeachers.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return [];
  }
};

/**
 * Get unique subjects from all teachers
 */
export const getUniqueSubjects = async (): Promise<string[]> => {
  const teachers = await getTeachers();
  const subjectsSet = new Set<string>();
  
  teachers.forEach(teacher => {
    if (teacher.subjects) {
      teacher.subjects.forEach(subject => subjectsSet.add(subject));
    }
    if (teacher.subject) {
      subjectsSet.add(teacher.subject);
    }
  });
  
  return Array.from(subjectsSet).sort();
};

/**
 * Get unique locations from all teachers
 */
export const getUniqueLocations = async (): Promise<string[]> => {
  const teachers = await getTeachers();
  const locationsSet = new Set<string>();
  
  teachers.forEach(teacher => {
    if (teacher.location) {
      locationsSet.add(teacher.location);
    }
  });
  
  return Array.from(locationsSet).sort();
};

/**
 * Get fee range (min and max) from all teachers
 */
export const getFeeRange = async (): Promise<{ min: number; max: number }> => {
  const teachers = await getTeachers();
  let min = Infinity;
  let max = 0;
  
  teachers.forEach(teacher => {
    if (teacher.feesPerHour) {
      min = Math.min(min, teacher.feesPerHour);
      max = Math.max(max, teacher.feesPerHour);
    }
  });
  
  return { min: min === Infinity ? 0 : min, max: max === 0 ? 1000 : max };
};

/**
 * Get unique teaching modes from all teachers
 */
export const getTeachingModes = async (): Promise<string[]> => {
  const teachers = await getTeachers();
  const modesSet = new Set<string>();
  
  teachers.forEach(teacher => {
    if (teacher.teachingMode) {
      // Split by comma if it's a comma-separated string
      const modes = teacher.teachingMode.split(',').map(mode => mode.trim());
      modes.forEach(mode => modesSet.add(mode));
    }
  });
  
  return Array.from(modesSet).sort();
}; 