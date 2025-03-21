"use client";

import { TeacherCard } from "@/app/components/teacher/teacher-card";
import { MapPin, ChevronDown, GraduationCap, Filter } from "lucide-react";
import { Pagination } from "./components/shared/pagination";
import { useState, useEffect, useMemo } from "react";
import { useMediaQuery } from "@/lib/hooks";
import { getTeachers, Teacher } from "@/lib/teacher-service";

export default function Home() {
  // Check if device is mobile
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  // State for teachers data
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch teachers from Firestore on component mount
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setIsLoading(true);
        const teachersData = await getTeachers();
        setTeachers(teachersData);
        setError(null);
      } catch (err) {
        console.error('Error fetching teachers:', err);
        setError('Failed to load teachers. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeachers();
  }, []);
  
  // Use useMemo to prevent recreating arrays on every render
  const sortedTeachers = useMemo(() => {
    if (!teachers.length) return [];
    
    // Teachers are already sorted in the service, but we can add additional sorting here if needed
    return teachers;
  }, [teachers]);

  // State for pagination and infinite scroll
  const itemsPerPage = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleTeachers, setVisibleTeachers] = useState<typeof sortedTeachers>([]);
  const [hasMore, setHasMore] = useState(true);
  
  // Calculate total pages for pagination
  const totalPages = Math.ceil(sortedTeachers.length / itemsPerPage);
  
  // Initialize visible teachers
  useEffect(() => {
    let isMounted = true;
    
    if (sortedTeachers.length === 0) return;
    
    if (isMobile) {
      // For mobile: Initial load of first batch
      if (isMounted) {
        setVisibleTeachers(sortedTeachers.slice(0, itemsPerPage));
        setHasMore(sortedTeachers.length > itemsPerPage);
      }
    } else {
      // For desktop: Load current page items
      const indexOfLastItem = currentPage * itemsPerPage;
      const indexOfFirstItem = indexOfLastItem - itemsPerPage;
      if (isMounted) {
        setVisibleTeachers(sortedTeachers.slice(indexOfFirstItem, indexOfLastItem));
      }
    }
    
    return () => {
      isMounted = false;
    };
  }, [currentPage, isMobile, sortedTeachers, itemsPerPage]);
  
  // Load more teachers for infinite scroll
  const loadMoreTeachers = () => {
    const currentSize = visibleTeachers.length;
    const newTeachers = sortedTeachers.slice(currentSize, currentSize + itemsPerPage);
    setVisibleTeachers(prev => [...prev, ...newTeachers]);
    
    if (currentSize + itemsPerPage >= sortedTeachers.length) {
      setHasMore(false);
    }
  };
  
  // Change page for pagination
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Scroll to top of teacher listings when page changes
    document.querySelector('.lg\\:w-3\\/4')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="bg-gray-50 min-h-screen pb-10">
      {/* Hero section */}
      <div className="bg-black text-white py-10 text-center relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-black/80 z-0"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center">
            <div className="mb-2">
              <GraduationCap className="h-8 w-8 text-blue-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Get your best teacher with <span className="text-blue-400">TeachersGallery</span></h1>
            <p className="text-gray-300 max-w-2xl mx-auto mb-6">
              Find the perfect teacher for your learning journey. Choose from our curated selection of experienced educators.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow p-4 lg:sticky lg:top-20">
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Subject</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <select className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                      <option>All Subjects</option>
                      <option>Mathematics</option>
                      <option>Physics</option>
                      <option>Chemistry</option>
                      <option>English Literature</option>
                      <option>Bengali Literature</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Location</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <select className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                      <option>All Locations</option>
                      <option>Mumbai, Maharashtra</option>
                      <option>Delhi, NCR</option>
                      <option>Bangalore, Karnataka</option>
                      <option>Kolkata, West Bengal</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Fee Range (₹/hr)</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">₹500</span>
                  <span className="text-sm text-gray-600">₹5000</span>
                </div>
                <input 
                  type="range" 
                  min="500" 
                  max="5000" 
                  step="100" 
                  defaultValue="1000" 
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" 
                />
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Experience</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <select className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                      <option>Any Experience</option>
                      <option>1-3 years</option>
                      <option>3-5 years</option>
                      <option>5-10 years</option>
                      <option>10+ years</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Teaching Mode</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="checkbox" id="online" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <label htmlFor="online" className="ml-2 text-sm text-gray-700">Online</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="offline" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <label htmlFor="offline" className="ml-2 text-sm text-gray-700">Offline</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="hybrid" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <label htmlFor="hybrid" className="ml-2 text-sm text-gray-700">Hybrid</label>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Availability</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="checkbox" id="weekdays" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" defaultChecked />
                    <label htmlFor="weekdays" className="ml-2 text-sm text-gray-700">Weekdays</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="weekends" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" defaultChecked />
                    <label htmlFor="weekends" className="ml-2 text-sm text-gray-700">Weekends</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="evening" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <label htmlFor="evening" className="ml-2 text-sm text-gray-700">Evening</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Teacher listing */}
          <div className="lg:w-3/4">
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-semibold">All Teachers 
                  {!isLoading && <span className="text-sm font-normal text-gray-500 ml-2">{sortedTeachers.length}</span>}
                </h2>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">Sort by:</span>
                  <div className="relative">
                    <select className="appearance-none border border-gray-300 rounded px-4 py-1 pr-8 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Last updated</option>
                      <option>Price: Low to High</option>
                      <option>Price: High to Low</option>
                      <option>Rating: High to Low</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-2 h-4 w-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                <p>{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            ) : sortedTeachers.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <p>No teachers found. Please check back later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
                {visibleTeachers.map((teacher) => {
                  // Ensure all required props are defined with fallbacks
                  const safeTeacher = {
                    id: teacher.id || 'unknown',
                    name: teacher.name || 'Unknown Teacher',
                    subject: teacher.subject || 'General',
                    location: teacher.location || 'Not specified',
                    feesPerHour: typeof teacher.feesPerHour === 'number' && teacher.feesPerHour > 0 
                      ? teacher.feesPerHour 
                      : teacher.feeRange?.min || 0,
                    experience: typeof teacher.experience === 'number' ? teacher.experience : 0,
                    teachingMode: teacher.teachingMode || 'Online',
                    educationLevels: Array.isArray(teacher.educationLevels) ? teacher.educationLevels : [],
                    rating: typeof teacher.rating === 'number' ? teacher.rating : 4.5,
                    isVerified: !!teacher.isVerified,
                    isFeatured: !!teacher.isFeatured,
                    avatarUrl: teacher.avatarUrl || ''
                  };
                  
                  return (
                    <TeacherCard
                      key={safeTeacher.id}
                      id={safeTeacher.id}
                      name={safeTeacher.name}
                      subject={safeTeacher.subject}
                      location={safeTeacher.location}
                      feesPerHour={safeTeacher.feesPerHour}
                      experience={safeTeacher.experience}
                      teachingMode={safeTeacher.teachingMode}
                      educationLevels={safeTeacher.educationLevels}
                      rating={safeTeacher.rating}
                      isVerified={safeTeacher.isVerified}
                      isFeatured={safeTeacher.isFeatured}
                      avatarUrl={safeTeacher.avatarUrl}
                    />
                  );
                })}
              </div>
            )}
            
            {/* Pagination or Load More Button */}
            {!isLoading && sortedTeachers.length > 0 && (
              <div className="mt-6 flex justify-center">
                {isMobile ? (
                  hasMore && (
                    <button 
                      onClick={loadMoreTeachers}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Load More
                    </button>
                  )
                ) : (
                  <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onPageChange={handlePageChange} 
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
