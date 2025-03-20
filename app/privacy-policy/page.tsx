import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="bg-blue-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-xl text-blue-100">
            Last Updated: May 15, 2024
          </p>
        </div>
      </div>
      
      {/* Policy Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 flex items-center">
          <Link href="/" className="text-blue-600 flex items-center hover:underline">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
        </div>
        
        <div className="prose prose-blue max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Introduction</h2>
            <p className="text-gray-700">
              TeachersGallery ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by TeachersGallery when you use our website at teachersgallery.com (the "Site") and our services (collectively, the "Services").
            </p>
            <p className="text-gray-700 mt-3">
              By accessing or using our Services, you signify that you have read, understood, and agree to our collection, storage, use, and disclosure of your personal information as described in this Privacy Policy.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Information We Collect</h2>
            <p className="text-gray-700 font-medium">We collect several types of information from and about users of our Services, including:</p>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">Personal Information</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                <span className="font-medium">Account Information:</span> When you register for an account, we collect your name, email address, password, phone number, and user type (teacher, student, or parent).
              </li>
              <li>
                <span className="font-medium">Profile Information:</span> For teachers, we collect additional information such as qualifications, teaching experience, subjects taught, preferred teaching modes, and rates.
              </li>
              <li>
                <span className="font-medium">Communication Information:</span> When you contact us or communicate with other users through our platform, we collect the content of those communications.
              </li>
              <li>
                <span className="font-medium">Payment Information:</span> If you make payments through our Services, our payment processor collects payment information such as credit card details or bank account information.
              </li>
            </ul>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">Usage Information</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                <span className="font-medium">Log Data:</span> When you visit our Site, our servers automatically log standard information including your IP address, browser type, operating system, the pages you visited, and the time and date of your visit.
              </li>
              <li>
                <span className="font-medium">Device Information:</span> We collect information about the device you use to access our Services, including hardware model, operating system and version, and unique device identifiers.
              </li>
              <li>
                <span className="font-medium">Cookies and Similar Technologies:</span> We use cookies, web beacons, and similar tracking technologies to collect information about your browsing behavior and preferences.
              </li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
            <p className="text-gray-700">We use your personal information for various purposes, including to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
              <li>Provide, maintain, and improve our Services</li>
              <li>Create and manage your account</li>
              <li>Process transactions and send related information</li>
              <li>Send administrative messages, updates, and security alerts</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Facilitate communication between teachers and students/parents</li>
              <li>Monitor and analyze trends, usage, and activities in connection with our Services</li>
              <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
              <li>Personalize your experience and provide content and features that match your profile and preferences</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">How We Share Your Information</h2>
            <p className="text-gray-700">We may share your personal information in the following situations:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
              <li>
                <span className="font-medium">With Other Users:</span> If you are a teacher, your profile information is made available to students and parents using our platform. Phone numbers are only shared when you approve a phone number request.
              </li>
              <li>
                <span className="font-medium">With Service Providers:</span> We may share your information with third-party vendors, service providers, and other business partners who perform services on our behalf, such as hosting, payment processing, and analytics.
              </li>
              <li>
                <span className="font-medium">For Legal Purposes:</span> We may disclose your information to comply with applicable laws and regulations, to respond to a subpoena, court order, or other legal request, or to protect our rights.
              </li>
              <li>
                <span className="font-medium">Business Transfers:</span> If TeachersGallery is involved in a merger, acquisition, or sale of all or a portion of its assets, your information may be transferred as part of that transaction.
              </li>
              <li>
                <span className="font-medium">With Your Consent:</span> We may share your information for any other purpose with your consent.
              </li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Data Security</h2>
            <p className="text-gray-700">
              We implement appropriate technical and organizational measures to protect the security of your personal information. However, no Internet or email transmission is ever fully secure or error-free. In particular, email sent to or from our Services may not be secure. Therefore, you should take special care in deciding what information you send to us via the Internet.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Rights and Choices</h2>
            <p className="text-gray-700">
              You have certain rights regarding your personal information, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
              <li>Accessing, updating, or deleting your information through your account settings</li>
              <li>Opting out of marketing communications</li>
              <li>Setting your browser to refuse cookies or alert you when cookies are being sent</li>
              <li>Requesting information about what personal data we have about you</li>
              <li>Requesting that we delete your personal information, subject to certain exceptions</li>
            </ul>
            <p className="text-gray-700 mt-3">
              To exercise these rights, please contact us at privacy@teachersgallery.com.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
            <p className="text-gray-700">
              Our Services are not intended for children under 13 years of age, and we do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe we have collected information from your child under 13, please contact us at privacy@teachersgallery.com.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Changes to This Privacy Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. The updated version will be effective as of the updated date stated at the top of this Privacy Policy. We encourage you to review this Privacy Policy periodically.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700">
              If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <div className="mt-3 text-gray-700">
              <p>TeachersGallery</p>
              <p>Email: privacy@teachersgallery.com</p>
              <p>Address: 123 Innovation Hub, Koramangala, Bengaluru, Karnataka 560034, India</p>
            </div>
          </section>
        </div>
        
        <div className="mt-8 border-t border-gray-200 pt-8">
          <Link href="/terms" className="text-blue-600 hover:underline">
            View Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
} 