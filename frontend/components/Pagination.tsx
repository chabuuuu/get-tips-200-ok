import Link from 'next/link';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl?: string;
}

export default function Pagination({ currentPage, totalPages, baseUrl = '/' }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = [];
  // Simple logic for now: show all or a window. For simplicity let's show window of 5 around current.
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);

  // Adjust start if end is capped
  const adjustedStart = Math.max(1, endPage - 4);

  for (let i = adjustedStart; i <= endPage; i++) {
    pages.push(i);
  }

  const prevLink = currentPage > 1 ? `${baseUrl}?page=${currentPage - 1}` : null;
  const nextLink = currentPage < totalPages ? `${baseUrl}?page=${currentPage + 1}` : null;

  return (
    <div className="flex justify-center mt-16 space-x-2">
      {prevLink ? (
        <Link 
          href={prevLink}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-600 dark:text-gray-400 transition"
          aria-label="Previous Page"
        >
          <ChevronLeft size={20} />
        </Link>
      ) : (
        <span className="p-2 text-gray-300 dark:text-gray-700 cursor-not-allowed">
           <ChevronLeft size={20} />
        </span>
      )}

      {pages.map((page) => (
        <Link
          key={page}
          href={`${baseUrl}?page=${page}`}
          className={clsx(
            "w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition",
            page === currentPage
              ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
          )}
        >
          {page}
        </Link>
      ))}

      {nextLink ? (
        <Link 
          href={nextLink}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-600 dark:text-gray-400 transition"
          aria-label="Next Page"
        >
          <ChevronRight size={20} />
        </Link>
      ) : (
        <span className="p-2 text-gray-300 dark:text-gray-700 cursor-not-allowed">
           <ChevronRight size={20} />
        </span>
      )}
    </div>
  );
}
