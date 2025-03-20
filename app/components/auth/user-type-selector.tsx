"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { UserType } from "@/lib/auth-context";
import { BookOpen, GraduationCap, Users } from "lucide-react";

interface UserTypeSelectorProps {
  selectedType: UserType | null;
  onSelect: (type: UserType) => void;
  className?: string;
}

export function UserTypeSelector({
  selectedType,
  onSelect,
  className,
}: UserTypeSelectorProps) {
  const userTypes: { type: UserType; label: string; icon: React.ReactNode; description: string }[] = [
    {
      type: "teacher",
      label: "Teacher",
      icon: <BookOpen className="h-5 w-5" />,
      description: "Create a profile and connect with students",
    },
    {
      type: "student",
      label: "Student",
      icon: <GraduationCap className="h-5 w-5" />,
      description: "Find qualified teachers for your subjects",
    },
    {
      type: "parent",
      label: "Parent",
      icon: <Users className="h-5 w-5" />,
      description: "Find tutors for your children",
    },
  ];

  return (
    <div className={cn("grid gap-4", className)}>
      <div className="text-center mb-2">
        <h2 className="text-lg font-medium">I am a...</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {userTypes.map((userType) => (
          <div
            key={userType.type}
            className={cn(
              "flex cursor-pointer flex-col items-center rounded-lg border p-4 text-center transition-colors",
              selectedType === userType.type
                ? "border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300"
                : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-900"
            )}
            onClick={() => onSelect(userType.type)}
          >
            <div
              className={cn(
                "mb-2 flex h-10 w-10 items-center justify-center rounded-full",
                selectedType === userType.type
                  ? "bg-blue-500 text-white dark:bg-blue-600"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
              )}
            >
              {userType.icon}
            </div>
            <h3 className="font-medium">{userType.label}</h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {userType.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
} 