"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn("bg-white border-t border-gray-200 mt-auto", className)}>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="inline-block mb-6">
              <div className="relative w-32 h-8">
                <Image 
                  src="/logo_dark.png" 
                  alt="TeachersGallery" 
                  width={128}
                  height={32}
                  className="object-contain w-full h-full"
                  onError={(e) => {
                    e.currentTarget.src = "";
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            </Link>
            <p className="text-gray-500 text-sm max-w-md">
              TeachersGallery connects students and parents with qualified teachers for tutoring and learning. Find your perfect teacher today.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-500 hover:text-primary text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-500 hover:text-primary text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-500 hover:text-primary text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-500 hover:text-primary text-sm">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-gray-500 hover:text-primary text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-500 hover:text-primary text-sm">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-gray-400 text-sm text-center">
            &copy; {new Date().getFullYear()} TeachersGallery. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 