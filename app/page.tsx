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
import { Button } from "@/app/components/ui/button";
import { Slider } from "@/app/components/ui/slider";
import { Checkbox } from "@/app/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/app/components/ui/sheet";

export default function Home() {
  // Check if device is mobile
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  // State for teachers data
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [subjectFilter, setSubjectFilter] = useState("All Subjects");
  const [locationFilter, setLocationFilter] = useState("All Locations");
  const [feeRangeFilter, setFeeRangeFilter] = useState([500]);
  const [experienceFilter, setExperienceFilter] = useState("Any Experience");
  const [teachingModeFilter, setTeachingModeFilter] = useState<string[]>([]);
  
  // Sort state
  const [sortOption, setSortOption] = useState("featured");
  
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
  
  // Apply filters and sorting
  const filteredAndSortedTeachers = useMemo(() => {
    if (!teachers.length) return [];
    
    // First, apply filters
    let result = [...teachers];
    
    // Subject filter
    if (subjectFilter !== "All Subjects") {
      result = result.filter(teacher => 
        teacher.subject === subjectFilter || 
        (teacher.subjects && teacher.subjects.includes(subjectFilter))
      );
    }
    
    // Location filter
    if (locationFilter !== "All Locations") {
      result = result.filter(teacher => teacher.location === locationFilter);
    }
    
    // Fee range filter
    if (feeRangeFilter.length > 0) {
      const maxFee = feeRangeFilter[0];
      result = result.filter(teacher => {
        // Get the fee considering both feesPerHour (primary) and feeRange (fallback)
        const fee = teacher.feesPerHour;
        
        // Simple comparison - if fee is less than or equal to maxFee, or if fee is undefined/null
        // This avoids any type errors when comparing
        return fee === undefined || fee === null || fee <= maxFee;
      });
    }
    
    // Experience filter
    if (experienceFilter !== "Any Experience") {
      result = result.filter(teacher => {
        // Skip if no experience data
        if (teacher.experience === undefined || teacher.experience === null) return false;
        
        const exp = teacher.experience;
        
        if (experienceFilter === "1-3") {
          return exp >= 1 && exp <= 3;
        } else if (experienceFilter === "3-5") {
          return exp >= 3 && exp <= 5;
        } else if (experienceFilter === "5-10") {
          return exp >= 5 && exp <= 10;
        } else if (experienceFilter === "10+") {
          return exp >= 10;
        }
        return false;
      });
    }
    
    // Teaching mode filter
    if (teachingModeFilter.length > 0) {
      result = result.filter(teacher => {
        // Check if any selected mode is in the teacher's teaching mode string
        return teachingModeFilter.some(mode => 
          teacher.teachingMode && teacher.teachingMode.includes(mode)
        );
      });
    }
    
    // Then, apply sorting
    switch (sortOption) {
      case "featured":
        return result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
      case "rating":
        return result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "experience":
        return result.sort((a, b) => {
          const aExp = typeof a.experience === 'number' ? a.experience : 0;
          const bExp = typeof b.experience === 'number' ? b.experience : 0;
          return bExp - aExp;
        });
      case "priceAsc":
        return result.sort((a, b) => {
          const aPrice = a.feesPerHour || 0;
          const bPrice = b.feesPerHour || 0;
          return aPrice - bPrice;
        });
      case "priceDesc":
        return result.sort((a, b) => {
          const aPrice = a.feesPerHour || 0;
          const bPrice = b.feesPerHour || 0;
          return bPrice - aPrice;
        });
      default:
        return result;
    }
  }, [teachers, subjectFilter, locationFilter, feeRangeFilter, experienceFilter, teachingModeFilter, sortOption]);

  // State for pagination and infinite scroll
  const itemsPerPage = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleTeachers, setVisibleTeachers] = useState<typeof filteredAndSortedTeachers>([]);
  const [hasMore, setHasMore] = useState(true);
  
  // Calculate total pages for pagination
  const totalPages = Math.ceil(filteredAndSortedTeachers.length / itemsPerPage);
  
  // Initialize visible teachers
  useEffect(() => {
    let isMounted = true;
    
    if (filteredAndSortedTeachers.length === 0) return;
    
    if (isMobile) {
      // For mobile: Initial load of first batch
      if (isMounted) {
        setVisibleTeachers(filteredAndSortedTeachers.slice(0, itemsPerPage));
        setHasMore(filteredAndSortedTeachers.length > itemsPerPage);
      }
    } else {
      // For desktop: Load current page items
      const indexOfLastItem = currentPage * itemsPerPage;
      const indexOfFirstItem = indexOfLastItem - itemsPerPage;
      if (isMounted) {
        setVisibleTeachers(filteredAndSortedTeachers.slice(indexOfFirstItem, indexOfLastItem));
      }
    }
    
    return () => {
      isMounted = false;
    };
  }, [currentPage, isMobile, filteredAndSortedTeachers, itemsPerPage]);
  
  // Load more teachers for infinite scroll
  const loadMoreTeachers = () => {
    const currentSize = visibleTeachers.length;
    const newTeachers = filteredAndSortedTeachers.slice(currentSize, currentSize + itemsPerPage);
    setVisibleTeachers(prev => [...prev, ...newTeachers]);
    
    if (currentSize + itemsPerPage >= filteredAndSortedTeachers.length) {
      setHasMore(false);
    }
  };
  
  // Change page for pagination
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Scroll to top of teacher listings when page changes
    document.querySelector('.lg\\:w-3\\/4')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle filters reset
  const handleResetFilters = () => {
    setSubjectFilter("All Subjects");
    setLocationFilter("All Locations");
    setFeeRangeFilter([500]);
    setExperienceFilter("Any Experience");
    setTeachingModeFilter([]);
  };

  // Handle teaching mode filter changes
  const handleTeachingModeChange = (mode: string, checked: boolean) => {
    if (checked) {
      setTeachingModeFilter(prev => [...prev, mode]);
    } else {
      setTeachingModeFilter(prev => prev.filter(item => item !== mode));
    }
  };

  // Shared filter content component
  const FilterContent = ({ isMobileView = false }: { isMobileView?: boolean }) => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-blue-100 p-1.5 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
          </span>
          <h3 className="font-semibold text-gray-900">Subject</h3>
        </div>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-full border-gray-300 bg-white text-gray-800 h-10 focus:ring-blue-500 focus:ring-offset-0">
            <SelectValue placeholder="Select a subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Subjects">All Subjects</SelectItem>
            <SelectItem value="Mathematics">Mathematics</SelectItem>
            <SelectItem value="Physics">Physics</SelectItem>
            <SelectItem value="Chemistry">Chemistry</SelectItem>
            <SelectItem value="English Literature">English Literature</SelectItem>
            <SelectItem value="Bengali Literature">Bengali Literature</SelectItem>
            <SelectItem value="Computer Science">Computer Science</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-green-100 p-1.5 rounded-full">
            <MapPin className="h-4 w-4 text-green-600" />
          </span>
          <h3 className="font-semibold text-gray-900">Location</h3>
        </div>
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-full border-gray-300 bg-white text-gray-800 h-10 focus:ring-blue-500 focus:ring-offset-0">
            <SelectValue placeholder="Select a location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Locations">All Locations</SelectItem>
            <SelectItem value="Mumbai">Mumbai</SelectItem>
            <SelectItem value="Delhi">Delhi</SelectItem>
            <SelectItem value="Bangalore">Bangalore</SelectItem>
            <SelectItem value="Kolkata">Kolkata</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-purple-100 p-1.5 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </span>
          <h3 className="font-semibold text-gray-900">Fee Range (₹)</h3>
        </div>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <span className="text-sm text-gray-700 font-medium">₹500</span>
          <span className="text-sm text-gray-700 font-medium">₹{feeRangeFilter[0]}</span>
        </div>
        <Slider
          value={feeRangeFilter}
          onValueChange={setFeeRangeFilter}
          max={5000}
          min={500}
          step={100}
          className="h-2"
        />
      </div>
      
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-amber-100 p-1.5 rounded-full">
            <GraduationCap className="h-4 w-4 text-amber-600" />
          </span>
          <h3 className="font-semibold text-gray-900">Experience</h3>
        </div>
        <Select value={experienceFilter} onValueChange={setExperienceFilter}>
          <SelectTrigger className="w-full border-gray-300 bg-white text-gray-800 h-10 focus:ring-blue-500 focus:ring-offset-0">
            <SelectValue placeholder="Select experience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Any Experience">Any Experience</SelectItem>
            <SelectItem value="1-3">1-3 years</SelectItem>
            <SelectItem value="3-5">3-5 years</SelectItem>
            <SelectItem value="5-10">5-10 years</SelectItem>
            <SelectItem value="10+">10+ years</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-blue-100 p-1.5 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
          </span>
          <h3 className="font-semibold text-gray-900">Teaching Mode</h3>
        </div>
        <div className="space-y-3 mt-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id={isMobileView ? "mobile-online" : "online"} 
              checked={teachingModeFilter.includes("Online")}
              onCheckedChange={(checked) => handleTeachingModeChange("Online", checked as boolean)}
            />
            <label 
              htmlFor={isMobileView ? "mobile-online" : "online"} 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700"
            >
              Online
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id={isMobileView ? "mobile-offline" : "offline"} 
              checked={teachingModeFilter.includes("Offline")}
              onCheckedChange={(checked) => handleTeachingModeChange("Offline", checked as boolean)}
            />
            <label 
              htmlFor={isMobileView ? "mobile-offline" : "offline"} 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700"
            >
              Offline
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id={isMobileView ? "mobile-hybrid" : "hybrid"} 
              checked={teachingModeFilter.includes("Hybrid")}
              onCheckedChange={(checked) => handleTeachingModeChange("Hybrid", checked as boolean)}
            />
            <label 
              htmlFor={isMobileView ? "mobile-hybrid" : "hybrid"} 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700"
            >
              Hybrid
            </label>
          </div>
        </div>
      </div>
      
      {isMobileView && (
        <div className="pt-4 space-y-3">
          <Button className="w-full" onClick={() => {}}>Apply Filters</Button>
          <Button 
            className="w-full" 
            variant="outline" 
            onClick={handleResetFilters}
          >
            Reset Filters
          </Button>
        </div>
      )}
      
      {!isMobileView && (
        <div className="pt-4">
          <Button 
            className="w-full" 
            variant="outline" 
            onClick={handleResetFilters}
          >
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  );

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
          {/* Mobile Filter Button - Fixed in the middle left of the page */}
          <div className="lg:hidden fixed left-0 top-1/2 z-40 transform -translate-y-1/2">
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-12 w-12 rounded-r-full rounded-l-none bg-white shadow-md border-gray-200"
                >
                  <Filter className="h-5 w-5 text-gray-700" />
                  <span className="sr-only">Open filters</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 sm:w-96 pt-6">
                <SheetHeader className="pb-4">
                  <SheetTitle className="text-xl font-semibold flex items-center gap-2">
                    <Filter className="h-4 w-4" /> Filters
                  </SheetTitle>
                </SheetHeader>
                
                {/* Mobile filters content */}
                <div className="mt-2">
                  <FilterContent isMobileView={true} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Desktop Filters sidebar - hidden on mobile */}
          <div className="hidden lg:block lg:w-1/5">
            <div className="bg-white rounded-xl shadow-sm p-5 lg:sticky lg:top-20 border border-gray-200">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <Filter className="h-4 w-4 text-gray-500" />
              </div>
              
              <FilterContent />
            </div>
          </div>
          
          {/* Teachers Grid */}
          <div className="lg:w-3/4">
            {/* All Teachers header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">All Teachers</h2>
                <span className="text-xs bg-blue-100 text-blue-600 font-medium rounded-full px-2 py-0.5">{filteredAndSortedTeachers.length}</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-sm text-gray-600">Sort by:</span>
                <Select value={sortOption} onValueChange={setSortOption}>
                  <SelectTrigger className="h-9 border-gray-300 bg-white min-w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="experience">Experience</SelectItem>
                    <SelectItem value="priceAsc">Price: Low to High</SelectItem>
                    <SelectItem value="priceDesc">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Error state */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                <p>{error}</p>
              </div>
            )}
            
            {/* Loading state */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 h-64 animate-pulse">
                    <div className="p-6 flex items-start space-x-4">
                      <div className="rounded-full bg-gray-200 h-16 w-16"></div>
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="px-6 pb-6">
                      <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* No results state */}
            {!isLoading && filteredAndSortedTeachers.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-10 text-center">
                <GraduationCap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No teachers found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  We couldn't find any teachers matching your criteria. Try adjusting your filters or check back later.
                </p>
              </div>
            )}
            
            {/* Teachers grid */}
            {!isLoading && visibleTeachers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
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
                  />
                ))}
              </div>
            )}
            
            {/* Pagination */}
            <div className="mt-10">
              {isMobile ? (
                hasMore && !isLoading && (
                  <Button 
                    onClick={loadMoreTeachers} 
                    variant="outline" 
                    size="lg" 
                    className="w-full py-6 text-base"
                  >
                    Load More Teachers
                  </Button>
                )
              ) : (
                totalPages > 1 && !isLoading && (
                  <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onPageChange={handlePageChange} 
                  />
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
