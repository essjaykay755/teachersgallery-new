"use client";

import React, { useState } from 'react';
import { Phone, Check, X, Loader2 } from 'lucide-react';

type RequestStatus = 'not_requested' | 'pending' | 'approved' | 'rejected';

interface PhoneRequestProps {
  teacherId: string;
  teacherName: string;
  onRequest: () => Promise<void>;
  initialStatus?: RequestStatus;
  phoneNumber?: string;
  className?: string;
}

export function PhoneRequest({ 
  teacherId, 
  teacherName, 
  onRequest, 
  initialStatus = 'not_requested',
  phoneNumber,
  className 
}: PhoneRequestProps) {
  const [status, setStatus] = useState<RequestStatus>(initialStatus);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = async () => {
    try {
      setIsRequesting(true);
      setError(null);
      await onRequest();
      setStatus('pending');
    } catch (err) {
      setError('Failed to send request. Please try again.');
      console.error('Error requesting phone number:', err);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      <h3 className="font-medium text-gray-900 mb-2">
        Contact {teacherName} directly
      </h3>
      
      {status === 'not_requested' && (
        <>
          <p className="text-sm text-gray-600 mb-4">
            Request the phone number to contact {teacherName} directly. 
            The teacher will need to approve your request first.
          </p>
          
          <button
            onClick={handleRequest}
            disabled={isRequesting}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRequesting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Phone className="h-5 w-5" />
            )}
            <span>{isRequesting ? 'Requesting...' : 'Request Phone Number'}</span>
          </button>
          
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </>
      )}
      
      {status === 'pending' && (
        <div className="text-center p-4 border border-yellow-200 bg-yellow-50 rounded-md">
          <p className="text-yellow-700 font-medium mb-1">Request Pending</p>
          <p className="text-sm text-yellow-600">
            Your request is pending approval from {teacherName}. 
            You'll be notified once they respond.
          </p>
        </div>
      )}
      
      {status === 'approved' && phoneNumber && (
        <div className="text-center p-4 border border-green-200 bg-green-50 rounded-md">
          <p className="text-green-700 font-medium mb-1">
            <Check className="h-5 w-5 inline-block mr-1" />
            Request Approved
          </p>
          <p className="text-sm text-green-600 mb-3">
            {teacherName} has approved your request. You can now contact them directly.
          </p>
          <div className="bg-white p-3 rounded border border-green-200">
            <p className="font-medium text-green-900">{phoneNumber}</p>
          </div>
        </div>
      )}
      
      {status === 'rejected' && (
        <div className="text-center p-4 border border-red-200 bg-red-50 rounded-md">
          <p className="text-red-700 font-medium mb-1">
            <X className="h-5 w-5 inline-block mr-1" />
            Request Rejected
          </p>
          <p className="text-sm text-red-600">
            Unfortunately, {teacherName} has declined your request at this time.
            You can still try to contact them via messaging.
          </p>
        </div>
      )}
    </div>
  );
} 