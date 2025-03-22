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
  subject: string;
  location: string;
  feesPerHour: number;
  experience: number;
  teachingMode: string;
  educationLevels: string[];
  rating: number;
  isVerified?: boolean;
  isFeatured?: boolean;
  className?: string;
}

export function TeacherCard(props: TeacherCardProps) {
  // Use defensive destructuring to ensure every prop has a default value
  const {
    id = "unknown",
    name = "Unknown Teacher",
    avatarUrl = "",
    subject = "General",
    location = "Not specified",
    feesPerHour = 0,
    experience = 0,
    teachingMode = "Online",
    educationLevels = [],
    rating = 4.5,
    isVerified = false,
    isFeatured = false,
    className = "",
  } = props;

  // Get initials for avatar fallback
  const initials = useMemo(() => {
    if (!name) return "UT";
    return name
      .split(" ")
      .map((n) => n[0] || "")
      .join("")
      .toUpperCase().substring(0, 2);
  }, [name]);

  // Create a cache-busted avatar URL to prevent stale images
  // This version ensures a unique URL even after server restart
  // Note: This is now handled directly in the AvatarImage component
  
  // Define color for teaching mode badge
  const getModeColor = (mode: string = "") => {
    switch (mode) {
      case "Online":
        return "bg-green-100 text-green-800";
      case "Offline":
        return "bg-blue-100 text-blue-800";
      case "Hybrid":
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
    const safeRating = typeof rating === 'number' && !isNaN(rating) ? rating : 4.5;
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-4 w-4",
              i < Math.floor(safeRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            )}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">{safeRating.toFixed(1)}</span>
      </div>
    );
  };

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
              <p className="text-sm text-gray-700 mt-0.5 font-medium">{subject} Teacher</p>
              <div className="flex items-center text-gray-500 text-xs mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{location}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-3 pb-2">
          <div className="flex justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={cn("text-xs font-medium rounded-full px-2 py-0.5", getModeColor(teachingMode))}>
                {teachingMode}
              </span>
              <span className="text-xs text-gray-600">{experience} years</span>
            </div>
            {renderStars()}
          </div>
          
          {safeEducationLevels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {safeEducationLevels.map((level, index) => (
                <span
                  key={`${level}-${index}`}
                  className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-xs"
                >
                  {level}
                </span>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t py-2 bg-gray-50">
          <div className="w-full text-right">
            <span className="text-blue-600 font-semibold">₹{feesPerHour}/hr</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
} 