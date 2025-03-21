"use client";

import React from 'react';

interface TypingIndicatorProps {
  isTyping: boolean;
  userName?: string;
}

export function TypingIndicator({ isTyping, userName }: TypingIndicatorProps) {
  if (!isTyping) return null;
  
  return (
    <div className="flex items-center text-xs text-gray-500 mb-2 animate-pulse">
      <div className="flex space-x-1 mr-2">
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animation-delay-200"></div>
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animation-delay-400"></div>
      </div>
      <span>{userName || 'Someone'} is typing...</span>
    </div>
  );
} 