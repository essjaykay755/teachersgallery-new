"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openItems, setOpenItems] = useState<number[]>([]);
  
  const faqItems: FAQItem[] = [
    // For Teachers
    {
      question: "How do I register as a teacher?",
      answer: "Sign up using the 'Register' button at the top of the page and select 'Teacher' as your account type. You'll need to complete a 3-step onboarding process, including personal details, professional information, and teaching preferences.",
      category: "teachers"
    },
    {
      question: "How much does it cost to create a teacher profile?",
      answer: "Creating a profile on TeachersGallery is completely free. We only charge if you choose to upgrade to a 'Featured' profile for better visibility.",
      category: "teachers"
    },
    {
      question: "What is a 'Featured' teacher profile?",
      answer: "Featured profiles appear at the top of search results and on the homepage, increasing your visibility to potential students. This is a premium service for teachers that costs ₹99 per month.",
      category: "teachers"
    },
    {
      question: "How do I receive payment from students?",
      answer: "TeachersGallery does not handle payments between teachers and students. You can discuss and arrange payment methods directly with your students after establishing contact.",
      category: "teachers"
    },
    {
      question: "Can I control who sees my phone number?",
      answer: "Yes, your phone number is private by default. Students must request access to your phone number, and you have complete control to approve or reject these requests.",
      category: "teachers"
    },
    
    // For Students
    {
      question: "How do I find the right teacher?",
      answer: "Browse our homepage or use the search functionality to filter teachers by subject, location, teaching mode, and price range. Each teacher's profile provides detailed information about their experience, qualifications, and teaching style.",
      category: "students"
    },
    {
      question: "Is there a fee to contact teachers?",
      answer: "No, contacting teachers through our messaging system is completely free. You only pay the teacher directly for their teaching services.",
      category: "students"
    },
    {
      question: "How do I access a teacher's phone number?",
      answer: "You can request a teacher's phone number through their profile page. The teacher will review your request and decide whether to approve it. Once approved, you'll be able to see their contact information.",
      category: "students"
    },
    {
      question: "Can I leave reviews for teachers?",
      answer: "Currently, we're developing our review system which will be available soon. This will allow you to share your experience and help other students make informed decisions.",
      category: "students"
    },
    {
      question: "What should I do if I have an issue with a teacher?",
      answer: "If you encounter any problems, please use the 'Report' button on the teacher's profile page or contact our support team at support@teachersgallery.com.",
      category: "students"
    },
    
    // For Parents
    {
      question: "How do I register as a parent?",
      answer: "Sign up using the 'Register' button and select 'Parent' as your account type. You'll need to complete a short onboarding process, including information about your children's educational needs.",
      category: "parents"
    },
    {
      question: "Can I contact teachers on behalf of my child?",
      answer: "Yes, parents can contact teachers through our messaging system and request phone numbers just like students can.",
      category: "parents"
    },
    {
      question: "How can I ensure my child's safety?",
      answer: "All teachers on our platform undergo a basic verification process. We recommend having an initial conversation with the teacher, checking their qualifications, and perhaps starting with online lessons before meeting in person.",
      category: "parents"
    },
    
    // Platform & Technical
    {
      question: "Is my personal information secure?",
      answer: "Yes, we take data privacy seriously. We use secure servers and encryption to protect your personal information. You can review our Privacy Policy for more details about how we handle your data.",
      category: "platform"
    },
    {
      question: "What devices can I use TeachersGallery on?",
      answer: "TeachersGallery is a responsive web application that works on desktop computers, tablets, and mobile phones. Just visit our website using your preferred device's web browser.",
      category: "platform"
    }
  ];
  
  // Toggle FAQ item open/closed
  const toggleItem = (index: number) => {
    if (openItems.includes(index)) {
      setOpenItems(openItems.filter(item => item !== index));
    } else {
      setOpenItems([...openItems, index]);
    }
  };
  
  // Filter FAQ items based on search query and active category
  const filteredFAQs = faqItems.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });
  
  // Categories for the filter tabs
  const categories = [
    { id: 'all', label: 'All FAQs' },
    { id: 'teachers', label: 'For Teachers' },
    { id: 'students', label: 'For Students' },
    { id: 'parents', label: 'For Parents' },
    { id: 'platform', label: 'Platform & Technical' }
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-blue-100 mb-8">
            Find answers to common questions about TeachersGallery
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-blue-300" />
            </div>
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      
      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <div className="flex overflow-x-auto space-x-2 py-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-md whitespace-nowrap text-sm font-medium ${
                  activeCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* FAQ List */}
        {filteredFAQs.length > 0 ? (
          <div className="space-y-4">
            {filteredFAQs.map((faq, index) => (
              <div 
                key={index} 
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full flex justify-between items-center p-4 text-left bg-white hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                >
                  <h3 className="text-lg font-medium text-gray-900">{faq.question}</h3>
                  <div className="ml-2 flex-shrink-0">
                    {openItems.includes(index) ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </button>
                
                {openItems.includes(index) && (
                  <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-gray-700 whitespace-pre-line">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No matching questions found</p>
            <p className="text-gray-600">Try adjusting your search or browse by category</p>
          </div>
        )}
        
        {/* Additional Help */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Still have questions?</h2>
            <p className="text-gray-600 mb-6">
              If you couldn't find the answer you were looking for, feel free to reach out to our support team.
            </p>
            <Link 
              href="/contact" 
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 