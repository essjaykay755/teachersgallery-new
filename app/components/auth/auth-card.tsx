"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({
  title,
  description,
  footer,
  children,
  className,
}: AuthCardProps) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className={cn(
        "w-full max-w-md space-y-6 rounded-lg border bg-white p-6 shadow-md dark:border-gray-800 dark:bg-gray-950",
        className
      )}>
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
        <div className="space-y-4">
          {children}
        </div>
        {footer && <div className="pt-4">{footer}</div>}
      </div>
    </div>
  );
} 