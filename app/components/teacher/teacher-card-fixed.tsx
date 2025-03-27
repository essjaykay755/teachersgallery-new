import Link from "next/link";
import { MapPin, Star, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/shared/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/app/components/shared/card";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface TeacherCardProps {
  id: string;
  name: string;
  avatarUrl?: string;
  subject?: string;
  subjects?: string[];
  location?: string;
  feesPerHour?: number;
  feeRange?: { 
    min: number; 
    max: number 
  };
  experience?: number;
  teachingMode?: string;
  educationLevels?: string[];
  rating?: number;
  reviews?: number;
  isVerified?: boolean;
  isFeatured?: boolean;
  isVisible?: boolean;
  featuredExpiry?: Date;
  className?: string;
}

export function TeacherCard(props: TeacherCardProps) {
  // Use defensive destructuring to ensure every prop has a default value
  const {
    id = "unknown",
    name = "Unknown Teacher",
    avatarUrl = "",
    subject = "General",
    subjects = [],
    location = "Not specified",
    feesPerHour = 0,
    feeRange,
    experience = 0,
    teachingMode = "Online",
    educationLevels = [],
    rating = 0,
    reviews = 0,
    isVerified = false,
    isFeatured = false,
    isVisible = true,
    className = "",
  } = props;

  // Display subject either from subjects array or from subject string
  const displaySubject = useMemo(() => {
    if (subjects && subjects.length > 0) return subjects[0];
    if (subject) return subject;
    return "General";
  }, [subjects, subject]);

  // Display fee as a range if available, otherwise as single value
  const displayFee = useMemo(() => {
    if (feeRange && typeof feeRange.min === 'number' && typeof feeRange.max === 'number') {
      if (feeRange.min === feeRange.max) return `₹${feeRange.min}`;
      return `₹${feeRange.min} - ₹${feeRange.max}`;
    }
    return `₹${feesPerHour}`;
  }, [feeRange, feesPerHour]);

  // Get initials for avatar fallback
  const initials = useMemo(() => {
    if (!name) return "UT";
    return name
      .split(" ")
      .map((n) => n[0] || "")
      .join("")
      .toUpperCase().substring(0, 2);
  }, [name]);
  
  // Process teaching mode to handle different formats
  const processTeachingMode = useMemo(() => {
    if (Array.isArray(teachingMode)) {
      return teachingMode.join(', ');
    }
    return teachingMode || 'Online';
  }, [teachingMode]);

  // Process experience value
  const processExperience = useMemo(() => {
    // Add debugging to track experience data
    console.log(`TeacherCard ${id} (${name}) - Raw experience:`, experience, typeof experience);
    
    // Handle string experience
    if (typeof experience === 'string') {
      const expStr = experience as string;
      
      // Convert string values like "1-2 years" to numbers
      if (expStr.toLowerCase().includes('less than 1') || expStr.toLowerCase().includes('new')) return 0;
      if (expStr.toLowerCase().includes('1-2')) return 1;
      if (expStr.toLowerCase().includes('3-5')) return 3;
      if (expStr.toLowerCase().includes('6-10')) return 6;
      if (expStr.toLowerCase().includes('more than 10') || expStr.toLowerCase().includes('10+')) return 10;
      
      // Try to convert to number directly
      const numValue = Number(expStr);
      if (!isNaN(numValue)) return numValue;
      
      // Try to extract numbers from strings like "5 years"
      const match = expStr.match(/(\d+)/);
      if (match && match[1]) {
        return Number(match[1]);
      }
    }
    
    // If it's a number, use it directly
    if (typeof experience === 'number' && !isNaN(experience)) {
      return Math.max(0, experience);
    }
    
    // Default to 0 for unknown values
    return 0;
  }, [experience, id, name]);

  // Define color for teaching mode badge
  const getModeColor = (mode: string = "") => {
    const normalizedMode = mode.trim().toLowerCase();
    switch (normalizedMode) {
      case "online":
        return "bg-green-100 text-green-800";
      case "student's home":
        return "bg-blue-100 text-blue-800";
      case "teacher's home":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Safe version of educationLevels
  const safeEducationLevels = useMemo(() => {
    if (!educationLevels) return [];
    if (!Array.isArray(educationLevels)) return [];
    return educationLevels.filter(level => typeof level === 'string');
  }, [educationLevels]);

  // Safe rendering of stars
  const renderStars = () => {
    // Use the actual rating from props
    const safeRating = rating ?? 0;
    const safeReviews = reviews ?? 0;
    
    console.log(`TeacherCard ${id}: Rendering stars with rating:`, safeRating, 'and reviews:', safeReviews);
    
    // If no rating exists or no reviews, show "No ratings yet"
    if (safeRating === 0 || safeReviews === 0) {
      return (
        <div className="text-sm font-medium text-gray-600">
          No ratings yet
        </div>
      );
    }
    
    // Show actual star rating with review count
    return (
      <div className="flex items-center">
        <div className="flex mr-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "h-4 w-4",
                star <= Math.round(safeRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
              )}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-gray-600">
          {safeRating.toFixed(1)} ({safeReviews})
        </span>
      </div>
    );
  };

  // Only render card if teacher is visible
  if (isVisible === false) return null;

  return (
    <Link href={`/teachers/${id}`} className="block">
      <Card className={cn("relative overflow-hidden border rounded-lg shadow-sm hover:shadow-md transition-all h-full", className, {
        "border-blue-300": isFeatured
      })}>
        {isFeatured && (
          <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-bl-lg">
            Featured
          </div>
        )}
        <CardHeader className="pb-0">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 border-2 border-gray-200">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback className="text-lg bg-blue-700 text-white">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
                {isVerified && (
                  <span className="text-blue-600" title="Verified">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 mt-0.5 font-medium">{displaySubject} Teacher</p>
              <div className="flex flex-col text-gray-500 text-xs mt-1 space-y-1">
                <div className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{location}</span>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>{processExperience > 0 ? `${processExperience} ${processExperience === 1 ? 'year' : 'years'} experience` : 'New teacher'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}