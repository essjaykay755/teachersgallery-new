"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// Define the shape of our context
type AvatarCacheContextType = {
  getAvatarUrl: (url: string | null) => string | null;
  setAvatarUrl: (url: string | null, cacheUrl: string) => void;
  clearCache: () => void;
};

// Create the context
const AvatarCacheContext = createContext<AvatarCacheContextType | undefined>(undefined);

// Create the provider component
export function AvatarCacheProvider({ children }: { children: ReactNode }) {
  // Use a Map to store avatar URLs
  const [avatarCache, setAvatarCache] = useState<Map<string, string>>(new Map());

  // Get an avatar URL from the cache or return the original
  const getAvatarUrl = useCallback((url: string | null): string | null => {
    if (!url) return url;
    
    // Don't cache data URLs
    if (url.startsWith('data:')) return url;
    
    // Return cached URL if it exists
    const cachedUrl = avatarCache.get(url);
    if (cachedUrl) {
      return cachedUrl;
    }
    
    // Return original URL if not in cache
    return url;
  }, [avatarCache]);

  // Set an avatar URL in the cache
  const setAvatarUrl = useCallback((url: string | null, cacheUrl: string) => {
    if (!url || url.startsWith('data:')) return;
    
    setAvatarCache(prevCache => {
      const newCache = new Map(prevCache);
      newCache.set(url, cacheUrl);
      return newCache;
    });
  }, []);

  // Clear the cache
  const clearCache = useCallback(() => {
    setAvatarCache(new Map());
  }, []);

  const value = {
    getAvatarUrl,
    setAvatarUrl,
    clearCache
  };

  return (
    <AvatarCacheContext.Provider value={value}>
      {children}
    </AvatarCacheContext.Provider>
  );
}

// Custom hook to use the avatar cache context
export function useAvatarCache() {
  const context = useContext(AvatarCacheContext);
  if (context === undefined) {
    throw new Error('useAvatarCache must be used within an AvatarCacheProvider');
  }
  return context;
} 