"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, src, ...props }, ref) => {
  // Add cache-busting to the URL to prevent stale images
  const cacheBustedSrc = React.useMemo(() => {
    if (typeof src !== 'string' || !src) return src;
    
    // Don't modify data URLs as they're already complete and can't accept query params
    if (src.startsWith('data:')) return src;
    
    // Force a new URL by adding timestamp and random number
    const separator = src.includes('?') ? '&' : '?';
    const cacheBuster = `${separator}v=${Date.now()}-${Math.random()}`;
    
    // Handle already cache-busted URLs 
    if (src.includes('v=')) {
      return src.replace(/v=[^&]+/, `v=${Date.now()}-${Math.random()}`);
    }
    
    return `${src}${cacheBuster}`;
  }, [src]);

  return (
    <AvatarPrimitive.Image
      ref={ref}
      src={cacheBustedSrc}
      className={cn("aspect-square h-full w-full object-cover", className)}
      onError={(e) => {
        console.error("Avatar image failed to load:", {
          src: cacheBustedSrc,
          isDataUrl: cacheBustedSrc?.startsWith('data:'),
          urlLength: typeof cacheBustedSrc === 'string' ? cacheBustedSrc.length : 0
        });
        
        // Hide the image if it fails to load
        const target = e.target as HTMLImageElement;
        if (target) {
          target.style.display = 'none';
          // Make sure the fallback is shown
          const fallback = target.parentElement?.querySelector('[data-radix-avatar-fallback]');
          if (fallback) {
            (fallback as HTMLElement).style.display = 'flex';
          }
        }
      }}
      {...props}
    />
  )
})
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-slate-50",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback } 