"use client";

import { TeacherCard } from "@/app/components/teacher/teacher-card";
import { MapPin, ChevronDown, GraduationCap, Filter, Search } from "lucide-react";
import { Pagination } from "./components/shared/pagination";
import { useState, useEffect, useMemo } from "react";
import { useMediaQuery } from "@/lib/hooks";
import { getTeachers, Teacher, getUniqueSubjects, getUniqueLocations, getFeeRange, getTeachingModes } from "@/lib/teacher-service";
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
  
  // State for filter options
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [locationOptions, setLocationOptions] = useState<string[]>([]);
  const [feeRange, setFeeRange] = useState<{ min: number; max: number }>({ min: 0, max: 1000 });
  const [teachingModeOptions, setTeachingModeOptions] = useState<string[]>([]);
  
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
  
  // Fetch filter options on component mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [subjects, locations, fees, modes] = await Promise.all([
          getUniqueSubjects(),
          getUniqueLocations(),
          getFeeRange(),
          getTeachingModes()
        ]);
        
        setSubjectOptions(subjects);
        setLocationOptions(locations);
        setFeeRange(fees);
        setTeachingModeOptions(modes);
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    };
    
    fetchFilterOptions();
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

  // Update FilterContent component to use dynamic options
  const FilterContent = ({ isMobileView = false }: { isMobileView?: boolean }) => (
    <div className="space-y-6">
      {/* Subject Filter */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-blue-100 p-1.5 rounded-full">
            <GraduationCap className="h-4 w-4 text-blue-600" />
          </span>
          <h3 className="font-semibold text-gray-900">Subject</h3>
        </div>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-full border-gray-300 bg-white text-gray-800 h-10 focus:ring-blue-500 focus:ring-offset-0">
            <SelectValue placeholder="Select a subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Subjects">All Subjects</SelectItem>
            {subjectOptions.map((subject) => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Location Filter */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-blue-100 p-1.5 rounded-full">
            <MapPin className="h-4 w-4 text-blue-600" />
          </span>
          <h3 className="font-semibold text-gray-900">Location</h3>
        </div>
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-full border-gray-300 bg-white text-gray-800 h-10 focus:ring-blue-500 focus:ring-offset-0">
            <SelectValue placeholder="Select a location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Locations">All Locations</SelectItem>
            {locationOptions.map((location) => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Fee Range Filter */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-blue-100 p-1.5 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </span>
          <h3 className="font-semibold text-gray-900">Fee Range (₹/hr)</h3>
        </div>
        <div className="pt-2 px-1">
          <Slider
            defaultValue={[feeRange.max]}
            max={feeRange.max}
            min={feeRange.min}
            step={50}
            value={feeRangeFilter}
            onValueChange={setFeeRangeFilter}
            className="w-full"
          />
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <span>₹{feeRange.min}</span>
            <span>₹{feeRangeFilter[0]}</span>
            <span>₹{feeRange.max}</span>
          </div>
        </div>
      </div>

      {/* Experience Filter */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-blue-100 p-1.5 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          </span>
          <h3 className="font-semibold text-gray-900">Experience</h3>
        </div>
        <Select value={experienceFilter} onValueChange={setExperienceFilter}>
          <SelectTrigger className="w-full border-gray-300 bg-white text-gray-800 h-10 focus:ring-blue-500 focus:ring-offset-0">
            <SelectValue placeholder="Select experience range" />
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

      {/* Teaching Mode Filter */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-blue-100 p-1.5 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h18M3 6h18M3 18h18"></path>
            </svg>
          </span>
          <h3 className="font-semibold text-gray-900">Teaching Mode</h3>
        </div>
        <div className="space-y-2">
          {teachingModeOptions.map((mode) => (
            <div key={mode} className="flex items-center">
              <Checkbox
                id={`mode-${mode}`}
                checked={teachingModeFilter.includes(mode)}
                onCheckedChange={(checked) => handleTeachingModeChange(mode, checked as boolean)}
              />
              <label
                htmlFor={`mode-${mode}`}
                className="ml-2 text-sm font-medium text-gray-700 cursor-pointer"
              >
                {mode}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Reset Filters Button */}
      <Button
        onClick={handleResetFilters}
        variant="outline"
        className="w-full mt-4"
      >
        Reset Filters
      </Button>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              All Teachers
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {filteredAndSortedTeachers.length}
              </span>
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Find and connect with qualified teachers in your area
            </p>
          </div>

          {/* Sort Dropdown */}
          <div className="w-full md:w-48">
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-full border-gray-300 bg-white">
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

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Section - Desktop */}
          <div className="hidden lg:block lg:w-1/4">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <FilterContent />
            </div>
          </div>

          {/* Mobile Filter Button */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  <FilterContent isMobileView />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Teachers Grid */}
          <div className="lg:w-3/4">
            {isLoading ? (
              // Loading state
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              // Error state
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">{error}</div>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            ) : filteredAndSortedTeachers.length === 0 ? (
              // No results state
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No teachers found matching your criteria</p>
                <Button onClick={handleResetFilters}>
                  Reset Filters
                </Button>
              </div>
            ) : (
              // Teachers grid
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {visibleTeachers.map((teacher) => (
                    <TeacherCard key={teacher.id} teacher={teacher} />
                  ))}
                </div>
                
                {/* Pagination or Load More */}
                {isMobile ? (
                  hasMore && (
                    <div className="mt-8 text-center">
                      <Button onClick={loadMoreTeachers} variant="outline">
                        Load More
                      </Button>
                    </div>
                  )
                ) : (
                  totalPages > 1 && (
                    <div className="mt-8">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
