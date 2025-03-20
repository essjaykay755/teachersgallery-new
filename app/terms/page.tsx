import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="bg-blue-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-xl text-blue-100">
            Last Updated: May 15, 2024
          </p>
        </div>
      </div>
      
      {/* Terms Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 flex items-center">
          <Link href="/" className="text-blue-600 flex items-center hover:underline">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
        </div>
        
        <div className="prose prose-blue max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Welcome to TeachersGallery</h2>
            <p className="text-gray-700">
              These Terms of Service ("Terms") govern your access to and use of the TeachersGallery website, services, and applications (collectively, the "Services"). Please read these Terms carefully. By accessing or using our Services, you agree to be bound by these Terms and our Privacy Policy.
            </p>
            <p className="text-gray-700 mt-3">
              If you are accepting these Terms on behalf of a company, organization, or other legal entity, you represent and warrant that you have the authority to bind that entity to these Terms, in which case the terms "you" or "your" shall refer to such entity.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Using TeachersGallery</h2>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">Account Registration</h3>
            <p className="text-gray-700">
              To access certain features of the Services, you must register for an account. When you register, you must provide accurate and complete information. You are responsible for maintaining the security of your account and password. TeachersGallery cannot and will not be liable for any loss or damage from your failure to maintain the security of your account.
            </p>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">User Types</h3>
            <p className="text-gray-700">
              Our platform serves three types of users:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
              <li>
                <span className="font-medium">Teachers:</span> Individuals who offer educational services and create profiles to showcase their qualifications and experience.
              </li>
              <li>
                <span className="font-medium">Students:</span> Individuals seeking educational services.
              </li>
              <li>
                <span className="font-medium">Parents:</span> Individuals seeking educational services on behalf of their children.
              </li>
            </ul>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">User Content</h3>
            <p className="text-gray-700">
              Our Services allow you to post, link, store, share, and otherwise make available certain information, text, graphics, videos, or other material ("User Content"). You are responsible for the User Content that you post on or through the Services, including its legality, reliability, and appropriateness.
            </p>
            <p className="text-gray-700 mt-3">
              By posting User Content on or through the Services, you grant TeachersGallery a non-exclusive, royalty-free, worldwide, perpetual license to use, modify, publicly display, publicly perform, reproduce, and distribute such User Content on and through the Services.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Acceptable Use</h2>
            <p className="text-gray-700">
              You agree not to engage in any of the following prohibited activities:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
              <li>Using the Services for any purpose that is illegal or prohibited by these Terms</li>
              <li>Posting any User Content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable</li>
              <li>Impersonating any person or entity or falsely stating or otherwise misrepresenting your affiliation with a person or entity</li>
              <li>Interfering with or disrupting the Services or servers or networks connected to the Services</li>
              <li>Attempting to gain unauthorized access to any portion of the Services or any other accounts, computer systems, or networks connected to the Services</li>
              <li>Using the Services to advertise or offer to sell goods and services unrelated to educational services</li>
              <li>Harvesting or collecting email addresses or other contact information of other users from the Services</li>
              <li>Creating multiple accounts for disruptive or abusive purposes</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Teacher-Specific Terms</h2>
            <p className="text-gray-700">
              If you are using our Services as a teacher, the following additional terms apply:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
              <li>You must provide accurate information about your qualifications, experience, and teaching services.</li>
              <li>You are responsible for setting your own rates and collecting payment from students/parents directly.</li>
              <li>You may choose to upgrade to a "Featured" profile for increased visibility on our platform for a fee.</li>
              <li>You must respond to student/parent inquiries and phone requests in a timely and professional manner.</li>
              <li>TeachersGallery does not guarantee any minimum number of student inquiries or bookings.</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Student and Parent-Specific Terms</h2>
            <p className="text-gray-700">
              If you are using our Services as a student or parent, the following additional terms apply:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
              <li>You are responsible for verifying the credentials and suitability of any teacher you choose to engage with.</li>
              <li>TeachersGallery does not guarantee the quality, safety, or legality of any teacher's services.</li>
              <li>Any arrangements, agreements, or contracts made between you and a teacher are solely between you and the teacher.</li>
              <li>You must use the messaging and phone request systems responsibly and for their intended purpose.</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Payments and Fees</h2>
            <p className="text-gray-700">
              Creating a basic account on TeachersGallery is free. However, we may offer premium features, such as "Featured" profiles for teachers, for a fee.
            </p>
            <p className="text-gray-700 mt-3">
              You agree to pay all fees or charges to your account based on the fees, charges, and billing terms in effect at the time a fee or charge is due and payable. If you dispute any charges, you must notify TeachersGallery within thirty (30) days after the date that TeachersGallery invoices you.
            </p>
            <p className="text-gray-700 mt-3">
              TeachersGallery uses third-party payment processors to bill you through a payment account linked to your account. The processing of payments will be subject to the terms, conditions, and privacy policies of the payment processor, in addition to these Terms.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Intellectual Property</h2>
            <p className="text-gray-700">
              The Services and their original content, features, and functionality are and will remain the exclusive property of TeachersGallery and its licensors. The Services are protected by copyright, trademark, and other laws of both India and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of TeachersGallery.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Termination</h2>
            <p className="text-gray-700">
              We may terminate or suspend your account and bar access to the Services immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
            </p>
            <p className="text-gray-700 mt-3">
              If you wish to terminate your account, you may simply discontinue using the Services or contact us at support@teachersgallery.com to request account deletion.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Disclaimer</h2>
            <p className="text-gray-700">
              TeachersGallery is a platform that connects teachers with students/parents. We do not control, and are not responsible for, the actions or content of any teacher, student, or parent using our Services. TeachersGallery is not a party to any agreement between teachers and students/parents.
            </p>
            <p className="text-gray-700 mt-3">
              The Services are provided on an "AS IS" and "AS AVAILABLE" basis. TeachersGallery disclaims all warranties of any kind, whether express or implied, including but not limited to the implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Limitation of Liability</h2>
            <p className="text-gray-700">
              In no event shall TeachersGallery, its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
              <li>Your access to or use of or inability to access or use the Services;</li>
              <li>Any conduct or content of any third party on the Services;</li>
              <li>Any content obtained from the Services; and</li>
              <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Governing Law</h2>
            <p className="text-gray-700">
              These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
            </p>
            <p className="text-gray-700 mt-3">
              Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Changes to Terms</h2>
            <p className="text-gray-700">
              We reserve the right to modify or replace these Terms at any time at our sole discretion. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
            <p className="text-gray-700 mt-3">
              By continuing to access or use our Services after any revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you are no longer authorized to use the Services.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="mt-3 text-gray-700">
              <p>TeachersGallery</p>
              <p>Email: legal@teachersgallery.com</p>
              <p>Address: 123 Innovation Hub, Koramangala, Bengaluru, Karnataka 560034, India</p>
            </div>
          </section>
        </div>
        
        <div className="mt-8 border-t border-gray-200 pt-8">
          <Link href="/privacy-policy" className="text-blue-600 hover:underline">
            View Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
} 