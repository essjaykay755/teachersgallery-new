import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Heart, Target, Users, ThumbsUp, BookOpen } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About TeachersGallery</h1>
            <p className="text-xl text-blue-100 mb-8">
              Connecting qualified teachers with students across India since 2023
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/register" className="bg-white text-blue-600 px-6 py-3 rounded-md font-medium hover:bg-blue-50 transition-colors">
                Join Today
              </Link>
              <Link href="/" className="border border-white text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors">
                Browse Teachers
              </Link>
            </div>
          </div>
        </div>
        
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto fill-white">
            <path d="M0,96L80,80C160,64,320,32,480,26.7C640,21,800,43,960,53.3C1120,64,1280,64,1360,64L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z" />
          </svg>
        </div>
      </div>
      
      {/* Our Mission */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-gray-900">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                At TeachersGallery, our mission is to transform education in India by connecting students with the best teachers across the country.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                We believe that quality education should be accessible to everyone. By creating a platform where teachers can showcase their expertise and students can find the right mentor, we're building a future where learning knows no boundaries.
              </p>
              <div className="flex items-center space-x-4">
                <Target className="h-10 w-10 text-blue-600" />
                <p className="text-lg font-medium text-gray-900">
                  Connecting the right teachers with eager minds
                </p>
              </div>
            </div>
            <div className="relative h-80 md:h-96 rounded-lg overflow-hidden">
              <Image 
                src="/images/mission.jpg" 
                alt="Students learning" 
                fill 
                className="object-cover"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg=="
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Our Values</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              These core principles guide everything we do at TeachersGallery
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Passion for Education</h3>
              <p className="text-gray-600">
                We're passionate about the power of education to transform lives and create opportunities for both teachers and students.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Community</h3>
              <p className="text-gray-600">
                We foster a supportive community where teachers can grow professionally and students can find the right mentors.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <ThumbsUp className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Excellence</h3>
              <p className="text-gray-600">
                We strive for excellence in everything we do, from our platform features to the teachers we showcase.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 relative h-80 md:h-96 rounded-lg overflow-hidden">
              <Image 
                src="/images/story.jpg" 
                alt="Our journey" 
                fill 
                className="object-cover"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg=="
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-bold mb-6 text-gray-900">Our Story</h2>
              <p className="text-lg text-gray-600 mb-6">
                TeachersGallery was founded in 2023 with a simple idea: to create a platform where teachers in India could showcase their expertise and connect with students who need their guidance.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                What started as a small project has grown into a vibrant community of educators and learners across the country. Today, we're proud to have helped thousands of students find the perfect teacher for their learning journey.
              </p>
              <div className="flex items-center space-x-4">
                <BookOpen className="h-10 w-10 text-blue-600" />
                <p className="text-lg font-medium text-gray-900">
                  Our story is still being written, with your help
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Join Our Growing Community</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Whether you're a teacher looking to share your knowledge or a student seeking guidance, TeachersGallery is the platform for you.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/register?type=teacher" className="bg-white text-blue-600 px-6 py-3 rounded-md font-medium hover:bg-blue-50 transition-colors">
              Register as a Teacher
            </Link>
            <Link href="/register?type=student" className="border border-white text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors">
              Register as a Student
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 