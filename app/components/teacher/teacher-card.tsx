import Link from "next/link";
import { MapPin, Star, Check, Clock } from "lucide-react";
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

  console.log(`TeacherCard ${id} (${name}): experience value:`, experience, typeof experience);

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
    console.log(`Processing experience for ${id} (${name}):`, experience, typeof experience);
    
    // Handle string values
    if (typeof experience === 'string') {
      const expString = experience as string;
      
      // Check if it's a numeric string first
      const numericValue = Number(expString);
      if (!isNaN(numericValue)) {
        return numericValue;
      }
      
      // Handle descriptive strings
      if (expString.toLowerCase().includes('less than 1')) return 0;
      if (expString.toLowerCase().includes('1-2')) return 1;
      if (expString.toLowerCase().includes('3-5')) return 3;
      if (expString.toLowerCase().includes('6-10')) return 6;
      if (expString.toLowerCase().includes('more than 10') || 
          expString.toLowerCase().includes('10+')) return 10;
      
      // Try to extract numeric values from strings like "5 years"
      const match = expString.match(/(\d+)/);
      if (match && match[1]) {
        return Number(match[1]);
      }
      
      return 0;
    }
    
    // Handle number values
    if (typeof experience === 'number' && !isNaN(experience)) {
      return experience;
    }
    
    // Handle undefined, null, or other invalid types
    return 0;
  }, [experience, id, name]);

  // Define color for teaching mode badge
  const getModeColor = (mode: string = "") => {
    const normalizedMode = mode.trim().toLowerCase();
    switch (normalizedMode) {
      case "online":
        return "bg-green-100 text-green-800 border border-green-200";
      case "student's home":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "teacher's home":
        return "bg-purple-100 text-purple-800 border border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
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
        <div className="text-sm font-medium text-gray-500">
          No ratings yet
        </div>
      );
    }
    
    // Show actual star rating with review count
    return (
      <div className="flex items-center">
        <div className="flex mr-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "h-4 w-4",
                star <= Math.round(safeRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
              )}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-gray-600">
          {safeRating.toFixed(1)} <span className="text-xs text-gray-500">({safeReviews})</span>
        </span>
      </div>
    );
  };

  // Only render card if teacher is visible
  if (isVisible === false) return null;

  return (
    <Link href={`/teachers/${id}`} className="block group">
      <Card className={cn("relative overflow-hidden border rounded-xl shadow-sm hover:shadow-lg transition-all h-full group-hover:border-blue-200", className, {
        "border-blue-300 ring-2 ring-blue-100": isFeatured
      })}>
        {isFeatured && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm z-10">
            Featured
          </div>
        )}
        <CardHeader className="pb-0">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 border-2 border-gray-100 shadow-sm group-hover:border-blue-200 transition-colors">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{name}</h3>
                {isVerified && (
                  <span className="flex items-center justify-center bg-blue-100 text-blue-600 rounded-full h-5 w-5" title="Verified">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-gray-700 mt-0.5">{displaySubject} Teacher</p>
              <div className="flex flex-col text-gray-500 text-xs mt-1.5 space-y-1.5">
                <div className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1.5 text-green-500" />
                  <span className="text-gray-600">{location}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1.5 text-amber-500" />
                  <span className="text-gray-600">{processExperience > 0 ? `${processExperience} ${processExperience === 1 ? 'year' : 'years'} experience` : 'New teacher'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 pb-2">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {processTeachingMode.split(',').map((mode: string, index: number) => (
              <span key={index} className={cn("text-xs font-medium rounded-full px-3 py-1", getModeColor(mode.trim()))}>
                {mode.trim()}
              </span>
            ))}
          </div>
          
          {safeEducationLevels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {safeEducationLevels.map((level, index) => (
                <span
                  key={`${level}-${index}`}
                  className="text-xs bg-gray-100 text-gray-700 rounded-full px-2.5 py-0.5 border border-gray-200"
                >
                  {level}
                </span>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between pt-0 pb-4 border-t border-gray-100 mt-2 group-hover:border-blue-50 transition-colors">
          <div className="flex-1">
            {renderStars()}
          </div>
          <div className="flex items-center bg-blue-50 px-3 py-1.5 rounded-lg group-hover:bg-blue-100 transition-colors">
            <span className="text-base font-bold text-blue-600">{displayFee}<span className="text-xs font-normal text-gray-500">/hr</span></span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
} 