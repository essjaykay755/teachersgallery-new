"use client";

import { TeacherCard } from "@/app/components/teacher/teacher-card";
import { MapPin, ChevronDown, GraduationCap, Filter, Search } from "lucide-react";
import { Pagination } from "./components/shared/pagination";
import { useState, useEffect, useMemo } from "react";
import { useMediaQuery } from "@/lib/hooks";
import { getTeachers, Teacher } from "@/lib/teacher-service";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/app/components/ui/select";
import { Button } from "@/app/components/shared/button";
import { cn } from "@/lib/utils";

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
        console.log('Teachers data fetched:', teachersData);
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
      <div className="bg-black text-white py-16 text-center relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center">
            <div className="mb-6">
              <GraduationCap className="h-10 w-10 text-blue-500 mx-auto" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Get your best teacher with <span className="text-blue-500">TeachersGallery</span></h1>
            <p className="text-gray-400 max-w-2xl mx-auto mb-8 text-lg">
              Find the perfect teacher for your learning journey. Choose from our curated selection of experienced educators.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-xl shadow-lg p-6 lg:sticky lg:top-20 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                <Filter className="h-5 w-5 text-blue-600" />
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <span className="bg-blue-100 p-1.5 rounded-md mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                  </span>
                  Subject
                </h3>
                <div className="mt-2">
                  <Select defaultValue="All Subjects">
                    <SelectTrigger className="w-full border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Subjects">All Subjects</SelectItem>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="Physics">Physics</SelectItem>
                      <SelectItem value="Chemistry">Chemistry</SelectItem>
                      <SelectItem value="English Literature">English Literature</SelectItem>
                      <SelectItem value="Bengali Literature">Bengali Literature</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <span className="bg-green-100 p-1.5 rounded-md mr-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </span>
                  Location
                </h3>
                <div className="mt-2">
                  <Select defaultValue="All Locations">
                    <SelectTrigger className="w-full border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all">
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Locations">All Locations</SelectItem>
                      <SelectItem value="Mumbai, Maharashtra">Mumbai, Maharashtra</SelectItem>
                      <SelectItem value="Delhi, NCR">Delhi, NCR</SelectItem>
                      <SelectItem value="Bangalore, Karnataka">Bangalore, Karnataka</SelectItem>
                      <SelectItem value="Kolkata, West Bengal">Kolkata, West Bengal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <span className="bg-purple-100 p-1.5 rounded-md mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  </span>
                  Fee Range (₹/hr)
                </h3>
                <div className="flex items-center justify-between mt-2 mb-2">
                  <span className="text-sm font-medium text-gray-700">₹500</span>
                  <span className="text-sm font-medium text-gray-700">₹5000</span>
                </div>
                <input 
                  type="range" 
                  min="500" 
                  max="5000" 
                  step="100" 
                  defaultValue="1000" 
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                />
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <span className="bg-amber-100 p-1.5 rounded-md mr-2">
                    <GraduationCap className="h-4 w-4 text-amber-600" />
                  </span>
                  Experience
                </h3>
                <div className="mt-2">
                  <Select defaultValue="Any Experience">
                    <SelectTrigger className="w-full border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all">
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Any Experience">Any Experience</SelectItem>
                      <SelectItem value="1-3 years">1-3 years</SelectItem>
                      <SelectItem value="3-5 years">3-5 years</SelectItem>
                      <SelectItem value="5-10 years">5-10 years</SelectItem>
                      <SelectItem value="10+ years">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <span className="bg-blue-100 p-1.5 rounded-md mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="3" y1="9" x2="21" y2="9"></line>
                      <line x1="9" y1="21" x2="9" y2="9"></line>
                    </svg>
                  </span>
                  Teaching Mode
                </h3>
                <div className="space-y-3 mt-2">
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
              
              <div className="mb-2">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <span className="bg-red-100 p-1.5 rounded-md mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </span>
                  Availability
                </h3>
                <div className="space-y-3 mt-2">
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
              
              <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white">
                Apply Filters
              </Button>
            </div>
          </div>
          
          {/* Teacher listing */}
          <div className="lg:w-3/4">
            <div className="bg-white rounded-xl shadow-lg p-5 mb-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center">
                  <h2 className="text-xl font-bold text-gray-900">All Teachers</h2>
                  {!isLoading && 
                    <span className="text-sm bg-blue-100 text-blue-800 font-semibold rounded-full px-3 py-1 ml-3">
                      {sortedTeachers.length}
                    </span>
                  }
                </div>
                <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 p-1 pr-2">
                  <span className="text-sm text-gray-600 mr-2 pl-2">Sort by:</span>
                  <div className="relative">
                    <Select defaultValue="last-updated">
                      <SelectTrigger className="border-0 bg-transparent focus:ring-0 focus:ring-offset-0 h-8 pt-1 pb-1 pl-0 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last-updated">Last updated</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="rating">Rating: High to Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600 bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                <p className="text-lg font-medium">{error}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                {visibleTeachers.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-100">
                    <div className="mb-4">
                      <Search className="mx-auto h-16 w-16 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No teachers found</h3>
                    <p className="text-gray-500">Try adjusting your filters to find what you're looking for.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {visibleTeachers.map((teacher) => (
                      <TeacherCard
                        key={teacher.id}
                        id={teacher.id}
                        name={teacher.name}
                        avatarUrl={teacher.avatarUrl}
                        subject={teacher.subject}
                        subjects={teacher.subjects}
                        location={teacher.location}
                        feesPerHour={teacher.feesPerHour}
                        feeRange={teacher.feeRange}
                        experience={teacher.experience}
                        teachingMode={teacher.teachingMode}
                        educationLevels={teacher.educationLevels}
                        rating={teacher.rating}
                        reviews={teacher.reviews}
                        isVerified={teacher.isVerified}
                        isFeatured={teacher.isFeatured}
                        className="h-full transition-transform hover:translate-y-[-4px]"
                      />
                    ))}
                  </div>
                )}
              </>
            )}
            
            {/* Pagination or Load More Button */}
            {!isLoading && sortedTeachers.length > 0 && (
              <div className="mt-6 flex justify-center">
                {isMobile ? (
                  hasMore && (
                    <Button 
                      onClick={loadMoreTeachers}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Load More
                    </Button>
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
