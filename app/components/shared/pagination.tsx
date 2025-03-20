import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  className 
}: PaginationProps) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    if (totalPages <= 5) {
      // If total pages is 5 or less, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include first page
      pageNumbers.push(1);
      
      if (currentPage <= 3) {
        // If near the beginning, show first 4 pages and then ellipsis
        pageNumbers.push(2, 3, 4, '...');
      } else if (currentPage >= totalPages - 2) {
        // If near the end, show ellipsis and last 4 pages
        pageNumbers.push('...', totalPages - 3, totalPages - 2, totalPages - 1);
      } else {
        // If in the middle, show ellipsis, current page and nearby pages, then ellipsis
        pageNumbers.push('...', currentPage - 1, currentPage, currentPage + 1, '...');
      }
      
      // Always include last page
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav className={cn("flex items-center justify-center space-x-2", className)}>
      <button
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      
      {pageNumbers.map((pageNumber, index) => (
        pageNumber === '...' ? (
          <span key={`ellipsis-${index}`} className="px-3 py-2">...</span>
        ) : (
          <button
            key={`page-${pageNumber}`}
            onClick={() => typeof pageNumber === 'number' && onPageChange(pageNumber)}
            className={cn(
              "px-3 py-2 rounded-md border",
              currentPage === pageNumber 
                ? "bg-blue-600 text-white border-blue-600" 
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            )}
          >
            {pageNumber}
          </button>
        )
      ))}
      
      <button
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
} 