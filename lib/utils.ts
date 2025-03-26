import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 

/**
 * Appends a cache-busting query parameter to image URLs to prevent caching issues
 * Returns a default placeholder for null or undefined URLs
 */
export function getCacheBustedUrl(url: string | null | undefined): string {
  if (!url) return 'https://via.placeholder.com/150';
  
  // If URL already has a query string, append the cache buster parameter
  if (url.includes('?')) {
    return `${url}&_cb=${Date.now()}`;
  }
  
  // Otherwise add the cache buster as the first query parameter
  return `${url}?_cb=${Date.now()}`;
} 