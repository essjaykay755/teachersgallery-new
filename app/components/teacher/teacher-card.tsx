import Link from "next/link";
import { MapPin, Star, Check, Clock, BadgeCheck } from "lucide-react";
import StatusAvatar from "@/app/components/shared/status-avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { Teacher } from "@/lib/teacher-service";

interface TeacherCardProps {
  teacher: Teacher;
  className?: string;
}

export function TeacherCard({ teacher, className = "" }: TeacherCardProps) {
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
  } = teacher;

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
    // Add more detailed debugging to track experience values
    console.log(`TeacherCard ${id} (${name}) - Raw experience:`, experience, typeof experience);
    
    // Process experience - simple function to handle all cases
    const getExperienceValue = (exp: unknown): number => {
      // Handle numeric experience
      if (typeof exp === 'number' && !isNaN(exp)) {
        return Math.max(0, exp);
      }
      
      // Handle string experience with text descriptions
      if (typeof exp === 'string') {
        // Handle common text patterns
        if (exp.toLowerCase().includes('less than 1') || 
            exp.toLowerCase().includes('new')) return 0;
        if (exp.toLowerCase().includes('1-2')) return 1;
        if (exp.toLowerCase().includes('3-5')) return 3;
        if (exp.toLowerCase().includes('6-10')) return 6;
        if (exp.toLowerCase().includes('more than 10') || 
            exp.toLowerCase().includes('10+')) return 10;
            
        // Try simple numeric conversion
        const numValue = Number(exp);
        if (!isNaN(numValue)) return Math.max(0, numValue);
        
        // Try to extract a number from text like "5 years experience"
        const match = exp.match(/(\d+)/);
        if (match && match[1]) {
          return Math.max(0, Number(match[1]));
        }
      }
      
      // For any other case (undefined, null, or unparsable), return 0
      return 0;
    };
    
    const expValue = getExperienceValue(experience);
    console.log(`TeacherCard ${id} (${name}) - Processed experience:`, expValue);
    return expValue;
  }, [experience, id, name]);

  // Create a separate flag for "new teacher" status to make logic clearer
  const isNewTeacher = useMemo(() => {
    return processExperience === 0;
  }, [processExperience]);

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
    
    // If no rating exists or no reviews, show "No ratings yet"
    if (safeRating === 0 || safeReviews === 0) {
      return (
        <div className="text-xs text-gray-500">
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
                "h-3 w-3",
                star <= Math.round(safeRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
              )}
            />
          ))}
        </div>
        <span className="text-xs text-gray-600">
          {safeRating.toFixed(1)} <span className="text-xs text-gray-400">({safeReviews})</span>
        </span>
      </div>
    );
  };

  // Only render card if teacher is visible
  if (isVisible === false) return null;

  return (
    <Link href={`/teachers/${id}`} className="block group">
      <Card className={cn("relative overflow-hidden border-gray-200 hover:border-blue-500 shadow-sm hover:shadow-md transition-all h-full bg-gradient-to-br from-white to-blue-50/40", className, {
        "ring-1 ring-blue-400": isFeatured
      })}>
        {isFeatured && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <Badge variant="blue" className="px-2 py-0.5 text-xs font-medium">
              Featured
            </Badge>
          </div>
        )}
        <CardHeader className="pb-0 pt-4 px-4">
          <div className="flex items-start space-x-3.5">
            <StatusAvatar 
              src={avatarUrl} 
              alt={name} 
              fallback={initials}
              userId={id}
              size="xl"
              className="border-2 border-gray-100 shadow-sm"
            />
            <div className="flex-1 -mt-1">
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{name}</h3>
                {isVerified && (
                  <span className="flex items-center justify-center text-blue-500" title="Verified">
                    <BadgeCheck className="h-4 w-4" />
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 font-medium">{displaySubject} Teacher</p>
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                <span>{location}</span>
              </div>
              {isNewTeacher ? (
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <span className="text-blue-600 font-medium">New teacher</span>
                </div>
              ) : (
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <Clock className="h-3 w-3 mr-1 text-gray-400" />
                  <span>{processExperience} {processExperience === 1 ? 'year' : 'years'} experience</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {processTeachingMode.split(',').map((mode: string, index: number) => {
              const modeText = mode.trim();
              let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "outline";
              
              if (modeText.toLowerCase() === "online") badgeVariant = "default";
              if (modeText.toLowerCase() === "offline") badgeVariant = "secondary";
              if (modeText.toLowerCase() === "hybrid") badgeVariant = "outline";
              
              return (
                <Badge key={index} variant={badgeVariant} className="text-xs font-medium px-2 py-0.5">
                  {modeText}
                </Badge>
              );
            })}
          </div>
          
          {safeEducationLevels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {safeEducationLevels.slice(0, 2).map((level, index) => (
                <Badge key={index} variant="outline" className="bg-gray-50 text-xs">
                  {level}
                </Badge>
              ))}
              {safeEducationLevels.length > 2 && (
                <Badge variant="outline" className="bg-gray-50 text-xs">
                  +{safeEducationLevels.length - 2} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between py-3 px-4 border-t border-gray-100 bg-gray-50">
          {renderStars()}
          <div className="text-blue-600 font-bold">
            {displayFee}<span className="text-xs font-normal">/hr</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
} 